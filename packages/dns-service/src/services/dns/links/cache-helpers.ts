/**
 * Shared helpers for the DNS response cache links (LRU + Redis). The cache
 * layers sit in front of the resolver chain: on a hit they short-circuit and
 * return the stored response; on a miss they run the chain and store the result
 * for the record's TTL. See `../TREE-SEMANTICS.md` for the response model.
 */

import type { DnsResponse } from '#lib/dns/types';
import type { DnsQuestion } from '../dns-request-handler.types';

const CACHE_KEY_PREFIX = 'dns-cache:v1';

const RCODE_NOERROR = 0;
const RCODE_NXDOMAIN = 3;

/**
 * Build the cache key. `namespace` distinguishes resolver versions (v2 / v2.1 /
 * v2.2) so a shared Redis cache never serves one version's answer to another.
 */
export function buildCacheKey(
  namespace: string,
  question: DnsQuestion,
): string {
  return `${CACHE_KEY_PREFIX}:${namespace}:${question.recordName}:${question.recordType}`;
}

/**
 * Only positive (NOERROR) and authoritative-negative (NXDOMAIN / NODATA)
 * answers are cacheable. Transient failures (e.g. SERVFAIL) must never be
 * cached, or a blip would stick for the whole TTL.
 */
export function isCacheableResponse(response: DnsResponse): boolean {
  const rcode = response.RCODE ?? RCODE_NOERROR;
  return rcode === RCODE_NOERROR || rcode === RCODE_NXDOMAIN;
}

export interface CacheTtlOptions {
  /** Cap for positive answers; a record's own (smaller) TTL wins. */
  maxTtlSeconds: number;
  /** TTL for negative responses (NXDOMAIN / NODATA). */
  negativeTtlSeconds: number;
}

/**
 * Resolve how long to cache a response, in seconds. Positive answers use the
 * smallest record TTL (capped by `maxTtlSeconds`); negative/empty responses use
 * `negativeTtlSeconds`. Returns 0 (i.e. "do not cache") when no positive TTL is
 * available.
 */
export function resolveTtlSeconds(
  response: DnsResponse,
  options: CacheTtlOptions,
): number {
  const answers = response.Answer ?? [];
  if (
    answers.length === 0 ||
    (response.RCODE ?? RCODE_NOERROR) === RCODE_NXDOMAIN
  ) {
    return Math.max(0, options.negativeTtlSeconds);
  }
  const minAnswerTtl = Math.min(...answers.map((answer) => answer.TTL));
  return Math.max(0, Math.min(minAnswerTtl, options.maxTtlSeconds));
}

/**
 * Deep clone so cached entries are never aliased to a response the caller may
 * mutate downstream (and vice-versa).
 */
export function cloneDnsResponse(response: DnsResponse): DnsResponse {
  return structuredClone(response);
}

/**
 * Race a promise against a timeout. Used so a slow/unreachable Redis can never
 * block DNS resolution longer than a small budget — on timeout this rejects
 * (the caller treats it as a cache miss / skipped write and resolves from
 * origin). The underlying promise keeps running in the background; the shared
 * redis client promise reuses that in-flight connect for later requests.
 * `timeoutMs <= 0` disables the guard.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    // Don't let the timer keep the process alive.
    timer.unref?.();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
