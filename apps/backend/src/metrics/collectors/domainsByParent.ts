import { Gauge } from 'prom-client';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_by_parent_total';

const domainsByParentGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Total domains grouped by parent domain (tld)',
  labelNames: ['parent_domain'],
  registers: [register],
});

export async function collectTotalDomainsByParentDomain(
  ctx: MetricsContext,
): Promise<void> {
  const parentDomainExpr = sql<string>`split_part(${indexedDomainsTable.normalizedDomainName}, '.', -1)`;

  const rows = await ctx.db
    .select({
      parentDomain: parentDomainExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false))
    .groupBy(parentDomainExpr);

  domainsByParentGauge.reset();

  for (const row of rows) {
    domainsByParentGauge.set(
      { parent_domain: row.parentDomain },
      Number(row.count ?? 0),
    );
  }
}
