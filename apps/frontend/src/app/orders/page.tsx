'use client';

import { AuthRequired } from '@/components/auth-required';
import { StatusBadge } from '@/components/status-badge';
import { CartCard } from '@/components/cart-card';
import {
  MobileTable,
  MobileTableMobile,
  MobileTableDesktop,
  MobileTableList,
  MobileTableItem,
  MobileTableItemHeader,
  MobileTableItemTitle,
  MobileTableItemContent,
  MobileTableItemField,
  MobileTableItemActions,
  MobileTableSkeleton,
  MobileTableEmpty,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/mobile-table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { AddressWithChain } from '@/components/address-with-chain';
import { useAuth } from '@/hooks/use-auth';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, ExternalLink, Info, PackageX } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { PageShell } from '@/components/page-shell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';

export default function OrdersPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const trpc = useTRPC();

  const ordersQuery = useQuery({
    ...trpc.orders.getOrderItems.queryOptions(),
    enabled: isAuthenticated,
  });

  const orderItems = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const isLoading = useMemo(
    () => isAuthLoading || ordersQuery.isLoading,
    [isAuthLoading, ordersQuery.isLoading],
  );

  const unlinkedWalletTooltip =
    "This wallet is not linked to the current account, so you won't be able to see the domain in account";

  const isWalletLinked = useCallback(
    (walletAddress: string | null) => {
      if (!walletAddress) {
        return true;
      }
      if (!linkedWalletsReady) {
        return true;
      }
      const normalizedWallet = walletAddress.toLowerCase();
      return linkedWalletAddresses.some(
        (address) => address.toLowerCase() === normalizedWallet,
      );
    },
    [linkedWalletAddresses, linkedWalletsReady],
  );

  const primaryWalletAddress = useMemo(() => {
    if (!linkedWalletsReady) {
      return null;
    }
    return linkedWalletAddresses[0] ?? null;
  }, [linkedWalletAddresses, linkedWalletsReady]);

  const renderNftWalletValue = useCallback(
    ({
      walletAddress,
      chainId,
      isAutoRenew = false,
    }: {
      walletAddress: string | null;
      chainId: number | null;
      isAutoRenew?: boolean;
    }) => {
      if (isAutoRenew) {
        // TODO: Replace primary wallet fallback with actual auto-renew address and chain.
        const autoRenewAddress = primaryWalletAddress;
        return (
          <div className="flex items-center gap-2">
            <AddressWithChain
              address={autoRenewAddress}
              chainId={null}
              showChainBadge={false}
            />
          </div>
        );
      }

      if (!walletAddress) {
        return <span className="text-muted-foreground">-</span>;
      }
      const showWarning = linkedWalletsReady && !isWalletLinked(walletAddress);
      return (
        <div className="flex items-center gap-2">
          <AddressWithChain address={walletAddress} chainId={chainId} />
          {showWarning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={<span className="inline-flex cursor-help" />}
                >
                  <Info className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{unlinkedWalletTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
    [isWalletLinked, linkedWalletsReady, primaryWalletAddress],
  );

  if (!(isAuthenticated || isLoading)) {
    return <AuthRequired />;
  }

  return (
    <PageShell padding="compact">
      <CartCard title="Order History">
        {isLoading ? (
          <MobileTable>
            <MobileTableMobile>
              <MobileTableSkeleton count={3} />
            </MobileTableMobile>
            <MobileTableDesktop>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>NFT Wallet</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...new Array(3)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-28" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </MobileTableDesktop>
          </MobileTable>
        ) : orderItems.length > 0 ? (
          <MobileTable>
            <MobileTableMobile>
              <MobileTableList>
                {orderItems.map((item) => (
                  <MobileTableItem key={item.id}>
                    <MobileTableItemHeader>
                      <MobileTableItemTitle>
                        <Link
                          href={`/orders/${item.orderId}`}
                          className="hover:underline text-foreground"
                        >
                          {item.normalizedDomainName}
                        </Link>
                      </MobileTableItemTitle>
                      {item.status && (
                        // Context: https://app.clickup.com/t/9009140026/NFI-5127
                        <StatusBadge
                          status={
                            item.status === 'CREATED'
                              ? 'PROCESSING'
                              : item.status
                          }
                          type="order"
                        />
                      )}
                    </MobileTableItemHeader>

                    <MobileTableItemContent>
                      <MobileTableItemField
                        label={
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Created:</span>
                          </span>
                        }
                        value={format(
                          new Date(item.createdAt),
                          'MMM d, yyyy h:mm a',
                        )}
                        valueClassName="text-muted-foreground"
                      />
                      <MobileTableItemField
                        label="NFT Wallet"
                        className="justify-start gap-2"
                        value={renderNftWalletValue({
                          walletAddress: item.nftWalletAddress ?? null,
                          chainId: item.nftChainId ?? null,
                          isAutoRenew: Boolean(item.orderMetadata?.autoRenew),
                        })}
                      />
                    </MobileTableItemContent>

                    <MobileTableItemActions>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        render={<Link href={`/orders/${item.orderId}`} />}
                        nativeButton={false}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </MobileTableItemActions>
                  </MobileTableItem>
                ))}
              </MobileTableList>
            </MobileTableMobile>
            <MobileTableDesktop>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>NFT Wallet</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${item.orderId}`}
                        className="hover:underline"
                      >
                        {item.normalizedDomainName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {item.status ? (
                        <StatusBadge
                          status={
                            item.status === 'CREATED'
                              ? 'PROCESSING'
                              : item.status
                          }
                          type="order"
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderNftWalletValue({
                        walletAddress: item.nftWalletAddress ?? null,
                        chainId: item.nftChainId ?? null,
                        isAutoRenew: Boolean(item.orderMetadata?.autoRenew),
                      })}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/orders/${item.orderId}/details`}
                        className="font-mono text-sm hover:underline inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </MobileTableDesktop>
          </MobileTable>
        ) : (
          <MobileTableEmpty
            icon={PackageX}
            title="No Orders Yet"
            description="Your orders would appear here when placed."
          />
        )}
      </CartCard>
    </PageShell>
  );
}
