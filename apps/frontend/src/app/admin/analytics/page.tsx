'use client';

import { withAdminGuard } from '@/components/admin/admin-guard';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import {
  RefreshCwIcon,
  TrendingUpIcon,
  PieChartIcon,
  BarChart3Icon,
  GlobeIcon,
  FilterIcon,
  XIcon,
  Loader2Icon,
} from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';

// Chart components
import DashboardOverview from '@/components/admin/analytics/DashboardOverview';
import { CheckoutFlowOverview } from '@/components/admin/analytics/CheckoutFlowOverview';
import DateRangePicker from '@/components/admin/analytics/DateRangePicker';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { PageShell } from '@/components/page-shell';
import type { CheckoutFlowEventSourceFilter } from '@namefi-astra/common/contract/analytics-contract';

function AnalyticsPageContent() {
  const [dateRange, setDateRange] = useState({
    startDate: '7daysAgo',
    endDate: 'today',
  });
  const [analyticsView, setAnalyticsView] = useState<'dns' | 'checkout'>('dns');
  const [checkoutEventSource, setCheckoutEventSource] =
    useState<CheckoutFlowEventSourceFilter>('all');

  const [publicSuffixFilter, setPublicSuffixFilter] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('');

  const trpc = useTRPC();

  // Get dashboard overview data with dynamic filtering
  const {
    data: dashboardData,
    refetch: refetchDashboard,
    isLoading,
    isFetching,
  } = useQuery({
    ...trpc.analytics.getDashboardOverview.queryOptions({
      ...dateRange,
      ...(publicSuffixFilter && { publicSuffix: publicSuffixFilter }),
      ...(domainFilter && { publicSuffixPlusOne: domainFilter }),
    }),
    placeholderData: (previousData) => previousData,
  });

  const {
    data: checkoutFlowData,
    refetch: refetchCheckoutFlow,
    isLoading: isCheckoutFlowLoading,
    isFetching: isCheckoutFlowFetching,
  } = useQuery({
    ...trpc.analytics.getCheckoutFlowOverview.queryOptions({
      ...dateRange,
      eventSource: checkoutEventSource,
    }),
    placeholderData: (previousData) => previousData,
  });

  // Get public suffixes for selection
  const { data: publicSuffixes } = useQuery({
    ...trpc.analytics.getByPublicSuffix.queryOptions({
      ...dateRange,
      limit: 100,
    }),
  });

  // Get public suffix plus one data for selection
  const { data: publicSuffixPlusOne } = useQuery({
    ...trpc.analytics.getByPublicSuffixPlusOne.queryOptions({
      ...dateRange,
      limit: 100,
    }),
  });

  const handleDateRangeChange = (newRange: {
    startDate: string;
    endDate: string;
  }) => {
    setDateRange(newRange);
  };

  const handleRefresh = () => {
    void Promise.all([refetchDashboard(), refetchCheckoutFlow()]);
  };

  const handleAnalyticsViewChange = (value: string) => {
    if (value === 'dns' || value === 'checkout') {
      setAnalyticsView(value);
    }
  };

  const handleCheckoutEventSourceChange = (value: string) => {
    if (value === 'all' || value === 'api' || value === 'non_api') {
      setCheckoutEventSource(value);
    }
  };

  const isAnyFetching = isFetching || isCheckoutFlowFetching;

  const handleClearFilters = () => {
    setPublicSuffixFilter('');
    setDomainFilter('');
  };

  // Smart filtering: domains filtered by selected public suffix
  const availablePublicSuffixes = publicSuffixes?.rows?.filter((row: any) => {
    const suffix = row.dimensionValues?.[0]?.value;
    if (!suffix || suffix.trim() === '' || suffix === '(not set)') return false;

    // If domain filter is set, only show public suffixes that match the domain
    if (domainFilter) {
      return domainFilter.endsWith(`.${suffix}`);
    }
    return true;
  });

  const availableDomains = publicSuffixPlusOne?.rows?.filter((row: any) => {
    const domain = row.dimensionValues?.[0]?.value;
    if (!domain || domain.trim() === '' || domain === '(not set)') return false;

    // If public suffix filter is set, only show domains that end with that suffix
    if (publicSuffixFilter) {
      return domain.endsWith(`.${publicSuffixFilter}`);
    }
    return true;
  });

  // Auto-update related filters when one changes
  const handlePublicSuffixChange = (newSuffix: string | null) => {
    if (!newSuffix) {
      return;
    }
    if (newSuffix === '__clear__') {
      setPublicSuffixFilter('');
      // When clearing public suffix, also clear domain since it would be inconsistent
      // A domain like "google.com" can't exist without a public suffix like "com"
      setDomainFilter('');
      return;
    }

    setPublicSuffixFilter(newSuffix);
    // If domain filter doesn't match the new suffix, clear it
    if (domainFilter && newSuffix && !domainFilter.endsWith(`.${newSuffix}`)) {
      setDomainFilter('');
    }
  };

  const handleDomainChange = (newDomain: string | null) => {
    if (!newDomain) {
      return;
    }
    if (newDomain === '__clear__') {
      setDomainFilter('');
      return;
    }

    setDomainFilter(newDomain);
    // Auto-set public suffix if not already set and domain is selected
    if (newDomain && !publicSuffixFilter) {
      const parsedDomain = parseDomainName(newDomain as NamefiNormalizedDomain);
      if (!parsedDomain.valid) {
        return;
      }

      const inferredSuffix = parsedDomain.publicSuffix;
      // Only set if this suffix exists in our data
      const suffixExists = publicSuffixes?.rows?.some(
        (row: any) => row.dimensionValues?.[0]?.value === inferredSuffix,
      );
      if (suffixExists) {
        setPublicSuffixFilter(inferredSuffix);
      }
    }
  };

  return (
    <PageShell padding="admin" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            DNS query analytics and checkout flow insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isAnyFetching}
          >
            {isAnyFetching ? (
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4 mr-2" />
            )}
            {isAnyFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Tabs value={analyticsView} onValueChange={handleAnalyticsViewChange}>
        <TabsList>
          <TabsTrigger value="dns">DNS Analytics</TabsTrigger>
          <TabsTrigger value="checkout">Checkout Analytics</TabsTrigger>
        </TabsList>
      </Tabs>

      {analyticsView === 'dns' && (
        <>
          {/* Filter Card */}
          <Card className="relative">
            {isFetching && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Updating data...
                </div>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FilterIcon className="h-5 w-5" />
                  Data Filters
                  {isFetching && (
                    <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
                {(publicSuffixFilter || domainFilter) && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Public Suffix Filter */}
                <div className="space-y-2">
                  <Label htmlFor="public-suffix-filter">
                    Public Suffix (TLD)
                  </Label>
                  <Select
                    value={publicSuffixFilter}
                    onValueChange={handlePublicSuffixChange}
                    disabled={isFetching}
                  >
                    <SelectTrigger id="public-suffix-filter">
                      <SelectValue placeholder="Choose a public suffix..." />
                    </SelectTrigger>
                    <SelectContent>
                      {publicSuffixFilter && (
                        <SelectItem value="__clear__">
                          Clear Public Suffix Filter
                        </SelectItem>
                      )}
                      {availablePublicSuffixes?.map(
                        (row: any, index: number) => {
                          const suffix = row.dimensionValues?.[0]?.value;
                          const count = row.metricValues?.[0]?.value;
                          return (
                            <SelectItem
                              key={`suffix-${suffix}-${index}`}
                              value={suffix}
                            >
                              .{suffix} (
                              {Number.parseInt(count || '0').toLocaleString()}{' '}
                              queries)
                            </SelectItem>
                          );
                        },
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Domain Filter */}
                <div className="space-y-2">
                  <Label htmlFor="domain-filter">Domain</Label>
                  <Select
                    value={domainFilter}
                    onValueChange={handleDomainChange}
                    disabled={isFetching}
                  >
                    <SelectTrigger id="domain-filter">
                      <SelectValue placeholder="Choose a domain..." />
                    </SelectTrigger>
                    <SelectContent>
                      {domainFilter && (
                        <SelectItem value="__clear__">
                          Clear Domain Filter
                        </SelectItem>
                      )}
                      {availableDomains?.map((row: any, index: number) => {
                        const domain = row.dimensionValues?.[0]?.value;
                        const count = row.metricValues?.[0]?.value;
                        return (
                          <SelectItem
                            key={`domain-${domain}-${index}`}
                            value={domain}
                          >
                            {domain} (
                            {Number.parseInt(count || '0').toLocaleString()}{' '}
                            queries)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filter Indicator */}
              {(publicSuffixFilter || domainFilter) && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <FilterIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      Active Filters:
                    </span>
                    {publicSuffixFilter && (
                      <span className="text-blue-700 dark:text-blue-300">
                        Public Suffix:{' '}
                        <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          .{publicSuffixFilter}
                        </span>
                      </span>
                    )}
                    {publicSuffixFilter && domainFilter && (
                      <span className="text-blue-500 dark:text-blue-400">
                        •
                      </span>
                    )}
                    {domainFilter && (
                      <span className="text-blue-700 dark:text-blue-300">
                        Domain:{' '}
                        <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          {domainFilter}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative">
              {isFetching && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                  <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Queries
                </CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.dailyVolume?.rows
                    ?.reduce(
                      (sum: number, row: any) =>
                        sum +
                        Number.parseInt(row.metricValues?.[0]?.value || '0'),
                      0,
                    )
                    ?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last{' '}
                  {dateRange.startDate === '7daysAgo' ? '7 days' : 'period'}
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
                  Unique Domains
                </CardTitle>
                <GlobeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.topDomains?.rows?.length?.toLocaleString() ||
                    '0'}
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
                        sum +
                        Number.parseInt(row.metricValues?.[0]?.value || '0'),
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
                <CardTitle className="text-sm font-medium">
                  Client IPs
                </CardTitle>
                <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.topClientIps?.rows?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique client IPs
                </p>
              </CardContent>
            </Card>
          </div>

          <DashboardOverview
            data={dashboardData}
            isLoading={isLoading}
            isFetching={isFetching}
            dateRange={dateRange}
          />
        </>
      )}

      {analyticsView === 'checkout' && (
        <div className="mt-2 space-y-4">
          <div className="flex justify-end">
            <Tabs
              value={checkoutEventSource}
              onValueChange={handleCheckoutEventSourceChange}
            >
              <TabsList>
                <TabsTrigger value="all">All Sources</TabsTrigger>
                <TabsTrigger value="api">API Events</TabsTrigger>
                <TabsTrigger value="non_api">Non-API Events</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CheckoutFlowOverview
            data={checkoutFlowData}
            isLoading={isCheckoutFlowLoading}
            isFetching={isCheckoutFlowFetching}
          />
        </div>
      )}
    </PageShell>
  );
}

export default withAdminGuard(AnalyticsPageContent);
