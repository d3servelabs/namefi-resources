import type {
  LinkedAccountWithMetadata,
  WalletWithMetadata,
} from '@privy-io/react-auth';
import { useMemo } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { switchChain as wagmiSwitchChain } from 'wagmi/actions';
import { useAuth } from './use-auth';

/**
 * The connected-wallet shape the app actually consumes — `address` plus the two
 * methods `use-watch-assets` calls. Reown AppKit (not Privy) owns the live
 * connection, so we synthesize this from the wagmi connection — the
 * connected-wallet surfaces (add-token, API-key signing) work without Privy
 * owning the wagmi runtime. See namefi-astra#4753.
 */
export interface AppConnectedWallet {
  address: string;
  type?: string;
  chainType?: string;
  connectorType?: string;
  switchChain: (chainId: number) => Promise<void>;
  getEthereumProvider: () => Promise<{
    request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  }>;
}

/**
 * The single live wallet lives in wagmi (`useAccount`), owned by Reown AppKit.
 * Back `switchChain`/`getEthereumProvider` with wagmi + the connector so
 * consumers behave the same as with a Privy `ConnectedWallet`.
 */
function useReownConnectedEthereumWallets(): AppConnectedWallet[] {
  const { address, isConnected, connector } = useAccount();
  const config = useConfig();

  return useMemo(() => {
    if (!isConnected || !address || !connector) {
      return [];
    }
    const connectorId = connector.id ?? '';
    return [
      {
        address,
        type: 'ethereum',
        chainType: 'ethereum',
        // Normalize so the `connectorType === 'metamask'` feature check (e.g.
        // wallet_watchAsset support) still matches MetaMask via Reown/injected.
        connectorType: /metamask/i.test(connectorId) ? 'metamask' : connectorId,
        switchChain: async (chainId: number) => {
          await wagmiSwitchChain(config, { chainId });
        },
        getEthereumProvider: async () =>
          (await connector.getProvider()) as Awaited<
            ReturnType<AppConnectedWallet['getEthereumProvider']>
          >,
      },
    ];
  }, [address, isConnected, connector, config]);
}

/**
 * Connected Ethereum wallets — the live wagmi connection owned by Reown AppKit.
 */
export function useConnectedWallets() {
  const connectedEthereumWallets = useReownConnectedEthereumWallets();

  return {
    connectedWalletsReady: true,
    connectedEthereumWallets,
  };
}

/**
 * Addresses of the connected Ethereum wallets (via {@link useConnectedWallets}).
 */
export function useConnectedWalletAddresses() {
  const { connectedWalletsReady, connectedEthereumWallets } =
    useConnectedWallets();

  const connectedWalletAddresses = useMemo(() => {
    if (!connectedWalletsReady) {
      return [];
    }
    return connectedEthereumWallets.map((wallet) => wallet.address);
  }, [connectedEthereumWallets, connectedWalletsReady]);

  return {
    connectedWalletsReady,
    connectedWalletAddresses,
  };
}

/**
 * Hook to get a user's LinkedWallet addresses from Privy. Currently, we only support Ethereum wallets
 */
export function useLinkedWalletAddresses() {
  const { linkedWallets, linkedWalletsReady } = useLinkedWallets();

  const linkedWalletAddresses = useMemo(() => {
    if (!linkedWalletsReady) {
      return [];
    }

    return linkedWallets.map(
      (linkedWallet: WalletWithMetadata) => linkedWallet.address,
    );
  }, [linkedWalletsReady, linkedWallets]);

  return { linkedWalletsReady, linkedWalletAddresses };
}

/**
 * Hook to get a user's LinkedWallets from Privy. Currently, we only support Ethereum wallets
 */
export function useLinkedWallets() {
  const {
    privyUser,
    privyRuntimeReady,
    privyRuntimeAuthenticated,
    isAuthenticated: authenticated,
  } = useAuth();

  const linkedWalletsReady = useMemo(() => {
    return (
      privyRuntimeReady &&
      privyRuntimeAuthenticated &&
      authenticated &&
      Boolean(privyUser)
    );
  }, [authenticated, privyRuntimeAuthenticated, privyRuntimeReady, privyUser]);

  const linkedWallets = useMemo((): WalletWithMetadata[] => {
    if (!linkedWalletsReady) {
      return [];
    }

    return (
      (privyUser?.linkedAccounts
        .filter(
          (linkedAccount: LinkedAccountWithMetadata) =>
            linkedAccount.type === 'wallet',
        )
        .filter(
          (linkedWallet: LinkedAccountWithMetadata) =>
            (linkedWallet as WalletWithMetadata).chainType === 'ethereum',
        ) as WalletWithMetadata[]) ?? []
    );
  }, [linkedWalletsReady, privyUser]);

  return { linkedWalletsReady, linkedWallets };
}

/**
 * Hook to get the union of a user's ConnectedWallets and LinkedWallets from Privy. Currently, we only support Ethereum wallets
 */
export function useUserWalletAddresses() {
  const { connectedWalletAddresses, connectedWalletsReady } =
    useConnectedWalletAddresses();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();

  const userWalletsReady = useMemo(
    () => connectedWalletsReady && linkedWalletsReady,
    [connectedWalletsReady, linkedWalletsReady],
  );

  const userWalletAddresses = useMemo(() => {
    if (!userWalletsReady) {
      return [];
    }

    const userWalletsAddressesSet = new Set([
      ...connectedWalletAddresses,
      ...linkedWalletAddresses,
    ]);

    return Array.from(userWalletsAddressesSet);
  }, [connectedWalletAddresses, linkedWalletAddresses, userWalletsReady]);

  return {
    userWalletsReady,
    userWalletAddresses,
  };
}
