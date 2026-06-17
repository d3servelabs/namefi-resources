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
 *
 * WalletConnect hardening (#4581): an injected provider (MetaMask extension)
 * usually hydrates the wallet client on the first refetch, but a WalletConnect
 * session re-establishing its relay after a cold load can take longer. A single
 * refetch may still return `undefined` mid-reconnect, dropping the user back to
 * the "Wallet not connected" state for a wallet that is about to be ready. The
 * resolver therefore polls the wallet client a few times with a small delay
 * (bounded to ~1–2s total) before declaring the wallet unavailable.
 */

/** Minimal shape we need from a wagmi wallet client to submit the swap. */
export interface SwapSigner {
  account: unknown;
  writeContract: (request: unknown) => Promise<`0x${string}`>;
}

/**
 * Default number of on-demand refetch attempts before giving up. The first
 * attempt fires immediately; each subsequent one waits {@link DEFAULT_REFETCH_DELAY_MS}.
 * Four attempts × 400ms ≈ 1.2s of polling, enough for a WalletConnect relay to
 * finish reconnecting without making a genuinely-disconnected wallet feel stuck.
 */
export const DEFAULT_REFETCH_ATTEMPTS = 4;
/** Delay between refetch attempts, in milliseconds. */
export const DEFAULT_REFETCH_DELAY_MS = 400;

const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface ResolveSwapSignerDeps<TSigner> {
  /** wagmi public client; only its presence is checked here. */
  client: unknown;
  /** The wallet client from `useWalletClient()` at render time (may be stale). */
  signer: TSigner | null | undefined;
  /** `useWalletClient().refetch` — used to hydrate the signer on demand. */
  refetchWalletClient: () => Promise<{ data?: TSigner | null | undefined }>;
  /**
   * How many times to refetch the wallet client before giving up. Defaults to
   * {@link DEFAULT_REFETCH_ATTEMPTS}. Must be >= 1.
   */
  refetchAttempts?: number;
  /**
   * Delay between refetch attempts, in milliseconds. Defaults to
   * {@link DEFAULT_REFETCH_DELAY_MS}.
   */
  refetchDelayMs?: number;
  /** Injectable delay, for deterministic tests. Defaults to a real `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Resolve a usable signer for the swap, polling the wallet client up to
 * `refetchAttempts` times (with a small delay between attempts) if it is not yet
 * available — a WalletConnect session may need a moment to rehydrate.
 *
 * @throws if the public client is missing, or if no signer can be obtained even
 * after the bounded retries (i.e. the wallet really is not connected).
 */
export async function resolveSwapSigner<TSigner>({
  client,
  signer,
  refetchWalletClient,
  refetchAttempts = DEFAULT_REFETCH_ATTEMPTS,
  refetchDelayMs = DEFAULT_REFETCH_DELAY_MS,
  sleep = realSleep,
}: ResolveSwapSignerDeps<TSigner>): Promise<TSigner> {
  if (!client) {
    throw new Error('Network client unavailable. Please try again.');
  }

  let activeSigner = signer ?? undefined;

  // Coerce to a finite integer so a malformed caller value (NaN, a fraction)
  // can't silently skip or fractionally over-run the retry budget.
  const attempts = Number.isFinite(refetchAttempts)
    ? Math.max(1, Math.floor(refetchAttempts))
    : DEFAULT_REFETCH_ATTEMPTS;
  for (let attempt = 0; !activeSigner && attempt < attempts; attempt++) {
    if (attempt > 0 && refetchDelayMs > 0) {
      await sleep(refetchDelayMs);
    }
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
