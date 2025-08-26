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
import { temporalClient } from './client';
import { freeClaimsCorrectionWorkflow } from './workflows/free-claims-correction.workflow';
import { TEMPORAL_ENUMS } from './shared';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

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
  // await temporalClient.workflow.start(freeClaimsCorrectionWorkflow, {
  //   workflowId: 'free-claims-correction-workflow',
  //   taskQueue: TEMPORAL_QUEUES.DEFAULT,
  //   args: [{
  //     campaignKey: '0xcity-promo-2025',
  //     incorrectParentDomain: '0xcity.com' as NamefiNormalizedDomain,
  //     correctParentDomain: '0x.city' as NamefiNormalizedDomain,
  //     campaignName: '0x.city 2025 Promotion',
  //   }],
  // });
  console.log('Workflow started');
}

main();
