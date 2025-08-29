'use client';
import { useParams } from 'next/navigation';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/shadcn/card';
import { OrdersDataTable } from '@/components/powered-by-namefi/OrdersDataTable';
import { OrdersTableSkeleton } from '@/components/powered-by-namefi/OrdersTableSkeleton';
import { PbnOwnerGuard } from '@/components/admin/pbn-owner-guard';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useMemo } from 'react';

export default function PoweredByNamefiAllOrdersPage() {
  const params = useParams<{ domain: string }>();
  const pbnDomain = params?.domain as string;

  return (
    <PbnOwnerGuard pbnDomain={pbnDomain as NamefiNormalizedDomain}>
      <InnerPage domain={pbnDomain} />
    </PbnOwnerGuard>
  );
}

function InnerPage({ domain }: { domain: string }) {
  const trpc = useTRPC();
  const ordersQuery = useQuery(
    trpc.pbnOwner.orderItemsHistory.queryOptions({
      page: 1,
      limit: 100,
      normalizedDomainName: domain,
    }),
  );
  const orders = useMemo(
    () => ordersQuery.data?.data ?? [],
    [ordersQuery.data?.data],
  );

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>All Orders for {domain}</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <OrdersTableSkeleton />
          ) : orders.length > 0 ? (
            <div>
              <OrdersDataTable items={orders as any} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No orders</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
