import { Gauge } from 'prom-client';
import {
  burnedNamefiNftCte,
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_expired_nft_unburned_total';

const expiredUnburnedGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains expired in registrar but NFT is still unburned',
  registers: [register],
});

export async function collectExpiredDomainsWithUnburnedNft(
  ctx: MetricsContext,
): Promise<void> {
  const [row] = await ctx.db
    .with(namefiNftCte, burnedNamefiNftCte)
    .select({ count: sql<number>`COUNT(*)` })
    .from(indexedDomainsTable)
    .innerJoin(
      namefiNftView,
      eq(
        indexedDomainsTable.normalizedDomainName,
        namefiNftView.normalizedDomainName,
      ),
    )
    .leftJoin(
      burnedNamefiNftCte,
      and(
        eq(
          burnedNamefiNftCte.normalizedDomainName,
          namefiNftView.normalizedDomainName,
        ),
        eq(burnedNamefiNftCte.chainId, namefiNftView.chainId),
      ),
    )
    .where(
      and(
        eq(indexedDomainsTable.isMissingFromRegistrar, false),
        lt(indexedDomainsTable.expirationTime, sql`NOW()`),
        isNull(burnedNamefiNftCte.normalizedDomainName),
      ),
    );

  expiredUnburnedGauge.set(Number(row?.count ?? 0));
}
