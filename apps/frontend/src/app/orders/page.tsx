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
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, PackageX, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/shadcn/button';

export default function OrdersPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
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

  if (!(isAuthenticated || isLoading)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-8">
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
                    </MobileTableItemContent>

                    <MobileTableItemActions>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/orders/${item.orderId}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
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
                      <Link
                        href={`/orders/${item.orderId}`}
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
    </div>
  );
}
