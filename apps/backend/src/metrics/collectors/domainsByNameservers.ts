import { Gauge } from 'prom-client';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_nameservers_total';

const domainsByNameserverGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains grouped by nameserver type',
  labelNames: ['nameserver_type'],
  registers: [register],
});

const NAMESERVER_TYPES = ['our', 'external'] as const;

export async function collectDomainsByNameserverType(
  ctx: MetricsContext,
): Promise<void> {
  const rows = await ctx.db
    .select({
      isUsingNamefi: indexedDomainsTable.isUsingNamefiNameservers,
      count: sql<number>`COUNT(*)`,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false))
    .groupBy(indexedDomainsTable.isUsingNamefiNameservers);

  const counts = new Map<string, number>();
  for (const row of rows) {
    const type = row.isUsingNamefi ? 'our' : 'external';
    counts.set(type, Number(row.count ?? 0));
  }

  domainsByNameserverGauge.reset();

  for (const type of NAMESERVER_TYPES) {
    domainsByNameserverGauge.set(
      { nameserver_type: type },
      counts.get(type) ?? 0,
    );
  }
}
