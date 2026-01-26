'use client';

import { useMemo } from 'react';
import { NFSCWalletCard } from './nfsc-wallet-card';
import type { WalletProvider } from './wallet-card';
import { useUserChainBalances } from '@/hooks/use-user-chain-balances';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import type { WalletWithMetadata } from '@privy-io/react-auth';

interface ConnectedNFSCWalletCardProps {
  address: `0x${string}`;
  ensName?: string;
  provider?: WalletProvider;
  className?: string;
  onBalanceClick?: () => void;
}

/**
 * Connected version of NFSCWalletCard that fetches balance data.
 * Use this when you need a standalone card that manages its own data fetching.
 * For lists/grids where you already have the data, use NFSCWalletCard directly.
 */
export function ConnectedNFSCWalletCard({
  address,
  ensName,
  provider,
  className,
  onBalanceClick,
}: ConnectedNFSCWalletCardProps) {
  const { linkedWallets } = useLinkedWallets();

  // Get all wallet addresses for balance query
  const walletAddresses = useMemo(() => {
    return linkedWallets.map(
      (wallet: WalletWithMetadata) => wallet.address as `0x${string}`,
    );
  }, [linkedWallets]);

  const { chainBalances, isLoadingBalance } = useUserChainBalances({
    walletAddresses,
  });

  // Filter balances for the current wallet address
  const currentWalletBalances = useMemo(() => {
    return chainBalances.filter(
      (balance) =>
        balance.walletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [chainBalances, address]);

  return (
    <NFSCWalletCard
      address={address}
      ensName={ensName}
      provider={provider}
      balances={currentWalletBalances}
      isLoadingBalance={isLoadingBalance}
      className={className}
      onBalanceClick={onBalanceClick}
    />
  );
}
