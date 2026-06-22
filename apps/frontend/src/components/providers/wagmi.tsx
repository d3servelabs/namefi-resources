'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { PrivyWalletStack } from './privy-wallet-stack';

const WagmiRuntimeContext = createContext(false);

/**
 * Global flag that swaps the wallet stack from Privy-owned (`@privy-io/wagmi`)
 * to Reown AppKit-owned connectors so the mobile MetaMask deep-link uses
 * universal/app links instead of Privy's `window.open('metamask://…')`.
 * URL-param testable as `ff_mobile_walletconnect=1`; default off, so the flag
 * off path is the unchanged Privy behavior. See namefi-astra#4753.
 */
export const MOBILE_WALLETCONNECT_FLAG: FeatureFlagDefinition = {
  key: 'mobile_walletconnect',
  label: 'Mobile WalletConnect (Reown AppKit)',
  description:
    'Own the WalletConnect connector via Reown AppKit so the mobile wallet deep-link works (iOS + Android). Privy stays for identity. Off = current Privy wallet stack.',
  scope: 'global',
  defaultValue: false,
};

const MOBILE_WALLETCONNECT_FLAGS: FeatureFlagDefinition[] = [
  MOBILE_WALLETCONNECT_FLAG,
];

// Dynamically imported so neither Reown AppKit nor its connectors ship on the
// default (flag-off) path — only loaded once an admin/tester enables the flag.
// A loading fallback avoids a blank route while the chunk loads (the chunk is
// cached after first load; flag-off users never hit this path).
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
 * selects the wallet stack from the `ff_mobile_walletconnect` flag — either the
 * Privy-owned default or the Reown AppKit-owned stack — and both publish a
 * `WalletConnectionRuntime` so leaf dialogs stay stack-agnostic.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const hasWagmiRuntime = useContext(WagmiRuntimeContext);
  useRegisterAdminFlags(MOBILE_WALLETCONNECT_FLAGS);
  const [mobileWalletConnectEnabled] = useAdminFeatureFlag(
    MOBILE_WALLETCONNECT_FLAG,
  );

  if (hasWagmiRuntime) {
    return children;
  }

  return (
    <WagmiRuntimeContext.Provider value={true}>
      {mobileWalletConnectEnabled ? (
        <ReownWalletStack>{children}</ReownWalletStack>
      ) : (
        <PrivyWalletStack>{children}</PrivyWalletStack>
      )}
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
