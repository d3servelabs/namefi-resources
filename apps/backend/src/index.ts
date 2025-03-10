import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server'; // Deno 'npm:@hono/trpc-server'
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './lib/env';
import { appRouter } from './trpc/routers/appRouter';

const app = new Hono();

app.use(cors());
app.use(prettyJSON());
app.use(logger());
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
  }),
);

serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  },
);
