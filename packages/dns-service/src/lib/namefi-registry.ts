import { db, type PoweredByNamefiDomainSelect } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { pluck } from 'ramda';
import superjson from 'superjson';
import { logger } from '#lib/logger';
import { getRedisClient, fromCacheOrFallback } from '#lib/redis';

/**
 * Hardcoded "powered by Namefi" parent domains. Exported so `apps/backend`
 * imports the single list rather than redeclaring it (it layers the per-row
 * config/hostname metadata on top of these names).
 */
export const HARDCODED_3P_DOMAINS_NAMES = [
  '0x.city',
  'taylor.cv',
  'ali.cv',
  'li.cv',
  'muller.cv',
  'kumar.cv',
  'victor.cv',
  'starts.today',
  'ends.today',
  'promos.today',
  'available.today',
  'discounts.today',
] as NamefiNormalizedDomain[];

/**
 * Redis key caching the full `poweredby_namefi_domains` row set. Shared
 * verbatim with `apps/backend` — both services read/write the same
 * `PoweredByNamefiDomainSelect[]` (superjson) shape under this key, so the
 * constant must stay identical to avoid cache-shape drift.
 */
export const POWERED_BY_NAMEFI_DOMAINS_CACHE_KEY = 'poweredbyNamefiDomains';

const POWERED_BY_NAMEFI_DOMAINS_CACHE_TTL_SECONDS = 12 * 60 * 60;

/**
 * Read the `poweredby_namefi_domains` rows, preferring the shared Redis cache.
 * On any Redis failure it falls back to a direct DB read so DNS resolution
 * keeps working when Redis is unavailable (the standalone ns-json-api may run
 * without Redis provisioned).
 */
const readPoweredByNamefiDomainRows = () =>
  fromCacheOrFallback({
    key: POWERED_BY_NAMEFI_DOMAINS_CACHE_KEY,
    ttlSeconds: POWERED_BY_NAMEFI_DOMAINS_CACHE_TTL_SECONDS,
    scope: 'pbn-domains',
    serialize: superjson.stringify,
    deserialize: (raw) => superjson.parse<PoweredByNamefiDomainSelect[]>(raw),
    fallback: () => db.query.poweredbyNamefiDomainsTable.findMany(),
  });

/**
 * Returns the de-duplicated set of parent-domain names served by Namefi
 * (DB rows ∪ hardcoded list). This is the only powered-by helper the DNS
 * resolution path needs; the backend keeps the richer
 * `getPoweredByNamefi3PDomainsDetails` for non-DNS callers.
 */
export const getPoweredByNamefi3PDomains = async (): Promise<
  NamefiNormalizedDomain[]
> => {
  const rows = await readPoweredByNamefiDomainRows();
  const namesFromDb = pluck(
    'normalizedDomainName',
    rows,
  ) as NamefiNormalizedDomain[];
  return Array.from(new Set([...namesFromDb, ...HARDCODED_3P_DOMAINS_NAMES]));
};

/**
 * Drops the cached powered-by-namefi row set from Redis so the next read
 * rebuilds from the database. Powers the ns-json-api `/flush-cache` endpoint.
 * Returns `true` on success and `false` (logging the error) when Redis is
 * unavailable, so the caller can report an accurate status instead of a
 * misleading success.
 */
export const invalidatePoweredByNamefi3PDomainsCache =
  async (): Promise<boolean> => {
    try {
      const redis = await getRedisClient();
      await redis.del(POWERED_BY_NAMEFI_DOMAINS_CACHE_KEY);
      return true;
    } catch (error) {
      logger.warn(
        { error },
        'Failed to invalidate powered-by-namefi Redis cache',
      );
      return false;
    }
  };
