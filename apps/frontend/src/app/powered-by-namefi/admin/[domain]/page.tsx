'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { RevenueLine } from '@/components/powered-by-namefi/RevenueLine';
import { RecentOrdersList } from '@/components/powered-by-namefi/RecentOrdersList';
import { useQueryClient } from '@tanstack/react-query';
import { DomainDetailsCard } from '@/components/powered-by-namefi/DomainDetailsCard';
import { EditDomainDialog } from '@/components/powered-by-namefi/EditDomainDialog';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { useMemo } from 'react';
import { subDays } from 'date-fns';
import type { ChartData } from 'chart.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { RsuiteRangePicker } from '@/components/powered-by-namefi/RsuiteRangePicker';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { PbnOwnerGuard } from '@/components/admin/pbn-owner-guard';

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

export default function PoweredByNamefiDomainDetailsPage() {
  const params = useParams<{ domain: string }>();
  const pbnDomain = params?.domain as string;

  return (
    <PbnOwnerGuard pbnDomain={pbnDomain as NamefiNormalizedDomain}>
      <InnerPage domain={pbnDomain as NamefiNormalizedDomain} />
    </PbnOwnerGuard>
  );
}

function InnerPage({ domain }: { domain: NamefiNormalizedDomain }) {
  const trpc = useTRPC();
  const domainsQuery = useQuery(trpc.pbnOwner.listOwnedDomains.queryOptions());
  const selected = domainsQuery.data?.find(
    (d) => d.normalizedDomainName === domain,
  );
  const [editOpen, setEditOpen] = useState(false);

  const ordersQuery = useQuery(
    trpc.pbnOwner.orderItemsHistory.queryOptions({
      page: 1,
      limit: 10,
      normalizedDomainName: domain,
    }),
  );
  const fourteenDaysAgo = useMemo(() => subDays(new Date(), 14), []);
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');
  const [dateRange, setDateRange] = useState({
    startDate: fourteenDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
  });
  const revenueQuery = useQuery(
    trpc.pbnOwner.revenue.queryOptions({
      interval,
      normalizedDomainName: domain,
      from: new Date(dateRange.startDate),
      to: new Date(dateRange.endDate),
    }),
  );

  const revenueLineData = useMemo(() => {
    const points = revenueQuery.data?.points ?? [];
    if (!points.length) return null;
    const yLabels = [];
    const max = Math.max(
      ...(revenueQuery.data?.points?.map((p) => p.amountInUsdCents ?? 0) ?? []),
    );
    const count = 20;
    const step = max / count;
    for (let i = 0; i < count; i++) {
      yLabels.push(step * i);
    }

    return {
      labels: points.map((p) => {
        const d = new Date(p.bucket as any);
        return d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
      }),
      datasets: [
        {
          label: 'Revenue (USD)',
          data: points.map((p) => (p.amountInUsdCents ?? 0) / 100),
          borderColor: 'rgb(59,130,246)',
          backgroundColor: 'rgba(59,130,246,0.2)',
          fill: true,
          tension: 0.3,
        },
      ],
    } satisfies ChartData<'line'>;
  }, [revenueQuery.data?.points]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{domain}</h1>
      </div>

      {domainsQuery.isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        selected && (
          <DomainDetailsCard
            domain={selected}
            onOpenEdit={() => setEditOpen(true)}
          />
        )
      )}
      {selected && (
        <EditDomainDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          domain={selected}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Revenue</CardTitle>
            <div className="flex items-center gap-2">
              <RsuiteRangePicker
                value={[
                  new Date(dateRange.startDate),
                  new Date(dateRange.endDate),
                ]}
                onChange={(value) => {
                  setDateRange({
                    startDate: value[0].toISOString(),
                    endDate: value[1].toISOString(),
                  });
                }}
              />
              <Select
                value={interval}
                onValueChange={(v) =>
                  setInterval(v as 'day' | 'week' | 'month')
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {revenueQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="text-2xl font-semibold mb-3">
                {((revenueQuery.data?.totalInUsdCents ?? 0) / 100).toFixed(2)}{' '}
                total
              </div>
              <RevenueLine data={revenueLineData} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders (SUCCEEDED)</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/powered-by-namefi/admin/${domain}/orders`}>
                View All
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <RecentOrdersList items={(ordersQuery.data?.data as any) ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
