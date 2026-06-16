import { createClient } from 'redis';
import { lazyAsync } from '@namefi-astra/utils/lazy';
import { secrets } from '#lib/env';
import { logger } from './logger';

// Lazy async singleton:
//  - concurrent callers before connect share one in-flight promise,
//  - the connected client is cached and reused even when momentarily not ready
//    (redis v5 auto-reconnects on transient drops, queuing commands until it
//    recovers — rebuilding on `!isReady` would churn during normal reconnects),
//  - a REJECTED connect is never cached, so a failed connect can't poison every
//    redis consumer (rate-limit, auth, notifications, the nonce-lock, …),
//  - a TERMINAL 'end' event invalidates the singleton via the generation-guarded
//    `reset` so the NEXT caller rebuilds; the guard means a stale client's 'end'
//    can't clobber a newer cached one. Transient disconnects do NOT emit 'end'.
export const getRedisClient = lazyAsync(async (reset) => {
  const c = _createClient();
  // Log (and absorb) runtime 'error' events; the connect() rejection is what
  // signals a connection FAILURE.
  c.on('error', (err) => logger.error({ err }, '[REDIS] client error'));
  c.on('end', () => {
    logger.warn('[REDIS] client ended; clearing cached singleton');
    reset();
  });
  await c.connect();
  return c;
});

const FATAL_LOG_THROTTLE_MS = 60_000;
const lastFatalAt = new Map<string, number>();

/**
 * Report a Redis failure that occurred on a NON-CRITICAL fallback path —
 * one where the caller has already degraded to the source of truth (DB,
 * config, in-memory) and the request is being served regardless.
 *
 * Redis being down or read-only is an infra emergency worth paging on-call,
 * so it logs at `fatal`. But these paths run per-request (e.g. CORS origin
 * resolution), so an unthrottled `fatal` would page thousands of times per
 * minute during an outage. The page is therefore throttled per `scope` to
 * once per minute; in-between failures drop to `debug`. NEVER throws — by
 * the time this is called the failure has already been handled.
 */
export function logRedisFallbackFailure(
  scope: string,
  error: unknown,
  message: string,
): void {
  const now = Date.now();
  const last = lastFatalAt.get(scope) ?? 0;
  if (now - last >= FATAL_LOG_THROTTLE_MS) {
    lastFatalAt.set(scope, now);
    logger.fatal({ error, scope }, message);
  } else {
    logger.debug({ error, scope }, message);
  }
}

export interface FromCacheOrFallbackOptions<T> {
  /** Redis key to read the cached value from and write it back to. */
  key: string;
  /** TTL applied to the cached value, in seconds. */
  ttlSeconds: number;
  /**
   * The source of truth (DB, config, computation). Called on a cache miss OR
   * on ANY Redis failure. Its result is always returned; the cache is only an
   * accelerator.
   */
  fallback: () => Promise<T>;
  /**
   * Stable scope for throttled fatal logging. Defaults to `key`. Pass an
   * explicit, low-cardinality scope when `key` is per-entity (e.g. one key
   * per host/user) so the throttle map can't grow unbounded.
   */
  scope?: string;
  /** Serialize before writing to Redis. Defaults to `JSON.stringify`. */
  serialize?: (value: T) => string;
  /**
   * Deserialize a cache hit. Defaults to `JSON.parse`. Throwing here (a
   * poison entry) is treated as a miss and falls back.
   */
  deserialize?: (raw: string) => T;
}

/**
 * Cache-aside read-through that treats Redis as a NON-CRITICAL accelerator:
 * a Redis outage — unreachable, timeout, or **read-only failover** — NEVER
 * propagates to the caller. Use this for every request-path Redis read whose
 * value can be recomputed.
 *
 * Behaviour:
 * - Cache hit → deserialize and return it.
 * - Cache miss → call `fallback()`, best-effort write-back, return the value.
 * - Any Redis read error → log (throttled `fatal`) and return `fallback()`.
 * - Any Redis write error (the read-only case that caused the outage) → log
 *   (throttled `fatal`) and return the already-computed fallback value.
 *
 * Do NOT use this where Redis is the source of truth (auth nonces/sessions,
 * sign-in challenges, distributed locks) — those must surface failures.
 * See `.claude/rules/redis-fallback-only.md`.
 */
export async function fromCacheOrFallback<T>(
  options: FromCacheOrFallbackOptions<T>,
): Promise<T> {
  const {
    key,
    ttlSeconds,
    fallback,
    scope = key,
    serialize = JSON.stringify as (value: T) => string,
    deserialize = JSON.parse as (raw: string) => T,
  } = options;

  let redis: Awaited<ReturnType<typeof getRedisClient>>;
  try {
    redis = await getRedisClient();
    const cached = await redis.get(key);
    if (cached !== null && cached !== undefined) {
      return deserialize(cached);
    }
  } catch (error) {
    logRedisFallbackFailure(
      `${scope}:read`,
      error,
      `[REDIS] cache read failed for ${scope}; serving from fallback`,
    );
    return fallback();
  }

  const value = await fallback();

  // Best-effort write-back. A read-only / down Redis must NOT fail the call —
  // this is the exact failure mode that caused the 2026-06-16 CORS outage.
  try {
    await redis.set(key, serialize(value), { EX: ttlSeconds });
  } catch (error) {
    logRedisFallbackFailure(
      `${scope}:write`,
      error,
      `[REDIS] cache write failed for ${scope}; served from fallback`,
    );
  }

  return value;
}

function _createClient() {
  logger.info(`[REDIS] creating client [${new Date()}]`);
  const client = createClient({
    url: secrets.MAIN_REDIS_URL,
    socket: {
      // Bounded so a connect attempt to a down redis can't outlast the callers'
      // activity timeouts (and so a failed connect clears the cache promptly).
      connectTimeout: 10_000,
    },
  });
  logger.info(`[REDIS] created client [${new Date()}]`);
  return client;
}
