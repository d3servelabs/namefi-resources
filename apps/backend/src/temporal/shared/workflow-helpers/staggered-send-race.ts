/**
 * Pinned-nonce staggered-parallel transaction race.
 *
 * Fixes the double-mint bug: the legacy flow re-read a FRESH nonce on every
 * retry, so a slow-but-eventually-mined tx could leave the retry on a new nonce
 * and mint again. Here we pin ONE nonce and reuse it for every replacement —
 * Ethereum mines at most one tx per (account, nonce), so broadcasting several
 * escalating-gas replacements can never double-mint.
 *
 * Shape:
 *   1. Pin the nonce once (`getSignerNonce`).
 *   2. Launch N "lanes". Lane i waits `i * staggerMs`, short-circuits if a
 *      winner was already confirmed, then broadcasts the SAME nonce at an
 *      escalating gas multiplier and records the returned hash.
 *   3. A read-only confirmation loop watches ALL recorded hashes. The first to
 *      confirm wins. Multiple-confirmed / reverted / stolen-nonce / overall
 *      timeout all raise a critical alert and a non-retryable failure (we never
 *      auto-re-mint, because the nonce is already consumed).
 *
 * Determinism: no wall clock / randomness; elapsed time is summed from slept
 * intervals; shared state mutates only in reaction to awaited activity results
 * and workflow timers (cf. `escalating-poller.ts`). Confirmation runs on the
 * DEFAULT queue so polling is never blocked by the single MINT activity slot.
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import type { PreparedTxOnlySerializableParams } from '../../activities/mint/mint.activities';
import type {
  TxConfirmationResult,
  TxSendOnlyResult,
} from '../../activities/shared/eth-tx-primitives';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { criticalAlertWithTicket } from './critical-alert-with-ticket';
import { typedProxyActivities } from './typed-proxy-activities';

/** Proxied activity references injected by the calling workflow. */
export interface StaggeredRaceActivities {
  getSignerNonce: (chainId: number) => Promise<number>;
  sendPreparedTransaction: (
    preparedTx: PreparedTxOnlySerializableParams,
    chainId: number,
    nonce: number,
    gasPriceMultiplier: number,
  ) => Promise<TxSendOnlyResult>;
  getTransactionConfirmation: (
    txHashes: Hash[],
    chainId: number,
    pinnedNonce: number,
    confirmations: number,
  ) => Promise<TxConfirmationResult>;
}

export interface StaggeredRaceConfig {
  /** Number of replacement lanes (default 5). */
  lanes?: number;
  /** Delay between successive lane broadcasts (default 8_000ms). */
  staggerMs?: number;
  /** Required confirmations before a candidate counts as won (default 3). */
  confirmations?: number;
  /** Interval between confirmation polls (default 6_000ms). */
  pollIntervalMs?: number;
  /** Fire a "taking too long" alert once after this elapsed time (default 90_000ms). */
  alertThresholdMs?: number;
  /** Hard-fail (critical alert + throw) after this elapsed time (default 180_000ms). */
  failThresholdMs?: number;
  /** Per-lane gas-price multiplier increment (default 0.05). */
  gasIncrementPerLane?: number;
  /** Consecutive NONCE_FILLED_NO_CANDIDATE polls tolerated before failing (default 3). */
  graceCycles?: number;
  /** Initial gas-price multiplier for lane 0 (chain-aware; required). */
  initialGasPriceMultiplier: number;
  /** Absolute cap on the gas-price multiplier (chain-aware; required). */
  maxGasPriceMultiplier: number;
}

export interface StaggeredSendRaceOptions {
  preparedTx: PreparedTxOnlySerializableParams;
  chainId: number;
  /** Context label for logs and alerts, e.g. 'mint:mintNfsc'. */
  label: string;
  activities: StaggeredRaceActivities;
  config: StaggeredRaceConfig;
}

const DEFAULTS = {
  lanes: 5,
  staggerMs: 8_000,
  confirmations: 3,
  pollIntervalMs: 6_000,
  alertThresholdMs: 90_000,
  failThresholdMs: 180_000,
  gasIncrementPerLane: 0.05,
  graceCycles: 3,
} as const;

class StaggeredRaceFailure extends Error {
  constructor(
    readonly type: string,
    message: string,
  ) {
    super(message);
    this.name = 'StaggeredRaceFailure';
  }
}

/**
 * Broadcasts a prepared transaction via a pinned-nonce staggered-parallel race
 * and returns the confirmed transaction hash.
 *
 * @throws a non-retryable `ApplicationFailure` (after a critical alert) on
 *   multi-confirm, revert, stolen-nonce, or overall timeout.
 */
export async function staggeredSendRace(
  opts: StaggeredSendRaceOptions,
): Promise<Hash> {
  const { preparedTx, chainId, label, activities } = opts;
  const cfg = { ...DEFAULTS, ...opts.config };
  const {
    getSignerNonce,
    sendPreparedTransaction,
    getTransactionConfirmation,
  } = activities;

  const { generalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  // 1. Pin the nonce ONCE — the idempotency anchor for the whole race.
  const pinnedNonce = await getSignerNonce(chainId);
  workflow.log.info(`[${label}] pinned nonce ${pinnedNonce}`);

  // 2. Shared, replay-deterministic state (single-threaded workflow loop).
  const candidateHashes: Hash[] = [];
  let stop = false;

  const laneGasMultiplier = (i: number): number =>
    Math.min(
      cfg.initialGasPriceMultiplier + i * cfg.gasIncrementPerLane,
      cfg.maxGasPriceMultiplier,
    );

  const runLane = async (i: number): Promise<void> => {
    if (i > 0) {
      // Interruptible stagger: a confirmed winner cancels pending staggers.
      await Promise.race([
        workflow.sleep(i * cfg.staggerMs),
        workflow.condition(() => stop),
      ]);
    }
    if (stop) return;

    const result = await sendPreparedTransaction(
      preparedTx,
      chainId,
      pinnedNonce,
      laneGasMultiplier(i),
    );
    switch (result.status) {
      case 'SENT':
        candidateHashes.push(result.txHash);
        workflow.log.info(`[${label}] lane ${i} sent ${result.txHash}`);
        return;
      // Benign in a race — the nonce slot is already taken by a sibling lane.
      case 'NONCE_EXPIRED':
      case 'REPLACEMENT_UNDERPRICED':
      case 'GAS_PRICE_TOO_LOW':
        workflow.log.info(`[${label}] lane ${i} benign ${result.status}`);
        return;
      // Fatal for this lane only; siblings and the poller keep going.
      default:
        workflow.log.error(
          `[${label}] lane ${i} ${result.status}: ${result.error}`,
        );
        return;
    }
  };

  const confirmLoop = async (): Promise<Hash> => {
    let elapsedMs = 0;
    let alerted = false;
    let nonceFilledStreak = 0;

    while (true) {
      if (candidateHashes.length > 0) {
        const confirmation = await getTransactionConfirmation(
          [...candidateHashes],
          chainId,
          pinnedNonce,
          cfg.confirmations,
        );
        switch (confirmation.kind) {
          case 'CONFIRMED':
            stop = true;
            workflow.log.info(
              `[${label}] confirmed ${confirmation.winner} @ block ${confirmation.blockNumber}`,
            );
            return confirmation.winner;
          case 'MULTIPLE_CONFIRMED':
            stop = true;
            throw new StaggeredRaceFailure(
              'staggered-race/multi-confirm',
              `[${label}] multiple transactions confirmed for nonce ${pinnedNonce}: ${confirmation.winners.join(', ')}`,
            );
          case 'REVERTED':
            stop = true;
            throw new StaggeredRaceFailure(
              'staggered-race/reverted',
              `[${label}] transaction ${confirmation.reverted} reverted @ block ${confirmation.blockNumber}`,
            );
          case 'NONCE_FILLED_NO_CANDIDATE':
            nonceFilledStreak += 1;
            if (nonceFilledStreak >= cfg.graceCycles) {
              stop = true;
              throw new StaggeredRaceFailure(
                'staggered-race/nonce-stolen',
                `[${label}] nonce ${pinnedNonce} consumed by a foreign tx (on-chain nonce ${confirmation.onChainNonce})`,
              );
            }
            break;
          default:
            nonceFilledStreak = 0;
        }
      }

      if (elapsedMs >= cfg.failThresholdMs) {
        stop = true;
        throw new StaggeredRaceFailure(
          'staggered-race/timeout',
          `[${label}] no confirmation after ${elapsedMs}ms (${candidateHashes.length} candidate(s), nonce ${pinnedNonce})`,
        );
      }

      if (!alerted && elapsedMs >= cfg.alertThresholdMs) {
        alerted = true;
        try {
          await generalAlertNamefi({
            title: `[${label}] transaction confirmation slow`,
            message: `No confirmation after ${Math.round(elapsedMs / 1000)}s; ${candidateHashes.length} candidate(s), nonce ${pinnedNonce}.`,
            extraData: { chainId, pinnedNonce, candidateHashes },
          });
        } catch {
          // Alert failures must not affect the race.
        }
      }

      const sleepMs = Math.min(
        cfg.pollIntervalMs,
        cfg.failThresholdMs - elapsedMs,
      );
      await workflow.sleep(sleepMs);
      elapsedMs += sleepMs;
    }
  };

  const lanePromises = Array.from({ length: cfg.lanes }, (_, i) => runLane(i));

  try {
    return await confirmLoop();
  } catch (error) {
    const type =
      error instanceof StaggeredRaceFailure
        ? error.type
        : 'staggered-race/failed';
    const message = error instanceof Error ? error.message : String(error);
    await criticalAlertWithTicket({
      title: `[${label}] transaction race failed`,
      message,
      priority: 1,
      extraData: { chainId, pinnedNonce, candidateHashes, type },
    });
    throw workflow.ApplicationFailure.create({
      message,
      type,
      nonRetryable: true,
    });
  } finally {
    // Signal lanes to short-circuit and drain them so no broadcast is orphaned.
    stop = true;
    await Promise.allSettled(lanePromises);
  }
}
