'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { WalletCard, type WalletCardProps } from './wallet-card';
import type { ChainBalance } from '@/hooks/use-user-chain-balances';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { NetworkLogo } from '@/components/network-logo';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { getPaymentProviderForChain } from '@/components/payment-method/hybrid-payment-utils';
import { cn } from '@namefi-astra/ui/lib/cn';
import { NfscOrdersList } from '@/components/payment-method/nfsc-orders-list';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';

interface NFSCWalletCardProps
  extends Omit<WalletCardProps, 'networks' | 'bottomContent'> {
  balances: ChainBalance[];
  isLoadingBalance?: boolean;
  onBalanceClick?: () => void;
  showSingleChain?: boolean;
  bottomActions?: React.ReactNode;
}

function formatBalanceInUsdCents(balanceInUsdCents: number): string {
  return (balanceInUsdCents / 100).toFixed(2);
}

function BalanceBreakdown({ balances }: { balances: ChainBalance[] }) {
  const t = useTranslations('nfsc');
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
              <span className="text-muted-foreground">
                {t('wallet.balanceLabel')}
              </span>
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
  showSingleChain = false,
  bottomActions,
}: NFSCWalletCardProps) {
  const t = useTranslations('nfsc');
  const tCommon = useTranslations('common');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const { nfscBalanceChains: chains } = useAllowedChains();

  // Add balances for chains with zero balance to show all allowed chains (only when not showing single chain)
  const completeBalances = useMemo(() => {
    if (showSingleChain) {
      return balances;
    }

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
  }, [balances, chains, address, showSingleChain]);

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
    } else if (!showSingleChain) {
      setShowBalanceModal(true);
    }
  };

  // Get single chain info when showSingleChain is true
  const singleChainBalance = showSingleChain ? balances[0] : null;

  const bottomContent = (
    <div className="w-full bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10 space-y-2">
      <button
        type="button"
        onClick={handleBalanceClick}
        className={cn(
          'w-full transition-colors rounded-md',
          !showSingleChain && 'hover:bg-white/10 cursor-pointer p-1 -m-1',
        )}
        disabled={showSingleChain}
      >
        <div className="flex justify-between items-center">
          <div className="text-start flex items-center gap-3">
            {showSingleChain && singleChainBalance && (
              <NetworkLogo
                network={singleChainBalance.chainId}
                className="w-6 h-6"
              />
            )}
            <div>
              <div className="text-xs opacity-70 uppercase tracking-wider">
                {showSingleChain && singleChainBalance
                  ? t('wallet.chainBalanceLabel', {
                      chainName: singleChainBalance.chainName,
                    })
                  : t('wallet.balanceLabel')}
              </div>
              <div className="text-lg font-semibold font-mono">
                {isLoadingBalance ? (
                  <Skeleton className="h-6 w-24 bg-white/20" />
                ) : (
                  `$${formatBalanceInUsdCents(currentWalletTotal)}`
                )}
              </div>
            </div>
          </div>
          {!showSingleChain && (
            <div className="text-xs opacity-70">
              {t('wallet.clickForDetails')}
            </div>
          )}
        </div>
      </button>

      {bottomActions && <div className="pt-2">{bottomActions}</div>}
    </div>
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

      {/* Wallet details modal — balance breakdown + recent NFSC orders */}
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('wallet.detailsTitle')}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="balance" className="mt-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="balance">
                {tCommon('account.balance')}
              </TabsTrigger>
              <TabsTrigger value="orders">{t('wallet.ordersTab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-4">
              {/* Total NFSC */}
              <div className="bg-muted rounded-lg p-4 mb-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {t('wallet.totalBalance')}
                </div>
                <div className="text-2xl font-bold font-mono">
                  ${formatBalanceInUsdCents(currentWalletTotal)}
                </div>
              </div>

              {/* Per-chain breakdown */}
              <BalanceBreakdown balances={completeBalances} />
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <RecentNfscOrdersTab
                walletAddress={address}
                enabled={showBalanceModal}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Recent NFSC top-up orders for a wallet — loaded only while the wallet-details
 * dialog is open so we don't fan out queries for every wallet card on the page.
 */
function RecentNfscOrdersTab({
  walletAddress,
  enabled,
}: {
  walletAddress: string;
  enabled: boolean;
}) {
  const t = useTranslations('nfsc');
  const trpc = useTRPC();
  const { data: orders, isLoading } = useQuery({
    ...trpc.orders.getMyNfscOrders.queryOptions({
      recipientWalletAddress: walletAddress,
      limit: 20,
    }),
    enabled,
  });

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
        {t('wallet.ordersDescription')}
      </p>
      <NfscOrdersList
        orders={orders}
        isLoading={isLoading}
        emptyMessage={t('wallet.noOrders')}
      />
    </div>
  );
}
