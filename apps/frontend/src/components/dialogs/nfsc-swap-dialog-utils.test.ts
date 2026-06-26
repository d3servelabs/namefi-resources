import { describe, expect, it } from 'vitest';
import {
  getSwapButtonLabel,
  getSwapButtonState,
  isBoundedColumnDialog,
  isConnectAction,
  isResponsiveBottomSheet,
  isSafeActionBar,
  isScrollableBody,
  isSwapButtonBusy,
  isSwapButtonDisabled,
  SWAP_DIALOG_ACTION_BAR_CLASSNAME,
  SWAP_DIALOG_CONTENT_CLASSNAME,
  SWAP_DIALOG_SCROLL_CLASSNAME,
  type SwapButtonInput,
} from './nfsc-swap-dialog-utils';

const base: SwapButtonInput = {
  hasReadyWallet: true,
  isWalletConnecting: false,
  insufficientBalance: false,
  isPending: false,
  isAmountValid: true,
};

describe('getSwapButtonState', () => {
  it('is ready when wallet is connected, amount valid, nothing pending', () => {
    expect(getSwapButtonState(base)).toBe('ready');
  });

  it('shows processing while a swap is being submitted (highest priority)', () => {
    expect(
      getSwapButtonState({
        ...base,
        isPending: true,
        // even if other flags are off, an in-flight swap wins
        hasReadyWallet: false,
        insufficientBalance: true,
      }),
    ).toBe('processing');
  });

  it('shows wallet-loading while connection / signer is hydrating', () => {
    expect(
      getSwapButtonState({
        ...base,
        hasReadyWallet: false,
        isWalletConnecting: true,
      }),
    ).toBe('wallet-loading');
  });

  // Regression guard for the reported bug: when the wallet client is not ready
  // the button must NOT present as a swap (which threw "Signer not found" and
  // flickered Processing→Swap with no MetaMask prompt). It must offer to
  // connect instead.
  it('asks to connect when no signer is ready, even with a valid amount', () => {
    expect(getSwapButtonState({ ...base, hasReadyWallet: false })).toBe(
      'connect-wallet',
    );
  });

  it('prioritises connect over amount/balance validation', () => {
    expect(
      getSwapButtonState({
        ...base,
        hasReadyWallet: false,
        isAmountValid: false,
        insufficientBalance: true,
      }),
    ).toBe('connect-wallet');
  });

  it('flags insufficient balance only once the wallet is ready', () => {
    expect(getSwapButtonState({ ...base, insufficientBalance: true })).toBe(
      'insufficient-balance',
    );
  });

  it('asks for an amount when wallet is ready but amount is invalid', () => {
    expect(getSwapButtonState({ ...base, isAmountValid: false })).toBe(
      'enter-amount',
    );
  });
});

describe('button affordances', () => {
  it('keeps the connect action enabled and clickable as a connect', () => {
    expect(isSwapButtonDisabled('connect-wallet')).toBe(false);
    expect(isConnectAction('connect-wallet')).toBe(true);
  });

  it('keeps the ready action enabled and clickable as a swap', () => {
    expect(isSwapButtonDisabled('ready')).toBe(false);
    expect(isConnectAction('ready')).toBe(false);
  });

  it('disables non-actionable states', () => {
    expect(isSwapButtonDisabled('processing')).toBe(true);
    expect(isSwapButtonDisabled('wallet-loading')).toBe(true);
    expect(isSwapButtonDisabled('insufficient-balance')).toBe(true);
    expect(isSwapButtonDisabled('enter-amount')).toBe(true);
  });

  it('shows the spinner only while processing or connecting', () => {
    expect(isSwapButtonBusy('processing')).toBe(true);
    expect(isSwapButtonBusy('wallet-loading')).toBe(true);
    expect(isSwapButtonBusy('connect-wallet')).toBe(false);
    expect(isSwapButtonBusy('ready')).toBe(false);
  });

  it('labels every state', () => {
    expect(getSwapButtonLabel('processing')).toBe('Processing...');
    expect(getSwapButtonLabel('wallet-loading')).toBe('Connecting wallet...');
    expect(getSwapButtonLabel('connect-wallet')).toBe('Connect Wallet');
    expect(getSwapButtonLabel('insufficient-balance')).toBe(
      'Insufficient ETH Balance',
    );
    expect(getSwapButtonLabel('enter-amount')).toBe('Enter an amount');
    expect(getSwapButtonLabel('ready')).toBe('Pay');
  });
});

describe('isBoundedColumnDialog (#4578/#4587: dialog shell is a bounded column)', () => {
  it('rejects the original container: overflow-hidden, no bounded height', () => {
    // What shipped before #4578 — content taller than the viewport was clipped
    // with no way to reach the Swap button.
    expect(
      isBoundedColumnDialog(
        'max-w-md p-0 overflow-hidden bg-zinc-950 border border-zinc-800',
      ),
    ).toBe(false);
  });

  it('rejects a static vh cap (ignores mobile browser chrome)', () => {
    // `vh` does not shrink when the address bar shows, so a vh-sized dialog can
    // push its action under the browser chrome — the #4587 failure mode.
    expect(isBoundedColumnDialog('flex flex-col max-h-[90vh]')).toBe(false);
  });

  it('accepts a column bounded by a dynamic viewport unit (svh/dvh)', () => {
    expect(isBoundedColumnDialog('flex flex-col max-h-[90svh]')).toBe(true);
    expect(isBoundedColumnDialog('flex flex-col max-h-[90dvh]')).toBe(true);
  });

  it('rejects a bounded box that is not a column (cannot split body + action bar)', () => {
    expect(isBoundedColumnDialog('grid max-h-[90svh]')).toBe(false);
  });

  it('guards the actual container class the swap dialog renders', () => {
    expect(isBoundedColumnDialog(SWAP_DIALOG_CONTENT_CLASSNAME)).toBe(true);
  });
});

describe('isResponsiveBottomSheet (#4587: bottom sheet on mobile, centered card on desktop)', () => {
  it('requires bottom-anchoring on mobile and centering from sm up', () => {
    expect(
      isResponsiveBottomSheet(
        'bottom-0 top-auto sm:top-1/2 sm:-translate-y-1/2',
      ),
    ).toBe(true);
    // A purely centered modal (no mobile bottom-anchor) is not responsive.
    expect(isResponsiveBottomSheet('top-1/2 -translate-y-1/2')).toBe(false);
    // Bottom-anchored but never restores the centered card on desktop.
    expect(isResponsiveBottomSheet('bottom-0 top-auto')).toBe(false);
  });

  it('guards the actual container class the swap dialog renders', () => {
    expect(isResponsiveBottomSheet(SWAP_DIALOG_CONTENT_CLASSNAME)).toBe(true);
  });
});

describe('isScrollableBody (#4587: body scrolls full height, clears the floating action bar)', () => {
  it('requires min-h-0, a vertical-scroll affordance, and safe-area scroll clearance', () => {
    expect(
      isScrollableBody(
        'min-h-0 flex-1 overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]',
      ),
    ).toBe(true);
    // Without min-h-0 a flex child cannot shrink below its content → no scroll.
    expect(
      isScrollableBody(
        'flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]',
      ),
    ).toBe(false);
    expect(
      isScrollableBody('min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]'),
    ).toBe(false);
    // No safe-area scroll clearance → last content stays stuck behind the
    // floating button and can't be scrolled clear.
    expect(isScrollableBody('min-h-0 flex-1 overflow-y-auto')).toBe(false);
    expect(isScrollableBody('min-h-0 flex-1 overflow-y-auto pb-24')).toBe(
      false,
    );
  });

  it('guards the actual scroll-region class the swap dialog renders', () => {
    expect(isScrollableBody(SWAP_DIALOG_SCROLL_CLASSNAME)).toBe(true);
  });
});

describe('isSafeActionBar (#4587: floating Swap button stays tappable, content scrolls behind)', () => {
  it('requires a bottom overlay that passes touch through and respects the safe area', () => {
    expect(
      isSafeActionBar(
        'pointer-events-none absolute inset-x-0 bottom-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
      ),
    ).toBe(true);
    // In-flow footer (shrink-0) reserves space → body can't scroll behind it.
    expect(
      isSafeActionBar('shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]'),
    ).toBe(false);
    // No pointer-events-none → the transparent padding would block scroll/touch
    // to the content behind it.
    expect(
      isSafeActionBar(
        'absolute bottom-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
      ),
    ).toBe(false);
    // No safe-area padding → button can sit under the iOS home indicator.
    expect(isSafeActionBar('pointer-events-none absolute bottom-0 pb-6')).toBe(
      false,
    );
  });

  it('guards the actual action-bar class the swap dialog renders', () => {
    expect(isSafeActionBar(SWAP_DIALOG_ACTION_BAR_CLASSNAME)).toBe(true);
  });
});
