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
import { getAddress } from 'viem';
import {
  WagmiProvider as BaseWagmiProvider,
  type Config,
  createConfig,
  useAccount,
  useConfig,
  useSignMessage,
} from 'wagmi';
import { getAccount, watchAccount } from 'wagmi/actions';
import { isClientDebugFlagEnabled } from '@/lib/debug-flag';
import { clientSideEnv } from '@/lib/env';
import {
  getSupportedChainTransports,
  supportedChains,
} from '@/lib/wagmi-config';
import { isWalletConnectNativeDeepLink } from '@/lib/wallet-deeplink';
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
// The AppKit instance, kept so `connectWallet` can await the modal's lifecycle
// (`subscribeState`) rather than only kicking it open.
let appKitModal: ReturnType<typeof createAppKit> | null = null;

// Reown/WalletConnect Explorer wallet ids, surfaced first in the AppKit modal so
// the common mobile wallets deep-link with one tap instead of being buried under
// "All Wallets". Ids verified against the Reown Explorer API.
const FEATURED_WALLET_IDS = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  'ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef', // imToken
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
];

// Opt-in deeplink logging so the reroute can be confirmed in the console (e2e /
// manual) without ever logging the wc `symKey`. Triggered by
// `?wallet_deeplink_debug=1`, a `wallet_deeplink_debug` localStorage key, or a
// `window.__WALLET_DEEPLINK_DEBUG` global.
function isWalletDeepLinkDebug(): boolean {
  return isClientDebugFlagEnabled(
    'wallet_deeplink_debug',
    '__WALLET_DEEPLINK_DEBUG',
  );
}

// Reown AppKit opens a connecting wallet via its native custom scheme
// (`metamask://wc?uri=…`) using `window.open`, which iOS Safari does not reliably
// honor (the app often doesn't open and the user lands on a web page). Intercept
// just that call and re-fire the SAME deep link via `window.location.href` — iOS
// honors a same-tab navigation to a wallet scheme far more reliably than a
// `window.open` of it. This is exactly what Uniswap's web app does for its own
// wallet (`window.location.href = uniswap://wc?uri=…`, explicitly avoiding
// `window.open` for popup-blocker / inconsistency reasons). Installed once,
// before AppKit init; only WalletConnect custom-scheme deep links are touched —
// every other `window.open` (http(s) links, etc.) passes straight through.
let walletDeepLinkShimInstalled = false;
function installWalletDeepLinkShim(): void {
  if (walletDeepLinkShimInstalled || typeof window === 'undefined') return;
  walletDeepLinkShimInstalled = true;
  const nativeOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const href = typeof url === 'string' ? url : (url?.toString() ?? '');
    if (isWalletConnectNativeDeepLink(href)) {
      if (isWalletDeepLinkDebug()) {
        const scheme = href.slice(0, href.indexOf('://') + 3);
        console.info(
          '[wallet-deeplink] launching %s via location.href (not window.open)',
          scheme,
        );
      }
      window.location.href = href;
      return null;
    }
    return nativeOpen(url as string, target, features);
  }) as typeof window.open;
}

function getReownWagmiAdapter(projectId: string): WagmiAdapter {
  installWalletDeepLinkShim();
  if (!wagmiAdapter) {
    wagmiAdapter = new WagmiAdapter({
      networks,
      projectId,
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
    appKitModal = createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      metadata: {
        name: 'Namefi',
        description: 'Namefi — tokenized domain management',
        url: appOrigin,
        icons: [`${appOrigin}/logotype.svg`],
      },
      // Surface MetaMask / imToken / Trust / Rainbow first so the mobile deep-link
      // is one tap; other WalletConnect wallets stay available under "All Wallets".
      featuredWalletIds: FEATURED_WALLET_IDS,
      // Reown owns only the external-wallet connection + deep-link; Privy stays
      // for identity, so AppKit's own email/social login is disabled.
      features: { analytics: false, email: false, socials: false },
    });
  }
  return wagmiAdapter;
}

/** Safety ceiling so `connectWallet` can never leave an imperative caller (e.g.
 *  `/mart` Buy Now) hanging if neither a connection nor a modal-close is ever
 *  observed. Generous because connecting is an interactive, human-paced flow. */
const CONNECT_FLOW_MAX_WAIT_MS = 180_000;

/**
 * Resolve once the connect flow the user just opened has settled — either the
 * wagmi account reached `connected` (success) or the AppKit modal was opened and
 * then closed (dismissed without connecting). `open()` only resolves when the
 * modal *mounts*, so awaiting this restores the "resolves after the user acted"
 * contract imperative callers rely on (they then read `useAccount()` for the
 * outcome).
 *
 * Deliberately does NOT bail on the initial modal state: right after `open()`
 * the published `open` flag can still read `false` for a tick, so keying off it
 * would resolve early and misreport an in-progress connect as cancelled (the
 * Bugbot finding). We wait for a real signal — account `connected`, or an
 * observed open→closed transition (latched on `sawModalOpen`) — with a long
 * safety ceiling so the caller can never hang forever.
 *
 * Exported so the wallet sign-in flow (`sign-in-chooser`) can await the same
 * "user finished connecting (or gave up)" signal after opening AppKit, instead
 * of re-implementing the latch.
 */
export function waitForConnectFlowSettled(config: Config): Promise<void> {
  if (getAccount(config).status === 'connected') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    // Latch: only treat a closed modal as a dismissal once we've actually seen
    // it open, so the brief post-`open()` `false` window can't end the wait.
    let sawModalOpen = appKitModal?.getState().open ?? false;
    const cleanups: Array<() => void> = [];
    const finish = () => {
      if (settled) return;
      settled = true;
      for (const cleanup of cleanups) cleanup();
      resolve();
    };

    // Success signal: the wagmi account becomes connected.
    cleanups.push(
      watchAccount(config, {
        onChange(account) {
          if (account.status === 'connected') finish();
        },
      }),
    );

    // Abort signal: the modal was open and is now closed — lets a give-up
    // resolve promptly instead of waiting out the ceiling.
    const modal = appKitModal;
    if (modal) {
      cleanups.push(
        modal.subscribeState((state) => {
          if (state.open) {
            sawModalOpen = true;
          } else if (sawModalOpen) {
            finish();
          }
        }),
      );
    }

    // Safety ceiling.
    const timer = globalThis.setTimeout(finish, CONNECT_FLOW_MAX_WAIT_MS);
    cleanups.push(() => globalThis.clearTimeout(timer));

    // Close the subscribe-after-check race: the account may have flipped to
    // `connected` between the initial read and the watcher taking effect.
    if (getAccount(config).status === 'connected') finish();
  });
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
        // Privy expects CAIP-2 chain ids (e.g. "eip155:8453"). Checksum the
        // address (EIP-55): some mobile WalletConnect connectors surface a
        // lowercase address, which would make Privy's SIWE message disagree with
        // the recovered signer and reject the link (matches the chooser path).
        const caip2ChainId = `eip155:${chainId}`;
        const checksummedAddress = getAddress(address);
        const message = await generateSiweMessage({
          address: checksummedAddress,
          chainId: caip2ChainId,
        });
        // If the user switched/disconnected mid-flight, abort without recording a
        // failure (it's a different wallet now, with its own key + attempt).
        if (!isSameWalletConnected()) return;
        const signature = await signMessageAsync({
          account: checksummedAddress,
          message,
        });
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
  const config = useConfig();

  useReconcileConnectedWalletWithPrivy();

  const runtime = useMemo<WalletConnectionRuntime>(
    () => ({
      async connectWallet() {
        await open();
        // `open()` resolves when the modal mounts, not when the user finishes,
        // so wait for the flow to actually settle (connect or dismiss) before
        // resolving — imperative callers then gate on wagmi's `useAccount()`.
        // See `waitForConnectFlowSettled`.
        await waitForConnectFlowSettled(config);
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
    [open, address, config],
  );

  return (
    <WalletConnectionRuntimeContext.Provider value={runtime}>
      {children}
    </WalletConnectionRuntimeContext.Provider>
  );
}

const WALLET_CONNECT_UNAVAILABLE_MESSAGE =
  'Wallet connection is temporarily unavailable. Please try again later or contact support.';

// Misconfiguration fallback: a plain wagmi config with NO WalletConnect, built
// only when NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is unset. It lets wallet routes
// still render and read-only wagmi hooks work instead of crashing on mount — the
// user only sees a (handled) error if they actually try to connect a wallet (see
// `MissingProjectIdBridge`). Never used in a correctly-provisioned deployment.
let fallbackWagmiConfig: Config | null = null;
function getFallbackWagmiConfig(): Config {
  if (!fallbackWagmiConfig) {
    console.error(
      '[wallet] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — wallet connect is disabled for this deployment. Set it in the environment (Infisical) to enable Reown AppKit.',
    );
    fallbackWagmiConfig = createConfig({
      chains: supportedChains,
      transports: getSupportedChainTransports(),
      ssr: true,
    });
  }
  return fallbackWagmiConfig;
}

/**
 * Runtime published by the fallback stack: the user can still browse wallet
 * routes, but an actual connect attempt surfaces a gentle, caller-toasted error
 * instead of silently doing nothing. Only mounted when the project id is missing.
 */
function MissingProjectIdBridge({ children }: PropsWithChildren) {
  const runtime = useMemo<WalletConnectionRuntime>(
    () => ({
      async connectWallet() {
        throw new Error(WALLET_CONNECT_UNAVAILABLE_MESSAGE);
      },
      async setActiveWalletByAddress() {
        throw new Error(WALLET_CONNECT_UNAVAILABLE_MESSAGE);
      },
    }),
    [],
  );
  return (
    <WalletConnectionRuntimeContext.Provider value={runtime}>
      {children}
    </WalletConnectionRuntimeContext.Provider>
  );
}

/**
 * The wallet stack: plain `wagmi` + Reown AppKit own the live connection and the
 * wallet deep-link (universal/app links — fixes mobile MetaMask connect);
 * `PrivyProvider` (via `SessionsProvider`, mounted at the root) stays for
 * identity. Loaded via `next/dynamic({ ssr: false })` from `wagmi.tsx` because
 * AppKit init is client-only (touches `window`).
 *
 * If the WalletConnect project id is unset (env not provisioned), AppKit cannot
 * initialize — fall back to a plain wagmi runtime so wallet routes still render;
 * the error is surfaced only when the user actually tries to connect.
 */
export function ReownWalletStack({ children }: PropsWithChildren) {
  const projectId = clientSideEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    return (
      <SessionsProvider>
        <BaseWagmiProvider config={getFallbackWagmiConfig()}>
          <MissingProjectIdBridge>{children}</MissingProjectIdBridge>
        </BaseWagmiProvider>
      </SessionsProvider>
    );
  }
  const adapter = getReownWagmiAdapter(projectId);
  return (
    <SessionsProvider>
      <BaseWagmiProvider config={adapter.wagmiConfig}>
        <ReownWalletConnectionBridge>{children}</ReownWalletConnectionBridge>
      </BaseWagmiProvider>
    </SessionsProvider>
  );
}
