/**
 * Pinned-nonce staggered send race — orchestrates per-attempt CHILD workflows.
 *
 * Fixes the double-mint bug by pinning ONE nonce and reusing it for every
 * replacement: Ethereum mines at most one tx per (account, nonce), so broadcasting
 * several escalating-gas replacements can never double-mint.
 *
 * Each attempt is a `sendAndConfirmTxWorkflow` CHILD (send → poll-confirm →
 * typed result), so the Temporal UI shows ordered, grouped, collapsible attempts
 * instead of interleaved activities. This parent:
 *   1. Pins the nonce (`getSignerNonce`), then runs a round.
 *   2. A round starts up to `lanes` children, STAGGERED via `interruptibleSleep`;
 *      it stops starting new children the moment the nonce is provably consumed.
 *   3. The first child to report CONFIRMED wins (fast path). Otherwise it waits
 *      for EVERY started child to settle before deciding — so it never re-pins
 *      while the true winner is still confirming.
 *
 * Recovery (opt-in via `recovery`):
 *   - 1b: all started children LOST/benign-not-sent with the nonce advanced →
 *     `NONCE_EXHAUSTED` → re-pin a fresh nonce (bounded by `maxNonceRepins`).
 *   - 2:  a prior round's child mined late (RPC lag) → cross-round re-confirm sees
 *     `MULTIPLE_CONFIRMED` → `onDoubleCommit` reconciles.
 *   - 1a: REVERTED / PENDING_TIMEOUT (our tx may still mine) / unexpected child
 *     failure → critical alert + non-retryable throw (never re-pin).
 *
 * Cancellation: losers self-resolve LOST once the nonce advances (a few
 * DEFAULT-queue polls, never re-touching the single MINT slot); a leftover child
 * is reaped at parent close via `parentClosePolicy: 'REQUEST_CANCEL'`. We do NOT
 * cancel children mid-round, so the winner is never cancelled before it observes
 * its own receipt.
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import type { PreparedTxOnlySerializableParams } from '../../activities/mint/mint.activities';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import {
  type SendAndConfirmTxInput,
  type SendAndConfirmTxResult,
  type SignerKind,
  sendAndConfirmTxWorkflow,
} from '../../workflows/send-and-confirm-tx.workflow';
import { criticalAlertWithTicket } from './critical-alert-with-ticket';
import { interruptibleSleep } from './interruptible-sleep';
import { typedChildWorkflow } from './typed-child-workflow';
import { typedProxyActivities } from './typed-proxy-activities';

export interface StaggeredRaceConfig {
  /** Number of replacement attempts/children (default 5). */
  lanes?: number;
  /** Delay between successive child starts (default 8_000ms). */
  staggerMs?: number;
  /** Required confirmations before a candidate counts as won (default 3). */
  confirmations?: number;
  /** Interval between a child's confirmation polls (default 6_000ms). */
  pollIntervalMs?: number;
  /** Fire a single "taking too long" alert once this round has elapsed (default 90_000ms). */
  alertThresholdMs?: number;
  /** Round budget; per-child confirm timeout derives from it (default 180_000ms). */
  failThresholdMs?: number;
  /** Floor for a child's confirm timeout regardless of stagger offset (default 30_000ms). */
  minChildTimeoutMs?: number;
  /** Per-attempt gas-price multiplier increment (default 0.05). */
  gasIncrementPerLane?: number;
  /** Consecutive NONCE_FILLED polls a child tolerates before concluding LOST (default 3). */
  graceCycles?: number;
  /** Initial gas-price multiplier for attempt 0 (chain-aware; required). */
  initialGasPriceMultiplier: number;
  /** Absolute cap on the gas-price multiplier (chain-aware; required). */
  maxGasPriceMultiplier: number;
}

/**
 * Opt-in failure recovery. When omitted: one round, throw on
 * nonce-stolen / multi-confirm / timeout.
 */
export interface StaggeredRaceRecovery {
  /** Max fresh-nonce re-pins (1b). 0 (default) = base behavior. */
  maxNonceRepins?: number;
  /**
   * Double-commit reconciler (2): given the >1 confirmed hashes, resolve the
   * canonical hash to return. Absent ⇒ critical alert + throw.
   */
  onDoubleCommit?: (winners: Hash[]) => Promise<Hash>;
}

export interface StaggeredSendRaceOptions {
  preparedTx: PreparedTxOnlySerializableParams;
  chainId: number;
  /** Context label for logs, alerts, and child summaries, e.g. 'mint:mintNfsc'. */
  label: string;
  /** Selects which signer's send/confirm/nonce activities the children proxy. */
  signerKind: SignerKind;
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
  minChildTimeoutMs: 30_000,
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
  | { kind: 'NONCE_EXHAUSTED'; onChainNonce: number };

/**
 * Broadcasts a prepared transaction via a pinned-nonce staggered race of
 * per-attempt child workflows and returns the confirmed transaction hash.
 *
 * @throws a non-retryable `ApplicationFailure` (after a critical alert) on
 *   revert, stolen-nonce (after re-pins), unresolved multi-confirm, child
 *   failure, or timeout with still-pending candidates.
 */
export async function staggeredSendRace(
  options: StaggeredSendRaceOptions,
): Promise<Hash> {
  const { preparedTx, chainId, label, signerKind, recovery } = options;
  const config = { ...DEFAULTS, ...options.config };
  const maxNonceRepins = recovery?.maxNonceRepins ?? 0;

  // The parent only pins/reads the nonce (MINT) and runs the cross-round
  // re-confirm + slow-alert (DEFAULT). Sends + per-attempt confirms live in the
  // children.
  const mintActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: { maximumAttempts: 1 },
      summary: 'read signer nonce',
    },
  });
  const defaultActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });
  const readSignerNonce =
    signerKind === 'x402'
      ? mintActivities.getX402SignerNonce
      : mintActivities.getSignerNonce;
  const reconfirm =
    signerKind === 'x402'
      ? defaultActivities.getX402TransactionConfirmation
      : defaultActivities.getTransactionConfirmation;
  const { generalAlertNamefi } = defaultActivities;

  const childRunner = typedChildWorkflow({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  });

  // Every hash any child has broadcast, across all re-pin rounds — feeds the
  // cross-round double-commit check.
  const allCandidateHashes: Hash[] = [];

  const laneGasMultiplier = (attemptIndex: number): number =>
    Math.min(
      config.initialGasPriceMultiplier +
        attemptIndex * config.gasIncrementPerLane,
      config.maxGasPriceMultiplier,
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

  /** A child result that proves the pinned nonce is consumed on-chain. */
  const consumesNonce = (result: SendAndConfirmTxResult): boolean =>
    result.status === 'CONFIRMED' ||
    result.status === 'REVERTED' ||
    result.status === 'LOST' ||
    (result.status === 'NOT_SENT' && result.benign);

  const runRound = async (
    roundIndex: number,
    pinnedNonce: number,
  ): Promise<RoundOutcome> => {
    const parentWfId = workflow.workflowInfo().workflowId;
    const pending: Promise<void>[] = [];
    const results: SendAndConfirmTxResult[] = [];
    let childFailed = false;
    let stopStarting = false;
    let confirmedWinner: Hash | null = null;
    let roundDone = false;

    // Single soft "slow" watchdog at the parent level (replaces the old in-poller
    // alert threshold). `condition(fn, timeout)` resolves `true` if the round
    // finishes first, `false` on timeout → alert once. Fire-and-forget.
    let alerted = false;
    void workflow
      .condition(() => roundDone, config.alertThresholdMs, {
        summary: `slow-confirmation alert (round ${roundIndex})`,
      })
      .then(async (finishedFirst) => {
        if (finishedFirst || alerted) return;
        alerted = true;
        try {
          await generalAlertNamefi({
            title: `[${label}] transaction confirmation slow`,
            message: `Round ${roundIndex} (nonce ${pinnedNonce}) has not confirmed yet.`,
            extraData: {
              chainId,
              pinnedNonce,
              candidates: allCandidateHashes.length,
            },
          });
        } catch {
          // Alert failures must not affect the race.
        }
      });

    try {
      for (let attemptIndex = 0; attemptIndex < config.lanes; attemptIndex++) {
        if (stopStarting) break;
        if (attemptIndex > 0) {
          await interruptibleSleep(config.staggerMs, () => stopStarting, {
            summary: `stagger attempt ${attemptIndex} (round ${roundIndex})`,
          });
          if (stopStarting) break;
        }

        const childInput: SendAndConfirmTxInput = {
          signerKind,
          preparedTx,
          chainId,
          nonce: pinnedNonce,
          gasPriceMultiplier: laneGasMultiplier(attemptIndex),
          confirmations: config.confirmations,
          pollIntervalMs: config.pollIntervalMs,
          // All attempts target one round-relative deadline (bounds the round to
          // ~failThresholdMs instead of stagger*(lanes-1)+timeout).
          timeoutMs: Math.max(
            config.failThresholdMs - attemptIndex * config.staggerMs,
            config.minChildTimeoutMs,
          ),
          graceCycles: config.graceCycles,
          label,
          attempt: attemptIndex,
          roundIndex,
        };

        const childHandle = await childRunner.startChild(
          sendAndConfirmTxWorkflow,
          [childInput],
          {
            workflowId: `send-and-confirm-${parentWfId}-r${roundIndex}-a${attemptIndex}`,
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
            parentClosePolicy: 'REQUEST_CANCEL',
            retry: { maximumAttempts: 1 },
            staticSummary: `[${label}] attempt ${attemptIndex} · nonce ${pinnedNonce} · gas ×${laneGasMultiplier(attemptIndex).toFixed(2)}`,
          },
        );

        pending.push(
          childHandle.result().then(
            (result) => {
              results.push(result);
              if ('txHash' in result) allCandidateHashes.push(result.txHash);
              if (result.status === 'CONFIRMED' && !confirmedWinner) {
                confirmedWinner = result.txHash;
              }
              if (consumesNonce(result)) stopStarting = true;
            },
            () => {
              childFailed = true;
              stopStarting = true;
            },
          ),
        );
      }

      // Fast path: a CONFIRMED winner is authoritative within one nonce.
      // Otherwise wait for ALL started children to settle before deciding — we
      // must never declare NONCE_EXHAUSTED while a child that actually mined is
      // still pending.
      await Promise.race([
        workflow.condition(() => confirmedWinner !== null),
        Promise.all(pending),
      ]);
    } finally {
      // Release the watchdog on EVERY exit — normal completion, an aggregation
      // throw below, or a startChild failure mid-launch — so it can't fire a
      // spurious "confirmation slow" alert for a round that already terminated.
      roundDone = true;
    }

    if (confirmedWinner) return { kind: 'CONFIRMED', winner: confirmedWinner };

    if (childFailed) {
      throw new StaggeredRaceFailure(
        'staggered-race/child-failed',
        `[${label}] a send-and-confirm child workflow failed`,
      );
    }

    const reverted = results.find(
      (
        result,
      ): result is Extract<SendAndConfirmTxResult, { status: 'REVERTED' }> =>
        result.status === 'REVERTED',
    );
    if (reverted) {
      throw new StaggeredRaceFailure(
        'staggered-race/reverted',
        `[${label}] transaction ${reverted.txHash} reverted @ block ${reverted.blockNumber}`,
      );
    }

    if (results.some((result) => result.status === 'PENDING_TIMEOUT')) {
      // Sent, still pending at the deadline — our tx MAY still mine. Terminal:
      // re-pinning here would risk a genuine double.
      throw new StaggeredRaceFailure(
        'staggered-race/timeout',
        `[${label}] no confirmation; candidate(s) still pending (nonce ${pinnedNonce})`,
      );
    }

    const lostResults = results.filter(
      (result): result is Extract<SendAndConfirmTxResult, { status: 'LOST' }> =>
        result.status === 'LOST',
    );
    const allConsumed = results.length > 0 && results.every(consumesNonce);
    if (lostResults.length > 0 && allConsumed) {
      return {
        kind: 'NONCE_EXHAUSTED',
        onChainNonce: Math.max(
          ...lostResults.map((lostResult) => lostResult.onChainNonce),
        ),
      };
    }

    // Zero-candidate: nobody successfully broadcast. Re-read the nonce to decide.
    const onChainNonce = await readSignerNonce(chainId);
    if (onChainNonce > pinnedNonce) {
      return { kind: 'NONCE_EXHAUSTED', onChainNonce };
    }
    throw new StaggeredRaceFailure(
      'staggered-race/send-failed',
      `[${label}] all attempts failed to send at nonce ${pinnedNonce}`,
    );
  };

  try {
    for (let roundIndex = 0; ; roundIndex++) {
      const pinnedNonce = await readSignerNonce(chainId);
      workflow.log.info(
        `[${label}] round ${roundIndex} pinned nonce ${pinnedNonce}`,
      );
      workflow.setCurrentDetails(
        `round ${roundIndex} · nonce ${pinnedNonce} · racing`,
      );

      const outcome = await runRound(roundIndex, pinnedNonce);

      if (outcome.kind === 'CONFIRMED') {
        // After a re-pin, a prior round's tx could have mined late (RPC lag):
        // re-confirm ALL hashes (shallow) to catch a cross-round double.
        if (roundIndex > 0) {
          const crossRound = await reconfirm(
            [...allCandidateHashes],
            chainId,
            pinnedNonce,
            1,
          );
          if (crossRound.kind === 'MULTIPLE_CONFIRMED') {
            return await resolveDoubleCommit(crossRound.winners);
          }
        }
        workflow.setCurrentDetails(`confirmed ${outcome.winner}`);
        return outcome.winner;
      }

      // NONCE_EXHAUSTED — re-pin if budget remains, else give up.
      if (roundIndex >= maxNonceRepins) {
        throw new StaggeredRaceFailure(
          'staggered-race/nonce-stolen',
          `[${label}] nonce repeatedly consumed by a foreign tx (last on-chain nonce ${outcome.onChainNonce}) after ${roundIndex} re-pin(s)`,
        );
      }
      workflow.log.warn(
        `[${label}] nonce consumed (on-chain ${outcome.onChainNonce}); re-pinning (${roundIndex + 1}/${maxNonceRepins})`,
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
