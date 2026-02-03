import { Hono } from 'hono';
import { secrets } from '#lib/env';
import {
  createLogger,
  getLogLevel,
  setLogLevel,
  LOG_LEVELS,
} from '#lib/logger';

const logLevelRouter = new Hono();
const logger = createLogger({ context: 'LOG_LEVEL_ROUTER' });

logLevelRouter.get('/', (c) => {
  const key = c.req.header('x-namefi-key') ?? c.req.query('key');
  if (key !== secrets.API_AUTH_KEY) {
    logger.fatal(new Error('Unauthorized request to "/log-level"'));
    c.status(401);
    return c.json({ error: 'Unauthorized' });
  }

  return c.json({
    level: getLogLevel(),
    availableLevels: LOG_LEVELS,
  });
});

logLevelRouter.post('/', async (c) => {
  const key = c.req.header('x-namefi-key') ?? c.req.query('key');
  if (key !== secrets.API_AUTH_KEY) {
    logger.fatal(new Error('Unauthorized request to "/log-level"'));
    c.status(401);
    return c.json({ error: 'Unauthorized' });
  }

  let body: { level?: string };
  try {
    body = await c.req.json<{ level: string }>();
  } catch {
    c.status(400);
    return c.json({
      error: 'Invalid JSON in request body',
      availableLevels: LOG_LEVELS,
    });
  }

  const { level } = body;

  if (!level || typeof level !== 'string') {
    c.status(400);
    return c.json({
      error: 'Missing or invalid "level" in request body',
      availableLevels: LOG_LEVELS,
    });
  }

  const success = setLogLevel(level);
  if (!success) {
    c.status(400);
    return c.json({
      error: `Invalid log level: "${level}"`,
      availableLevels: LOG_LEVELS,
    });
  }

  logger.debug({ newLevel: level }, 'Log level changed');
  return c.json({
    success: true,
    level: getLogLevel(),
  });
});

export { logLevelRouter };
