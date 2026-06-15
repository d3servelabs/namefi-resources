import {
  useWallets,
  type LinkedAccountWithMetadata,
  type WalletWithMetadata,
} from '@privy-io/react-auth';
import { useAuth } from './use-auth';
import { useMemo } from 'react';

export function useConnectedWallets() {
  const { ready: connectedWalletsReady, wallets } = useWallets();
  const connectedEthereumWallets = useMemo(
    () => wallets.filter((wallet) => wallet.type === 'ethereum'),
    [wallets],
  );

  return { connectedWalletsReady, connectedEthereumWallets };
}

/**
 * Hook to get a user's ConnectedWallets from Privy. Currently, we only support Ethereum wallets
 */
export function useConnectedWalletAddresses() {
  const {
    ready: connectedEthereumWalletsReady,
    wallets: connectedEthereumWallets,
  } = useWallets();

  const connectedWalletAddresses = useMemo(() => {
    if (!connectedEthereumWalletsReady) {
      return [];
    }
    return [...connectedEthereumWallets].map((wallet) => wallet.address);
  }, [connectedEthereumWallets, connectedEthereumWalletsReady]);

  return {
    connectedWalletsReady: connectedEthereumWalletsReady,
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
