'use client';

import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit, useAppKit } from '@reown/appkit/react';
import {
  type LinkedAccountWithMetadata,
  useLinkWithSiwe,
  usePrivy,
  type WalletWithMetadata,
} from '@privy-io/react-auth';
import { useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import {
  WagmiProvider as BaseWagmiProvider,
  useAccount,
  useSignMessage,
} from 'wagmi';
import { clientSideEnv } from '@/lib/env';
import {
  getSupportedChainTransports,
  supportedChains,
} from '@/lib/wagmi-config';
import { SessionsProvider } from './privy';
import {
  WalletConnectionRuntimeContext,
  type WalletConnectionRuntime,
} from './wallet-connection-runtime';

// Our viem chains satisfy AppKit's `BaseNetwork` branch (AppKit derives the
// CAIP id from `id`), so we keep a single source of truth for chains.
const networks = [...supportedChains] as unknown as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

// A wagmi config must be a stable singleton, and `createAppKit` must run exactly
// once. This module is only ever loaded via `next/dynamic({ ssr: false })` from
// `wagmi.tsx`, so it is client-only.
let wagmiAdapter: WagmiAdapter | null = null;

function getReownWagmiAdapter(): WagmiAdapter {
  if (!wagmiAdapter) {
    wagmiAdapter = new WagmiAdapter({
      networks,
      projectId: clientSideEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      transports: getSupportedChainTransports(),
      ssr: true,
    });
    // Use the actual page origin so WalletConnect dApp identity + deep-link
    // return match the host the user is on (Namefi or a powered-by-namefi
    // tenant). This module is client-only (dynamic ssr:false), so `window` is
    // safe; fall back to the canonical origin only as a defensive default.
    const appOrigin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://app.namefi.io';
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId: clientSideEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'Namefi',
        description: 'Namefi — tokenized domain management',
        url: appOrigin,
        icons: [`${appOrigin}/logotype.svg`],
      },
      // Reown owns only the external-wallet connection + deep-link; Privy stays
      // for identity, so AppKit's own email/social login is disabled.
      features: { analytics: false, email: false, socials: false },
    });
  }
  return wagmiAdapter;
}

/**
 * Concurrency + backoff control for the eager SIWE link, at **module scope** so
 * it survives the per-route `WagmiProvider` remounting on navigation (the root
 * cause of the prior attempt re-prompting SIWE on every `/mart` ↔ `/domains`
 * navigation). `inFlight` prevents a second prompt while one is open; `failedAt`
 * applies a cooldown after a dismissed/failed attempt so navigation does not
 * re-prompt in a tight loop — but, unlike a permanent block, it still retries
 * once the cooldown elapses. The real "already done" signal is Privy's live
 * `linkedAccounts` (checked first); `linked` is a success marker that bridges
 * the brief window between `linkWithSiwe` resolving and Privy's `user` object
 * reflecting the new linked account, so we don't fire a duplicate prompt then.
 */
const siweLinkInFlight = new Set<string>();
const siweLinkedKeys = new Set<string>();
const siweLinkFailedAt = new Map<string, number>();
const SIWE_LINK_RETRY_COOLDOWN_MS = 60_000;

/**
 * After a wallet connects via Reown AppKit, register it on the authenticated
 * Privy user with `useLinkWithSiwe` (a plain SIWE signature — no Privy modal, no
 * fragile deep-link). The backend trusts Privy *linked* wallets for ownership +
 * every EIP-712 signed mutation, so a connected-but-unlinked wallet would be
 * rejected. The "already linked" check reads Privy's **live** `user` object (not
 * the app auth-context snapshot, which lagged in the prior attempt), so a
 * successful link stops further prompts immediately.
 */
function useReconcileConnectedWalletWithPrivy() {
  const { address, chainId, connector, isConnected } = useAccount();
  const { ready, authenticated, user } = usePrivy();
  const { generateSiweMessage, linkWithSiwe } = useLinkWithSiwe();
  const { signMessageAsync } = useSignMessage();

  // Live mirror of the connected address so an in-flight link can tell whether
  // the *same* wallet is still connected after an await — distinguishing a
  // benign provider remount (same wallet → finish linking) from a real wallet
  // switch (different wallet → abort without burning the retry cooldown).
  const latestAddressRef = useRef(address);
  latestAddressRef.current = address;

  useEffect(() => {
    // Require `connector` to be settled too: attempting while wagmi is still
    // hydrating can fail and (previously) burned the dedup slot permanently.
    if (
      !ready ||
      !authenticated ||
      !isConnected ||
      !address ||
      !chainId ||
      !connector ||
      !user
    ) {
      return;
    }

    const lowerAddress = address.toLowerCase();
    const key = `${user.id}:${lowerAddress}`;
    const alreadyLinked = (user.linkedAccounts ?? []).some(
      (account: LinkedAccountWithMetadata) =>
        account.type === 'wallet' &&
        (account as WalletWithMetadata).chainType === 'ethereum' &&
        (account as WalletWithMetadata).address?.toLowerCase() === lowerAddress,
    );
    if (alreadyLinked) {
      // Privy's live state now reflects the link — release the transient bridge
      // so it can't permanently block re-linking if the wallet is later unlinked.
      siweLinkedKeys.delete(key);
      return;
    }
    // `siweLinkedKeys` only bridges the gap between `linkWithSiwe` resolving and
    // Privy's `linkedAccounts` catching up, preventing a back-to-back duplicate
    // prompt in that window; it's cleared above once Privy reflects the link.
    if (siweLinkedKeys.has(key)) {
      return;
    }

    if (siweLinkInFlight.has(key)) {
      return;
    }
    const failedAt = siweLinkFailedAt.get(key);
    if (
      failedAt !== undefined &&
      Date.now() - failedAt < SIWE_LINK_RETRY_COOLDOWN_MS
    ) {
      return;
    }

    // True only if the originally-connected wallet is still the active one.
    const isSameWalletConnected = () =>
      latestAddressRef.current?.toLowerCase() === lowerAddress;

    siweLinkInFlight.add(key);
    void (async () => {
      try {
        // Privy expects CAIP-2 chain ids (e.g. "eip155:8453").
        const caip2ChainId = `eip155:${chainId}`;
        const message = await generateSiweMessage({
          address,
          chainId: caip2ChainId,
        });
        // If the user switched/disconnected mid-flight, abort without recording a
        // failure (it's a different wallet now, with its own key + attempt).
        if (!isSameWalletConnected()) return;
        const signature = await signMessageAsync({ account: address, message });
        if (!isSameWalletConnected()) return;
        await linkWithSiwe({
          message,
          signature,
          chainId: caip2ChainId,
          walletClientType: connector.id,
          connectorType: connector.type,
        });
        // Mark linked immediately so a re-render before Privy's `user` updates
        // doesn't start a second sign/link for the same wallet.
        siweLinkedKeys.add(key);
        siweLinkFailedAt.delete(key);
      } catch (error) {
        // Start a cooldown rather than blocking forever, so a transient failure
        // or dismissed prompt retries later without re-prompting every nav.
        siweLinkFailedAt.set(key, Date.now());
        console.warn('[wallet] SIWE link to Privy failed', error);
      } finally {
        siweLinkInFlight.delete(key);
      }
    })();
  }, [
    ready,
    authenticated,
    user,
    isConnected,
    address,
    chainId,
    connector,
    generateSiweMessage,
    signMessageAsync,
    linkWithSiwe,
  ]);
}

/**
 * Publishes the Reown-backed {@link WalletConnectionRuntime}. AppKit holds a
 * single live connection, so connect/switch route through its modal, which uses
 * universal/app links for the wallet deep-link.
 */
function ReownWalletConnectionBridge({ children }: PropsWithChildren) {
  const { open } = useAppKit();
  const { address } = useAccount();

  useReconcileConnectedWalletWithPrivy();

  const runtime = useMemo<WalletConnectionRuntime>(
    () => ({
      mode: 'reown',
      async connectWallet() {
        await open();
      },
      async setActiveWalletByAddress(targetAddress) {
        // Single active connection: if it already matches, we're done; otherwise
        // open the modal so the user can connect/switch to the requested wallet.
        if (address && address.toLowerCase() === targetAddress.toLowerCase()) {
          return;
        }
        await open();
      },
    }),
    [open, address],
  );

  return (
    <WalletConnectionRuntimeContext.Provider value={runtime}>
      {children}
    </WalletConnectionRuntimeContext.Provider>
  );
}

/**
 * The Reown AppKit wallet stack (feature flag on): plain `wagmi` + AppKit own the
 * live connection and the wallet deep-link (universal/app links — fixes mobile
 * MetaMask connect); `PrivyProvider` (via `SessionsProvider`, mounted at the
 * root) stays for identity. Loaded via `next/dynamic` so neither AppKit nor its
 * connectors ship on the default flag-off path.
 */
export function ReownWalletStack({ children }: PropsWithChildren) {
  const adapter = getReownWagmiAdapter();
  return (
    <SessionsProvider>
      <BaseWagmiProvider config={adapter.wagmiConfig}>
        <ReownWalletConnectionBridge>{children}</ReownWalletConnectionBridge>
      </BaseWagmiProvider>
    </SessionsProvider>
  );
}
