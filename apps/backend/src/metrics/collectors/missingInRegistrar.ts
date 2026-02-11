import { Gauge } from 'prom-client';
import {
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { eq, isNull, or, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_missing_in_registrar_total';

const missingInRegistrarGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains with NFT but missing in registrar',
  registers: [register],
});

export async function collectDomainsWithNftMissingInRegistrar(
  ctx: MetricsContext,
): Promise<void> {
  const [row] = await ctx.db
    .with(namefiNftCte)
    .select({ count: sql<number>`COUNT(*)` })
    .from(namefiNftView)
    .leftJoin(
      indexedDomainsTable,
      eq(
        indexedDomainsTable.normalizedDomainName,
        namefiNftView.normalizedDomainName,
      ),
    )
    .where(
      or(
        isNull(indexedDomainsTable.normalizedDomainName),
        eq(indexedDomainsTable.isMissingFromRegistrar, true),
      ),
    );

  missingInRegistrarGauge.set(Number(row?.count ?? 0));
}
