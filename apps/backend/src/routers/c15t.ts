import { c15tInstance } from '@c15t/backend/v2';
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';
import { Hono } from 'hono';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
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

const c15tLogger = createLogger({ component: 'c15t' });
const c15tLoggers = {
  error: c15tLogger.error.bind(c15tLogger),
  warn: c15tLogger.warn.bind(c15tLogger),
  debug: c15tLogger.debug.bind(c15tLogger),
  info: c15tLogger.info.bind(c15tLogger),
};
const c15t = c15tInstance({
  appName: 'namefi-astra',
  basePath: '/c15t',
  trustedOrigins,
  logger: {
    level: config.LOG_LEVEL,
    appName: 'namefi-astra',
    log(level, message, ...args) {
      const logFn =
        level === 'error'
          ? c15tLoggers.error
          : level === 'warn'
            ? c15tLoggers.warn
            : level === 'debug'
              ? c15tLoggers.debug
              : c15tLoggers.info;

      if (args.length === 0) {
        logFn(message);
        return;
      }

      if (args.length === 1) {
        const [arg] = args;
        if (arg instanceof Error) {
          logFn({ error: arg }, message);
          return;
        }
        if (arg && typeof arg === 'object') {
          logFn(arg as Record<string, unknown>, message);
          return;
        }
        logFn({ value: arg }, message);
        return;
      }

      logFn({ args }, message);
    },
  },
  adapter: drizzleAdapter({
    db,
    provider: 'postgresql',
  }),
});

export const c15tRouter = new Hono().all('*', async (c) => {
  return c15t.handler(c.req.raw);
});
