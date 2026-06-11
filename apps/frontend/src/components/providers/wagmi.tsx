'use client';

import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { getWagmiConfig } from '@/lib/wagmi-config';

let config: ReturnType<typeof getWagmiConfig> | null = null;
const WagmiRuntimeContext = createContext(false);

function getConfig() {
  config ??= getWagmiConfig();
  return config;
}

/**
 * Public wallet-runtime boundary. Wrap components that call wagmi hooks when
 * their route or parent component does not already provide a wagmi runtime.
 *
 * The provider is idempotent: nested callers render through the existing
 * runtime instead of creating a second wagmi provider.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const hasWagmiRuntime = useContext(WagmiRuntimeContext);

  if (hasWagmiRuntime) {
    return children;
  }

  return (
    <PrivyWagmiProvider config={getConfig()}>
      <WagmiRuntimeContext.Provider value={true}>
        {children}
      </WagmiRuntimeContext.Provider>
    </PrivyWagmiProvider>
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
