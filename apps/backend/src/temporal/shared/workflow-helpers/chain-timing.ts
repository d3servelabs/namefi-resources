/**
 * Per-chain timing facts and the timings derived from them (e.g. the staggered
 * race's inter-lane delay).
 *
 * Workflow-safe: no imports, no `Date`/`Math.random`/I/O — numeric chain-id
 * literals and arithmetic only. An optional block-time OVERRIDE is supported, but
 * it is passed in (see `resolveBlockTimeMs`) — the env value is fetched by the
 * `getEnvVars` activity, NOT read here, so this stays pure and replay-safe.
 */

export const SEPOLIA_CHAIN_ID = 11155111;
/** Env var that overrides Sepolia's block time (testnet stress-test knob). */
export const SEPOLIA_BLOCK_TIME_ENV_KEY = 'SEPOLIA_BLOCK_TIME_MS';

/**
 * Approximate mean block time per chain (ms). Numeric chain-id literals keep this
 * module dependency-free and safe to import from workflow code.
 */
const BLOCK_TIME_MS_BY_CHAIN: Record<number, number> = {
  1: 12_000, // Ethereum mainnet
  [SEPOLIA_CHAIN_ID]: 12_000, // Sepolia (Ethereum L1 testnet)
  8453: 2_000, // Base
  84532: 2_000, // Base Sepolia
};

/**
 * Mean block time for a chain. Unmapped chains fall back to a CONSERVATIVE 12s so
 * any derived spacing errs LONGER — a too-short stagger is the failure we guard
 * against (firing the next lane just as the previous tx is landing).
 */
export function getChainBlockTimeMs(chainId: number): number {
  return BLOCK_TIME_MS_BY_CHAIN[chainId] ?? 12_000;
}

/**
 * Effective block time, honoring an optional `SEPOLIA_BLOCK_TIME_MS` override
 * (fetched out-of-band via the `getEnvVars` activity and passed in as a string).
 * ONLY Sepolia is overridable, and only by a positive integer; everything else
 * (invalid value, other chains) falls back to {@link getChainBlockTimeMs}. Lets
 * the testnet stress test shrink the derived stagger / batch-poll windows.
 */
export function resolveBlockTimeMs(
  chainId: number,
  sepoliaOverrideRaw?: string,
): number {
  if (chainId === SEPOLIA_CHAIN_ID && sepoliaOverrideRaw !== undefined) {
    const n = Number(sepoliaOverrideRaw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return getChainBlockTimeMs(chainId);
}

/** Fixed leeway added on top of 3 block times for the default inter-lane stagger. */
export const STAGGER_LEEWAY_MS = 3_000;

/**
 * Default delay between successive lane (child) launches: THREE block times plus
 * {@link STAGGER_LEEWAY_MS}. Spacing launches by ~3 blocks gives the previous
 * lane's tx time to land/confirm before the next replacement is broadcast.
 * Callers may pass an explicit `blockTimeMs` (e.g. a resolved override) or pin
 * `config.staggerMs` to override entirely.
 */
export function computeChainStaggerMs(
  chainId: number,
  blockTimeMs: number = getChainBlockTimeMs(chainId),
): number {
  return 3 * blockTimeMs + STAGGER_LEEWAY_MS;
}

/** Fixed leeway added on top of the block-time budget for one batch poll window. */
export const BATCH_POLL_LEEWAY_MS = 3_000;

/**
 * How long to keep polling a batch's candidate txs for confirmation before
 * deciding the batch is still pending and (optionally) launching the next one.
 *
 * Budgeted as `confirmations + 3` block times plus a fixed
 * {@link BATCH_POLL_LEEWAY_MS}. Callers may pass an explicit `blockTimeMs` (e.g. a
 * resolved override). Pure/workflow-safe.
 */
export function computeBatchPollWindowMs(
  chainId: number,
  confirmations: number,
  blockTimeMs: number = getChainBlockTimeMs(chainId),
): number {
  return (confirmations + 3) * blockTimeMs + BATCH_POLL_LEEWAY_MS;
}
