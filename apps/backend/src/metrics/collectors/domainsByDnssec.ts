import { Gauge } from 'prom-client';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_dnssec_total';

const domainsByDnssecGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains grouped by DNSSEC status',
  labelNames: ['dnssec'],
  registers: [register],
});

const DNSSEC_LABELS = ['enabled', 'disabled'] as const;

export async function collectDomainsByDnssecStatus(
  ctx: MetricsContext,
): Promise<void> {
  const dnssecEnabledExpr = sql<boolean>`COALESCE((${indexedDomainsTable.dnssecStatus}->>'zoneHasActiveDnssec')::boolean, false)`;

  const rows = await ctx.db
    .select({
      enabled: dnssecEnabledExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false))
    .groupBy(dnssecEnabledExpr);

  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = row.enabled ? 'enabled' : 'disabled';
    counts.set(label, Number(row.count ?? 0));
  }

  domainsByDnssecGauge.reset();
  for (const label of DNSSEC_LABELS) {
    domainsByDnssecGauge.set({ dnssec: label }, counts.get(label) ?? 0);
  }
}
