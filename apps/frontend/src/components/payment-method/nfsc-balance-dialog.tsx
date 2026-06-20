'use client';

import { useWatchAssets } from '@/hooks/use-watch-assets';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import type { ChainBalance } from '@/hooks/use-user-chain-balances';
import { formatAmountInUSD } from '@/lib/number';
import { getShortAddress } from '@/lib/string';
import { useTRPC } from '@/lib/trpc';
import { WagmiProvider } from '@/components/providers/wagmi';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import { CoinsIcon, Loader2Icon, PlusCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { NfscOrdersList } from './nfsc-orders-list';

const NfscSwapDialog = dynamic(
  () => import('@/components/dialogs/nfsc-swap-dialog'),
  {
    ssr: false,
  },
);

export type BalanceBreakdownDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chainBalances: ChainBalance[];
  totalBalanceInUsdCents: number;
  isLoadingBalances: boolean;
  walletAddresses: `0x${string}`[];
};

export function BalanceBreakdownDialogRuntime(
  props: BalanceBreakdownDialogProps,
) {
  return (
    <WagmiProvider>
      <BalanceBreakdownDialog {...props} />
    </WagmiProvider>
  );
}

export function BalanceBreakdownDialog({
  open,
  onOpenChange,
  chainBalances,
  totalBalanceInUsdCents,
  isLoadingBalances,
  walletAddresses,
}: BalanceBreakdownDialogProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const trpc = useTRPC();
  const { watchNfscInWallet, isAnyWalletConnected } = useWatchAssets();
  const { defaultNfscBalanceChainId } = useAllowedChains();
  const { address: activeWalletAddress } = useAccount();
  // The swap dialog is opened from inside this dialog; rendered as a sibling
  // and keyed by wallet so closing the balance dialog doesn't unmount it.
  // `isSwapDialogOpen` is tracked separately from the target wallet so the
  // dialog-level "Top Up" can open the swap flow even with no wallet to target
  // (e.g. at a zero balance), where the swap dialog falls back to the connected
  // wallet.
  const [swapDialogWalletAddress, setSwapDialogWalletAddress] = useState<
    string | null
  >(null);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);

  const walletGroups = useMemo(() => {
    const addressMap = walletAddresses.map((walletAddress) => {
      const balances = chainBalances.filter(
        (balance) =>
          balance.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
      );
      return { walletAddress, balances };
    });

    return addressMap.filter((group) => group.balances.length > 0);
  }, [chainBalances, walletAddresses]);

  const hasWallets = walletAddresses.length > 0;
  const hasBalances = chainBalances.length > 0;

  // Recent NFSC top-up orders are fetched only while the dialog is open.
  const { data: nfscOrders, isLoading: isLoadingOrders } = useQuery({
    ...trpc.orders.getMyNfscOrders.queryOptions({ limit: 20 }),
    enabled: open,
  });

  const handleWatchNfsc = useCallback(async () => {
    if (!activeWalletAddress) {
      toast.error(t('nfscBalanceDialog.connectWalletToContinue'));
      return;
    }
    try {
      const added = await watchNfscInWallet(
        activeWalletAddress,
        defaultNfscBalanceChainId,
      );
      if (added) {
        toast.success(t('nfscBalanceDialog.nfscAdded'));
      } else {
        toast.error(t('nfscBalanceDialog.nfscAddFailed'));
      }
    } catch (error) {
      toast.error(t('nfscBalanceDialog.nfscAddError'), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [activeWalletAddress, defaultNfscBalanceChainId, watchNfscInWallet, t]);

  const openSwapDialog = useCallback(
    (walletAddress: string | null) => {
      onOpenChange(false);
      setSwapDialogWalletAddress(walletAddress);
      setIsSwapDialogOpen(true);
    },
    [onOpenChange],
  );

  const handleAddFunds = useCallback(
    (walletAddress: string) => openSwapDialog(walletAddress),
    [openSwapDialog],
  );

  const handleTopUp = useCallback(
    () => openSwapDialog(walletAddresses[0] ?? null),
    [openSwapDialog, walletAddresses],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-lg')}
        >
          <DialogHeader>
            <DialogTitle>{t('nfscBalanceDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('nfscBalanceDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="balance" className="mt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="balance">
                {tCommon('account.balance')}
              </TabsTrigger>
              <TabsTrigger value="orders">
                {t('nfscBalanceDialog.tabOrders')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-4 space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('nfscBalanceDialog.totalAvailable')}
                </div>
                <div className="text-2xl font-semibold">
                  {formatAmountInUSD(totalBalanceInUsdCents, true)} NFSC
                </div>
              </div>

              <Button className="w-full" onClick={handleTopUp}>
                <PlusCircleIcon className="me-2 h-4 w-4" />
                {t('nfscBalanceDialog.topUp')}
              </Button>

              {isAnyWalletConnected && activeWalletAddress && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleWatchNfsc}
                >
                  <CoinsIcon className="me-2 h-4 w-4" />
                  {t('nfscBalanceDialog.showNfscInWallet')}
                </Button>
              )}

              {isLoadingBalances ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  {t('nfscBalanceDialog.fetchingBalances')}
                </div>
              ) : !hasWallets ? (
                <EmptyState message={t('nfscBalanceDialog.emptyNoWallets')} />
              ) : !hasBalances ? (
                <EmptyState message={t('nfscBalanceDialog.emptyNoBalances')} />
              ) : (
                <div className="space-y-3">
                  {walletGroups.map(({ walletAddress, balances }) => {
                    const walletTotal = balances.reduce(
                      (sum, balance) => sum + balance.balanceInUsdCents,
                      0,
                    );
                    return (
                      <div
                        key={walletAddress}
                        className="rounded-lg border border-border/60 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>{getShortAddress(walletAddress)}</span>
                          <span>
                            {formatAmountInUSD(walletTotal, true)} NFSC
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {balances.map((balance) => (
                            <div
                              key={`${walletAddress}-${balance.chainId}`}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <span>{balance.chainName}</span>
                              <span className="font-medium text-foreground">
                                {formatAmountInUSD(
                                  balance.balanceInUsdCents,
                                  true,
                                )}{' '}
                                NFSC
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleAddFunds(walletAddress)}
                        >
                          {t('nfscBalanceDialog.addFunds')}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4 space-y-3">
              <p className="rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {t('nfscBalanceDialog.ordersDisclaimer')}
              </p>
              <NfscOrdersList
                orders={nfscOrders}
                isLoading={isLoadingOrders}
                emptyMessage={t('nfscBalanceDialog.emptyOrders')}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="w-full sm:flex-1"
              onClick={() => onOpenChange(false)}
              render={<Link href="/payment-methods" />}
              nativeButton={false}
            >
              {t('nfscBalanceDialog.goToPaymentMethods')}
            </Button>
            <Button
              className="w-full sm:flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isSwapDialogOpen ? (
        <NfscSwapDialog
          key={swapDialogWalletAddress ?? 'no-wallet'}
          open={isSwapDialogOpen}
          onOpenChange={(nextOpen) => {
            setIsSwapDialogOpen(nextOpen);
            if (!nextOpen) setSwapDialogWalletAddress(null);
          }}
          walletAddress={swapDialogWalletAddress ?? undefined}
        />
      ) : null}
    </>
  );
}

type EmptyStateProps = {
  message: string;
};

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
