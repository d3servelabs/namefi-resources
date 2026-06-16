import { createClient } from 'redis';
import { secrets } from '#lib/env';
import { logger } from './logger';

let client: ReturnType<typeof _createClient>;
let _promise: Promise<typeof client> | undefined;

export async function getRedisClient(): Promise<typeof client> {
  if (client) return client;

  if (!_promise) {
    _promise = (async () => {
      try {
        const redisClient = _createClient();
        redisClient.on('error', (err) => {
          logger.error({ err }, '[REDIS] client error');
        });
        await redisClient.connect();
        client = redisClient;
        return client;
      } catch (err) {
        // Reset so a later call retries with a fresh connection instead of
        // reusing this rejected promise (which would permanently break access).
        _promise = undefined;
        throw err;
      }
    })();
  }
  return _promise;
}

const FATAL_LOG_THROTTLE_MS = 60_000;
const lastFatalAt = new Map<string, number>();

/**
 * Report a Redis failure on a NON-CRITICAL fallback path — one where the
 * caller has already degraded to the source of truth and is being served
 * regardless. Logs at a throttled `fatal` (once per minute per `scope`,
 * `debug` in between) so a sustained outage pages on-call once instead of
 * once per request. NEVER throws. Mirrors the backend helper of the same name.
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
   * per host) so the throttle map can't grow unbounded.
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
 * a Redis outage — unreachable, timeout, or read-only failover — NEVER
 * propagates to the caller. On a hit it returns the cached value; on a miss
 * or ANY Redis failure it returns `fallback()` and writes back best-effort.
 *
 * Do NOT use where Redis is the source of truth (auth, locks). See the
 * backend twin and `.claude/rules/redis-fallback-only.md`.
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
  if (!secrets.MAIN_REDIS_URL) {
    throw new Error(
      '[REDIS] MAIN_REDIS_URL is required to initialize the redis client',
    );
  }
  logger.info(`[REDIS] creating client [${new Date()}]`);
  const client = createClient({
    url: secrets.MAIN_REDIS_URL,
    socket: {
      connectTimeout: 300_000,
    },
  });
  logger.info(`[REDIS] created client [${new Date()}]`);
  return client;
}
