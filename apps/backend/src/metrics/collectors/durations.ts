/**
 * TotalOrderDuration: time that the order took including payment delays, from user submission till finish
 * ActualOrderProcessing: time of internal order processing with payment delays
 */
import { Gauge } from 'prom-client';
import {
  mapper,
  orderItemsTable,
  ordersTable,
  paymentsTable,
} from '@namefi-astra/db';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME_TOTAL_ORDER_DURATION =
  'namefi_total_order_duration_seconds';
export const METRIC_NAME_ACTUAL_ORDER_PROCESSING =
  'namefi_actual_order_processing_seconds';

const DURATION_BUCKETS = [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600, 1800, 3600];
const ORDER_SOURCES = ['import', 'normal'] as const;
const DURATION_SAMPLE_CACHE_KEY = 'order-duration-samples';
const DURATION_SAMPLE_TTL_MS = 60_000;

type DurationBucketRange = {
  gte: number;
  le: number;
};

const DURATION_BUCKET_RANGES: DurationBucketRange[] = [
  {
    gte: 0,
    le: DURATION_BUCKETS[0] ?? Number.POSITIVE_INFINITY,
  },
  ...DURATION_BUCKETS.slice(1).map((le, index) => ({
    gte: DURATION_BUCKETS[index] as number,
    le,
  })),
  {
    gte: DURATION_BUCKETS[DURATION_BUCKETS.length - 1] ?? 0,
    le: Number.POSITIVE_INFINITY,
  },
];

const totalOrderDurationBucketGauge = new Gauge({
  name: `${METRIC_NAME_TOTAL_ORDER_DURATION}_bucket`,
  help: 'TotalOrderDuration in seconds by range bucket (last 24 hours) (TotalOrderDuration: time that the order took including payment delays, from user submission till finish)',
  labelNames: ['source', 'gte', 'le'],
  registers: [register],
});

const totalOrderDurationSumGauge = new Gauge({
  name: `${METRIC_NAME_TOTAL_ORDER_DURATION}_sum`,
  help: 'Sum of TotalOrderDuration in seconds (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

const totalOrderDurationCountGauge = new Gauge({
  name: `${METRIC_NAME_TOTAL_ORDER_DURATION}_count`,
  help: 'Count of orders included in TotalOrderDuration stats (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

const actualOrderProcessingBucketGauge = new Gauge({
  name: `${METRIC_NAME_ACTUAL_ORDER_PROCESSING}_bucket`,
  help: 'ActualOrderProcessing in seconds by range bucket (last 24 hours) (ActualOrderProcessing: time of internal order processing with payment delays)',
  labelNames: ['source', 'gte', 'le'],
  registers: [register],
});

const actualOrderProcessingSumGauge = new Gauge({
  name: `${METRIC_NAME_ACTUAL_ORDER_PROCESSING}_sum`,
  help: 'Sum of ActualOrderProcessing in seconds (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

const actualOrderProcessingCountGauge = new Gauge({
  name: `${METRIC_NAME_ACTUAL_ORDER_PROCESSING}_count`,
  help: 'Count of orders included in ActualOrderProcessing stats (last 24 hours)',
  labelNames: ['source'],
  registers: [register],
});

type DurationSample = {
  source: (typeof ORDER_SOURCES)[number];
  totalOrderDurationSeconds: number;
  actualOrderProcessingSeconds: number | null;
};

type BucketCounts = {
  buckets: Map<string, number>;
  count: number;
  sum: number;
};

function buildBucketCounts(values: number[]): BucketCounts {
  const counts = new Array(DURATION_BUCKET_RANGES.length).fill(0);
  let sum = 0;
  let count = 0;

  for (const value of values) {
    if (!Number.isFinite(value) || value < 0) {
      continue;
    }
    count += 1;
    sum += value;
    let matchedRangeIndex = DURATION_BUCKET_RANGES.findIndex((range) => {
      if (!Number.isFinite(range.le)) {
        return value >= range.gte;
      }
      return value >= range.gte && value <= range.le;
    });

    if (matchedRangeIndex === -1) {
      matchedRangeIndex = DURATION_BUCKET_RANGES.length - 1;
    }

    counts[matchedRangeIndex] += 1;
  }

  const bucketMap = new Map<string, number>();
  for (let i = 0; i < DURATION_BUCKET_RANGES.length; i += 1) {
    const range = DURATION_BUCKET_RANGES[i];
    const gteLabel = Number.isFinite(range.gte) ? String(range.gte) : '+Inf';
    const leLabel = Number.isFinite(range.le) ? String(range.le) : '+Inf';
    bucketMap.set(`${gteLabel}:${leLabel}`, counts[i] ?? 0);
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

  bucketGauge.reset();
  sumGauge.reset();
  countGauge.reset();

  for (const source of ORDER_SOURCES) {
    const { buckets, sum, count } = buildBucketCounts(valuesBySource[source]);
    for (const range of DURATION_BUCKET_RANGES) {
      const gteLabel = Number.isFinite(range.gte) ? String(range.gte) : '+Inf';
      const leLabel = Number.isFinite(range.le) ? String(range.le) : '+Inf';
      bucketGauge.set(
        { source, gte: gteLabel, le: leLabel },
        buckets.get(`${gteLabel}:${leLabel}`) ?? 0,
      );
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
  const orderFinishedAtExpr =
    sql<Date>`COALESCE(${ordersTable.finishedAt}, ${ordersTable.startedAt})`.mapWith(
      mapper.time,
    );
  const firstPaymentExpr = sql<Date | null>`MIN(
    CASE WHEN ${paymentsTable.status} = 'SUCCEEDED'
      THEN COALESCE(${paymentsTable.finishedAt}, ${paymentsTable.startedAt})
      ELSE NULL
    END
  )`.mapWith(mapper.time);

  const rows = await ctx.db
    .select({
      orderId: ordersTable.id,
      startedAt: ordersTable.startedAt,
      createdAt: ordersTable.createdAt,
      effectiveFinishedAt: orderFinishedAtExpr.as('order_finished_at'),
      isImport: sourceExpr,
      firstPaymentAt: firstPaymentExpr.as('first_payment_date'),
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
    const totalOrderDurationSeconds =
      (row.effectiveFinishedAt.getTime() -
        (row.startedAt ?? row.createdAt).getTime()) /
      1000;
    const actualOrderProcessingSeconds = row.firstPaymentAt
      ? (row.effectiveFinishedAt.getTime() - row.firstPaymentAt.getTime()) /
        1000
      : null;

    return {
      source,
      totalOrderDurationSeconds,
      actualOrderProcessingSeconds,
    };
  });

  await ctx.cache.set(
    DURATION_SAMPLE_CACHE_KEY,
    samples,
    DURATION_SAMPLE_TTL_MS,
  );

  return samples;
}

export async function collectTotalOrderDurationMetrics(
  ctx: MetricsContext,
): Promise<void> {
  const samples = await loadDurationSamples(ctx);
  const valuesBySource: Record<(typeof ORDER_SOURCES)[number], number[]> = {
    import: [],
    normal: [],
  };

  for (const sample of samples) {
    valuesBySource[sample.source].push(sample.totalOrderDurationSeconds);
  }

  updateHistogramGauges({
    bucketGauge: totalOrderDurationBucketGauge,
    sumGauge: totalOrderDurationSumGauge,
    countGauge: totalOrderDurationCountGauge,
    valuesBySource,
  });
}

export async function collectActualOrderProcessingMetrics(
  ctx: MetricsContext,
): Promise<void> {
  const samples = await loadDurationSamples(ctx);
  const valuesBySource: Record<(typeof ORDER_SOURCES)[number], number[]> = {
    import: [],
    normal: [],
  };

  for (const sample of samples) {
    if (sample.actualOrderProcessingSeconds === null) {
      continue;
    }
    valuesBySource[sample.source].push(sample.actualOrderProcessingSeconds);
  }

  updateHistogramGauges({
    bucketGauge: actualOrderProcessingBucketGauge,
    sumGauge: actualOrderProcessingSumGauge,
    countGauge: actualOrderProcessingCountGauge,
    valuesBySource,
  });
}
