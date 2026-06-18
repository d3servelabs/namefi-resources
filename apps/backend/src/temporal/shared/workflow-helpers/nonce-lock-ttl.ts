/**
 * Pure timing helpers for the distributed signer-nonce lock.
 *
 * Workflow-safe: no `Date`, no `Math.random`, no I/O — only arithmetic.
 */

/** Default heartbeat cadence for refreshing the rolling signer-nonce lock TTL. */
export const NONCE_LOCK_HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * The short ROLLING redis TTL set on each heartbeat = THREE heartbeat intervals,
 * so the lock survives up to two consecutive missed/failed beats before it would
 * expire (and a crashed holder's lock auto-expires within one TTL window). The
 * heartbeat therefore refreshes at exactly a third of the TTL.
 */
export function computeNonceLockTtlMs(heartbeatIntervalMs: number): number {
  return 3 * heartbeatIntervalMs;
}

/**
 * Per-round overhead budgeted into the absolute cap: a nonce read (~30s) plus,
 * between rounds, the pre-re-pin already-sent check (~3 × 60s). Generous so the
 * cap stays above a legit slow multi-round race.
 */
export const DEFAULT_PER_ROUND_OVERHEAD_MS = 200_000;

/**
 * Default window the race keeps RE-trying a still-pending tx (escalating gas in
 * batches, then polling once gas is maxed) before it hands off to the
 * `tx-stuck-pending` admin gate. The lock is held throughout — a pending tx must
 * never be abandoned by releasing the signer.
 */
export const DEFAULT_MAX_PENDING_WAIT_MS = 30 * 60_000; // 30 min

/**
 * Default BOUNDED extra time the lock is kept (heartbeat-extended) while the
 * `tx-stuck-pending` admin gate is open. Beyond it the heartbeat stops and the
 * lock may lapse — but the PINNED NONCE remains the safety net (any other
 * workflow reads `pending` = pinnedNonce+1, a different slot), so this only
 * bounds the signer-block and the Temporal history, not correctness.
 */
export const DEFAULT_GATE_LOCK_HOLD_MS = 1 * 60 * 60_000; // 1 h

export interface NonceLockBudgetParams {
  /** Attempts per nonce pin (config.lanes) — run CONCURRENTLY, staggered. */
  triesPerPin: number;
  /** Fresh-nonce re-pins (recovery.maxNonceRepins). */
  maxRepins: number;
  /** A round's confirm budget (config.failThresholdMs). */
  maxTimeoutPerTryMs: number;
  /** Delay between successive lane starts (config.staggerMs). */
  staggerMs: number;
  /** Floor for a lane's confirm timeout (config.minChildTimeoutMs). */
  minChildTimeoutMs: number;
  /** Recognized for future per-chain scaling; unused today. */
  chainId: number;
  /** Recognized for future per-chain scaling; unused today. */
  chainBlockTimeMs?: number;
  /** Per-round nonce-read + precheck overhead (default {@link DEFAULT_PER_ROUND_OVERHEAD_MS}). */
  perRoundOverheadMs?: number;
  /** Still-pending re-try window before the stuck-pending gate (default {@link DEFAULT_MAX_PENDING_WAIT_MS}). */
  maxPendingWaitMs?: number;
  /** Bounded lock-hold while the stuck-pending gate is open (default {@link DEFAULT_GATE_LOCK_HOLD_MS}). */
  gateLockHoldMs?: number;
  /** Extra slack added to the cap (default 3000). */
  leewayMs?: number;
}

/**
 * The ABSOLUTE lock TTL — the hard ceiling on total lock lifetime. It is stamped
 * into the lock token at acquire time and enforced in `extendNonceLock`, so even
 * a runaway heartbeat can never hold the lock past this value.
 *
 * Modeled on the real race wall-clock: lanes run CONCURRENTLY (staggered) within
 * a round, so a round is the LATER of its confirm budget and the last staggered
 * lane's finish — NOT lanes × budget. The race is `(maxRepins + 1)` SEQUENTIAL
 * rounds, each plus per-round overhead (a nonce read and, on re-pin, the
 * already-sent precheck). On top of that we add the still-pending re-try window
 * ({@link DEFAULT_MAX_PENDING_WAIT_MS}) and the bounded gate lock-hold
 * ({@link DEFAULT_GATE_LOCK_HOLD_MS}) — a tx may legitimately stay pending well
 * past the active racing, and the lock must survive that whole window. Generously
 * budgeted so the cap never cuts a legit slow race short.
 *
 * TODO: scale by `chainBlockTimeMs` / `chainId` once per-chain block times are
 * wired (the signature already accepts them); uniform today.
 */
export function computeNonceLockAbsoluteMaxMs(
  params: NonceLockBudgetParams,
): number {
  const {
    triesPerPin,
    maxRepins,
    maxTimeoutPerTryMs,
    staggerMs,
    minChildTimeoutMs,
    perRoundOverheadMs = DEFAULT_PER_ROUND_OVERHEAD_MS,
    maxPendingWaitMs = DEFAULT_MAX_PENDING_WAIT_MS,
    gateLockHoldMs = DEFAULT_GATE_LOCK_HOLD_MS,
    leewayMs = 3000,
  } = params;
  const roundWallClockMs = Math.max(
    maxTimeoutPerTryMs,
    Math.max(0, triesPerPin - 1) * staggerMs + minChildTimeoutMs,
  );
  const raceBudgetMs =
    (maxRepins + 1) * (roundWallClockMs + perRoundOverheadMs);
  return raceBudgetMs + maxPendingWaitMs + gateLockHoldMs + leewayMs;
}
