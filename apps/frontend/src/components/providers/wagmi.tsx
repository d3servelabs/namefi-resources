'use client';

import { createContext, useContext, type PropsWithChildren } from 'react';
import { RainbowKitWalletStack } from './rainbowkit-wallet-stack';

const WagmiRuntimeContext = createContext(false);

/**
 * Public wallet-runtime boundary. Wrap components that call wagmi hooks when
 * their route or parent component does not already provide a wagmi runtime.
 *
 * The provider is idempotent: nested callers render through the existing runtime
 * instead of creating a second wagmi provider. It mounts the RainbowKit-owned
 * wallet stack — plain `wagmi` + RainbowKit own the connectors and the wallet
 * deep-link (universal/app links, fixing mobile MetaMask connect), while Privy
 * stays for identity. See namefi-astra#4753.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const hasWagmiRuntime = useContext(WagmiRuntimeContext);

  if (hasWagmiRuntime) {
    return children;
  }

  return (
    <WagmiRuntimeContext.Provider value={true}>
      <RainbowKitWalletStack>{children}</RainbowKitWalletStack>
    </WagmiRuntimeContext.Provider>
  );
}

/**
 * Public signal for leaf components that need to know whether a parent already
 * owns the wallet runtime. Prefer wrapping wallet hook consumers in
 * WagmiProvider unless the component only needs to decide whether to request a
 * runtime-owned child.
 */
export function useHasWagmiRuntime() {
  return useContext(WagmiRuntimeContext);
}
