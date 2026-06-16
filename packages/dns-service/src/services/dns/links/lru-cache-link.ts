/**
 * In-memory LRU cache layer for DNS responses. Sits at the front of the chain
 * (the fastest layer): a hit short-circuits the resolver chain; a miss runs it
 * and caches the result for the record TTL. Eviction is configurable by entry
 * count (`maxEntries`) and/or total serialized size (`maxSizeBytes`).
 */

import { LRUCache } from 'lru-cache';
import type { DnsResponse } from '#lib/dns/types';
import type { DnsRequestLink } from '../dns-request-handler.types';
import {
  buildCacheKey,
  type CacheTtlOptions,
  cloneDnsResponse,
  isCacheableResponse,
  resolveTtlSeconds,
} from './cache-helpers';

export interface LruCacheLinkOptions extends CacheTtlOptions {
  /** Resolver-version namespace for the cache key (e.g. 'v2'). */
  namespace: string;
  /** Max number of cached entries (count-based eviction). */
  maxEntries: number;
  /**
   * Optional total size cap in bytes (size-based eviction). When set, entries
   * are sized by their serialized length and evicted once the total exceeds it.
   */
  maxSizeBytes?: number;
}

export function createLruCacheLink(
  options: LruCacheLinkOptions,
): DnsRequestLink {
  const lruOptions: LRUCache.Options<string, DnsResponse, unknown> = {
    max: options.maxEntries,
    // Default TTL ceiling; per-entry TTLs (set below) refine it per record.
    ttl: options.maxTtlSeconds * 1000,
  };
  if (options.maxSizeBytes && options.maxSizeBytes > 0) {
    lruOptions.maxSize = options.maxSizeBytes;
    lruOptions.sizeCalculation = (value) =>
      Buffer.byteLength(JSON.stringify(value)) || 1;
  }

  const cache = new LRUCache<string, DnsResponse>(lruOptions);

  return async (context, next) => {
    // Never cache mock-table responses (dev/test data must not leak across requests).
    if (context.meta.useMockDnsTable) {
      return next();
    }

    const key = buildCacheKey(options.namespace, context.question);

    const cached = cache.get(key);
    if (cached) {
      context.logger.trace({ key }, 'dns lru cache hit');
      return cloneDnsResponse(cached);
    }

    const response = await next();

    if (isCacheableResponse(response)) {
      const ttlSeconds = resolveTtlSeconds(response, options);
      if (ttlSeconds > 0) {
        cache.set(key, cloneDnsResponse(response), { ttl: ttlSeconds * 1000 });
      }
    }

    return response;
  };
}
