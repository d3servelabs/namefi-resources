import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server'; // Deno 'npm:@hono/trpc-server'
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config, secrets } from './lib/env';
import { nsJsonRouter } from './ns-json';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers/appRouter';

const app = new Hono();

app.use(
  cors({
    origin: (origin) => {
      if (
        config.ALLOWED_ORIGINS?.some((allowedOrigin) =>
          new RegExp(allowedOrigin).test(origin),
        )
      ) {
        return origin;
      }

      return null; // Block other origins
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies if needed
  }),
);
app.use(prettyJSON());
app.use(logger());
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

app.route('v1/ns-json', nsJsonRouter);

app.get('/config', (c) => {
  const key = c.req.header('x-namefi-key');
  if (key !== secrets.API_AUTH_KEY) {
    c.status(401);
    return c.json({ error: 'Unauthorized' });
  }

  return c.json({
    ENVIRONMENT: process.env.ENVIRONMENT,
    config,
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
