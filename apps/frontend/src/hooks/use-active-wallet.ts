import { useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';

export function useActiveWallet() {
  const { wallets } = useWallets();
  const { address: activeWalletAddress } = useAccount();
  const { setActiveWallet } = useSetActiveWallet();

  const ethereumWallets = useMemo(
    () => wallets.filter((wallet) => wallet.type === 'ethereum'),
    [wallets],
  );

  const hasMultipleWallets = ethereumWallets.length > 1;

  const switchToWallet = useCallback(
    async (walletAddress: string) => {
      const targetWallet = ethereumWallets.find(
        (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (!targetWallet) {
        throw new Error('Wallet not found');
      }

      await setActiveWallet(targetWallet);
    },
    [ethereumWallets, setActiveWallet],
  );

  return {
    activeWalletAddress,
    ethereumWallets,
    hasMultipleWallets,
    switchToWallet,
  };
}
