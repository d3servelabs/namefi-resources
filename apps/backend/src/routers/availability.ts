/**
 * This is an endpoint that is used to track if a domain is served by Namefi.
 * It is used to track if a domain is served by Namefi.
 * This is used for plugins in coredns to determine if a domain is served by Namefi. and control specific behavior.
 */
import { Hono, type Context } from 'hono';

import { secrets } from '#lib/env';

import { createLogger } from '#lib/logger';
import { bearerAuth } from 'hono/bearer-auth';
import { getConnInfo } from '@hono/node-server/conninfo';
import { some, every } from 'hono/combine';
import { rateLimiter } from 'hono-rate-limiter';
import { getDomainListInfo } from '#lib/namefi-registry';
import { z } from 'zod';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

const availabilityRouter = new Hono();
const _logger = createLogger({ context: 'AVAILABILITY' });

const keyGenerator = (c: Context) => {
  const connInfo = getConnInfo(c);
  const ip = c.req.header('x-forwarded-for') ?? connInfo.remote.address ?? ''; // Example: rate limit by IP
  return ip;
};

// Apply the rate limiter middleware
availabilityRouter.use(
  '/',
  some(
    every(
      bearerAuth({
        token: secrets.AVAILABILITY_API_AUTH_KEY,
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

const getRequestSchema = z.object({
  domain: namefiNormalizedDomainSchema,
});

availabilityRouter.get('', async (c) => {
  const parsedQuery = getRequestSchema.safeParse(c.req.query());
  if (!parsedQuery.success) {
    return c.json(
      { error: 'Bad Request', message: parsedQuery.error.message },
      400,
    );
  }
  const { domain } = parsedQuery.data;

  const res = (await getDomainListInfo([domain], null))[0];
  return c.json(res);
});

const postRequestSchema = z.object({
  domains: z.array(namefiNormalizedDomainSchema).min(1).max(200),
});

availabilityRouter.post('bulk', async (c) => {
  const parsedQuery = postRequestSchema.safeParse(c.req.json());
  if (!parsedQuery.success) {
    return c.json(
      { error: 'Bad Request', message: parsedQuery.error.message },
      400,
    );
  }
  const { domains } = parsedQuery.data;

  const res = await getDomainListInfo(domains, null);
  return c.json({ domains: res });
});

export { availabilityRouter };
