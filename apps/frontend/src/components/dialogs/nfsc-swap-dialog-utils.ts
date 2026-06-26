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

/**
 * Layout class lists for the swap dialog, split into three regions so the
 * primary action never depends on scroll position (#4578 → #4587).
 *
 * Background: the original dialog used a bare `overflow-hidden` with no bounded
 * height, so the Swap button was clipped below the fold (#4578). Making the
 * whole dialog scroll helped but the button was still not reliably tappable on
 * iOS (#4587) — it could sit under the home indicator / bottom browser chrome,
 * and it moved with the scroll. The fix follows the wallet/exchange pattern
 * (MetaMask/Uniswap/Coinbase): a height-bounded column whose body scrolls full
 * height behind a transparent, safe-area-aware action bar that floats over the
 * bottom — so the primary action is always reachable and never blocks content.
 *
 * - CONTENT: the shell — a height-bounded flex column. `svh` (small viewport
 *   height) tracks the viewport even when the address bar is shown or placed at
 *   the bottom, so the dialog never exceeds the usable area. It clips its own
 *   overflow; scrolling happens in the body region. (It does NOT set `position`
 *   here — the base `DialogContent` is `fixed`, which both centers it in the
 *   viewport and serves as the positioning context for the floating action bar.
 *   Adding `relative` would override that `fixed` via tailwind-merge and break
 *   the centering.)
 * - SCROLL: the body — fills the whole shell and scrolls its overflow, edge to
 *   edge (the action bar floats over it). `min-h-0` lets a flex child shrink
 *   below its content height so it can scroll. Its bottom padding
 *   (`pb-[calc(5.5rem+env(safe-area-inset-bottom))]`, ≈ the action bar's height)
 *   is scroll clearance: it lets the last content (e.g. Gas Fee) scroll up
 *   *clear above* the floating button so it's fully readable, rather than being
 *   stuck behind it at the bottom of the scroll.
 * - ACTION_BAR: the Swap button's wrapper, a *transparent floating overlay*
 *   pinned to the bottom (`absolute bottom-0`). It does NOT reserve layout
 *   space — the body scrolls full height *behind* it, so content is never
 *   blocked by an opaque footer; the button simply sits z-above it. The wrapper
 *   is `pointer-events-none` (its transparent padding passes scroll/touch
 *   through to the content behind) while the button re-enables
 *   `pointer-events-auto`. The safe-area bottom padding keeps the ≥44px tap
 *   target clear of the iOS home indicator / bottom browser chrome.
 */
export const SWAP_DIALOG_CONTENT_CLASSNAME =
  // Mobile (< sm): a full-width bottom sheet — anchored to the bottom edge
  // (thumb zone), no side/bottom margins, rounded top only. It "loses the card"
  // so the content owns the screen instead of floating in the middle.
  'fixed inset-x-0 bottom-0 top-auto w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border border-x-0 border-b-0 border-zinc-800 ' +
  // sm+: restore the centered card.
  'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-x sm:border-b ' +
  // Motion: on mobile the sheet slides up from the bottom edge on open and back
  // down on close (no zoom); from sm up it keeps the card's zoom. Fade applies
  // to both (inherited from the base DialogContent). The base also drives
  // `animate-in`/`animate-out` via data-open/data-closed.
  'duration-300 data-open:slide-in-from-bottom data-closed:slide-out-to-bottom data-open:zoom-in-100 data-closed:zoom-out-100 ' +
  'sm:duration-200 sm:data-open:slide-in-from-bottom-0 sm:data-closed:slide-out-to-bottom-0 sm:data-open:zoom-in-95 sm:data-closed:zoom-out-95 ' +
  // Shared shell: a height-bounded flex column.
  'flex max-h-[90svh] flex-col gap-0 overflow-hidden bg-zinc-950 p-0';

export const SWAP_DIALOG_SCROLL_CLASSNAME =
  'no-scrollbar min-h-0 flex-1 overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]';

export const SWAP_DIALOG_ACTION_BAR_CLASSNAME =
  // `z-20` keeps the button above the in-body swap arrow (`z-10`) so, when the
  // two overlap after scrolling on a short viewport, the arrow can't paint over
  // the button or steal its taps.
  'pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]';

const WHITESPACE = /\s+/;
const BOUNDED_DYNAMIC_HEIGHT_CLASS = /^max-h-\[\d+(?:s|d)vh\]$/;
const VERTICAL_SCROLL_CLASSES = new Set([
  'overflow-y-auto',
  'overflow-y-scroll',
  'overflow-auto',
  'overflow-scroll',
]);

/**
 * The dialog shell must be a height-bounded column: bounded with a *dynamic*
 * viewport unit (`svh`/`dvh`, never static `vh`, which ignores mobile browser
 * chrome) and laid out as a flex column so a scroll region + pinned action bar
 * can divide its height.
 */
export function isBoundedColumnDialog(className: string): boolean {
  const classes = className.split(WHITESPACE).filter(Boolean);
  const boundedDynamic = classes.some((c) =>
    BOUNDED_DYNAMIC_HEIGHT_CLASS.test(c),
  );
  const isColumn = classes.includes('flex') && classes.includes('flex-col');
  return boundedDynamic && isColumn;
}

/**
 * The dialog must be responsive: a full-width **bottom sheet** on small screens
 * (anchored to the bottom edge / thumb zone — `bottom-0` + `top-auto`, not a
 * floating centered card) and a **centered card** from `sm` up (`sm:top-1/2` +
 * `sm:-translate-y-1/2`). Anchoring the sheet to the bottom on mobile is the
 * wallet/exchange best practice and keeps the primary action thumb-reachable.
 */
export function isResponsiveBottomSheet(className: string): boolean {
  const classes = className.split(WHITESPACE).filter(Boolean);
  const mobileBottomAnchored =
    classes.includes('bottom-0') && classes.includes('top-auto');
  const desktopCentered =
    classes.includes('sm:top-1/2') && classes.includes('sm:-translate-y-1/2');
  return mobileBottomAnchored && desktopCentered;
}

/**
 * The body region must be able to shrink and scroll (`min-h-0` + a vertical
 * scroll affordance) so it — not the action bar — absorbs overflow, AND it must
 * reserve bottom scroll clearance that accounts for the safe area, so the last
 * content can scroll clear of the floating action bar instead of being stuck
 * behind the button.
 */
export function isScrollableBody(className: string): boolean {
  const classes = className.split(WHITESPACE).filter(Boolean);
  const canShrink = classes.includes('min-h-0');
  const scrolls = classes.some((c) => VERTICAL_SCROLL_CLASSES.has(c));
  const clearsFloatingAction =
    /pb-\[[^\]]*env\(safe-area-inset-bottom\)[^\]]*\]/.test(className);
  return canShrink && scrolls && clearsFloatingAction;
}

/**
 * The action bar must be a bottom-anchored overlay (`absolute bottom-0`) that
 * lets scroll/touch pass through to the content behind it (`pointer-events-none`
 * on the wrapper — the button re-enables pointer events) and pads for the
 * device safe area so the primary button stays tappable above the home
 * indicator / browser chrome. Being an overlay (not an in-flow footer) is what
 * lets the body scroll full height behind it instead of being blocked. This is
 * the #4587 invariant.
 */
export function isSafeActionBar(className: string): boolean {
  const classes = className.split(WHITESPACE).filter(Boolean);
  const isBottomOverlay =
    classes.includes('absolute') && classes.includes('bottom-0');
  const passesThroughToContent = classes.includes('pointer-events-none');
  const respectsSafeArea = className.includes('env(safe-area-inset-bottom)');
  return isBottomOverlay && passesThroughToContent && respectsSafeArea;
}

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
      // The live button interpolates the ETH cost ("Pay 0.0088 ETH"); this is
      // the amount-less reference fallback for the ready state.
      return 'Pay';
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
