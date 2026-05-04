'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJs,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Loader2 } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import type { FinancialSummary } from './types';
import {
  centsToUsd,
  formatInteger,
  formatPaymentMethod,
  formatPercent,
  formatUsdAmount,
  formatUsdCents,
} from './utils';

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export function SummaryCards({
  summary,
  isLoading,
  isFetching,
}: {
  summary: FinancialSummary | undefined;
  isLoading: boolean;
  isFetching: boolean;
}) {
  const totals = summary?.totals;
  const cards = [
    {
      title: 'Gross Volume',
      value: formatUsdCents(totals?.grossAmountInUsdCents ?? 0),
      note: 'Settled payments, USD',
    },
    {
      title: 'Refunds',
      value: formatUsdCents(totals?.refundAmountInUsdCents ?? 0),
      note: `${totals?.refundCount ?? 0} succeeded refunds`,
    },
    {
      title: 'Net Volume',
      value: formatUsdCents(totals?.netAmountInUsdCents ?? 0),
      note: 'Gross less succeeded refunds',
    },
    {
      title: 'Auto-Renew Net',
      value: formatUsdCents(summary?.autoRenew.netAmountInUsdCents ?? 0),
      note: `${summary?.autoRenew.itemCount ?? 0} auto-renew items`,
    },
    {
      title: 'Orders',
      value: formatInteger(totals?.orderCount ?? 0),
      note: `${totals?.paidOrderCount ?? 0} paid orders`,
    },
    {
      title: 'Order Items',
      value: formatInteger(totals?.itemCount ?? 0),
      note: 'Matched order items',
    },
    {
      title: 'Average Order Value',
      value: formatUsdCents(totals?.averageOrderValueInUsdCents ?? 0),
      note: 'Settled payments / paid orders',
    },
    {
      title: 'Refund Rate',
      value: formatPercent(totals?.refundRate ?? 0),
      note: 'Refunds / gross volume',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          {isFetching && !isLoading && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FinancialCharts({
  summary,
  isLoading,
  isFetching,
}: {
  summary: FinancialSummary | undefined;
  isLoading: boolean;
  isFetching: boolean;
}) {
  const dailyChart = useMemo(() => {
    if (!summary?.daily) return null;
    return {
      labels: summary.daily.map((row) => row.date),
      datasets: [
        {
          label: 'Gross USD',
          data: summary.daily.map((row) =>
            centsToUsd(row.grossAmountInUsdCents),
          ),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          tension: 0.25,
        },
        {
          label: 'Refunds USD',
          data: summary.daily.map((row) =>
            centsToUsd(row.refundAmountInUsdCents),
          ),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.25,
        },
        {
          label: 'Net USD',
          data: summary.daily.map((row) => centsToUsd(row.netAmountInUsdCents)),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.25,
        },
      ],
    };
  }, [summary?.daily]);

  const itemTypeChart = useMemo(() => {
    if (!summary?.byItemType) return null;
    return {
      labels: summary.byItemType.map((row) => row.type),
      datasets: [
        {
          label: 'Net USD',
          data: summary.byItemType.map((row) =>
            centsToUsd(row.netAmountInUsdCents),
          ),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
        },
      ],
    };
  }, [summary?.byItemType]);

  const registrarChart = useMemo(() => {
    if (!summary?.byRegistrar) return null;
    const rows = summary.byRegistrar.slice(0, 10);
    return {
      labels: rows.map((row) => row.registrar),
      datasets: [
        {
          label: 'Net USD',
          data: rows.map((row) => centsToUsd(row.netAmountInUsdCents)),
          backgroundColor: 'rgba(20, 184, 166, 0.8)',
        },
      ],
    };
  }, [summary?.byRegistrar]);

  const paymentMethodChart = useMemo(() => {
    if (!summary?.byPaymentMethod) return null;
    return {
      labels: summary.byPaymentMethod.map((row) =>
        formatPaymentMethod(row.paymentProvider, row.chain),
      ),
      datasets: [
        {
          label: 'Net USD',
          data: summary.byPaymentMethod.map((row) =>
            centsToUsd(row.netAmountInUsdCents),
          ),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
        },
      ],
    };
  }, [summary?.byPaymentMethod]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const },
        tooltip: {
          callbacks: {
            label: (context: {
              dataset: { label?: string };
              parsed: { y?: number } | number;
            }) => {
              const value =
                typeof context.parsed === 'number'
                  ? context.parsed
                  : (context.parsed.y ?? 0);
              return `${context.dataset.label ?? 'Value'}: ${formatUsdAmount(value)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: string | number) =>
              formatUsdAmount(Number(value)),
          },
        },
      },
    }),
    [],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading financial charts...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard
        title="Volume by Order Date"
        isFetching={isFetching}
        className="xl:col-span-2"
      >
        {dailyChart ? <Line data={dailyChart} options={options} /> : null}
      </ChartCard>
      <ChartCard title="Net Revenue by Type" isFetching={isFetching}>
        {itemTypeChart ? <Bar data={itemTypeChart} options={options} /> : null}
      </ChartCard>
      <ChartCard title="Net Revenue by Registrar" isFetching={isFetching}>
        {registrarChart ? (
          <Bar data={registrarChart} options={options} />
        ) : null}
      </ChartCard>
      <ChartCard
        title="Net by Payment Method / Chain"
        isFetching={isFetching}
        className="xl:col-span-2"
      >
        {paymentMethodChart ? (
          <Bar data={paymentMethodChart} options={options} />
        ) : null}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  isFetching,
  className,
  children,
}: {
  title: string;
  isFetching: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('relative', className)}>
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">{children}</div>
      </CardContent>
    </Card>
  );
}
