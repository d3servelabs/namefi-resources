import { describe, expect, it } from 'vitest';
import {
  STAGGER_LEEWAY_MS,
  computeChainStaggerMs,
  getChainBlockTimeMs,
} from './chain-timing';

describe('getChainBlockTimeMs', () => {
  it('returns real per-chain block times (fast L2 vs slow L1)', () => {
    expect(getChainBlockTimeMs(8453)).toBe(2_000); // Base
    expect(getChainBlockTimeMs(84532)).toBe(2_000); // Base Sepolia
    expect(getChainBlockTimeMs(1)).toBe(12_000); // Ethereum mainnet
    expect(getChainBlockTimeMs(11155111)).toBe(12_000); // Sepolia
  });
  it('falls back to a conservative 12s for unmapped chains', () => {
    expect(getChainBlockTimeMs(999_999)).toBe(12_000);
  });
});

describe('computeChainStaggerMs', () => {
  it('is 3 block times + a fixed leeway', () => {
    expect(computeChainStaggerMs(8453)).toBe(3 * 2_000 + STAGGER_LEEWAY_MS); // 9s
    expect(computeChainStaggerMs(11155111)).toBe(
      3 * 12_000 + STAGGER_LEEWAY_MS,
    ); // 39s
  });
});
