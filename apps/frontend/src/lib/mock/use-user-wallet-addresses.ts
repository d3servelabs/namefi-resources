/**
 * Storybook mock for `@/hooks/use-user-wallet-addresses` (wired up via a Vite
 * alias in `.storybook/main.ts`).
 *
 * The real module calls Privy's `useWallets()`. In Storybook there is no real
 * `PrivyProvider` (stories use the lightweight `MockPrivyProvider` context), so
 * the real hook logs "`useWallets` was called outside the PrivyProvider
 * component" and — intermittently, while the test-runner navigates between
 * stories — fails the smoke run with "Cannot initialize the Privy provider with
 * an invalid Privy app ID". That made the `Pages/My Domains` smoke test flaky.
 *
 * Connected wallets resolve to an empty set here (stories don't have a live
 * wallet connection anyway); linked wallets still derive from the mocked
 * auth/Privy user, so stories that surface a user's linked wallets keep
 * rendering exactly as before — only the real Privy SDK call is removed.
 */
import type {
  LinkedAccountWithMetadata,
  WalletWithMetadata,
} from '@privy-io/react-auth';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

const EMPTY_WALLETS: WalletWithMetadata[] = [];
const EMPTY_ADDRESSES: string[] = [];

export function useConnectedWallets() {
  return {
    connectedWalletsReady: true,
    connectedEthereumWallets: EMPTY_WALLETS,
  };
}

export function useConnectedWalletAddresses() {
  return {
    connectedWalletsReady: true,
    connectedWalletAddresses: EMPTY_ADDRESSES,
  };
}

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
      return EMPTY_WALLETS;
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
        ) as WalletWithMetadata[]) ?? EMPTY_WALLETS
    );
  }, [linkedWalletsReady, privyUser]);

  return { linkedWalletsReady, linkedWallets };
}

export function useLinkedWalletAddresses() {
  const { linkedWallets, linkedWalletsReady } = useLinkedWallets();

  const linkedWalletAddresses = useMemo(() => {
    if (!linkedWalletsReady) {
      return EMPTY_ADDRESSES;
    }

    return linkedWallets.map(
      (linkedWallet: WalletWithMetadata) => linkedWallet.address,
    );
  }, [linkedWalletsReady, linkedWallets]);

  return { linkedWalletsReady, linkedWalletAddresses };
}

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
      return EMPTY_ADDRESSES;
    }

    return Array.from(
      new Set([...connectedWalletAddresses, ...linkedWalletAddresses]),
    );
  }, [connectedWalletAddresses, linkedWalletAddresses, userWalletsReady]);

  return {
    userWalletsReady,
    userWalletAddresses,
  };
}
