'use client';

import { useMemo, useState } from 'react';
import { Chart } from 'react-google-charts';
import {
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Loader2Icon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import type { AppRouterOutput } from '@/lib/trpc';

const FUNNEL_COLORS = [
  '#0EA5E9',
  '#14B8A6',
  '#22C55E',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#A855F7',
  '#6366F1',
  '#06B6D4',
];

const SUMMARY_SKELETON_KEYS = [
  'begin-search',
  'order-placed',
  'conversion-rate',
  'completion-rate',
] as const;

const DEFAULT_SANKEY_HEIGHT = 550;
const MIN_SANKEY_HEIGHT = 360;
const MAX_SANKEY_HEIGHT = 900;
const SANKEY_HEIGHT_STEP = 20;

const sankeyOptions = {
  sankey: {
    node: {
      width: 20,
      nodePadding: 18,
      label: {
        fontSize: 12,
      },
    },
    link: {
      colorMode: 'gradient',
      color: {
        fillOpacity: 0.45,
      },
    },
  },
};

type CheckoutFlowOverviewData =
  AppRouterOutput['analytics']['getCheckoutFlowOverview'];
type CheckoutSankeyGraph = CheckoutFlowOverviewData['sankey'];

interface CheckoutSankeyChartConfig {
  key: string;
  title: string;
  graph: CheckoutSankeyGraph | null | undefined;
}

interface CheckoutSankeyChartViewModel extends CheckoutSankeyChartConfig {
  rows: (string | number)[][] | null;
  minWidth: number;
}

interface CheckoutFlowOverviewProps {
  data: CheckoutFlowOverviewData | null | undefined;
  isLoading: boolean;
  isFetching?: boolean;
}

function formatInt(value: number): string {
  return value.toLocaleString();
}

function formatValue(value: unknown): string {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value ?? '0'), 10);

  return Number.isFinite(numericValue) ? formatInt(numericValue) : '0';
}

function getSankeyMinWidth(
  graph: CheckoutSankeyGraph | null | undefined,
): number {
  const nodeCount = graph?.nodes?.length ?? 0;
  if (nodeCount <= 0) return 960;
  return Math.max(960, nodeCount * 140);
}

function buildSankeyRows(
  graph: CheckoutSankeyGraph | null | undefined,
): (string | number)[][] | null {
  if (!graph?.links?.length) {
    return null;
  }

  const labelByNodeId = new Map(
    graph.nodes.map((node) => [node.id, node.label]),
  );

  return [
    ['From', 'To', 'Events'],
    ...graph.links.map((link) => [
      labelByNodeId.get(link.source) ?? link.source,
      labelByNodeId.get(link.target) ?? link.target,
      link.value,
    ]),
  ];
}

export function CheckoutFlowOverview({
  data,
  isLoading,
  isFetching = false,
}: CheckoutFlowOverviewProps) {
  const [sankeyHeight, setSankeyHeight] = useState(DEFAULT_SANKEY_HEIGHT);

  const sankeyCharts = useMemo<CheckoutSankeyChartViewModel[]>(() => {
    const chartConfigs: CheckoutSankeyChartConfig[] = [
      {
        key: 'full',
        title: 'Checkout Sankey (Full)',
        graph: data?.sankey,
      },
      {
        key: 'domain-acquisition',
        title: 'Domain Acquisition Sankey',
        graph: data?.sankeyDomainAcquisition,
      },
      {
        key: 'checkout',
        title: 'Checkout + Email Sankey',
        graph: data?.sankeyCheckout,
      },
    ];

    return chartConfigs.map((config) => ({
      ...config,
      rows: buildSankeyRows(config.graph),
      minWidth: getSankeyMinWidth(config.graph),
    }));
  }, [data?.sankey, data?.sankeyDomainAcquisition, data?.sankeyCheckout]);

  const hasFunnelData = (data?.funnel ?? []).some((point) => point.value > 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SUMMARY_SKELETON_KEYS.map((key) => (
            <Card key={key}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`sankey-skeleton-${index}`}>
              <CardHeader>
                <Skeleton className="h-5 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton
                  className="w-full"
                  style={{ height: `${DEFAULT_SANKEY_HEIGHT}px` }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent
          className="flex items-center justify-center"
          style={{ height: `${DEFAULT_SANKEY_HEIGHT}px` }}
        >
          <p className="text-muted-foreground">
            No checkout flow data available for the selected time range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Begin Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatInt(data.summary.beginSearchCount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Top-of-funnel searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Placed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatInt(data.summary.orderPlacedCount)}
            </div>
            <p className="text-xs text-muted-foreground">Checkout intent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.conversionRatePercent === null
                ? 'N/A'
                : `${data.summary.conversionRatePercent.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Order Placed / Begin Search
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.completionRatePercent === null
                ? 'N/A'
                : `${data.summary.completionRatePercent.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Success domains:{' '}
              {formatInt(data.summary.domainAcquisitionFinishedSuccessCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="relative">
          {isFetching && (
            <div className="absolute inset-0 z-10 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Updating checkout funnel...
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>Checkout Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {hasFunnelData ? (
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <RechartsTooltip
                      formatter={(value) => formatValue(value)}
                    />
                    <Funnel
                      data={data.funnel}
                      dataKey="value"
                      nameKey="label"
                      isAnimationActive={false}
                    >
                      {data.funnel.map((step, index) => (
                        <Cell
                          key={step.eventName}
                          fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(value) => formatValue(value)}
                        fill="currentColor"
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
                No funnel data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Sankey Charts</CardTitle>
            <div className="flex items-center gap-3">
              <label
                htmlFor="checkout-sankey-height"
                className="text-xs text-muted-foreground"
              >
                Chart Height
              </label>
              <input
                id="checkout-sankey-height"
                type="range"
                min={MIN_SANKEY_HEIGHT}
                max={MAX_SANKEY_HEIGHT}
                step={SANKEY_HEIGHT_STEP}
                value={sankeyHeight}
                onChange={(event) => {
                  setSankeyHeight(Number.parseInt(event.target.value, 10));
                }}
                className="w-36 accent-primary"
              />
              <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                {sankeyHeight}px
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Use horizontal scroll for wide Sankey graphs.
            </p>
          </CardContent>
        </Card>

        {sankeyCharts.map((chart) => (
          <Card key={chart.key} className="relative">
            {isFetching && (
              <div className="absolute inset-0 z-10 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Updating checkout flow...
                </div>
              </div>
            )}
            <CardHeader>
              <CardTitle>{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {chart.rows ? (
                <div className="w-full overflow-x-auto pb-2">
                  <div style={{ minWidth: `${chart.minWidth}px` }}>
                    <Chart
                      chartType="Sankey"
                      width="100%"
                      height={`${sankeyHeight}px`}
                      data={chart.rows}
                      options={sankeyOptions}
                      loader={
                        <Skeleton
                          className="w-full"
                          style={{ height: `${sankeyHeight}px` }}
                        />
                      }
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center text-sm text-muted-foreground"
                  style={{ height: `${sankeyHeight}px` }}
                >
                  No Sankey links available for this period.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.steps.map((step) => {
            return (
              <div
                key={step.eventName}
                className="rounded-md border border-border px-3 py-2 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center"
              >
                <div>
                  <p className="font-medium text-sm">{step.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {step.eventName}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums justify-self-start md:justify-self-end">
                  {formatInt(step.count)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums justify-self-start md:justify-self-end">
                  {step.conversionFromPreviousPercent === null
                    ? 'Start'
                    : `${step.conversionFromPreviousPercent.toFixed(1)}% from previous`}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
