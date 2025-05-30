import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server'; // Deno 'npm:@hono/trpc-server'
import { Hono } from 'hono';
import { pinoLogger as pinoLoggerHono } from 'hono-pino-logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from '#lib/logger';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';
import { dnssecRouter } from './dnssec';
import { config, secrets } from './lib/env';
import { nsJsonRouter } from './ns-json';
import { webhooksRouter } from './routers/webhooks';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers/appRouter';

const app = new Hono();

app.use(async (...args) => {
  const allowedHostnames: string[] = [
    ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
    ...(await getPoweredByNamefi3PHostnames()),
  ];

  return cors({
    origin: (origin) => {
      if (config.ALLOW_ALL_ORIGINS) {
        return origin;
      }

      if (origin) {
        try {
          const parsedOrigin = new URL(origin);

          // Check if it's using https
          if (!config.ALLOW_HTTP && parsedOrigin.protocol !== 'https:') {
            return null;
          }

          if (
            allowedHostnames.includes(parsedOrigin.hostname) ||
            allowedHostnames.includes(
              config.ADDITIONAL_HOSTNAME_MAP[parsedOrigin.hostname],
            )
          ) {
            return origin;
          }
        } catch (error) {
          console.error('Error parsing origin', error);
          return null;
        }
      }
      return null; // Block other origins
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies if needed
  })(...args);
});
app.use(prettyJSON());
app.use(pinoLoggerHono(logger));
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

app.route('v1/ns-json', nsJsonRouter);
app.route('v1/dnssec', dnssecRouter);
app.route('/webhooks', webhooksRouter);

app.get('/configfi', (c) => {
  return c.json({
    ENVIRONMENT: process.env.ENVIRONMENT,
    config,
  });
});

app.get('/secretsfi', (c) => {
  const key = c.req.header('x-namefi-key') ?? c.req.query('key');
  if (key !== secrets.API_AUTH_KEY) {
    c.status(401);
    return c.json({ error: 'Unauthorized' });
  }

  return c.json({
    ENVIRONMENT: process.env.ENVIRONMENT,
    config,
    secrets,
  });
});

serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    console.info('Server is running on port', info.port);
  },
);
