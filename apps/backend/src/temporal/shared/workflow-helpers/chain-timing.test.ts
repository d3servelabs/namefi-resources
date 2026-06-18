import { describe, expect, it } from 'vitest';
import {
  BATCH_POLL_LEEWAY_MS,
  SEPOLIA_CHAIN_ID,
  STAGGER_LEEWAY_MS,
  computeBatchPollWindowMs,
  computeChainStaggerMs,
  getChainBlockTimeMs,
  resolveBlockTimeMs,
} from './chain-timing';

describe('getChainBlockTimeMs', () => {
  it('returns real per-chain block times (fast L2 vs slow L1)', () => {
    expect(getChainBlockTimeMs(8453)).toBe(2_000); // Base
    expect(getChainBlockTimeMs(84532)).toBe(2_000); // Base Sepolia
    expect(getChainBlockTimeMs(1)).toBe(12_000); // Ethereum mainnet
    expect(getChainBlockTimeMs(SEPOLIA_CHAIN_ID)).toBe(12_000); // Sepolia
  });
  it('falls back to a conservative 12s for unmapped chains', () => {
    expect(getChainBlockTimeMs(999_999)).toBe(12_000);
  });
});

describe('resolveBlockTimeMs (SEPOLIA_BLOCK_TIME_MS override)', () => {
  it('applies a positive override ONLY for Sepolia', () => {
    expect(resolveBlockTimeMs(SEPOLIA_CHAIN_ID, '500')).toBe(500);
    // Other chains ignore the override.
    expect(resolveBlockTimeMs(1, '500')).toBe(12_000);
    expect(resolveBlockTimeMs(8453, '500')).toBe(2_000);
  });
  it('ignores missing / blank / non-positive / invalid values', () => {
    expect(resolveBlockTimeMs(SEPOLIA_CHAIN_ID, undefined)).toBe(12_000);
    for (const bad of ['', '0', '-100', 'fast', 'NaN']) {
      expect(resolveBlockTimeMs(SEPOLIA_CHAIN_ID, bad)).toBe(12_000);
    }
  });
});

describe('computeChainStaggerMs', () => {
  it('is 3 block times + a fixed leeway (chain default)', () => {
    expect(computeChainStaggerMs(8453)).toBe(3 * 2_000 + STAGGER_LEEWAY_MS); // 9s
    expect(computeChainStaggerMs(SEPOLIA_CHAIN_ID)).toBe(
      3 * 12_000 + STAGGER_LEEWAY_MS,
    ); // 39s
  });
  it('honors an explicit blockTimeMs override', () => {
    expect(computeChainStaggerMs(SEPOLIA_CHAIN_ID, 500)).toBe(
      3 * 500 + STAGGER_LEEWAY_MS,
    ); // 4.5s
  });
});

describe('computeBatchPollWindowMs', () => {
  it('is (confirmations + 3) block times + a fixed leeway (chain default)', () => {
    expect(computeBatchPollWindowMs(8453, 3)).toBe(
      (3 + 3) * 2_000 + BATCH_POLL_LEEWAY_MS,
    ); // 15s
    expect(computeBatchPollWindowMs(1, 3)).toBe(
      (3 + 3) * 12_000 + BATCH_POLL_LEEWAY_MS,
    ); // 75s
  });
  it('honors an explicit blockTimeMs override', () => {
    expect(computeBatchPollWindowMs(SEPOLIA_CHAIN_ID, 3, 500)).toBe(
      (3 + 3) * 500 + BATCH_POLL_LEEWAY_MS,
    );
  });
  it('scales with the confirmations target', () => {
    expect(computeBatchPollWindowMs(8453, 6)).toBeGreaterThan(
      computeBatchPollWindowMs(8453, 3),
    );
  });
});
