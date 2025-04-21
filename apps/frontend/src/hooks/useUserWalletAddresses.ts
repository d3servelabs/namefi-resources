import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMemo } from 'react';

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
 * Hook to get a user's LinkedWallets from Privy. Currently, we only support Ethereum wallets
 */
export function useLinkedWalletAddresses() {
  const { user: privyUser, ready: privyUserReady, authenticated } = usePrivy();

  const linkedWalletsReady = useMemo(() => {
    return privyUserReady && authenticated && privyUser;
  }, [authenticated, privyUser, privyUserReady]);

  const linkedWalletAddresses = useMemo(() => {
    if (!linkedWalletsReady) {
      return [];
    }

    return (
      privyUser?.linkedAccounts
        .filter((linkedAccount) => linkedAccount.type === 'wallet')
        .filter((linkedWallet) => linkedWallet.chainType === 'ethereum')
        .map((linkedWallet) => linkedWallet.address) ?? []
    );
  }, [linkedWalletsReady, privyUser]);

  return { linkedWalletsReady, linkedWalletAddresses };
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
