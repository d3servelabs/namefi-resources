'use client';

import '@rainbow-me/rainbowkit/styles.css';

import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
  useAccountModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit';
import { useLinkWithSiwe, usePrivy } from '@privy-io/react-auth';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import {
  WagmiProvider as BaseWagmiProvider,
  useAccount,
  useSignMessage,
} from 'wagmi';
import { clientSideEnv } from '@/lib/env';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import {
  getSupportedChainTransports,
  supportedChains,
} from '@/lib/wagmi-config';
import { SessionsProvider } from './privy';
import {
  WalletConnectionRuntimeContext,
  type WalletConnectionRuntime,
} from './wallet-connection-runtime';

let rainbowKitConfig: ReturnType<typeof getDefaultConfig> | null = null;

function getRainbowKitConfig() {
  // RainbowKit's `getDefaultConfig` wraps wagmi's `createConfig` with the
  // wallet list (MetaMask, Coinbase, WalletConnect, injected, …) — so *we* own
  // the connectors and therefore the deep-link mechanism. Built once and cached:
  // a wagmi config must be a stable singleton across renders.
  rainbowKitConfig ??= getDefaultConfig({
    appName: 'Namefi',
    projectId: clientSideEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: supportedChains,
    transports: getSupportedChainTransports(),
    ssr: true,
  });
  return rainbowKitConfig;
}

/**
 * After a wallet connects via RainbowKit, register it on the authenticated
 * Privy user with `useLinkWithSiwe` — a plain SIWE signature, no Privy modal and
 * no fragile deep-link. The backend treats Privy *linked* wallets as the source
 * of truth for ownership and for every EIP-712 signed mutation, so a wallet that
 * is connected but not Privy-linked would sign client-side yet be rejected by
 * the backend. Linking here closes that gap before the first signed op.
 */
function useReconcileConnectedWalletWithPrivy() {
  const { address, chainId, connector, isConnected } = useAccount();
  const { ready, authenticated, user } = usePrivy();
  const { linkedWallets, linkedWalletsReady } = useLinkedWallets();
  const { generateSiweMessage, linkWithSiwe } = useLinkWithSiwe();
  const { signMessageAsync } = useSignMessage();

  // Tracks which (address, chain) pairs we have already attempted, so a single
  // connection never re-prompts for a signature in a loop.
  const attemptedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ready || !authenticated || !isConnected || !address || !chainId) {
      return;
    }
    if (!linkedWalletsReady) {
      return;
    }

    const lowerAddress = address.toLowerCase();
    const alreadyLinked = linkedWallets.some(
      (wallet) => wallet.address.toLowerCase() === lowerAddress,
    );
    if (alreadyLinked) {
      return;
    }

    // Scope the dedup key to the authenticated Privy user too — otherwise, after
    // a logout/login on the same connected wallet, a prior user's attempt would
    // skip linking the wallet to the newly signed-in user.
    const key = `${user?.id ?? 'anon'}:${lowerAddress}:${chainId}`;
    if (attemptedKeysRef.current.has(key)) {
      return;
    }
    attemptedKeysRef.current.add(key);

    void (async () => {
      try {
        // Privy expects CAIP-2 chain ids (e.g. "eip155:8453").
        const caip2ChainId = `eip155:${chainId}`;
        const message = await generateSiweMessage({
          address,
          chainId: caip2ChainId,
        });
        const signature = await signMessageAsync({ account: address, message });
        await linkWithSiwe({
          message,
          signature,
          chainId: caip2ChainId,
          walletClientType: connector?.id,
          connectorType: connector?.type,
        });
      } catch (error) {
        // Allow a retry on the next connect/render (the user may have dismissed
        // the signature prompt, or linking transiently failed).
        attemptedKeysRef.current.delete(key);
        console.warn('[wallet] SIWE link to Privy failed', error);
      }
    })();
  }, [
    ready,
    authenticated,
    user?.id,
    isConnected,
    address,
    chainId,
    connector,
    linkedWallets,
    linkedWalletsReady,
    generateSiweMessage,
    signMessageAsync,
    linkWithSiwe,
  ]);
}

/**
 * Publishes the RainbowKit-backed {@link WalletConnectionRuntime}. RainbowKit
 * holds a single live connection, so connect/switch route through its modal,
 * which uses universal/app links for the wallet deep-link.
 */
function RainbowKitWalletConnectionBridge({ children }: PropsWithChildren) {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { address } = useAccount();

  useReconcileConnectedWalletWithPrivy();

  const openConnectOrManage = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
      return;
    }
    // Already connected — let the user manage/switch the account.
    openAccountModal?.();
  }, [openConnectModal, openAccountModal]);

  const runtime = useMemo<WalletConnectionRuntime>(
    () => ({
      async connectWallet() {
        openConnectOrManage();
      },
      async setActiveWalletByAddress(targetAddress) {
        // Single active connection: if it already matches, we're done; otherwise
        // re-open the modal so the user can connect the requested wallet.
        if (address && address.toLowerCase() === targetAddress.toLowerCase()) {
          return;
        }
        openConnectOrManage();
      },
    }),
    [openConnectOrManage, address],
  );

  return (
    <WalletConnectionRuntimeContext.Provider value={runtime}>
      {children}
    </WalletConnectionRuntimeContext.Provider>
  );
}

/**
 * The wallet stack: plain `wagmi` + RainbowKit own the live connection and the
 * wallet deep-link (universal/app links — fixes mobile MetaMask connect);
 * `PrivyProvider` (via `SessionsProvider`, mounted at the root) stays for
 * identity. This is the single wallet stack for every user (desktop + mobile);
 * the SIWE bridge above keeps the backend's Privy linked-wallet trust intact.
 */
export function RainbowKitWalletStack({ children }: PropsWithChildren) {
  return (
    <SessionsProvider>
      <BaseWagmiProvider config={getRainbowKitConfig()}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          <RainbowKitWalletConnectionBridge>
            {children}
          </RainbowKitWalletConnectionBridge>
        </RainbowKitProvider>
      </BaseWagmiProvider>
    </SessionsProvider>
  );
}
