/**
 * Pure decision logic for the NFSC swap dialog's primary action button.
 *
 * Extracted so the button's behaviour can be unit-tested without rendering the
 * dialog (which needs a live wagmi/Privy runtime). See the sibling
 * `nfsc-swap-dialog-utils.test.ts`.
 *
 * Background: the wallet runtime is mounted lazily (deferred wallet bundles),
 * so when the dialog opens the wagmi wallet client can be momentarily — or
 * persistently — unavailable. Previously the Swap button always rendered as
 * "Swap Tokens" and, on click, the swap threw `Signer not found` synchronously,
 * making the button flicker Processing→Swap with no wallet prompt and no
 * recoverable action. These states make "wallet not ready" an explicit,
 * actionable state instead.
 */

export type SwapButtonState =
  | 'processing'
  | 'wallet-loading'
  | 'connect-wallet'
  | 'insufficient-balance'
  | 'enter-amount'
  | 'ready';

export interface SwapButtonInput {
  /** A wallet is connected AND its signer (wallet client) is available. */
  hasReadyWallet: boolean;
  /** A connection / signer hydration is in flight. */
  isWalletConnecting: boolean;
  /** Pay amount exceeds the connected wallet's native balance. */
  insufficientBalance: boolean;
  /** A swap transaction is currently being submitted. */
  isPending: boolean;
  /** The entered pay amount is a valid, positive number. */
  isAmountValid: boolean;
}

/**
 * Resolve the single state the Swap button should reflect. Order matters:
 * an in-flight swap or wallet connection always wins, then wallet readiness is
 * gated before amount validation so the user is told to connect (an actionable
 * step) rather than shown a swap that will instantly fail.
 */
export function getSwapButtonState(input: SwapButtonInput): SwapButtonState {
  const {
    hasReadyWallet,
    isWalletConnecting,
    insufficientBalance,
    isPending,
    isAmountValid,
  } = input;

  if (isPending) return 'processing';
  if (isWalletConnecting) return 'wallet-loading';
  if (!hasReadyWallet) return 'connect-wallet';
  if (insufficientBalance) return 'insufficient-balance';
  if (!isAmountValid) return 'enter-amount';
  return 'ready';
}

/** Human-readable label for each button state. */
export function getSwapButtonLabel(state: SwapButtonState): string {
  switch (state) {
    case 'processing':
      return 'Processing...';
    case 'wallet-loading':
      return 'Connecting wallet...';
    case 'connect-wallet':
      return 'Connect Wallet';
    case 'insufficient-balance':
      return 'Insufficient ETH Balance';
    case 'enter-amount':
      return 'Enter an amount';
    case 'ready':
      return 'Swap Tokens';
  }
}

/**
 * Whether the button should be disabled. `connect-wallet` is intentionally
 * enabled — it is the user's recovery action — and `ready` is enabled to swap.
 */
export function isSwapButtonDisabled(state: SwapButtonState): boolean {
  return (
    state === 'processing' ||
    state === 'wallet-loading' ||
    state === 'insufficient-balance' ||
    state === 'enter-amount'
  );
}

/** Whether the button click should trigger a wallet connection vs. a swap. */
export function isConnectAction(state: SwapButtonState): boolean {
  return state === 'connect-wallet';
}

/** Whether to show the spinner glyph. */
export function isSwapButtonBusy(state: SwapButtonState): boolean {
  return state === 'processing' || state === 'wallet-loading';
}
