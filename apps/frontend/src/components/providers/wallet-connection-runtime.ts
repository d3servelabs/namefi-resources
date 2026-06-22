'use client';

import { createContext, useContext } from 'react';

export interface ConnectWalletOptions {
  /**
   * A hint for which wallet to surface. Currently advisory only — RainbowKit's
   * modal lets the user pick the wallet — but kept so callers can express intent
   * (e.g. "connect the wallet that owns this domain").
   */
  suggestedAddress?: string;
}

/**
 * The wallet-connection operations consumed by the wallet dialogs. The
 * RainbowKit stack publishes an implementation through
 * {@link WalletConnectionRuntimeContext}, so the dialogs never import RainbowKit
 * (or wagmi connector) hooks directly — which also keeps them render-safe in
 * Storybook, where the wagmi provider is mocked and no runtime is mounted.
 */
export interface WalletConnectionRuntime {
  /**
   * Open the wallet-connect flow. Resolves once the flow has been kicked off —
   * callers gate success on wagmi's `useAccount()` reaching the target wallet,
   * not on this promise.
   */
  connectWallet: (options?: ConnectWalletOptions) => Promise<void>;
  /**
   * Make `address` the active wagmi account. RainbowKit holds a single live
   * connection, so this is a best-effort: a no-op when the active account
   * already matches, otherwise it re-opens the connect modal.
   */
  setActiveWalletByAddress: (address: string) => Promise<void>;
}

/**
 * Render-safe fallback used when no runtime is mounted (e.g. Storybook, which
 * mocks `@/components/providers/wagmi`). Methods are no-ops so dialogs render
 * without a provider; the real app always mounts a runtime via `WagmiProvider`.
 */
const FALLBACK_WALLET_CONNECTION_RUNTIME: WalletConnectionRuntime = {
  async connectWallet() {
    console.warn(
      '[wallet] connectWallet() called with no WalletConnectionRuntime mounted',
    );
  },
  async setActiveWalletByAddress() {
    console.warn(
      '[wallet] setActiveWalletByAddress() called with no WalletConnectionRuntime mounted',
    );
  },
};

export const WalletConnectionRuntimeContext =
  createContext<WalletConnectionRuntime | null>(null);

/**
 * Read the active wallet-connection runtime. Returns a no-op fallback when no
 * provider is mounted so leaf components stay render-safe.
 */
export function useWalletConnectionRuntime(): WalletConnectionRuntime {
  return (
    useContext(WalletConnectionRuntimeContext) ??
    FALLBACK_WALLET_CONNECTION_RUNTIME
  );
}
