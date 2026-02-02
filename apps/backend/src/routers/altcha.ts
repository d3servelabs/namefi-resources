/**
 * ALTCHA Challenge Router
 *
 * Provides endpoints for generating CAPTCHA challenges used in newsletter
 * subscription forms and other user-facing forms requiring human verification.
 *
 * Uses ALTCHA library for proof-of-work based CAPTCHA that is privacy-friendly
 * and accessible.
 */
import { Hono, type Context } from 'hono';

import { secrets } from '#lib/env';

import { createLogger } from '#lib/logger';
import { getConnInfo } from '@hono/node-server/conninfo';
import { some } from 'hono/combine';
import { rateLimiter } from 'hono-rate-limiter';
import { createChallenge } from 'altcha-lib';
import { addMinutes } from 'date-fns';

const _logger = createLogger({ context: 'ALTCHA' });

const keyGenerator = (c: Context) => {
  const connInfo = getConnInfo(c);
  const ip = c.req.header('x-forwarded-for') ?? connInfo.remote.address ?? ''; // Example: rate limit by IP
  return ip;
};

export const altchaRouter = new Hono();

// Apply the rate limiter middleware
altchaRouter.use(
  '/',
  some(
    rateLimiter({
      windowMs: 60 * 1000, // 1 minute
      limit: 10, // max 10 requests per minute
      keyGenerator: keyGenerator,
      standardHeaders: 'draft-6',
      statusCode: 429,
      message: 'Too Many Requests',
    }),
  ),
);

/**
 * GET /altcha
 *
 * Endpoint for fetching a new random challenge to be used by the ALTCHA widget
 */
altchaRouter.get('/challenge', async (c) => {
  try {
    // Generate a new random challenge with a specified complexity
    const challenge = await createChallenge({
      hmacKey: secrets.ALTCHA_HMAC_KEY,
      maxNumber: 50_000,
      expires: addMinutes(Date.now(), 2),
    });

    // Return the generated challenge as JSON (avoid caching challenges)
    return c.json(challenge, 200, { 'Cache-Control': 'no-store' });
  } catch (error: any) {
    // Handle any errors that occur during challenge creation
    _logger.error({ error }, 'ALTCHA challenge creation failed');
    return c.json({ error: 'Failed to create challenge' }, 500);
  }
});
