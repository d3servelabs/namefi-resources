import { Gauge } from 'prom-client';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_expired_gt_60d_total';

const expiredGt60dGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains that have been expired for more than 60 days',
  registers: [register],
});

export async function collectDomainsExpiredGreaterThan60Days(
  ctx: MetricsContext,
): Promise<void> {
  const [row] = await ctx.db
    .select({ count: sql<number>`COUNT(*)` })
    .from(indexedDomainsTable)
    .where(
      and(
        eq(indexedDomainsTable.isMissingFromRegistrar, false),
        lt(indexedDomainsTable.expirationTime, sql`NOW() - interval '60 days'`),
      ),
    );

  expiredGt60dGauge.set(Number(row?.count ?? 0));
}
