/**
 * Per-chain timing facts and the timings derived from them (e.g. the staggered
 * race's inter-lane delay).
 *
 * Workflow-safe: no imports, no `Date`/`Math.random`/I/O — numeric chain-id
 * literals and arithmetic only.
 */

/**
 * Approximate mean block time per chain (ms). Numeric chain-id literals keep this
 * module dependency-free and safe to import from workflow code.
 */
const BLOCK_TIME_MS_BY_CHAIN: Record<number, number> = {
  1: 12_000 * 3, // Ethereum mainnet //TODO remove *3 temp
  11155111: 12_000, // Sepolia (Ethereum L1 testnet)
  8453: 3_000 * 3, // Base //TODO remove *3 temp
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

/** Fixed leeway added on top of 3 block times for the default inter-lane stagger. */
export const STAGGER_LEEWAY_MS = 3_000;

/**
 * Default delay between successive lane (child) launches for a chain: THREE block
 * times plus {@link STAGGER_LEEWAY_MS}. Spacing launches by ~3 blocks gives the
 * previous lane's tx time to land/confirm before the next replacement is
 * broadcast, so we don't fire a redundant lane just as the prior one is mined.
 * Callers may still pin an explicit `config.staggerMs` to override.
 */
export function computeChainStaggerMs(chainId: number): number {
  return 3 * getChainBlockTimeMs(chainId) + STAGGER_LEEWAY_MS;
}
