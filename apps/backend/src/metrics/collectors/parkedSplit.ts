import { Gauge } from 'prom-client';
import { dnsRecordsTable, indexedDomainsTable } from '@namefi-astra/db';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';
import { PARKED_DOMAIN_RECORDS } from '../../services/dns/parking';

export const METRIC_NAME = 'namefi_domains_parking_total';

const domainsByParkingGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains grouped by parking state',
  labelNames: ['parked'],
  registers: [register],
});

const PARKED_LABELS = ['true', 'false'] as const;

export async function collectDomainsByParkingState(
  ctx: MetricsContext,
): Promise<void> {
  const [parkedA, parkedAaaa] = PARKED_DOMAIN_RECORDS;

  const hasAExpr = sql<number>`SUM(
    CASE
      WHEN ${dnsRecordsTable.type} = ${parkedA.type}
        AND ${dnsRecordsTable.name} = ${parkedA.name}
        AND ${dnsRecordsTable.rdata} = ${parkedA.rdata}
        AND ${dnsRecordsTable.ttl} = ${parkedA.ttl}
      THEN 1 ELSE 0
    END
  )`;

  const hasAaaaExpr = sql<number>`SUM(
    CASE
      WHEN ${dnsRecordsTable.type} = ${parkedAaaa.type}
        AND ${dnsRecordsTable.name} = ${parkedAaaa.name}
        AND ${dnsRecordsTable.rdata} = ${parkedAaaa.rdata}
        AND ${dnsRecordsTable.ttl} = ${parkedAaaa.ttl}
      THEN 1 ELSE 0
    END
  )`;

  const parkedZonesQuery = ctx.db
    .select({ zoneName: dnsRecordsTable.zoneName })
    .from(dnsRecordsTable)
    .innerJoin(
      indexedDomainsTable,
      eq(indexedDomainsTable.normalizedDomainName, dnsRecordsTable.zoneName),
    )
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false))
    .groupBy(dnsRecordsTable.zoneName)
    .having(sql`${hasAExpr} > 0 AND ${hasAaaaExpr} > 0`)
    .as('parked_zones');

  const [parkedRow] = await ctx.db
    .select({ count: sql<number>`COUNT(*)` })
    .from(parkedZonesQuery);

  const [totalRow] = await ctx.db
    .select({ count: sql<number>`COUNT(*)` })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.isMissingFromRegistrar, false));

  const parkedCount = Number(parkedRow?.count ?? 0);
  const totalCount = Number(totalRow?.count ?? 0);
  const unparkedCount = Math.max(0, totalCount - parkedCount);

  domainsByParkingGauge.reset();
  const countsByState: Record<string, number> = {
    true: parkedCount,
    false: unparkedCount,
  };

  for (const parked of PARKED_LABELS) {
    domainsByParkingGauge.set({ parked }, countsByState[parked] ?? 0);
  }
}
