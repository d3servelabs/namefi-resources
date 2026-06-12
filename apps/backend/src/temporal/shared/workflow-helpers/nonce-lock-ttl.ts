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
 * already-sent precheck). Generously budgeted so the cap never cuts a legit slow
 * race short, while staying far below the old `× lanes` over-inflation.
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
    leewayMs = 3000,
  } = params;
  const roundWallClockMs = Math.max(
    maxTimeoutPerTryMs,
    Math.max(0, triesPerPin - 1) * staggerMs + minChildTimeoutMs,
  );
  return (maxRepins + 1) * (roundWallClockMs + perRoundOverheadMs) + leewayMs;
}
