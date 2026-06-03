import type { Context, MiddlewareHandler } from 'hono';
import type { ConnInfo } from 'hono/conninfo';
import {
  RateLimiterMemory,
  RateLimiterRedis,
  type RateLimiterRes,
} from 'rate-limiter-flexible';

import { createLogger } from '#lib/logger';
import { getRedisClient } from '#lib/redis';
import type { RequestInfo } from '#lib/request-info';

const logger = createLogger({ context: 'rate-limit' });

export interface RedisRateLimitOptions {
  /** Maximum number of requests allowed per `duration` window. */
  points: number;
  /** Length of the sliding window in seconds. */
  duration: number;
  /**
   * Redis key namespace for this limiter so independent limiters do not
   * collide on the same client identifier.
   */
  keyPrefix: string;
}

type RateLimitHonoVars = {
  connInfo?: ConnInfo;
  requestInfo?: RequestInfo;
};

// TODO: Rate limit by authenticated userId (falling back to IP for anonymous
// requests) for proper per-user limits. IP-only keying is coarse: users behind
// a shared IP / NAT can exhaust each other's quota, and a single user can
// rotate IPs to bypass the limit. The OpenAPI handler resolves the user
// downstream (apiAuthResult.user), so this middleware would need access to that
// identity to key by it.
/**
 * Resolves the best-known client IP for a request, mirroring the resolution
 * order used elsewhere in the OpenAPI handler: the request-info middleware's
 * value first (Google LB / x-forwarded-for aware), then the raw connection
 * address, falling back to a shared `unknown` bucket.
 */
function resolveClientIp(c: Context): string {
  const honoVars = c.var as RateLimitHonoVars;
  return (
    honoVars.requestInfo?.ipAddress ??
    honoVars.connInfo?.remote?.address ??
    'unknown'
  );
}

function setRateLimitHeaders(
  c: Context,
  limit: number,
  res: RateLimiterRes,
): void {
  // draft-6 standard rate limit headers, matching `hono-rate-limiter` usage
  // elsewhere in the backend.
  c.header('RateLimit-Limit', String(limit));
  c.header('RateLimit-Remaining', String(Math.max(0, res.remainingPoints)));
  c.header('RateLimit-Reset', String(Math.ceil(res.msBeforeNext / 1000)));
}

/**
 * Builds a Hono middleware that rate limits requests by client IP using Redis
 * as the shared store, so the limit is enforced across all backend instances.
 *
 * The Redis limiter is created lazily on the first request once the shared
 * Redis client has connected. An in-memory `insuranceLimiter` is attached so a
 * Redis outage degrades to per-instance limiting instead of dropping
 * protection entirely (recommended by rate-limiter-flexible).
 *
 * @see https://github.com/animir/node-rate-limiter-flexible/wiki/Redis
 */
export function createRedisRateLimiter(
  options: RedisRateLimitOptions,
): MiddlewareHandler {
  const { points, duration, keyPrefix } = options;

  const insuranceLimiter = new RateLimiterMemory({
    keyPrefix: `${keyPrefix}:insurance`,
    points,
    duration,
  });

  let limiterPromise: Promise<RateLimiterRedis> | null = null;

  function getLimiter(): Promise<RateLimiterRedis> {
    if (!limiterPromise) {
      limiterPromise = getRedisClient()
        .then(
          (storeClient) =>
            new RateLimiterRedis({
              storeClient,
              // Required for the node-redis (v4+) client used by this backend.
              useRedisPackage: true,
              keyPrefix,
              points,
              duration,
              insuranceLimiter,
            }),
        )
        .catch((error) => {
          // Reset so a later request can retry connecting to Redis instead of
          // caching a rejected promise forever.
          limiterPromise = null;
          throw error;
        });
    }
    return limiterPromise;
  }

  return async (c, next) => {
    const clientIp = resolveClientIp(c);

    let limiter: RateLimiterRedis | RateLimiterMemory;
    try {
      limiter = await getLimiter();
    } catch (error) {
      // Redis is unreachable: degrade to the in-memory limiter so we still
      // enforce a per-instance limit rather than disabling protection.
      logger.warn(
        { error },
        'Redis rate limiter unavailable; falling back to in-memory limiter',
      );
      limiter = insuranceLimiter;
    }

    try {
      const res = await limiter.consume(clientIp);
      setRateLimitHeaders(c, points, res);
      return next();
    } catch (rejection) {
      if (rejection instanceof Error) {
        // Unexpected limiter fault: fail open so a limiter bug does not take
        // down the API. With `insuranceLimiter` set this should not happen.
        logger.warn(
          { error: rejection, clientIp },
          'Rate limiter error; allowing request',
        );
        return next();
      }

      const res = rejection as RateLimiterRes;
      setRateLimitHeaders(c, points, res);
      const retryAfterSeconds = Math.max(1, Math.ceil(res.msBeforeNext / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      logger.warn(
        { clientIp, msBeforeNext: res.msBeforeNext },
        'Rate limit exceeded for %s',
        clientIp,
      );
      return c.json({ error: 'Too Many Requests' }, 429);
    }
  };
}
