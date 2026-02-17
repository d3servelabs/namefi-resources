import { Gauge } from 'prom-client';
import {
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { eq, isNull, or, sql, not, and, inArray } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { config } from '#lib/env';

export const METRIC_NAME = 'namefi_domains_missing_in_registrar_total';

const missingInRegistrarGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains with NFT but missing in registrar',
  registers: [register],
});

export async function collectDomainsWithNftMissingInRegistrar(
  ctx: MetricsContext,
): Promise<void> {
  const poweredByNamefiDomains = [
    ...(await getPoweredByNamefi3PDomains()),
    'withharris.club',
    'withtrump.club',
    'defi.build',
  ];

  // Extract the powered-by-namefi condition to avoid repetition
  const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${namefiNftView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

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
      and(
        inArray(namefiNftView.chainId, config.ALLOWED_CHAINS),

        or(
          and(
            not(isPoweredByNamefiCondition),
            isNull(indexedDomainsTable.normalizedDomainName),
          ),
          eq(indexedDomainsTable.isMissingFromRegistrar, true),
        ),
      ),
    );

  missingInRegistrarGauge.set(Number(row?.count ?? 0));
}
