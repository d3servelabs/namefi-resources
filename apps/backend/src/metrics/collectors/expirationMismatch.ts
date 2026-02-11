import { Gauge } from 'prom-client';
import {
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_domains_expiration_mismatch_total';

const expirationMismatchGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Domains where registrar expiration differs from NFT expiration',
  registers: [register],
});

const DATE_MISMATCH_THRESHOLD_SECONDS = 86_400;

export async function collectDomainsWithExpirationMismatch(
  ctx: MetricsContext,
): Promise<void> {
  const mismatchExpr = sql<boolean>`ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}`;

  const [row] = await ctx.db
    .with(namefiNftCte)
    .select({ count: sql<number>`COUNT(*)` })
    .from(indexedDomainsTable)
    .innerJoin(
      namefiNftView,
      eq(
        indexedDomainsTable.normalizedDomainName,
        namefiNftView.normalizedDomainName,
      ),
    )
    .where(
      and(
        eq(indexedDomainsTable.isMissingFromRegistrar, false),
        isNotNull(indexedDomainsTable.expirationTime),
        isNotNull(namefiNftView.expirationTime),
        mismatchExpr,
      ),
    );

  expirationMismatchGauge.set(Number(row?.count ?? 0));
}
