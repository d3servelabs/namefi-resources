'use client';

import { createContext, useContext } from 'react';

export interface ConnectWalletOptions {
  /**
   * A hint for which wallet to surface in the connect flow. Currently a no-op:
   * Reown AppKit's modal lets the user pick the wallet and cannot be pinned to a
   * specific address. Kept so callers can express intent without branching.
   */
  suggestedAddress?: string;
}

/**
 * The provider-agnostic wallet-connection operations consumed by the wallet
 * dialogs. The Reown AppKit stack publishes an implementation through
 * {@link WalletConnectionRuntimeContext}, so the dialogs never depend on a
 * stack-specific hook directly.
 */
export interface WalletConnectionRuntime {
  /**
   * Open the wallet-connect flow. Resolves once the flow has been kicked off —
   * callers gate success on wagmi's `useAccount()` reaching the target wallet,
   * not on this promise.
   */
  connectWallet: (options?: ConnectWalletOptions) => Promise<void>;
  /**
   * Make `address` the active wagmi account. AppKit holds a single live
   * connection, so this is a best-effort that re-opens the connect modal when
   * the active account does not already match.
   */
  setActiveWalletByAddress: (address: string) => Promise<void>;
}

/**
 * Render-safe fallback used when no stack has mounted a runtime (e.g. Storybook,
 * which mocks `@/components/providers/wagmi`). Methods are no-ops so dialogs
 * render without a provider; the real app always mounts a runtime via
 * `WagmiProvider`.
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
