'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createContext, useContext, type PropsWithChildren } from 'react';

const WagmiRuntimeContext = createContext(false);

// The wallet stack is plain `wagmi` + Reown AppKit: AppKit owns the external
// wallet connection and the deep-link (universal/app links — fixes mobile
// MetaMask connect), while Privy stays for identity. Loaded via
// `next/dynamic({ ssr: false })` because AppKit (`createAppKit`) and the wagmi
// adapter init touch `window`, so the module must be client-only. A loading
// fallback avoids a blank route while the chunk loads (cached after first load).
const ReownWalletStack = dynamic(
  () => import('./reown-wallet-stack').then((m) => m.ReownWalletStack),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

/**
 * Public wallet-runtime boundary. Wrap components that call wagmi hooks when
 * their route or parent component does not already provide a wagmi runtime.
 *
 * The provider is idempotent: nested callers render through the existing
 * runtime instead of creating a second wagmi provider. The outermost instance
 * mounts the Reown AppKit stack, which publishes a `WalletConnectionRuntime` so
 * leaf dialogs stay stack-agnostic.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const hasWagmiRuntime = useContext(WagmiRuntimeContext);

  if (hasWagmiRuntime) {
    return children;
  }

  return (
    <WagmiRuntimeContext.Provider value={true}>
      <ReownWalletStack>{children}</ReownWalletStack>
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
