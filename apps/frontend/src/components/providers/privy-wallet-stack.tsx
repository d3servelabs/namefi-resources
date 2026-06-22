'use client';

import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { useConnectWallet, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useMemo, type PropsWithChildren } from 'react';
import { getWagmiConfig } from '@/lib/wagmi-config';
import { SessionsProvider } from './privy';
import {
  WalletConnectionRuntimeContext,
  type WalletConnectionRuntime,
} from './wallet-connection-runtime';

let config: ReturnType<typeof getWagmiConfig> | null = null;

function getConfig() {
  config ??= getWagmiConfig();
  return config;
}

/**
 * Publishes the Privy-backed {@link WalletConnectionRuntime}: connect goes
 * through Privy's modal and `setActiveWallet` switches among Privy's connected
 * wallets. Lives inside `PrivyWagmiProvider` because `useSetActiveWallet`
 * requires it.
 */
function PrivyWalletConnectionBridge({ children }: PropsWithChildren) {
  const { connectWallet } = useConnectWallet();
  const { setActiveWallet } = useSetActiveWallet();
  const { wallets } = useWallets();

  const runtime = useMemo<WalletConnectionRuntime>(
    () => ({
      mode: 'privy',
      async connectWallet(options) {
        await connectWallet(
          options?.suggestedAddress
            ? { suggestedAddress: options.suggestedAddress }
            : undefined,
        );
      },
      async setActiveWalletByAddress(address) {
        const target = wallets.find(
          (wallet) =>
            wallet.type === 'ethereum' &&
            wallet.address.toLowerCase() === address.toLowerCase(),
        );
        if (!target) {
          throw new Error('Wallet not connected');
        }
        await setActiveWallet(target);
      },
    }),
    [connectWallet, setActiveWallet, wallets],
  );

  return (
    <WalletConnectionRuntimeContext.Provider value={runtime}>
      {children}
    </WalletConnectionRuntimeContext.Provider>
  );
}

/**
 * The default wallet stack (feature flag off): Privy owns identity *and* the
 * wagmi runtime via `@privy-io/wagmi`. This is the historical behavior, kept
 * byte-for-byte so `ff_mobile_walletconnect=0` is a no-op.
 */
export function PrivyWalletStack({ children }: PropsWithChildren) {
  return (
    <SessionsProvider>
      <PrivyWagmiProvider config={getConfig()}>
        <PrivyWalletConnectionBridge>{children}</PrivyWalletConnectionBridge>
      </PrivyWagmiProvider>
    </SessionsProvider>
  );
}
