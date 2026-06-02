import { c15tInstance, policyPackPresets } from '@c15t/backend';
import { drizzleAdapter } from '@c15t/backend/db/adapters/drizzle';
import { Hono } from 'hono';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';
import { db } from '@namefi-astra/db';
import {
  buildC15tInitHeaders,
  isC15tInitData,
  resolveInitialMeasurementConsent,
} from '@namefi-astra/common/google-analytics';

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
const policyPacks = [
  policyPackPresets.europeOptIn(),
  policyPackPresets.californiaOptOut(),
  policyPackPresets.quebecOptIn(),
  policyPackPresets.worldNoBanner(),
];

const c15t = c15tInstance({
  appName: 'namefi-astra',
  basePath: '/c15t',
  trustedOrigins,
  policyPacks,
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
  telemetry: { enabled: false },
  adapter: drizzleAdapter({ db, provider: 'postgresql' }),
  tablePrefix: 'c15t_',
});

export async function isC15tMeasurementConsentAutoGranted(
  requestHeaders: Headers,
): Promise<boolean> {
  try {
    const initHeaders = buildC15tInitHeaders(requestHeaders);
    if (!initHeaders) return false;

    const response = await c15t.handler(
      new Request('http://namefi.local/c15t/init', {
        method: 'GET',
        headers: initHeaders,
      }),
    );

    if (!response.ok) {
      c15tLogger.debug(
        { status: response.status },
        'c15t init returned non-OK while resolving analytics auto-grant',
      );
      return false;
    }

    const initData: unknown = await response.json();
    if (!isC15tInitData(initData)) {
      const initDataMeta =
        initData && typeof initData === 'object'
          ? {
              initDataType: 'object',
              initDataKeys: Object.keys(
                initData as Record<string, unknown>,
              ).slice(0, 20),
            }
          : { initDataType: typeof initData };
      c15tLogger.warn(
        initDataMeta,
        'c15t init returned unexpected shape while resolving analytics auto-grant',
      );
      return false;
    }

    return resolveInitialMeasurementConsent({
      initData,
      requestHasGlobalPrivacyControl: requestHeaders.get('sec-gpc') === '1',
    });
  } catch (error) {
    c15tLogger.warn(
      { error },
      'Failed to resolve c15t analytics auto-grant state',
    );
    return false;
  }
}

export const c15tRouter = new Hono().all('*', async (c) => {
  return c15t.handler(c.req.raw);
});
