// this needs to be the first import
import { config, secrets } from './lib/env';
import '../global';

// other imports
import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server'; // Deno 'npm:@hono/trpc-server'
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { createLogger } from '#lib/logger';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';
import { isHostnameAllowed } from '#lib/hostname-validation';
import { dnssecRouter } from './routers/dns/v1/dnssec';
import { nsJsonRouter } from './routers/dns/v1/ns-json';
import { dnsAnalyticsGateRouter } from './routers/dns/v1/analytics-gate';
import { dnsRouter } from './routers/dns';
import { emailAnalyticsRouter } from './routers/email-analytics';
import { webhooksRouter } from './routers/webhooks';
import { availabilityRouter } from './routers/availability';
import { publicAiRouter } from './routers/public-ai';
import { c15tRouter } from './routers/c15t';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers/appRouter';
import { validateAndCreateSearchAttributes } from '#temporal/operator/search-attributes';
import { randomBytes } from 'node:crypto';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { ConnInfo } from 'hono/conninfo';
import { resolveRequestInfo, type RequestInfo } from '#lib/request-info';
import { altchaRouter } from './routers/altcha';
import { publicRouter } from './routers/public';
import { providersRouter } from './routers/openapi';
import { monitorsRouter } from './routers/monitors';
import { logLevelRouter } from './routers/log-level';
import { statsRouter } from './routers/stats';
import { tlsRouter } from './routers/tls';
import { browserLogsProxyRouter } from './routers/browser-logs-proxy';
import { validateApiKey } from './lib/validate-api-key';
import { nftIndexSchema } from '@namefi-astra/db/schemas/onchain-indexers/schema-def';
import { rdapRouter } from './routers/rdap';
import { whoisRouter } from './routers/whois';
import { x402Router } from './routers/x402';
import { mppRouter } from './routers/mpp';
import { mlsRssProxyRouter } from './routers/mls-rss-proxy';
import { llmsTxtRouter } from './routers/llms-txt';
import { auditLogsTestRouter } from './routers/audit-logs-test';

type HonoVariables = {
  requestId: string;
  connInfo: ConnInfo;
  requestInfo: RequestInfo;
};

const app = new Hono<{ Variables: HonoVariables }>();
const logger = createLogger({ module: 'index', context: 'Main' });
const DNS_RELATED_ROUTES = [
  /v1\/ns-json/,
  /v1\/dns\/tracking/,
  /v1\/tls/,
  /v1\/dnssec/,
  /dns\/.*/,
  /parking\/.*/,
  /x402/,
  /mpp/,
];
const SKIP_CORS_ROUTES = [...DNS_RELATED_ROUTES, /llms\.txt/];
const X402Headers = [
  'x-payment',
  'payment',
  'payment-required',
  'x-payment-signature',
  'payment-signature',
];

async function resolveCorsOrigin(origin: string | undefined, path: string) {
  if (config.ALLOW_ALL_ORIGINS) {
    return origin;
  }
  if (SKIP_CORS_ROUTES.some((re) => re.test(path))) {
    return origin;
  }

  const allowedHostnames: string[] = [
    ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
    ...(await getPoweredByNamefi3PHostnames()),
  ];

  if (!origin) {
    return null;
  }

  try {
    const parsedOrigin = new URL(origin);

    // Check if it's using https
    if (!config.ALLOW_HTTP && parsedOrigin.protocol !== 'https:') {
      return null;
    }

    if (isHostnameAllowed(parsedOrigin.hostname, allowedHostnames)) {
      return origin;
    }
  } catch (error) {
    logger.error(error, 'Error parsing origin');
    return null;
  }

  return null; // Block other origins
}

app.use(async (...args) => {
  return cors({
    origin: (origin) => resolveCorsOrigin(origin, args[0].req.path),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-request-id',
      'x-c15t-country',
      'x-c15t-region',
      'accept-language',
      'x-skip-auth',
      'x-browser-fingerprint',
      ...X402Headers,
    ],
    credentials: true, // Allow cookies if needed
  })(...args);
});
app.use(prettyJSON());
app.use(async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? genRequestId();
  const connInfo = getConnInfo(c);
  const requestInfo = resolveRequestInfo(c, connInfo);
  c.set('requestId', requestId);
  c.set('connInfo', connInfo);
  c.set('requestInfo', requestInfo);
  logger.assign({
    ip: requestInfo.ipAddress,
    ipSource: requestInfo.source,
    isGoogleLB: requestInfo.isGoogleLB,
    connInfo,
    requestId,
  });
  return next();
});
// app.use(pinoLoggerHono(logger as any));

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
    allowMethodOverride: true,
  }),
);

// #region legacy v1 routes deprecated
app.route('v1/ns-json', nsJsonRouter);
app.route('v1/dns/tracking', dnsAnalyticsGateRouter);
app.route('v1/dnssec', dnssecRouter);
app.route('v1/tls', tlsRouter);
// #endregion legacy v1 routes

app.route('dns', dnsRouter);
app.route('parking/v1/tls', tlsRouter);

app.route('v1/email', emailAnalyticsRouter);
app.route('v1/availability', availabilityRouter);
app.route('v1/public/ai', publicAiRouter);
app.route('v1/public', publicRouter);
app.route('v1/rdap', rdapRouter);
app.route('v1/whois', whoisRouter);
app.route('/webhooks', webhooksRouter);
app.route('/altcha', altchaRouter);
app.route('/monitors', monitorsRouter);
app.route('/stats', statsRouter);
app.route('v-next', providersRouter);
app.route('/c15t', c15tRouter);
app.route('/log-level', logLevelRouter);
app.route('/client-events', browserLogsProxyRouter);
app.route('x402', x402Router);
app.route('mpp', mppRouter);
app.route('feed/rss.xml', mlsRssProxyRouter);
app.get('mls/feed/rss.xml', (c) => c.redirect('/feed/rss.xml', 308));
app.route('llms.txt', llmsTxtRouter);
app.route('audit-logs-test', auditLogsTestRouter);

app.get('/configfi', (c) => {
  return c.json({
    ENVIRONMENT: process.env.ENVIRONMENT,
    config,
  });
});

app.get('/secretsfi', (c) => {
  const key = c.req.header('x-namefi-key') ?? c.req.query('key');
  if (!validateApiKey(key, secrets.API_AUTH_KEY)) {
    logger.warn('Unauthorized request to "/secretsfi"');
    c.status(401);
    return c.json({ error: 'Unauthorized' });
  }

  return c.json({
    ENVIRONMENT: process.env.ENVIRONMENT,
    config,
    secrets,
    nftIndex: nftIndexSchema.schemaName,
  });
});

async function main() {
  if (config.AUTO_CREATE_TEMPORAL_SEARCH_ATTRIBUTES) {
    try {
      const searchAttributesValidated =
        await validateAndCreateSearchAttributes();
      if (!searchAttributesValidated) {
        logger.warn('Temporal search attributes validation failed');
        throw new Error('Temporal search attributes validation failed');
      }
      logger.info('Temporal search attributes validated and created');
    } catch (error) {
      if (config.REQUIRE_TEMPORAL_SEARCH_ATTRIBUTES_VALIDATION) {
        logger.error(
          'Error validating and creating temporal search attributes',
          error,
        );
        throw error;
      }
      logger.warn(
        'Error validating and creating temporal search attributes',
        error,
      );
    }
  }

  serve(
    {
      fetch: app.fetch,
      port: config.PORT,
      serverOptions: {
        requestTimeout: 630_000,
        keepAliveTimeout: 610_000,
        headersTimeout: 620_000,
      },
    },
    (info) => {
      logger.info(`Server is running on port ${info.port}`);
    },
  );
}
main();

function genRequestId() {
  return `${Date.now().toString()}-${randomBytes(12).toString('base64url')}`;
}
