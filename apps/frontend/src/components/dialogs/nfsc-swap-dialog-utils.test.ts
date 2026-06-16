import { describe, expect, it } from 'vitest';
import {
  getSwapButtonLabel,
  getSwapButtonState,
  isConnectAction,
  isSwapButtonBusy,
  isSwapButtonDisabled,
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
    expect(getSwapButtonLabel('ready')).toBe('Swap Tokens');
  });
});
