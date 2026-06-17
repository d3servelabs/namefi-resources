import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_REFETCH_ATTEMPTS,
  resolveSwapSigner,
} from './use-buy-nfsc-utils';

const SIGNER = { account: '0xabc', writeContract: vi.fn() };
const CLIENT = { simulateContract: vi.fn() };

// No-op delay so the bounded retry loop doesn't make the suite wait on real timers.
const noSleep = () => Promise.resolve();

describe('resolveSwapSigner', () => {
  it('returns the render-time signer without refetching when present', async () => {
    const refetchWalletClient = vi.fn();
    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: SIGNER,
        refetchWalletClient,
      }),
    ).resolves.toBe(SIGNER);
    expect(refetchWalletClient).not.toHaveBeenCalled();
  });

  // Regression guard for #4577. With the deferred wallet runtime the signer can
  // be momentarily undefined at click time. The OLD code threw "Signer not
  // found" here (button flickered Processing→Swap, no MetaMask). The resolver
  // must instead refetch and proceed with the hydrated signer.
  it('refetches the wallet client when the signer is not yet hydrated', async () => {
    const refetchWalletClient = vi.fn().mockResolvedValue({ data: SIGNER });

    const resolved = await resolveSwapSigner({
      client: CLIENT,
      signer: undefined,
      refetchWalletClient,
    });

    expect(refetchWalletClient).toHaveBeenCalledTimes(1);
    expect(resolved).toBe(SIGNER);
  });

  // Hardening guard for #4581. A WalletConnect session re-establishing its relay
  // after a cold load can stay undefined past the first refetch. The resolver
  // must keep polling (bounded) and proceed with the signer once it hydrates,
  // rather than dropping the user to the "Wallet not connected" state.
  it('keeps refetching until a slow WalletConnect signer hydrates', async () => {
    const refetchWalletClient = vi
      .fn()
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: SIGNER });

    const resolved = await resolveSwapSigner({
      client: CLIENT,
      signer: undefined,
      refetchWalletClient,
      sleep: noSleep,
    });

    expect(refetchWalletClient).toHaveBeenCalledTimes(3);
    expect(resolved).toBe(SIGNER);
  });

  // Regression guard for #4577. When the wallet genuinely is not connected the
  // failure must be an actionable, user-facing message — NOT the internal
  // "Signer not found" the old code surfaced. After #4581 it also bounds the
  // retries: it gives up after DEFAULT_REFETCH_ATTEMPTS rather than looping
  // forever.
  it('throws an actionable error after exhausting the bounded retries', async () => {
    const refetchWalletClient = vi.fn().mockResolvedValue({ data: undefined });

    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: undefined,
        refetchWalletClient,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/connect your wallet/i);

    expect(refetchWalletClient).toHaveBeenCalledTimes(DEFAULT_REFETCH_ATTEMPTS);

    refetchWalletClient.mockClear();
    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: undefined,
        refetchWalletClient,
        sleep: noSleep,
      }),
    ).rejects.not.toThrow(/signer not found/i);
  });

  // A caller can shorten or disable the retry budget; one attempt must still work.
  it('respects a custom refetchAttempts budget', async () => {
    const refetchWalletClient = vi.fn().mockResolvedValue({ data: undefined });

    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: undefined,
        refetchWalletClient,
        refetchAttempts: 1,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/connect your wallet/i);

    expect(refetchWalletClient).toHaveBeenCalledTimes(1);
  });

  // A malformed attempt budget must not silently skip retries (NaN) or run a
  // fractional number of times; it falls back to the documented default.
  it('falls back to the default attempt budget for a non-finite refetchAttempts', async () => {
    const refetchWalletClient = vi.fn().mockResolvedValue({ data: undefined });

    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: undefined,
        refetchWalletClient,
        refetchAttempts: Number.NaN,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/connect your wallet/i);

    expect(refetchWalletClient).toHaveBeenCalledTimes(DEFAULT_REFETCH_ATTEMPTS);
  });

  it('throws a network error (and never refetches) when the public client is missing', async () => {
    const refetchWalletClient = vi.fn();
    await expect(
      resolveSwapSigner({
        client: null,
        signer: SIGNER,
        refetchWalletClient,
      }),
    ).rejects.toThrow(/network client/i);
    expect(refetchWalletClient).not.toHaveBeenCalled();
  });

  it('treats a null refetch result as no signer', async () => {
    const refetchWalletClient = vi.fn().mockResolvedValue({ data: null });
    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: null,
        refetchWalletClient,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/connect your wallet/i);
  });
});
