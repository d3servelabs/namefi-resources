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
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, PackageX } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

// Empty state component
const EmptyState = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
};

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
        {isLoading ? (
          <Table>
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
          </Table>
        ) : orderItems.length > 0 ? (
          <Table>
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
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={PackageX}
            title="No Orders Yet"
            description="Your orders would appear here when placed."
          />
        )}
      </CartCard>
    </div>
  );
}
