import { c15tInstance } from '@c15t/backend/v2';
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';
import { Hono } from 'hono';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';
import { db } from '@namefi-astra/db';
import {
  buildC15tShowConsentBannerHeaders,
  isC15tInitialBannerData,
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
  advanced: {
    telemetry: {
      disabled: true,
    },
  },
  adapter: drizzleAdapter({
    db,
    provider: 'postgresql',
  }),
});

export async function isC15tMeasurementConsentAutoGranted(
  requestHeaders: Headers,
): Promise<boolean> {
  try {
    const response = await c15t.handler(
      new Request('http://namefi.local/c15t/show-consent-banner', {
        method: 'GET',
        headers:
          buildC15tShowConsentBannerHeaders(requestHeaders) ?? new Headers(),
      }),
    );

    if (!response.ok) {
      c15tLogger.debug(
        { status: response.status },
        'c15t show-consent-banner returned non-OK while resolving analytics auto-grant',
      );
      return false;
    }

    const initialBannerData: unknown = await response.json();
    if (!isC15tInitialBannerData(initialBannerData)) {
      const bannerDataMeta =
        initialBannerData && typeof initialBannerData === 'object'
          ? {
              initialBannerDataType: 'object',
              initialBannerDataKeys: Object.keys(
                initialBannerData as Record<string, unknown>,
              ).slice(0, 20),
            }
          : { initialBannerDataType: typeof initialBannerData };
      c15tLogger.warn(
        bannerDataMeta,
        'c15t show-consent-banner returned unexpected shape while resolving analytics auto-grant',
      );
      return false;
    }

    return resolveInitialMeasurementConsent({ initialBannerData });
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
