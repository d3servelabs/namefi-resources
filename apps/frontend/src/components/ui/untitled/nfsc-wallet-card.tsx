'use client';

import { useState, useMemo } from 'react';
import { WalletCard, type WalletCardProps } from './wallet-card';
import type { ChainBalance } from '@/hooks/use-user-chain-balances';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { NetworkLogo } from '@/components/network-logo';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { getPaymentProviderForChain } from '@/hooks/use-user-chain-balances';

interface NFSCWalletCardProps
  extends Omit<WalletCardProps, 'networks' | 'bottomContent'> {
  balances: ChainBalance[];
  isLoadingBalance?: boolean;
  onBalanceClick?: () => void;
}

function formatBalanceInUsdCents(balanceInUsdCents: number): string {
  return (balanceInUsdCents / 100).toFixed(2);
}

function BalanceBreakdown({ balances }: { balances: ChainBalance[] }) {
  return (
    <div className="space-y-4">
      {balances.map((balance) => (
        <div key={balance.chainId} className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <NetworkLogo network={balance.chainId} className="w-8 h-8" />
            <span className="font-semibold">{balance.chainName}</span>
          </div>

          <div className="space-y-2">
            {/* NFSC balance in USD */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">NFSC Balance</span>
              <span className="font-mono">
                ${formatBalanceInUsdCents(balance.balanceInUsdCents)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NFSCWalletCard({
  address,
  ensName,
  provider,
  balances,
  isLoadingBalance = false,
  className,
  onBalanceClick,
}: NFSCWalletCardProps) {
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const { chains } = useAllowedChains();

  // Add balances for chains with zero balance to show all allowed chains
  const completeBalances = useMemo(() => {
    const balanceMap = new Map(balances.map((b) => [b.chainId, b]));

    return chains.map((chain) => {
      if (balanceMap.has(chain.id)) {
        return balanceMap.get(chain.id)!;
      }

      // Create zero balance entry for missing chains
      return {
        chainId: chain.id,
        chainName: chain.name,
        walletAddress: address as `0x${string}`,
        balanceInUsdCents: 0,
        paymentProvider: getPaymentProviderForChain(chain.id),
      } as ChainBalance;
    });
  }, [balances, chains, address]);

  // Calculate total for current wallet
  const currentWalletTotal = useMemo(() => {
    return balances.reduce(
      (sum, balance) => sum + balance.balanceInUsdCents,
      0,
    );
  }, [balances]);

  // Create networks from complete balances
  const networks = useMemo(() => {
    return completeBalances.map((balance) => ({
      chainId: balance.chainId,
      name: balance.chainName,
    }));
  }, [completeBalances]);

  const handleBalanceClick = () => {
    if (onBalanceClick) {
      onBalanceClick();
    } else {
      setShowBalanceModal(true);
    }
  };

  const bottomContent = (
    <button
      type="button"
      onClick={handleBalanceClick}
      className="w-full bg-black/20 backdrop-blur-sm rounded-lg p-3 hover:bg-black/30 transition-colors cursor-pointer border border-white/10"
    >
      <div className="flex justify-between items-center">
        <div className="text-left">
          <div className="text-xs opacity-70 uppercase tracking-wider">
            NFSC Balance
          </div>
          <div className="text-lg font-semibold font-mono">
            {isLoadingBalance ? (
              <Skeleton className="h-6 w-24 bg-white/20" />
            ) : (
              `$${formatBalanceInUsdCents(currentWalletTotal)}`
            )}
          </div>
        </div>
        <div className="text-xs opacity-70">Click for details →</div>
      </div>
    </button>
  );

  return (
    <>
      <WalletCard
        address={address}
        ensName={ensName}
        provider={provider}
        networks={networks}
        className={className}
        bottomContent={bottomContent}
      />

      {/* Balance Breakdown Modal */}
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Balance Breakdown</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {/* Total NFSC */}
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="text-sm text-muted-foreground mb-1">
                Total NFSC Balance
              </div>
              <div className="text-2xl font-bold font-mono">
                ${formatBalanceInUsdCents(currentWalletTotal)}
              </div>
            </div>

            {/* Per-chain breakdown */}
            <BalanceBreakdown balances={completeBalances} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
