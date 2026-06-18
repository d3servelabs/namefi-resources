/**
 * Pinned-nonce staggered send race — orchestrates per-attempt CHILD workflows.
 *
 * Fixes the double-mint bug by pinning ONE nonce and reusing it for every
 * replacement: Ethereum mines at most one tx per (account, nonce), so broadcasting
 * several escalating-gas replacements can never double-mint.
 *
 * Each attempt is a `sendAndConfirmTxWorkflow` CHILD (send → poll-confirm →
 * typed result), so the Temporal UI shows ordered, grouped, collapsible attempts.
 * But a child only polls ITS OWN hash, so its verdict is ADVISORY: a slow winner's
 * siblings each see "my hash didn't mine + nonce advanced" and report LOST. The
 * AUTHORITY is the parent's CROSS-CANDIDATE check (`getTransactionConfirmation`
 * over ALL hashes together) — that is what decides win / lost-foreign / pending.
 *
 * Resolution at one pinned nonce (`resolvePinnedNonce`) — BATCHES, never giving up
 * while pending:
 *   1. Launch a BATCH of up to `lanes` children, STAGGERED, gas escalating via a
 *      MONOTONIC counter that continues across batches (capped at `maxGasMultiplier`).
 *   2. After the batch settles, run the authoritative cross-candidate check:
 *      CONFIRMED → win; MULTIPLE_CONFIRMED → reconcile; REVERTED → fail;
 *      NONCE_FILLED (×grace) → LOST-foreign → re-pin; PENDING → keep going.
 *   3. Still PENDING + gas headroom → launch ANOTHER batch. Gas MAXED + still
 *      pending → keep polling (no new lanes) up to `maxPendingWaitMs`, then hand
 *      off to the `tx-stuck-pending` admin gate. We NEVER fail or release the lock
 *      while the nonce is still pending (`latest == pinnedNonce`).
 *
 * Recovery (opt-in via `recovery`):
 *   - re-pin a fresh nonce ONLY on LOST-foreign (bounded by `maxNonceRepins`), with
 *     the pre-re-pin already-sent precheck; gas RESETS on re-pin (fresh nonce).
 *   - a prior round's child mined late (RPC lag) → cross-round re-confirm sees
 *     `MULTIPLE_CONFIRMED` → `onDoubleCommit` reconciles.
 *   - stuck-pending (gas maxed, never mines) → `onStuckPending` admin gate.
 *
 * Cancellation: losers self-resolve once the nonce advances; a leftover child is
 * reaped at parent close via `parentClosePolicy: 'REQUEST_CANCEL'`. We do NOT
 * cancel children mid-batch, so a winner is never cancelled before it observes its
 * own receipt.
 *
 * NOTE (rollout): this batched control-flow is replay-incompatible with the prior
 * single-round shape — deploy behind Worker Build ID versioning or a quiet window
 * (these executions are short-lived).
 */

import * as workflow from '@temporalio/workflow';
import type { Address, Hash, Hex } from 'viem';
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
import {
  type AlreadySentPolicy,
  decideNonceCollision,
} from './nonce-collision-precheck';
import { typedChildWorkflow } from './typed-child-workflow';

export type { AlreadySentPolicy } from './nonce-collision-precheck';
import type { NonceLockToken } from '../../activities/default/nonce-lock.activities';
import { catchAndAlertLocally } from './catch-and-alert-locally';
import { runNonceLockHeartbeat } from './nonce-lock-heartbeat';
import {
  SEPOLIA_BLOCK_TIME_ENV_KEY,
  SEPOLIA_CHAIN_ID,
  computeBatchPollWindowMs,
  computeChainStaggerMs,
  resolveBlockTimeMs,
} from './chain-timing';
import {
  DEFAULT_MAX_PENDING_WAIT_MS,
  NONCE_LOCK_HEARTBEAT_INTERVAL_MS,
  computeNonceLockAbsoluteMaxMs,
  computeNonceLockTtlMs,
} from './nonce-lock-ttl';
import type {
  StuckPendingDecision,
  TxStuckPendingGateArgs,
} from './tx-stuck-pending-gate';
import { typedProxyActivities } from './typed-proxy-activities';

export interface StaggeredRaceConfig {
  /** Number of replacement attempts/children (default 5). */
  lanes?: number;
  /** Delay between successive child starts. Default: per-chain ≈3 block times + 3s (see `computeChainStaggerMs`). */
  staggerMs?: number;
  /** Required confirmations before a candidate counts as won (default 3). */
  confirmations?: number;
  /** Interval between a child's confirmation polls (default 6_000ms). */
  pollIntervalMs?: number;
  /** Fire a single "taking too long" alert once this pinned nonce has been racing this long (default 90_000ms). */
  alertThresholdMs?: number;
  /** A round's nominal confirm budget — now only feeds the lock's absolute-cap estimate (default 180_000ms). */
  failThresholdMs?: number;
  /** Floor used in the lock's absolute-cap estimate (default 30_000ms). */
  minChildTimeoutMs?: number;
  /** Per-attempt gas-price multiplier increment (default 0.05). */
  gasIncrementPerLane?: number;
  /** Consecutive NONCE_FILLED polls a child tolerates before concluding LOST (default 3). */
  graceCycles?: number;
  /**
   * Once gas is maxed and a tx is STILL pending, keep polling (no new lanes) for
   * up to this long before handing off to the `tx-stuck-pending` admin gate
   * (default {@link DEFAULT_MAX_PENDING_WAIT_MS}). The lock is held throughout.
   */
  maxPendingWaitMs?: number;
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
  /**
   * Pre-re-pin idempotency stance. When set, before re-pinning on
   * NONCE_EXHAUSTED the race asks `checkNonceAlreadySent` whether our calldata
   * already landed at the pinned nonce, and acts per `decideNonceCollision`.
   * Omitted ⇒ no pre-check (base re-pin behavior).
   */
  alreadySentPolicy?: AlreadySentPolicy;
  /**
   * For a non-idempotent op whose calldata already landed (WAIT_FOR_ADMIN):
   * resolve the landed tx through the `tx-already-sent` admin gate — the admin
   * accepts it (returns it) or cancels (throws). Absent ⇒ critical alert + throw.
   */
  onAlreadySentNeedsAdmin?: (landedTxHash: Hash) => Promise<Hash>;
  /**
   * Stuck-pending resolver: when gas is maxed and a tx is STILL pending after
   * `maxPendingWaitMs`, hand off to the `tx-stuck-pending` admin gate (the lock
   * stays held). The admin marks it confirmed, authorizes a re-pin, or asks to
   * keep waiting; CANCEL throws. Absent ⇒ a non-retryable throw at the bound.
   */
  onStuckPending?: (
    args: TxStuckPendingGateArgs,
  ) => Promise<StuckPendingDecision>;
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
  /**
   * Opt-in distributed signer-nonce lock. When `enabled`, the race acquires a
   * cross-process lock on `eip155:<chainId>:<signer>` before the first nonce pin,
   * keeps it fresh with a heartbeat across all re-pins, and releases it at the
   * end — so only one workflow at a time can read→send for this signer. Omitted
   * ⇒ no lock (back-compat). `heartbeatIntervalMs` overrides the refresh cadence
   * (default {@link NONCE_LOCK_HEARTBEAT_INTERVAL_MS}); the rolling redis TTL is
   * three intervals, so the heartbeat refreshes at a third of the TTL.
   */
  lock?: { enabled: boolean; heartbeatIntervalMs?: number; leewayMs?: number };
}

const DEFAULTS = {
  lanes: 5,
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

/** Outcome of resolving one pinned nonce (`resolvePinnedNonce`). */
type PinnedNonceOutcome =
  | { kind: 'CONFIRMED'; winner: Hash }
  // A FOREIGN tx took the nonce (latest > pinned, none of ours mined) — safe to
  // re-pin a fresh nonce (bounded by `maxNonceRepins`).
  | { kind: 'LOST_FOREIGN'; onChainNonce: number }
  // The admin (stuck-pending gate) authorized a re-pin — re-pin REGARDLESS of the
  // foreign-steal budget (still passes the pre-re-pin already-sent precheck).
  | { kind: 'ADMIN_REPIN' };

/** Authoritative verdict from the parent's cross-candidate confirmation poll. */
type CrossVerdict =
  | { kind: 'CONFIRMED'; winner: Hash }
  | { kind: 'MULTIPLE'; winners: Hash[] }
  | { kind: 'REVERTED'; reverted: Hash; blockNumber: string }
  | { kind: 'LOST_FOREIGN'; onChainNonce: number }
  | { kind: 'PENDING' };

/**
 * Broadcasts a prepared transaction via a pinned-nonce staggered race of
 * per-attempt child workflows and returns the confirmed transaction hash.
 *
 * Never fails or releases the lock while the nonce is still pending — it keeps
 * batching, then waits, then hands off to the stuck-pending admin gate.
 *
 * @throws a non-retryable `ApplicationFailure` (after a critical alert) on
 *   revert, stolen-nonce (after re-pins), unresolved multi-confirm, a never-
 *   broadcast send failure, or the stuck-pending gate being cancelled/unwired.
 */
export async function staggeredSendRace(
  options: StaggeredSendRaceOptions,
): Promise<Hash> {
  const { preparedTx, chainId, label, signerKind, recovery } = options;
  const config = { ...DEFAULTS, ...options.config };
  // At least one lane — a `lanes: 0` misconfig would launch nothing and spin
  // forever (never advancing `globalAttempt`, so `gasMaxed` never trips).
  const lanes = Math.max(1, config.lanes);
  const maxNonceRepins = recovery?.maxNonceRepins ?? 0;
  const alreadySentPolicy = recovery?.alreadySentPolicy;

  // The parent pins/reads the nonce (MINT) and runs the AUTHORITATIVE
  // cross-candidate confirmation poll + slow-alert (DEFAULT). Sends + the
  // advisory per-attempt confirms live in the children. Each proxy below carries a
  // distinct UI `summary` explaining WHY it runs — so a reviewer can read the
  // workflow's activity list top-to-bottom (activity summaries are per-proxy in
  // the SDK, so a single activity used for two purposes needs two proxies).
  const nonceActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: { maximumAttempts: 1 },
      summary: 'pin signer nonce',
    },
  });
  // The AUTHORITATIVE resolution: polls ALL candidate hashes together (not a single
  // hash) to decide whether our pinned nonce won, was taken by a foreign tx, or is
  // still pending. This is what runs repeatedly "in the middle" of the race.
  const crossCandidateActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      summary: 'cross-candidate confirm poll',
    },
  });
  // A one-shot re-check AFTER a re-pin confirmed, to catch a prior round's tx that
  // mined late (RPC lag) — that would be a cross-round double-commit.
  const crossRoundActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      summary: 'cross-round double-commit re-check',
    },
  });
  const alertActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      summary: 'slow-confirmation alert',
    },
  });
  const envActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      summary: 'fetch SEPOLIA_BLOCK_TIME_MS override',
    },
  });
  // The pre-re-pin collision check can scan a bounded block range; give it a
  // longer timeout than the short-running confirm pollers. Read-only ⇒ retryable.
  const precheckActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '60 seconds',
      retry: { maximumAttempts: 3 },
      summary: 'pre-re-pin already-sent check',
    },
  });
  // Distributed nonce-lock activities (DEFAULT queue — never occupy a MINT slot).
  // acquire waits DURABLY (no maximumAttempts): Temporal retries until the lock
  // frees — a crashed holder's short TTL auto-expires, and a redis outage
  // resolves once redis recovers (the getRedisClient cache no longer poisons on
  // failure). The trade-off: a redis outage PAUSES minting (serialization is
  // preserved) rather than proceeding lock-less.
  const lockAcquireActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '20 seconds',
      retry: {
        initialInterval: '1 second',
        maximumInterval: '30 seconds',
        backoffCoefficient: 2,
      },
      summary: 'acquire signer-nonce lock',
    },
  });
  const lockReleaseActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '15 seconds',
      retry: { maximumAttempts: 3 },
      summary: 'release signer-nonce lock',
    },
  });

  const readSignerNonce =
    signerKind === 'x402'
      ? nonceActivities.getX402PendingSignerNonce
      : nonceActivities.getPendingSignerNonce;
  const reconfirm =
    signerKind === 'x402'
      ? crossCandidateActivities.getX402TransactionConfirmation
      : crossCandidateActivities.getTransactionConfirmation;
  const crossRoundReconfirm =
    signerKind === 'x402'
      ? crossRoundActivities.getX402TransactionConfirmation
      : crossRoundActivities.getTransactionConfirmation;
  const { generalAlertNamefi } = alertActivities;
  const { getEnvVars } = envActivities;

  const childRunner = typedChildWorkflow({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  });

  // Resolve the per-chain block time ONCE, honoring an optional
  // `SEPOLIA_BLOCK_TIME_MS` override. Workflow code can't read `process.env`
  // (sandbox-stubbed + non-deterministic), so we fetch it via an activity — the
  // recorded result keeps replay deterministic. Only fetched for Sepolia (the one
  // overridable chain), so other chains pay nothing.
  const sepoliaOverrideRaw =
    chainId === SEPOLIA_CHAIN_ID
      ? (await getEnvVars([SEPOLIA_BLOCK_TIME_ENV_KEY]))[
          SEPOLIA_BLOCK_TIME_ENV_KEY
        ]
      : undefined;
  const blockTimeMs = resolveBlockTimeMs(chainId, sepoliaOverrideRaw);
  // Inter-lane stagger defaults to the chain's cadence (≈3 block times + 3s) so a
  // lane doesn't fire just as the previous one is landing; `config.staggerMs` wins.
  const staggerMs =
    options.config.staggerMs ?? computeChainStaggerMs(chainId, blockTimeMs);
  // One batch's confirmation poll window — the children AND the parent's
  // cross-candidate recheck share it.
  const batchPollWindowMs = computeBatchPollWindowMs(
    chainId,
    config.confirmations,
    blockTimeMs,
  );

  // Every hash any child has broadcast, across all batches and re-pin rounds —
  // the input to the AUTHORITATIVE cross-candidate poll (and the cross-round
  // double-commit check). The parent decides from this union, never per-child.
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

  /**
   * Launch ONE batch of up to `lanes` children at `pinnedNonce`, staggered, with
   * monotonically escalating gas; await the batch to settle. Children push their
   * hashes into `allCandidateHashes`; their per-hash verdicts are ADVISORY — the
   * authority is `pollCrossCandidate` after this returns. Returns the next
   * monotonic attempt index and `possiblyOrphaned`: whether any child could have
   * broadcast a tx WITHOUT us capturing its hash (a crashed child, or a
   * non-benign NOT_SENT where the node may have accepted the tx but the response
   * was lost) — which means an empty `allCandidateHashes` does NOT prove "nothing
   * was sent".
   */
  const launchBatch = async (
    roundIndex: number,
    batchIndex: number,
    pinnedNonce: number,
    startAttempt: number,
  ): Promise<{ nextAttempt: number; possiblyOrphaned: boolean }> => {
    const parentWfId = workflow.workflowInfo().workflowId;
    const pending: Promise<void>[] = [];
    let stopStarting = false;
    let confirmedSeen = false;
    // An orphan risk: a tx may be live on-chain but its hash was never captured.
    let possiblyOrphaned = false;
    let attempt = startAttempt;

    for (let lane = 0; lane < lanes; lane++) {
      if (stopStarting) break;
      if (lane > 0) {
        await interruptibleSleep(staggerMs, () => stopStarting, {
          summary: `stagger lane ${lane} (round ${roundIndex} batch ${batchIndex})`,
        });
        if (stopStarting) break;
      }

      const gas = laneGasMultiplier(attempt);
      const childInput: SendAndConfirmTxInput = {
        signerKind,
        preparedTx,
        chainId,
        nonce: pinnedNonce,
        gasPriceMultiplier: gas,
        confirmations: config.confirmations,
        pollIntervalMs: config.pollIntervalMs,
        // The child self-polls its own hash for this bounded, chain-aware window,
        // then returns the benign STILL_PENDING — the parent's cross-candidate
        // check (not the child's single-hash view) is the authority.
        pollWindowMs: batchPollWindowMs,
        graceCycles: config.graceCycles,
        label,
        attempt,
        roundIndex,
      };

      const childHandle = await childRunner.startChild(
        sendAndConfirmTxWorkflow,
        [childInput],
        {
          workflowId: `send-and-confirm-${parentWfId}-r${roundIndex}-b${batchIndex}-a${attempt}`,
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          parentClosePolicy: 'REQUEST_CANCEL',
          retry: { maximumAttempts: 1 },
          staticSummary: `[${label}] attempt ${attempt} · nonce ${pinnedNonce} · gas ×${gas.toFixed(2)}`,
        },
      );
      attempt += 1;

      pending.push(
        childHandle.result().then(
          (result) => {
            if ('txHash' in result) allCandidateHashes.push(result.txHash);
            if (result.status === 'CONFIRMED') confirmedSeen = true;
            // A non-benign NOT_SENT (e.g. FAILED_TO_SEND_TRANSACTION) may mean the
            // node accepted the broadcast but the response was lost → orphan tx
            // with no hash. A benign NOT_SENT (nonce-race) is a clean no-broadcast.
            if (result.status === 'NOT_SENT' && !result.benign) {
              possiblyOrphaned = true;
            }
            // Stop launching the REST of this batch the moment the nonce is
            // provably consumed (a sibling won / a foreign tx took it).
            if (consumesNonce(result)) stopStarting = true;
          },
          () => {
            // The child workflow crashed — its send activity may have broadcast
            // before dying, leaving an orphan tx whose hash we never captured.
            possiblyOrphaned = true;
            stopStarting = true;
          },
        ),
      );
    }

    // Fast path: a child reporting CONFIRMED is decisive within one nonce; else
    // wait for every started child to settle (STILL_PENDING is benign, so this
    // never hangs). We do NOT cancel siblings — a winner must observe its receipt.
    await Promise.race([
      workflow.condition(() => confirmedSeen),
      Promise.all(pending),
    ]);

    return { nextAttempt: attempt, possiblyOrphaned };
  };

  /**
   * The AUTHORITATIVE resolution at one nonce: poll `getTransactionConfirmation`
   * over ALL candidate hashes TOGETHER (never a single hash — that is what made a
   * slow winner's siblings report LOST), for up to `windowMs`. `PENDING` means the
   * nonce is genuinely still open (`latest <= pinned`, nobody mined).
   */
  const pollCrossCandidate = async (
    pinnedNonce: number,
    windowMs: number,
  ): Promise<CrossVerdict> => {
    let elapsed = 0;
    let nonceFilledStreak = 0;
    while (true) {
      const confirmation = await reconfirm(
        [...allCandidateHashes],
        chainId,
        pinnedNonce,
        config.confirmations,
      );
      switch (confirmation.kind) {
        case 'CONFIRMED':
          return { kind: 'CONFIRMED', winner: confirmation.winner };
        case 'MULTIPLE_CONFIRMED':
          return { kind: 'MULTIPLE', winners: confirmation.winners };
        case 'REVERTED':
          return {
            kind: 'REVERTED',
            reverted: confirmation.reverted,
            blockNumber: confirmation.blockNumber,
          };
        case 'NONCE_FILLED_NO_CANDIDATE':
          // latest > pinned AND none of OUR hashes have a receipt → a foreign tx
          // took the nonce. Grace a couple cycles against transient RPC nonce-lag.
          nonceFilledStreak += 1;
          if (nonceFilledStreak >= config.graceCycles) {
            return {
              kind: 'LOST_FOREIGN',
              onChainNonce: confirmation.onChainNonce,
            };
          }
          break;
        default:
          nonceFilledStreak = 0; // PENDING — latest <= pinned, nobody mined yet.
      }
      if (elapsed >= windowMs) return { kind: 'PENDING' };
      const sleepMs = Math.max(
        1,
        Math.min(config.pollIntervalMs, windowMs - elapsed),
      );
      await workflow.sleep(sleepMs, {
        summary: `cross-candidate poll (nonce ${pinnedNonce})`,
      });
      elapsed += sleepMs;
    }
  };

  /**
   * Resolve ONE pinned nonce: launch batches of escalating-gas children and run
   * the authoritative cross-candidate check between them. NEVER fails or returns
   * while the nonce is still pending (`latest == pinned`) — keeps batching, then
   * (gas maxed) keeps polling up to `maxPendingWaitMs`, then opens the
   * `tx-stuck-pending` admin gate (the lock stays held throughout).
   */
  const resolvePinnedNonce = async (
    roundIndex: number,
    pinnedNonce: number,
  ): Promise<PinnedNonceOutcome> => {
    // Gas counter — MONOTONIC across batches at this nonce; RESETS per re-pin (a
    // fresh `resolvePinnedNonce` call starts at 0).
    let globalAttempt = 0;
    let pendingElapsedMs = 0; // accumulated prolonged-pending wait (gas maxed)
    let waitCycle = 0; // stuck-pending gate openings
    // Sticky across batches: did any child possibly broadcast a tx we never
    // captured a hash for (crash / non-benign NOT_SENT)? If so, an empty
    // `allCandidateHashes` must NOT be read as "nothing sent".
    let possiblyOrphaned = false;
    // After a batch the children already polled `batchPollWindowMs`; the parent
    // only needs a short authoritative recheck (long enough for the NONCE_FILLED
    // grace).
    const recheckWindowMs = config.graceCycles * config.pollIntervalMs;
    const maxPendingWaitMs =
      config.maxPendingWaitMs ?? DEFAULT_MAX_PENDING_WAIT_MS;

    // Single soft "slow" watchdog for the whole nonce. Fire-and-forget; resolved
    // by `nonceDone` so it can't fire after we've terminated.
    let nonceDone = false;
    let alerted = false;
    void workflow
      .condition(() => nonceDone, config.alertThresholdMs, {
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
      })
      .catch(() => undefined);

    try {
      for (let batchIndex = 0; ; batchIndex++) {
        // Stop launching NEW batches only once an attempt AT the gas cap has
        // already been LAUNCHED (`globalAttempt - 1` is the last launched index) —
        // checking the next, un-launched attempt would stop one increment early
        // and never broadcast the configured `maxGasPriceMultiplier`. Batch 0
        // always launches (globalAttempt === 0).
        const gasMaxed =
          globalAttempt > 0 &&
          laneGasMultiplier(globalAttempt - 1) >= config.maxGasPriceMultiplier;

        if (!gasMaxed) {
          const launched = await launchBatch(
            roundIndex,
            batchIndex,
            pinnedNonce,
            globalAttempt,
          );
          globalAttempt = launched.nextAttempt;
          if (launched.possiblyOrphaned) {
            // A crashed child / non-benign send may have broadcast without us
            // capturing the hash — resolve via the cross-candidate check, and
            // never treat empty candidates as "nothing sent" (below).
            possiblyOrphaned = true;
            workflow.log.warn(
              `[${label}] a send-and-confirm child may have orphaned a tx; resolving via cross-candidate check`,
            );
          }
        }

        const verdict = await pollCrossCandidate(
          pinnedNonce,
          gasMaxed ? batchPollWindowMs : recheckWindowMs,
        );
        switch (verdict.kind) {
          case 'CONFIRMED':
            return { kind: 'CONFIRMED', winner: verdict.winner };
          case 'MULTIPLE':
            return {
              kind: 'CONFIRMED',
              winner: await resolveDoubleCommit(verdict.winners),
            };
          case 'REVERTED':
            throw new StaggeredRaceFailure(
              'staggered-race/reverted',
              `[${label}] transaction ${verdict.reverted} reverted @ block ${verdict.blockNumber}`,
            );
          case 'LOST_FOREIGN':
            return { kind: 'LOST_FOREIGN', onChainNonce: verdict.onChainNonce };
          default:
            break; // PENDING — keep going (NEVER fail/return while pending).
        }

        if (!gasMaxed) {
          // Gas headroom remains → launch another batch next iteration.
          continue;
        }

        // Gas maxed, still pending, and NOTHING was broadcast. Only fail fast if
        // we are CERTAIN no tx escaped: no child crashed and no non-benign send
        // failure (`!possiblyOrphaned`). If a send MIGHT have orphaned a tx, fall
        // through to the stuck-pending wait/gate instead — releasing the lock here
        // could strand a live tx and re-open the double-mint window on retry.
        if (allCandidateHashes.length === 0 && !possiblyOrphaned) {
          throw new StaggeredRaceFailure(
            'staggered-race/send-failed',
            `[${label}] no transaction broadcast at nonce ${pinnedNonce} (sends failing)`,
          );
        }

        // Gas maxed and a real tx is still pending: keep polling (no new lanes)
        // toward the bound.
        pendingElapsedMs += batchPollWindowMs;
        if (pendingElapsedMs < maxPendingWaitMs) {
          workflow.setCurrentDetails(
            `nonce ${pinnedNonce} · still pending (gas maxed) · ${Math.round(
              pendingElapsedMs / 1000,
            )}s/${Math.round(maxPendingWaitMs / 1000)}s`,
          );
          continue;
        }

        // Bound reached → hand off to the admin gate (the lock stays held; the
        // pending tx is never abandoned).
        if (!recovery?.onStuckPending) {
          throw new StaggeredRaceFailure(
            'staggered-race/stuck-pending',
            `[${label}] tx stuck pending at nonce ${pinnedNonce} (gas maxed); no stuck-pending gate wired`,
          );
        }
        const decision = await recovery.onStuckPending({
          pinnedNonce,
          candidateHashes: [...allCandidateHashes],
          waitCycle: waitCycle++,
        });
        switch (decision.kind) {
          case 'MARK_CONFIRMED':
            return { kind: 'CONFIRMED', winner: decision.txHash };
          case 'REPIN':
            return { kind: 'ADMIN_REPIN' };
          default:
            // KEEP_WAITING → reset the bound and keep polling.
            pendingElapsedMs = 0;
        }
      }
    } finally {
      nonceDone = true;
    }
  };

  /**
   * Pre-re-pin guard: before abandoning the pinned nonce, verify our calldata was
   * not already broadcast (a transport failure after node acceptance leaves no
   * local hash — finding #1). Returns RETURN(winner) to finish or REPIN to proceed;
   * throws on REVERTED / ESCALATE. Opt-in via `alreadySentPolicy`; the `patched`
   * gate keeps in-flight workflows on the no-precheck path.
   */
  const runPrecheck = async (
    pinnedNonce: number,
  ): Promise<{ kind: 'RETURN'; winner: Hash } | { kind: 'REPIN' }> => {
    if (
      !alreadySentPolicy ||
      !workflow.patched('staggered-race/nonce-already-sent-precheck')
    ) {
      return { kind: 'REPIN' };
    }
    const collision = await precheckActivities.checkNonceAlreadySent({
      signerKind,
      chainId,
      nonce: pinnedNonce,
      expectedData: preparedTx.data as Hex,
      contractAddress: preparedTx.to as Address,
    });
    const decision = decideNonceCollision(collision, alreadySentPolicy);
    workflow.log.info(
      `[${label}] pre-re-pin check: ${collision.status} → ${decision.kind}`,
    );
    switch (decision.kind) {
      case 'PROCEED':
        workflow.setCurrentDetails(
          `already sent ${decision.winner} — proceeding`,
        );
        return { kind: 'RETURN', winner: decision.winner };
      case 'WAIT_FOR_ADMIN':
        if (recovery?.onAlreadySentNeedsAdmin) {
          return {
            kind: 'RETURN',
            winner: await recovery.onAlreadySentNeedsAdmin(decision.winner),
          };
        }
        throw new StaggeredRaceFailure(
          'staggered-race/already-sent-needs-admin',
          `[${label}] tx already sent (${decision.winner}); no admin gate wired`,
        );
      case 'REVERTED':
        throw new StaggeredRaceFailure(
          'staggered-race/reverted',
          `[${label}] already-sent tx ${decision.txHash} reverted`,
        );
      case 'ESCALATE':
        throw new StaggeredRaceFailure(
          'staggered-race/already-sent-unidentified',
          `[${label}] nonce consumed by an unidentified tx (on-chain nonce ${decision.onChainNonce}); cannot safely re-pin a non-idempotent op`,
        );
      default:
        return { kind: 'REPIN' };
    }
  };

  // Acquire the distributed signer-nonce lock (if enabled) BEFORE the first nonce
  // pin, and keep it fresh with a heartbeat across all re-pins. Released in the
  // finally below. Correctness still rests on the pinned nonce; the lock removes
  // the cross-workflow read→send collision window.
  let lockToken: NonceLockToken | undefined;
  let lockDone = false;
  let heartbeat: Promise<void> | undefined;
  if (options.lock?.enabled) {
    // The heartbeat interval is primary; the rolling TTL is three intervals, so
    // the heartbeat refreshes at a third of the TTL.
    const heartbeatIntervalMs =
      options.lock.heartbeatIntervalMs ?? NONCE_LOCK_HEARTBEAT_INTERVAL_MS;
    const lockTtlMs = computeNonceLockTtlMs(heartbeatIntervalMs);
    const absoluteMaxMs = computeNonceLockAbsoluteMaxMs({
      triesPerPin: lanes,
      maxRepins: maxNonceRepins,
      maxTimeoutPerTryMs: config.failThresholdMs,
      staggerMs,
      minChildTimeoutMs: config.minChildTimeoutMs,
      chainId,
      chainBlockTimeMs: blockTimeMs,
      leewayMs: options.lock.leewayMs,
    });
    lockToken = await lockAcquireActivities.acquireNonceLock({
      chainId,
      signerKind,
      ttlMs: lockTtlMs,
      absoluteMaxMs,
    });
    // Attach the handler at creation so the fire-and-forget promise is never
    // momentarily unhandled (e.g. a CancelledFailure from interruptibleSleep on
    // external cancellation); the finally still awaits it deterministically.
    heartbeat = runNonceLockHeartbeat({
      token: lockToken,
      lockTtlMs,
      intervalMs: heartbeatIntervalMs,
      absoluteMaxMs,
      isDone: () => lockDone,
      label,
    }).catch(() => undefined);
  }

  try {
    for (let roundIndex = 0; ; roundIndex++) {
      const pinnedNonce = await readSignerNonce(chainId);
      workflow.log.info(
        `[${label}] round ${roundIndex} pinned nonce ${pinnedNonce}`,
      );
      workflow.setCurrentDetails(
        `round ${roundIndex} · nonce ${pinnedNonce} · racing`,
      );

      const outcome = await resolvePinnedNonce(roundIndex, pinnedNonce);

      if (outcome.kind === 'CONFIRMED') {
        // After a re-pin, a prior round's tx could have mined late (RPC lag):
        // re-confirm ALL hashes (shallow) to catch a cross-round double.
        if (roundIndex > 0) {
          const crossRound = await crossRoundReconfirm(
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

      if (outcome.kind === 'ADMIN_REPIN') {
        // The stuck-pending admin authorized a re-pin (they cleared/replaced the
        // stuck tx). Re-pin REGARDLESS of the foreign-steal budget — the precheck
        // below still guards a non-idempotent op (its calldata may have landed).
        workflow.log.warn(
          `[${label}] admin-authorized re-pin at nonce ${pinnedNonce}`,
        );
        const pre = await runPrecheck(pinnedNonce);
        if (pre.kind === 'RETURN') return pre.winner;
        continue; // re-pin a fresh nonce
      }

      // LOST_FOREIGN: a foreign tx took the nonce. Verify our calldata was not
      // already broadcast, then re-pin a fresh nonce if budget remains.
      const pre = await runPrecheck(pinnedNonce);
      if (pre.kind === 'RETURN') return pre.winner;
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
  } finally {
    if (lockToken) {
      // Stop the heartbeat (trips its interruptibleSleep), drain any in-flight
      // extend, then release. Runs on every success/throw path.
      lockDone = true;
      await heartbeat?.catch(() => undefined);
      const token = lockToken;
      await catchAndAlertLocally(
        () => lockReleaseActivities.releaseNonceLock({ token }),
        { message: `[${label}] nonce-lock release failed` },
      );
    }
  }
}
