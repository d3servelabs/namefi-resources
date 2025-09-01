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
import { ReservedWordsManager } from '@/components/powered-by-namefi/ReservedWordsManager';
import { useCallback, useState } from 'react';
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
import { parseAsStringEnum, useQueryState } from 'nuqs';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { OrdersTableSkeleton } from '@/components/powered-by-namefi/OrdersTableSkeleton';
import { OrdersDataTable } from '@/components/powered-by-namefi/OrdersDataTable';
import {
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbPage,
  Breadcrumb,
} from '@/components/ui/shadcn/breadcrumb';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);
enum TabValues {
  OVERVIEW = 'overview',
  RESERVED_WORDS = 'reserved-words',
  ORDERS = 'orders',
}
const DEFAULT_TAB = TabValues.OVERVIEW;

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
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum<TabValues>(Object.values(TabValues))
      .withOptions({
        clearOnDefault: false,
      })
      .withDefault(DEFAULT_TAB),
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value as TabValues);
    },
    [setActiveTab],
  );

  return (
    <div className="container mx-auto px-x">
      <PbnDomainBreadcrumb domain={domain} activeTab={activeTab} />

      <Tabs value={activeTab.toString()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value={TabValues.OVERVIEW}>Overview</TabsTrigger>
          <TabsTrigger value={TabValues.RESERVED_WORDS}>
            Reserved Domains Management
          </TabsTrigger>
          <TabsTrigger value={TabValues.ORDERS}>Orders Details</TabsTrigger>
        </TabsList>

        <TabsContent value={TabValues.OVERVIEW} className="mt-6">
          <Overview domain={domain} />
        </TabsContent>

        <TabsContent value={TabValues.RESERVED_WORDS} className="mt-6">
          <ReservedWordsManager domain={domain} />
        </TabsContent>

        <TabsContent value={TabValues.ORDERS} className="mt-6">
          <OrderDetails domain={domain} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PbnDomainBreadcrumb({
  domain,
  activeTab,
}: {
  domain: NamefiNormalizedDomain;
  activeTab: TabValues;
}) {
  const trpc = useTRPC();
  const domainsQuery = useQuery(trpc.pbnOwner.listOwnedDomains.queryOptions());

  return (
    <Breadcrumb className="font-semibold text-2xl mb-6 mt-1">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/powered-by-namefi/admin">Domains</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <BreadcrumbPage className="flex gap-1 font-semibold">
                {domain} <ChevronDownIcon className="w-5 h-5 pt-1" />
              </BreadcrumbPage>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {domainsQuery.data?.map((domain) => (
                <DropdownMenuItem key={domain.normalizedDomainName} asChild>
                  <Link
                    href={`/powered-by-namefi/admin/${domain.normalizedDomainName}?tab=${activeTab}`}
                  >
                    {domain.normalizedDomainName}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Overview({ domain }: { domain: NamefiNormalizedDomain }) {
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
  const _10WeeksAgo = useMemo(() => subDays(new Date(), 70), []);
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('week');
  const [dateRange, setDateRange] = useState({
    startDate: _10WeeksAgo.toISOString(),
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

    const computedStyle = getComputedStyle(document.documentElement);
    const borderColor = computedStyle
      .getPropertyValue('--brand-primary')
      .trim();

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
          borderColor,
          backgroundColor: '#7f7f7f',
          fill: true,
          tension: 0.3,
        },
      ],
    } satisfies ChartData<'line'>;
  }, [revenueQuery.data?.points]);

  return (
    <div className="container mx-auto p-6 space-y-6">
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
                  <SelectValue placeholder="Group By" defaultValue="week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {revenueQuery.isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              <div className="text-xl font-semibold mb-3">
                {((revenueQuery.data?.totalInUsdCents ?? 0) / 100).toFixed(2)}{' '}
                $USD{' '}
                <div className="text-sm text-muted-foreground">
                  (During selected time range)
                </div>
              </div>
              <RevenueLine data={revenueLineData} className="h-96" />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders (SUCCEEDED)</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={'?tab=orders'}>View All</Link>
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

function OrderDetails({ domain }: { domain: string }) {
  const trpc = useTRPC();
  const ordersQuery = useQuery(
    trpc.pbnOwner.orderItemsHistory.queryOptions({
      page: 1,
      limit: 100,
      normalizedDomainName: domain,
    }),
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
          ) : (
            <OrdersDataTable items={(ordersQuery.data?.data as any) ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
