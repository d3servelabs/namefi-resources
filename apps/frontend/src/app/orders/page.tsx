'use client';

import { AuthRequired } from '@/components/auth-required';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { CartCard } from '@/components/cart-card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { useAuth } from '@/hooks/useAuth';
import { shortage } from '@/utils/string';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

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
    <div className="container mx-auto py-8 px-8">
      <CartCard title="Order History">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
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
              </>
            ) : (
              orderItems.map((item) => (
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
                      <StatusBadge status={item.status} type="order" />
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
                      {shortage(item.orderId, 8)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CartCard>
    </div>
  );
}
