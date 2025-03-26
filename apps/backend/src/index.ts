import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server'; // Deno 'npm:@hono/trpc-server'
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './lib/env';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers/appRouter';

const app = new Hono();

app.use(
  cors({
    origin: (origin) => {
      if (!origin) {
        return '*'; // Allow non-browser requests
      }
      if (origin.startsWith('http://localhost')) {
        return origin; // Allow localhost
      }
      if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') {
        return origin; // Allow Vercel domain and Vercel subdomains
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

serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    console.info('Server is running on port', info.port);
  },
);
