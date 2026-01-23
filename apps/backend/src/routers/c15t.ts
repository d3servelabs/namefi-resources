import { c15tInstance } from '@c15t/backend/v2';
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';
import { Hono } from 'hono';
import { config } from '#lib/env';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';
import { db } from '@namefi-astra/db';

const trustedOrigins = config.ALLOW_ALL_ORIGINS
  ? ['*']
  : Array.from(
      new Set([
        ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
        ...(await getPoweredByNamefi3PHostnames()),
      ]),
    );

const c15t = c15tInstance({
  appName: 'namefi-astra',
  basePath: '/c15t',
  trustedOrigins,
  adapter: drizzleAdapter({
    db,
    provider: 'postgresql',
  }),
});

export const c15tRouter = new Hono().all('*', async (c) => {
  return c15t.handler(c.req.raw);
});
