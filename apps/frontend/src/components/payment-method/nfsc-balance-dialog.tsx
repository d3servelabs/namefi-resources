'use client';

import { useWatchAssets } from '@/hooks/use-watch-assets';
import type { ChainBalance } from '@/hooks/use-user-chain-balances';
import { formatAmountInUSD } from '@/lib/number';
import { getShortAddress } from '@/lib/string';
import { useTRPC } from '@/lib/trpc';
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
import { useQuery } from '@tanstack/react-query';
import { CoinsIcon, Loader2Icon, PlusCircleIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
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

export function BalanceBreakdownDialog({
  open,
  onOpenChange,
  chainBalances,
  totalBalanceInUsdCents,
  isLoadingBalances,
  walletAddresses,
}: BalanceBreakdownDialogProps) {
  const trpc = useTRPC();
  const { watchNfscInWallet, isAnyWalletConnected } = useWatchAssets();
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
    try {
      await watchNfscInWallet();
      toast.success('NFSC token added to your wallet');
    } catch (error) {
      toast.error('Failed to add NFSC to wallet', {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [watchNfscInWallet]);

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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>NFSC Balance</DialogTitle>
            <DialogDescription>
              Review your available $NFSC across linked wallets and supported
              chains.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="balance" className="mt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="orders">Recent NFSC orders</TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-4 space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total Available
                </div>
                <div className="text-2xl font-semibold">
                  {formatAmountInUSD(totalBalanceInUsdCents, true)} NFSC
                </div>
              </div>

              <Button className="w-full" onClick={handleTopUp}>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Top Up
              </Button>

              {isAnyWalletConnected && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleWatchNfsc}
                >
                  <CoinsIcon className="mr-2 h-4 w-4" />
                  Show NFSC in wallet
                </Button>
              )}

              {isLoadingBalances ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Fetching balances...
                </div>
              ) : !hasWallets ? (
                <EmptyState message="Link or connect a wallet to view your $NFSC balances." />
              ) : !hasBalances ? (
                <EmptyState message="No $NFSC detected across your wallets yet." />
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
                          Add funds
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4 space-y-3">
              <p className="rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                These are credit-card NFSC top-ups across all your wallets.
                NFSC-paid domain orders appear in your full order history.
              </p>
              <NfscOrdersList
                orders={nfscOrders}
                isLoading={isLoadingOrders}
                emptyMessage="No NFSC top-ups yet."
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
              Go to Payment Methods
            </Button>
            <Button
              className="w-full sm:flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
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
