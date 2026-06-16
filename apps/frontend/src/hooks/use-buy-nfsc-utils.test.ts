import { describe, expect, it, vi } from 'vitest';
import { resolveSwapSigner } from './use-buy-nfsc-utils';

const SIGNER = { account: '0xabc', writeContract: vi.fn() };
const CLIENT = { simulateContract: vi.fn() };

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

  // Regression guard for #4577. When the wallet genuinely is not connected the
  // failure must be an actionable, user-facing message — NOT the internal
  // "Signer not found" the old code surfaced.
  it('throws an actionable error when no signer can be obtained', async () => {
    const refetchWalletClient = vi.fn().mockResolvedValue({ data: undefined });

    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: undefined,
        refetchWalletClient,
      }),
    ).rejects.toThrow(/connect your wallet/i);

    await expect(
      resolveSwapSigner({
        client: CLIENT,
        signer: undefined,
        refetchWalletClient,
      }),
    ).rejects.not.toThrow(/signer not found/i);
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
      }),
    ).rejects.toThrow(/connect your wallet/i);
  });
});
