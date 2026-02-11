import { Gauge } from 'prom-client';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_total';

const domainsByRegistrarGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Total number of domains grouped by registrar',
  labelNames: ['registrar'],
  registers: [register],
});

export async function collectTotalDomainsByRegistrar(
  ctx: MetricsContext,
): Promise<void> {
  const rows = await ctx.db
    .select({
      registrar: indexedDomainsTable.registrarKey,
      count: sql<number>`COUNT(*)`,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false))
    .groupBy(indexedDomainsTable.registrarKey);

  domainsByRegistrarGauge.reset();

  for (const row of rows) {
    domainsByRegistrarGauge.set(
      { registrar: row.registrar },
      Number(row.count ?? 0),
    );
  }
}
