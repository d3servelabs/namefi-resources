import { Gauge } from 'prom-client';
import {
  indexedDomainsTable,
  committedNamefiNftCte,
  committedNamefiNftView,
} from '@namefi-astra/db';
import { and, eq, isNull, sql, inArray } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';
import { getAllowedChainsForNft } from '#lib/env/allowed-chains';

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
    .with(committedNamefiNftCte)
    .select({ count: sql<number>`COUNT(*)` })
    .from(indexedDomainsTable)
    .leftJoin(
      committedNamefiNftView,
      eq(
        indexedDomainsTable.normalizedDomainName,
        committedNamefiNftView.normalizedDomainName,
      ),
    )
    .where(
      and(
        inArray(committedNamefiNftView.chainId, getAllowedChainsForNft()),
        eq(indexedDomainsTable.isMissingFromRegistrar, false),
        isNull(committedNamefiNftView.normalizedDomainName),
      ),
    );

  missingNftGauge.set(Number(row?.count ?? 0));
}
