// this needs to be the first import
import '../../global';
// other imports
import { initWorkers } from './workers';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config, secrets } from '#lib/env';
import workersRouter from './workers.router';

async function main() {
  await initWorkers();

  const app = new Hono();

  app.use(cors());
  app.use(prettyJSON());
  app.use(logger());

  app.route('/workers', workersRouter);

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
      port: config.TEMPORAL_WORKER_PORT,
    },
    (info) => {
      console.info('Server is running on port', info.port);
    },
  );
}

main();
