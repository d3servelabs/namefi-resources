'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Loader2Icon } from 'lucide-react';
import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import type { AppRouterOutput } from '@/lib/trpc';

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

type DashboardOverviewData =
  AppRouterOutput['analytics']['getDashboardOverview'];

interface DashboardOverviewProps {
  data: DashboardOverviewData | null | undefined;
  isLoading: boolean;
  isFetching?: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function DashboardOverview({
  data,
  isLoading,
  isFetching = false,
  dateRange,
}: DashboardOverviewProps) {
  // Prepare chart data
  const topDomainsChart = useMemo(() => {
    if (!data?.topDomains?.rows) return null;

    const rows = data.topDomains.rows.slice(0, 15);
    return {
      labels: rows.map(
        (row: any) => row.dimensionValues?.[0]?.value || 'Unknown',
      ),
      datasets: [
        {
          label: 'DNS Queries',
          data: rows.map((row: any) =>
            Number.parseInt(row.metricValues?.[0]?.value || '0'),
          ),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [data?.topDomains]);

  const responseCodeChart = useMemo(() => {
    if (!data?.queriesByResponseCode?.rows) return null;

    const rows = data.queriesByResponseCode.rows;
    return {
      labels: rows.map(
        (row: any) => row.dimensionValues?.[0]?.value || 'Unknown',
      ),
      datasets: [
        {
          data: rows.map((row: any) =>
            Number.parseInt(row.metricValues?.[0]?.value || '0'),
          ),
          backgroundColor: [
            'rgba(52, 211, 153, 0.9)', // Soft green for NOERROR
            'rgba(248, 113, 113, 0.9)', // Soft red for NXDOMAIN
            'rgba(251, 191, 36, 0.9)', // Soft yellow for other errors
            'rgba(196, 125, 255, 0.9)', // Soft purple
            'rgba(244, 114, 182, 0.9)', // Soft pink
            'rgba(96, 165, 250, 0.9)', // Soft blue
            'rgba(74, 222, 128, 0.9)', // Soft lime
            'rgba(251, 146, 60, 0.9)', // Soft orange
          ],
          borderColor: [
            'rgba(52, 211, 153, 1)',
            'rgba(248, 113, 113, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(196, 125, 255, 1)',
            'rgba(244, 114, 182, 1)',
            'rgba(96, 165, 250, 1)',
            'rgba(74, 222, 128, 1)',
            'rgba(251, 146, 60, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data?.queriesByResponseCode]);

  const queryTypeChart = useMemo(() => {
    if (!data?.queriesByType?.rows) return null;

    const rows = data.queriesByType.rows;
    return {
      labels: rows.map(
        (row: any) => row.dimensionValues?.[0]?.value || 'Unknown',
      ),
      datasets: [
        {
          label: 'Queries by Type',
          data: rows.map((row: any) =>
            Number.parseInt(row.metricValues?.[0]?.value || '0'),
          ),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [data?.queriesByType]);

  const hourlyVolumeChart = useMemo(() => {
    if (!data?.hourlyVolume?.rows) return null;

    const rows = data.hourlyVolume.rows;
    return {
      labels: rows.map((row: any) => {
        const dateHour = row.dimensionValues?.[0]?.value;
        if (dateHour) {
          // Format as readable time
          const date = dateHour.substring(0, 8);
          const hour = dateHour.substring(8, 10);
          return `${date.substring(4, 6)}/${date.substring(6, 8)} ${hour}:00`;
        }
        return 'Unknown';
      }),
      datasets: [
        {
          label: 'Queries per Hour',
          data: rows.map((row: any) =>
            Number.parseInt(row.metricValues?.[0]?.value || '0'),
          ),
          fill: false,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
      ],
    };
  }, [data?.hourlyVolume]);

  const publicSuffixChart = useMemo(() => {
    if (!data?.publicSuffix?.rows) return null;

    const rows = data.publicSuffix.rows;
    return {
      labels: rows.map((row: any) => {
        const v = row.dimensionValues?.[0]?.value;
        return v ? `.${v}` : 'Unknown';
      }),
      datasets: [
        {
          data: rows.map((row: any) =>
            Number.parseInt(row.metricValues?.[0]?.value || '0'),
          ),
          backgroundColor: [
            'rgba(96, 165, 250, 0.9)', // Soft blue
            'rgba(52, 211, 153, 0.9)', // Soft teal
            'rgba(251, 191, 36, 0.9)', // Soft yellow
            'rgba(248, 113, 113, 0.9)', // Soft red
            'rgba(196, 125, 255, 0.9)', // Soft purple
            'rgba(244, 114, 182, 0.9)', // Soft pink
            'rgba(34, 197, 249, 0.9)', // Soft cyan
            'rgba(163, 230, 53, 0.9)', // Soft lime
            'rgba(251, 146, 60, 0.9)', // Soft orange
            'rgba(239, 68, 68, 0.9)', // Soft rose
          ],
          borderColor: [
            'rgba(96, 165, 250, 1)',
            'rgba(52, 211, 153, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(248, 113, 113, 1)',
            'rgba(196, 125, 255, 1)',
            'rgba(244, 114, 182, 1)',
            'rgba(34, 197, 249, 1)',
            'rgba(163, 230, 53, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data?.publicSuffix]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: (value: string | number) =>
            (typeof value === 'number'
              ? value
              : Number.parseInt(String(value))
            ).toLocaleString(),
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
          maxTicksLimit: 12, // Limit number of x-axis labels
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: (value: any) => Number.parseInt(value).toLocaleString(),
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(156, 163, 175)', // Gray-400 for dark mode
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)', // Dark background
        titleColor: 'rgb(243, 244, 246)', // Light text
        bodyColor: 'rgb(209, 213, 219)', // Slightly dimmer text
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) =>
            `${context.label}: ${context.parsed.toLocaleString()}`,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            No data available for the selected time range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Domains */}
      {topDomainsChart && (
        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Updating chart...
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>Top DNS Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[32rem]">
              <Bar data={topDomainsChart} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Codes */}
      {responseCodeChart && (
        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Updating chart...
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>Response Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={responseCodeChart} options={pieChartOptions} />
          </CardContent>
        </Card>
      )}

      {/* Query Types */}
      {queryTypeChart && (
        <Card>
          <CardHeader>
            <CardTitle>Query Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <Bar data={queryTypeChart} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Public Suffixes */}
      {publicSuffixChart && (
        <Card>
          <CardHeader>
            <CardTitle>Top Public Suffixes</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={publicSuffixChart} options={pieChartOptions} />
          </CardContent>
        </Card>
      )}

      {/* Hourly Volume */}
      {hourlyVolumeChart && (
        <Card className="lg:col-span-2 relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Updating time series...
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>Query Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={hourlyVolumeChart} options={lineChartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Hit Ratio and DNSSEC Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Cache Hit Ratio</h4>
            {data.cacheHitRatio?.rows?.map((row: any, index: number) => {
              const isHit = row.dimensionValues?.[0]?.value === 'true';
              const count = Number.parseInt(
                row.metricValues?.[0]?.value || '0',
              );
              return (
                <div key={index} className="flex justify-between">
                  <span>{isHit ? 'Cache Hits' : 'Cache Misses'}</span>
                  <span className="font-mono">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <div>
            <h4 className="font-medium mb-2">DNSSEC Status</h4>
            {data.dnssecStats?.rows?.map((row: any, index: number) => {
              const status = row.dimensionValues?.[0]?.value || 'Unknown';
              const count = Number.parseInt(
                row.metricValues?.[0]?.value || '0',
              );
              return (
                <div key={index} className="flex justify-between">
                  <span>{status}</span>
                  <span className="font-mono">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CountriesChart({
  data,
  barChartOptions,
}: {
  data: any;
  barChartOptions: any;
}) {
  const countriesChart = useMemo(() => {
    if (!data?.queriesByCountry?.rows) return null;

    const rows = data.queriesByCountry.rows.slice(0, 10);
    return {
      labels: rows.map(
        (row: any) => row.dimensionValues?.[0]?.value || 'Unknown',
      ),
      datasets: [
        {
          label: 'Queries by Country',
          data: rows.map((row: any) =>
            Number.parseInt(row.metricValues?.[0]?.value || '0'),
          ),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [data?.queriesByCountry]);

  if (countriesChart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Bar data={countriesChart} options={barChartOptions} />
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
}
