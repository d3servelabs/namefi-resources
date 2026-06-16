/**
 * Redis cache layer for DNS responses. Sits behind the in-memory LRU layer (a
 * shared, cross-pod cache): a hit short-circuits the resolver chain; a miss runs
 * it and stores the result with the record TTL as the Redis expiry. All Redis
 * access is best-effort — a Redis outage degrades to resolving from origin, it
 * never fails the query.
 */

import type { DnsResponse } from '#lib/dns/types';
import { getRedisClient } from '#lib/redis';
import type { DnsRequestLink } from '../dns-request-handler.types';
import {
  buildCacheKey,
  type CacheTtlOptions,
  isCacheableResponse,
  resolveTtlSeconds,
  withTimeout,
} from './cache-helpers';

export interface RedisCacheLinkOptions extends CacheTtlOptions {
  /** Resolver-version namespace for the cache key (e.g. 'v2'). */
  namespace: string;
  /**
   * Max time (ms) to wait on a Redis read/write before giving up and resolving
   * from origin. Bounds the per-request cost when Redis is slow or unreachable
   * (the shared client's connectTimeout is minutes). <= 0 disables the guard.
   */
  timeoutMs: number;
}

export function createRedisCacheLink(
  options: RedisCacheLinkOptions,
): DnsRequestLink {
  return async (context, next) => {
    if (context.meta.useMockDnsTable) {
      return next();
    }

    const key = buildCacheKey(options.namespace, context.question);

    try {
      const raw = await withTimeout(
        (async () => (await getRedisClient()).get(key))(),
        options.timeoutMs,
        'dns redis cache read',
      );
      if (raw) {
        context.logger.trace({ key }, 'dns redis cache hit');
        return JSON.parse(raw) as DnsResponse;
      }
    } catch (error) {
      context.logger.warn({ error, key }, 'dns redis cache read failed');
    }

    const response = await next();

    if (isCacheableResponse(response)) {
      const ttlSeconds = resolveTtlSeconds(response, options);
      if (ttlSeconds > 0) {
        try {
          await withTimeout(
            (async () => {
              const redis = await getRedisClient();
              await redis.set(key, JSON.stringify(response), {
                EX: ttlSeconds,
              });
            })(),
            options.timeoutMs,
            'dns redis cache write',
          );
        } catch (error) {
          context.logger.warn({ error, key }, 'dns redis cache write failed');
        }
      }
    }

    return response;
  };
}
