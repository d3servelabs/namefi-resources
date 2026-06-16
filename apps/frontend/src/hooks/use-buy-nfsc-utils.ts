/**
 * Pure signer-resolution logic for {@link import('./use-buy-nfsc').useBuyNfsc},
 * extracted so the click-time behaviour can be unit-tested without a live
 * wagmi/Privy runtime (the frontend has no React-hook test harness; see the
 * sibling `use-buy-nfsc-utils.test.ts`).
 *
 * Regression context (#4577): with the wallet runtime mounted lazily (deferred
 * wallet bundles), `useWalletClient()` can return `undefined` at the moment the
 * user clicks Swap even though a wallet is connected. The previous inline logic
 * threw `Signer not found` synchronously, which surfaced as the Swap button
 * flickering Processing→Swap with no MetaMask prompt. This resolver instead
 * refetches the wallet client on demand before giving up, and fails with an
 * actionable message rather than internal jargon.
 */

/** Minimal shape we need from a wagmi wallet client to submit the swap. */
export interface SwapSigner {
  account: unknown;
  writeContract: (request: unknown) => Promise<`0x${string}`>;
}

export interface ResolveSwapSignerDeps<TSigner> {
  /** wagmi public client; only its presence is checked here. */
  client: unknown;
  /** The wallet client from `useWalletClient()` at render time (may be stale). */
  signer: TSigner | null | undefined;
  /** `useWalletClient().refetch` — used to hydrate the signer on demand. */
  refetchWalletClient: () => Promise<{ data?: TSigner | null | undefined }>;
}

/**
 * Resolve a usable signer for the swap, refetching the wallet client once if it
 * is not yet available.
 *
 * @throws if the public client is missing, or if no signer can be obtained even
 * after a refetch (i.e. the wallet really is not connected).
 */
export async function resolveSwapSigner<TSigner>({
  client,
  signer,
  refetchWalletClient,
}: ResolveSwapSignerDeps<TSigner>): Promise<TSigner> {
  if (!client) {
    throw new Error('Network client unavailable. Please try again.');
  }

  let activeSigner = signer ?? undefined;
  if (!activeSigner) {
    const refetched = await refetchWalletClient();
    activeSigner = refetched.data ?? undefined;
  }

  if (!activeSigner) {
    throw new Error(
      'Wallet not connected. Please connect your wallet and try again.',
    );
  }

  return activeSigner;
}
