import { Gauge } from 'prom-client';
import {
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_missing_nft_total';

const missingNftGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains present in registrar but missing NFT',
  registers: [register],
});

export async function collectDomainsInRegistrarMissingNft(
  ctx: MetricsContext,
): Promise<void> {
  const [row] = await ctx.db
    .with(namefiNftCte)
    .select({ count: sql<number>`COUNT(*)` })
    .from(indexedDomainsTable)
    .leftJoin(
      namefiNftView,
      eq(
        indexedDomainsTable.normalizedDomainName,
        namefiNftView.normalizedDomainName,
      ),
    )
    .where(
      and(
        eq(indexedDomainsTable.isMissingFromRegistrar, false),
        isNull(namefiNftView.normalizedDomainName),
      ),
    );

  missingNftGauge.set(Number(row?.count ?? 0));
}
