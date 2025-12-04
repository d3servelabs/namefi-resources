import { Hono, type Context } from 'hono';

import { secrets } from '#lib/env';

import { createLogger } from '#lib/logger';
import { bearerAuth } from 'hono/bearer-auth';
import { getConnInfo } from '@hono/node-server/conninfo';
import { some, every } from 'hono/combine';
import { rateLimiter } from 'hono-rate-limiter';
import { getTldPricingTable } from '#lib/namefi-registry';

const publicRouter = new Hono();
const _logger = createLogger({ context: 'PUBLIC_ROUTER' });

const keyGenerator = (c: Context) => {
  const connInfo = getConnInfo(c);
  const ip = c.req.header('x-forwarded-for') ?? connInfo.remote.address ?? ''; // Example: rate limit by IP
  return ip;
};

// Apply the rate limiter middleware
publicRouter.use(
  '/',
  some(
    every(
      bearerAuth({
        token: secrets.PUBLIC_ROUTER_AUTH_KEY,
      }),
      rateLimiter({
        windowMs: 60 * 1000, // 1 minute
        limit: 100, // max 100 requests
        keyGenerator: keyGenerator,
        statusCode: 429,
        message: 'Too Many Requests',
        standardHeaders: 'draft-6',
      }),
    ),
    rateLimiter({
      windowMs: 60 * 1000, // 1 minute
      limit: 10, // max 10 requests
      keyGenerator: keyGenerator,
      standardHeaders: 'draft-6',
      statusCode: 429,
      message: 'Too Many Requests',
    }),
  ),
);

publicRouter.get('/tlds', async (c) => {
  try {
    const res = await getTldPricingTable();
    return c.json(res);
  } catch (error) {
    _logger.error('Error fetching TLD pricing table', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export { publicRouter };
