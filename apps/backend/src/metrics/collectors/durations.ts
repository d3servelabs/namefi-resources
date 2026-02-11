import { Gauge } from 'prom-client';
import { orderItemsTable, ordersTable, paymentsTable } from '@namefi-astra/db';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME_ORDER_DURATION = 'namefi_order_duration_seconds';
export const METRIC_NAME_ORDER_HANDLING_DURATION =
  'namefi_order_handling_duration_seconds';

const DURATION_BUCKETS = [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600, 1800, 3600];
const ORDER_SOURCES = ['import', 'normal'] as const;
const DURATION_SAMPLE_CACHE_KEY = 'order-duration-samples';
const DURATION_SAMPLE_TTL_MS = 60_000;

const orderDurationBucketGauge = new Gauge({
  name: `${METRIC_NAME_ORDER_DURATION}_bucket`,
  help: 'Order total duration in seconds by bucket (last 24 hours)',
  labelNames: ['source', 'le'],
  registers: [register],
});

const orderDurationSumGauge = new Gauge({
  name: `${METRIC_NAME_ORDER_DURATION}_sum`,
  help: 'Sum of order durations in seconds (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

const orderDurationCountGauge = new Gauge({
  name: `${METRIC_NAME_ORDER_DURATION}_count`,
  help: 'Count of orders included in duration stats (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

const orderHandlingBucketGauge = new Gauge({
  name: `${METRIC_NAME_ORDER_HANDLING_DURATION}_bucket`,
  help: 'Order handling duration in seconds by bucket (last 24 hours)',
  labelNames: ['source', 'le'],
  registers: [register],
});

const orderHandlingSumGauge = new Gauge({
  name: `${METRIC_NAME_ORDER_HANDLING_DURATION}_sum`,
  help: 'Sum of order handling durations in seconds (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

const orderHandlingCountGauge = new Gauge({
  name: `${METRIC_NAME_ORDER_HANDLING_DURATION}_count`,
  help: 'Count of orders included in handling duration stats (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

type DurationSample = {
  source: (typeof ORDER_SOURCES)[number];
  orderDurationSeconds: number;
  handlingDurationSeconds: number | null;
};

type BucketCounts = {
  buckets: Map<string, number>;
  count: number;
  sum: number;
};

function buildBucketCounts(values: number[]): BucketCounts {
  const bounds = [...DURATION_BUCKETS, Number.POSITIVE_INFINITY];
  const counts = new Array(bounds.length).fill(0);
  let sum = 0;
  let count = 0;

  for (const value of values) {
    if (!Number.isFinite(value) || value < 0) {
      continue;
    }
    count += 1;
    sum += value;
    for (let i = 0; i < bounds.length; i += 1) {
      if (value <= bounds[i]) {
        counts[i] += 1;
      }
    }
  }

  const bucketMap = new Map<string, number>();
  for (let i = 0; i < bounds.length; i += 1) {
    const label = Number.isFinite(bounds[i]) ? String(bounds[i]) : '+Inf';
    bucketMap.set(label, counts[i]);
  }

  return { buckets: bucketMap, count, sum };
}

function updateHistogramGauges(params: {
  bucketGauge: Gauge;
  sumGauge: Gauge;
  countGauge: Gauge;
  valuesBySource: Record<(typeof ORDER_SOURCES)[number], number[]>;
}) {
  const { bucketGauge, sumGauge, countGauge, valuesBySource } = params;
  const bucketLabels = [...DURATION_BUCKETS.map(String), '+Inf'];

  bucketGauge.reset();
  sumGauge.reset();
  countGauge.reset();

  for (const source of ORDER_SOURCES) {
    const { buckets, sum, count } = buildBucketCounts(valuesBySource[source]);
    for (const label of bucketLabels) {
      bucketGauge.set({ source, le: label }, buckets.get(label) ?? 0);
    }
    sumGauge.set({ source }, sum);
    countGauge.set({ source }, count);
  }
}

async function loadDurationSamples(
  ctx: MetricsContext,
): Promise<DurationSample[]> {
  const cached = await ctx.cache.get(DURATION_SAMPLE_CACHE_KEY);
  if (cached) {
    return cached as DurationSample[];
  }

  const sourceExpr = sql<boolean>`COALESCE(bool_or(${orderItemsTable.type} = 'IMPORT'), false)`;
  const orderFinishedAtExpr = sql<Date>`COALESCE(${ordersTable.finishedAt}, ${ordersTable.startedAt})`;
  const firstPaymentExpr = sql<Date | null>`MIN(
    CASE WHEN ${paymentsTable.status} = 'SUCCEEDED'
      THEN COALESCE(${paymentsTable.finishedAt}, ${paymentsTable.startedAt})
      ELSE NULL
    END
  )`;

  const rows = await ctx.db
    .select({
      orderId: ordersTable.id,
      startedAt: ordersTable.startedAt,
      createdAt: ordersTable.createdAt,
      effectiveFinishedAt: orderFinishedAtExpr,
      isImport: sourceExpr,
      firstPaymentAt: firstPaymentExpr,
    })
    .from(ordersTable)
    .leftJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
    .leftJoin(paymentsTable, eq(paymentsTable.orderId, ordersTable.id))
    .where(
      and(
        gte(orderFinishedAtExpr, sql`NOW() - interval '24 hours'`),
        inArray(ordersTable.status, ['SUCCEEDED', 'PARTIALLY_COMPLETED']),
      ),
    )
    .groupBy(ordersTable.id);

  const samples = rows.map<DurationSample>((row) => {
    const source: DurationSample['source'] = row.isImport ? 'import' : 'normal';
    // finishedAt can be null for legacy rows, so we fall back to startedAt.
    const orderDurationSeconds =
      (row.effectiveFinishedAt.getTime() -
        (row.startedAt ?? row.createdAt).getTime()) /
      1000;
    const handlingDurationSeconds = row.firstPaymentAt
      ? (row.effectiveFinishedAt.getTime() - row.firstPaymentAt.getTime()) /
        1000
      : null;

    return {
      source,
      orderDurationSeconds,
      handlingDurationSeconds,
    };
  });

  await ctx.cache.set(
    DURATION_SAMPLE_CACHE_KEY,
    samples,
    DURATION_SAMPLE_TTL_MS,
  );

  return samples;
}

export async function collectOrderDurationMetrics(
  ctx: MetricsContext,
): Promise<void> {
  const samples = await loadDurationSamples(ctx);
  const valuesBySource: Record<(typeof ORDER_SOURCES)[number], number[]> = {
    import: [],
    normal: [],
  };

  for (const sample of samples) {
    valuesBySource[sample.source].push(sample.orderDurationSeconds);
  }

  updateHistogramGauges({
    bucketGauge: orderDurationBucketGauge,
    sumGauge: orderDurationSumGauge,
    countGauge: orderDurationCountGauge,
    valuesBySource,
  });
}

export async function collectOrderHandlingDurationMetrics(
  ctx: MetricsContext,
): Promise<void> {
  const samples = await loadDurationSamples(ctx);
  const valuesBySource: Record<(typeof ORDER_SOURCES)[number], number[]> = {
    import: [],
    normal: [],
  };

  for (const sample of samples) {
    if (sample.handlingDurationSeconds === null) {
      continue;
    }
    valuesBySource[sample.source].push(sample.handlingDurationSeconds);
  }

  updateHistogramGauges({
    bucketGauge: orderHandlingBucketGauge,
    sumGauge: orderHandlingSumGauge,
    countGauge: orderHandlingCountGauge,
    valuesBySource,
  });
}
