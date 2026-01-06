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
import { PageShell } from '@/components/page-shell';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
import DashboardOverview from '@/components/admin/analytics/DashboardOverview';
import {
  RefreshCwIcon,
  TrendingUpIcon,
  PieChartIcon,
  BarChart3Icon,
  GlobeIcon,
  Loader2Icon,
  GiftIcon,
} from 'lucide-react';

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);
const SKELETON_KEYS = ['one', 'two', 'three', 'four', 'five'];
enum TabValues {
  OVERVIEW = 'overview',
  RESERVED_WORDS = 'reserved-words',
  ORDERS = 'orders',
  ANALYTICS = 'analytics',
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
    <PageShell padding="admin">
      <PbnDomainBreadcrumb domain={domain} activeTab={activeTab} />

      <Tabs value={activeTab.toString()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value={TabValues.OVERVIEW}>Overview</TabsTrigger>
          <TabsTrigger value={TabValues.RESERVED_WORDS}>
            Protected Words Management
          </TabsTrigger>
          <TabsTrigger value={TabValues.ORDERS}>Orders Details</TabsTrigger>
          <TabsTrigger value={TabValues.ANALYTICS}>Analytics</TabsTrigger>
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

        <TabsContent value={TabValues.ANALYTICS} className="mt-6">
          <DomainAnalytics domain={domain} />
        </TabsContent>
      </Tabs>
    </PageShell>
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
    <PageShell padding="admin" className="space-y-6" gutter={false}>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={`/powered-by-namefi/admin/${domain}/gifts`}>
            <GiftIcon className="w-4 h-4 mr-2" /> Manage Gifts & Reservations
          </Link>
        </Button>
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
              {SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <RecentOrdersList items={(ordersQuery.data?.data as any) ?? []} />
          )}
        </CardContent>
      </Card>
    </PageShell>
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
    <PageShell padding="admin" gutter={false}>
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
    </PageShell>
  );
}

function DomainAnalytics({ domain }: { domain: NamefiNormalizedDomain }) {
  const trpc = useTRPC();
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    subDays(new Date(), 7),
    new Date(),
  ]);

  const toYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDateStr = toYmd(dateRange[0]);
  const endDateStr = toYmd(dateRange[1]);

  const {
    data: dashboardData,
    refetch: refetchDashboard,
    isLoading,
    isFetching,
  } = useQuery({
    ...trpc.pbnOwner.getAnalyticsDashboardOverview.queryOptions({
      startDate: startDateStr,
      endDate: endDateStr,
      publicSuffixPlusOne: domain,
    }),
    placeholderData: (previousData) => previousData,
  });

  const handleDateRangeChange = (value: [Date, Date]) => {
    setDateRange(value);
  };

  const handleRefresh = () => {
    refetchDashboard();
  };

  return (
    <PageShell padding="admin" className="space-y-6" gutter={false}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Analytics for {domain}
          </h2>
          <p className="text-muted-foreground mt-1">
            Prefiltered to this domain
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <RsuiteRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4 mr-2" />
            )}
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.dailyVolume?.rows
                ?.reduce(
                  (sum: number, row: any) =>
                    sum + Number.parseInt(row.metricValues?.[0]?.value || '0'),
                  0,
                )
                ?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Selected period</p>
          </CardContent>
        </Card>

        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Domains
            </CardTitle>
            <GlobeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.topDomains?.rows?.length?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Different domains queried
            </p>
          </CardContent>
        </Card>

        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cache Hit Rate
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const cacheData = dashboardData?.cacheHitRatio?.rows;
                if (!cacheData || cacheData.length === 0) return 'N/A';
                const hits =
                  cacheData.find(
                    (row: any) => row.dimensionValues?.[0]?.value === '1',
                  )?.metricValues?.[0]?.value || 0;
                const total = cacheData.reduce(
                  (sum: number, row: any) =>
                    sum + Number.parseInt(row.metricValues?.[0]?.value || '0'),
                  0,
                );
                return total > 0
                  ? `${((Number.parseInt(hits.toString()) / total) * 100).toFixed(1)}%`
                  : 'N/A';
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Queries served from cache
            </p>
          </CardContent>
        </Card>

        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client IPs</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.topClientIps?.rows?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unique client IPs</p>
          </CardContent>
        </Card>
      </div>

      <DashboardOverview
        data={dashboardData}
        isLoading={isLoading}
        isFetching={isFetching}
        dateRange={{ startDate: startDateStr, endDate: endDateStr }}
        visibility={{
          publicSuffixPie: false,
        }}
      />
    </PageShell>
  );
}
