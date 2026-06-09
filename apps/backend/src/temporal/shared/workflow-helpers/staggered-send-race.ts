/**
 * Pinned-nonce staggered-parallel transaction race.
 *
 * Fixes the double-mint bug: the legacy flow re-read a FRESH nonce on every
 * retry, so a slow-but-eventually-mined tx could leave the retry on a new nonce
 * and mint again. Here we pin ONE nonce and reuse it for every replacement —
 * Ethereum mines at most one tx per (account, nonce), so broadcasting several
 * escalating-gas replacements can never double-mint.
 *
 * Shape (one "round"):
 *   1. Pin the nonce once (`getSignerNonce`).
 *   2. Launch N "lanes". Lane i waits `i * staggerMs`, short-circuits if a
 *      winner was already confirmed, then broadcasts the SAME nonce at an
 *      escalating gas multiplier and records the returned hash.
 *   3. A read-only confirmation loop watches the round's hashes. The first to
 *      confirm wins.
 *
 * Recovery (opt-in via `recovery`, off by default — back-compatible):
 *   - 1b "nonce consumed by a foreign tx, none of ours mined" → the round is
 *     `NONCE_EXHAUSTED`; if re-pin budget remains we pin a FRESH nonce and run
 *     another round (the prepared tx carries no nonce, so this is safe). Our tx
 *     at the old nonce is provably dead, so this cannot double-mint.
 *   - 2 "two of our hashes mined across re-pin rounds" (the rare RPC receipt-lag
 *     false positive of 1b) → `onDoubleCommit(winners)` decides the canonical
 *     hash (e.g. autofix / admin gate); absent ⇒ critical alert + throw.
 *   - 1a terminal (revert, hard send error, timeout with still-pending
 *     candidates) → critical alert + non-retryable throw. We never re-pin here.
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
  /** Consecutive NONCE_FILLED_NO_CANDIDATE polls tolerated before declaring the round nonce-exhausted (default 3). */
  graceCycles?: number;
  /** Initial gas-price multiplier for lane 0 (chain-aware; required). */
  initialGasPriceMultiplier: number;
  /** Absolute cap on the gas-price multiplier (chain-aware; required). */
  maxGasPriceMultiplier: number;
}

/**
 * Opt-in failure recovery. When omitted the race behaves exactly as the base
 * implementation: one round, throw on nonce-stolen / multi-confirm / timeout.
 */
export interface StaggeredRaceRecovery {
  /**
   * Max number of fresh-nonce re-pins (1b recovery). 0 (default) keeps the base
   * behavior. Each re-pin only happens when the pinned nonce is provably
   * consumed by a non-our tx and none of our hashes mined.
   */
  maxNonceRepins?: number;
  /**
   * Double-commit reconciler (case 2): given the >1 confirmed hashes, resolve
   * the canonical hash to return (e.g. autofix-charge the extra / wait for an
   * admin / critical-alert-and-throw). Absent ⇒ critical alert + throw.
   */
  onDoubleCommit?: (winners: Hash[]) => Promise<Hash>;
}

export interface StaggeredSendRaceOptions {
  preparedTx: PreparedTxOnlySerializableParams;
  chainId: number;
  /** Context label for logs and alerts, e.g. 'mint:mintNfsc'. */
  label: string;
  activities: StaggeredRaceActivities;
  config: StaggeredRaceConfig;
  recovery?: StaggeredRaceRecovery;
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

type RoundOutcome =
  | { kind: 'CONFIRMED'; winner: Hash }
  | { kind: 'NONCE_EXHAUSTED'; onChainNonce: number }
  | { kind: 'DOUBLE_COMMIT'; winners: Hash[] };

/**
 * Broadcasts a prepared transaction via a pinned-nonce staggered-parallel race
 * and returns the confirmed transaction hash.
 *
 * @throws a non-retryable `ApplicationFailure` (after a critical alert) on
 *   revert, stolen-nonce (after re-pins), unresolved multi-confirm, or timeout.
 */
export async function staggeredSendRace(
  opts: StaggeredSendRaceOptions,
): Promise<Hash> {
  const { preparedTx, chainId, label, activities, recovery } = opts;
  const cfg = { ...DEFAULTS, ...opts.config };
  const maxNonceRepins = recovery?.maxNonceRepins ?? 0;
  const {
    getSignerNonce,
    sendPreparedTransaction,
    getTransactionConfirmation,
  } = activities;

  const { generalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  // Every hash we have ever broadcast, across all re-pin rounds. Used for the
  // cross-round double-commit check.
  const allCandidateHashes: Hash[] = [];

  const laneGasMultiplier = (i: number): number =>
    Math.min(
      cfg.initialGasPriceMultiplier + i * cfg.gasIncrementPerLane,
      cfg.maxGasPriceMultiplier,
    );

  /** Reconcile a detected double-commit, or throw if no reconciler is wired. */
  const resolveDoubleCommit = async (winners: Hash[]): Promise<Hash> => {
    if (recovery?.onDoubleCommit) {
      workflow.log.warn(
        `[${label}] double-commit detected (${winners.join(', ')}); reconciling`,
      );
      return recovery.onDoubleCommit(winners);
    }
    throw new StaggeredRaceFailure(
      'staggered-race/multi-confirm',
      `[${label}] multiple transactions confirmed: ${winners.join(', ')}`,
    );
  };

  /** Run one race at a single pinned nonce. Terminal (1a) failures throw. */
  const runRound = async (pinnedNonce: number): Promise<RoundOutcome> => {
    const roundHashes: Hash[] = [];
    let stop = false;
    let lanesSettled = false;

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
          roundHashes.push(result.txHash);
          allCandidateHashes.push(result.txHash);
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

    const lanePromises = Array.from({ length: cfg.lanes }, (_, i) =>
      runLane(i),
    );
    void Promise.allSettled(lanePromises).then(() => {
      lanesSettled = true;
    });

    try {
      let elapsedMs = 0;
      let alerted = false;
      let nonceFilledStreak = 0;

      while (true) {
        if (roundHashes.length > 0) {
          const confirmation = await getTransactionConfirmation(
            [...roundHashes],
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
              return { kind: 'CONFIRMED', winner: confirmation.winner };
            case 'MULTIPLE_CONFIRMED':
              // Impossible within a single nonce, but stay defensive.
              stop = true;
              return { kind: 'DOUBLE_COMMIT', winners: confirmation.winners };
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
                return {
                  kind: 'NONCE_EXHAUSTED',
                  onChainNonce: confirmation.onChainNonce,
                };
              }
              break;
            default:
              nonceFilledStreak = 0;
          }
        } else if (lanesSettled) {
          // Zero-candidate resolution: every lane failed to broadcast. If the
          // nonce has advanced, a foreign tx consumed our slot — re-pin is safe.
          // Otherwise our slot is still open and we simply could not send.
          const currentNonce = await getSignerNonce(chainId);
          stop = true;
          if (currentNonce > pinnedNonce) {
            return { kind: 'NONCE_EXHAUSTED', onChainNonce: currentNonce };
          }
          throw new StaggeredRaceFailure(
            'staggered-race/send-failed',
            `[${label}] all lanes failed to send at nonce ${pinnedNonce}`,
          );
        }

        if (elapsedMs >= cfg.failThresholdMs) {
          // Timeout with still-pending candidates: our tx may yet mine, so this
          // is terminal — re-pinning here would risk a genuine double.
          stop = true;
          throw new StaggeredRaceFailure(
            'staggered-race/timeout',
            `[${label}] no confirmation after ${elapsedMs}ms (${roundHashes.length} candidate(s), nonce ${pinnedNonce})`,
          );
        }

        if (!alerted && elapsedMs >= cfg.alertThresholdMs) {
          alerted = true;
          try {
            await generalAlertNamefi({
              title: `[${label}] transaction confirmation slow`,
              message: `No confirmation after ${Math.round(elapsedMs / 1000)}s; ${roundHashes.length} candidate(s), nonce ${pinnedNonce}.`,
              extraData: { chainId, pinnedNonce, roundHashes },
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
    } finally {
      // Signal lanes to short-circuit and drain them so no broadcast is orphaned.
      stop = true;
      await Promise.allSettled(lanePromises);
    }
  };

  try {
    for (let repin = 0; ; repin++) {
      // Pin a (fresh, on re-pin) nonce — the idempotency anchor for this round.
      const pinnedNonce = await getSignerNonce(chainId);
      workflow.log.info(
        `[${label}] round ${repin} pinned nonce ${pinnedNonce}`,
      );

      const outcome = await runRound(pinnedNonce);

      if (outcome.kind === 'DOUBLE_COMMIT') {
        return await resolveDoubleCommit(outcome.winners);
      }

      if (outcome.kind === 'CONFIRMED') {
        // After a re-pin, a prior round's tx could have mined late (RPC lag):
        // re-confirm ALL hashes (shallow) to catch a cross-round double.
        if (repin > 0) {
          const crossRound = await getTransactionConfirmation(
            [...allCandidateHashes],
            chainId,
            pinnedNonce,
            1,
          );
          if (crossRound.kind === 'MULTIPLE_CONFIRMED') {
            return await resolveDoubleCommit(crossRound.winners);
          }
        }
        return outcome.winner;
      }

      // NONCE_EXHAUSTED — re-pin if budget remains, else give up.
      if (repin >= maxNonceRepins) {
        throw new StaggeredRaceFailure(
          'staggered-race/nonce-stolen',
          `[${label}] nonce repeatedly consumed by a foreign tx (last on-chain nonce ${outcome.onChainNonce}) after ${repin} re-pin(s)`,
        );
      }
      workflow.log.warn(
        `[${label}] nonce consumed (on-chain ${outcome.onChainNonce}); re-pinning (${repin + 1}/${maxNonceRepins})`,
      );
    }
  } catch (error) {
    // A deliberate failure (e.g. the reconciler's CRITICAL_ALERT) is already
    // alerted and shaped — propagate as-is, do not double-alert.
    if (error instanceof workflow.ApplicationFailure) {
      throw error;
    }
    const type =
      error instanceof StaggeredRaceFailure
        ? error.type
        : 'staggered-race/failed';
    const message = error instanceof Error ? error.message : String(error);
    await criticalAlertWithTicket({
      title: `[${label}] transaction race failed`,
      message,
      priority: 1,
      extraData: { chainId, candidateHashes: allCandidateHashes, type },
    });
    throw workflow.ApplicationFailure.create({
      message,
      type,
      nonRetryable: true,
    });
  }
}
