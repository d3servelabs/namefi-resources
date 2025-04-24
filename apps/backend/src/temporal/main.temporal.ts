import { initWorkers } from './workers';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from '../lib/env';
import workersRouter from './workers.router';

async function main() {
  await initWorkers();

  const app = new Hono();

  app.use(cors());
  app.use(prettyJSON());
  app.use(logger());

  app.route('/workers', workersRouter);

  serve(
    {
      fetch: app.fetch,
      port: config.TEMPORAL_WORKER_PORT,
    },
    (info) => {
      console.info('Server is running on port', info.port);
    },
  );
}

main();
