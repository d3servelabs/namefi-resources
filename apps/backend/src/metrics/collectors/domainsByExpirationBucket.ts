import { Gauge } from 'prom-client';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_expiration_bucket_total';

const domainsByExpirationBucketGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domain counts by expiration time bucket relative to now',
  labelNames: ['bucket'],
  registers: [register],
});

const EXPIRATION_BUCKETS = [
  'lt_1m',
  '1m_3m',
  '3m_6m',
  '6m_1y',
  'gte_1y',
] as const;

export async function collectDomainsByExpirationBucket(
  ctx: MetricsContext,
): Promise<void> {
  const bucketExpr = sql<string>`
    CASE
      WHEN ${indexedDomainsTable.expirationTime} < NOW() + interval '30 days'
        THEN 'lt_1m'
      WHEN ${indexedDomainsTable.expirationTime} < NOW() + interval '90 days'
        THEN '1m_3m'
      WHEN ${indexedDomainsTable.expirationTime} < NOW() + interval '180 days'
        THEN '3m_6m'
      WHEN ${indexedDomainsTable.expirationTime} < NOW() + interval '365 days'
        THEN '6m_1y'
      ELSE 'gte_1y'
    END
  `;

  const rows = await ctx.db
    .select({
      bucket: bucketExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false))
    .groupBy(bucketExpr);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.bucket, Number(row.count ?? 0));
  }

  domainsByExpirationBucketGauge.reset();
  for (const bucket of EXPIRATION_BUCKETS) {
    domainsByExpirationBucketGauge.set({ bucket }, counts.get(bucket) ?? 0);
  }
}
