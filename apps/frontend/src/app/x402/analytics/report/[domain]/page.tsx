'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { config } from '@/lib/env';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  TrendingUpIcon,
  PieChartIcon,
  BarChart3Icon,
  GlobeIcon,
  Loader2Icon,
  AlertCircleIcon,
  ExternalLinkIcon,
  CalendarIcon,
  WalletIcon,
} from 'lucide-react';
import X402DashboardOverview from '@/components/x402/analytics/X402DashboardOverview';
import type { DnsAnalyticsParsed } from '@namefi-astra/common/analytics-parser';

// Placeholder - to be updated with actual URL
const REDIRECT_URL = '#';

interface PageProps {
  params: Promise<{ domain: string }>;
}

interface X402AnalyticsResponse {
  buyerWallet: string;
  domainName: string;
  dateRange: { startDate: string; endDate: string };
  accessedVia: 'token' | 'payment';
  txHash?: string;
  chainId?: number;
  network?: string;
  accessToken?: string;
  report: DnsAnalyticsParsed;
}

function shortenAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  // Handle relative date tokens
  if (startDate.endsWith('daysAgo')) {
    const days = startDate.replace('daysAgo', '');
    return `Last ${days} days`;
  }
  if (startDate === 'today' && endDate === 'today') {
    return 'Today';
  }
  return `${startDate} to ${endDate}`;
}

function ErrorCard({
  title,
  message,
  showRedirect = true,
}: {
  title: string;
  message: string;
  showRedirect?: boolean;
}) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {showRedirect && (
            <Button variant="outline">
              <a href={REDIRECT_URL}>
                Get Access Token
                <ExternalLinkIcon className="h-4 w-4 ms-2" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCards({
  data,
  isLoading,
  isFetching,
}: {
  data: DnsAnalyticsParsed | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
}) {
  const totalQueries = data?.summary?.totalQueries ?? 0;
  const uniqueDomains = data?.summary?.uniqueDomains ?? 0;
  const cacheHitRate = data?.summary?.cacheHitRatePercent;
  const uniqueClientIps = data?.summary?.uniqueClientIps ?? 0;

  return (
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
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {totalQueries.toLocaleString()}
            </div>
          )}
          <p className="text-xs text-muted-foreground">In selected period</p>
        </CardContent>
      </Card>

      <Card className="relative">
        {isFetching && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Domains</CardTitle>
          <GlobeIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {uniqueDomains.toLocaleString()}
            </div>
          )}
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
          <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {cacheHitRate !== null && cacheHitRate !== undefined
                ? `${cacheHitRate.toFixed(1)}%`
                : 'N/A'}
            </div>
          )}
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
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {uniqueClientIps.toLocaleString()}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Unique client IPs</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inner component that handles the analytics report display.
 * Separated to ensure hooks are called unconditionally.
 */
function AnalyticsReportContent({
  domain,
  accessToken,
  startDate,
  endDate,
}: {
  domain: string;
  accessToken: string;
  startDate: string;
  endDate: string;
}) {
  const { data, isLoading, isFetching, error, refetch } =
    useQuery<X402AnalyticsResponse>({
      queryKey: ['x402-analytics', domain, accessToken, startDate, endDate],
      queryFn: async () => {
        const url = new URL(
          `${config.BACKEND_URL}/x402/analytics/report/${encodeURIComponent(domain)}`,
        );
        url.searchParams.set('accessToken', accessToken);
        url.searchParams.set('startDate', startDate);
        url.searchParams.set('endDate', endDate);
        url.searchParams.set('format', 'parsed');

        const res = await fetch(url.toString());

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message =
            errorData.message ||
            (res.status === 401 || res.status === 403
              ? 'Access token is invalid or expired'
              : res.status === 404
                ? 'Domain not found'
                : `Request failed with status ${res.status}`);
          throw new Error(message);
        }

        return res.json();
      },
      retry: false,
    });

  // Handle errors
  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    const isAuthError =
      errorMessage.includes('invalid') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403');

    return (
      <ErrorCard
        title={isAuthError ? 'Access Denied' : 'Error Loading Analytics'}
        message={errorMessage}
        showRedirect={isAuthError}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            DNS Analytics Report
          </h1>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-48" />
          ) : (
            <p className="text-lg text-muted-foreground">{data?.domainName}</p>
          )}
        </div>

        {/* Refresh button */}
        {!isLoading && !error && (
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2Icon className="h-4 w-4 me-2 animate-spin" />
            ) : null}
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Payment Info & Date Range Badges */}
      {!isLoading && data && (
        <div className="flex flex-wrap gap-3">
          {/* Date Range Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatDateRange(
                data.dateRange.startDate,
                data.dateRange.endDate,
              )}
            </span>
          </div>

          {/* Buyer Wallet Badge */}
          {data.buyerWallet && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">
                {shortenAddress(data.buyerWallet)}
              </span>
            </div>
          )}

          {/* Access Type Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 rounded-full text-sm">
            <span>
              Accessed via {data.accessedVia === 'token' ? 'Token' : 'Payment'}
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards
        data={data?.report}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      {/* Dashboard Charts */}
      <X402DashboardOverview
        data={data?.report}
        isLoading={isLoading}
        isFetching={isFetching}
      />
    </div>
  );
}

export default function X402AnalyticsReportPage({ params }: PageProps) {
  const { domain } = use(params);
  const searchParams = useSearchParams();

  const accessToken = searchParams.get('accessToken');
  const startDate = searchParams.get('startDate') || '7daysAgo';
  const endDate = searchParams.get('endDate') || 'today';

  // Check accessToken exists - this can safely return early since no hooks are called after
  if (!accessToken) {
    return (
      <ErrorCard
        title="Access Token Required"
        message="An access token is required to view this analytics report. Please obtain an access token to continue."
      />
    );
  }

  return (
    <AnalyticsReportContent
      domain={domain}
      accessToken={accessToken}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
