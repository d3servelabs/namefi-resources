import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import { keyvPostgres } from '#lib/keyv';
import Keyv from 'keyv';
import { collectAll, createMetricsContext, register } from '../metrics';

const statsRouter = new Hono();
const logger = createLogger({ context: 'STATS_ROUTER' });
const statsCache = new Keyv<string>(keyvPostgres, {
  namespace: 'stats-response',
});

const STATS_CACHE_KEY = 'stats_response';
const STATS_STALE_KEY = 'stats_response_stale';
const STATS_CACHE_TTL_MS = 60_000;

statsRouter.get('/general', async (c) => {
  const cached = await statsCache.get(STATS_CACHE_KEY);
  if (cached) {
    c.header('Content-Type', register.contentType);
    return c.body(cached);
  }

  try {
    const metricsContext = {
      ...createMetricsContext(),
      log: logger,
    };

    await collectAll(metricsContext);
    const body = await register.metrics();
    await statsCache.set(STATS_CACHE_KEY, body, STATS_CACHE_TTL_MS);
    await statsCache.set(STATS_STALE_KEY, body);
    c.header('Content-Type', register.contentType);
    return c.body(body);
  } catch (error) {
    logger.error({ error }, 'Failed to render stats response');
    const stale = await statsCache.get(STATS_STALE_KEY);
    if (stale) {
      c.header('Content-Type', register.contentType);
      return c.body(stale);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export { statsRouter };
