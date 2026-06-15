// Validate DNS-service config/secrets at boot (throws if ENVIRONMENT is unset).
import '@namefi-astra/dns-service/lib/env';

import { db } from '@namefi-astra/db';
import { createLogger } from '@namefi-astra/dns-service/lib/logger';
import { invalidatePoweredByNamefi3PDomainsCache } from '@namefi-astra/dns-service/lib/namefi-registry';
import { dnsRouter } from '@namefi-astra/dns-service/routers/dns';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';

const logger = createLogger({ context: 'NS-JSON-API' });

const PORT = Number(process.env.PORT) || 8080;

const app = new Hono();

// Liveness: the process is up. Declared before `dnsRouter` so the router's
// per-version 404 handlers can't shadow it.
app.get('/healthz', (c) => c.json({ status: 'ok' }));

// Readiness: the DNS record source (Postgres) is reachable.
app.get('/readyz', async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ status: 'ready' });
  } catch (error) {
    logger.warn({ error }, 'readiness check failed');
    // Keep failure details in logs only; don't leak them to clients.
    return c.json({ status: 'unavailable' }, 503);
  }
});

// Drop the powered-by-namefi Redis cache so edits propagate without waiting out
// the TTL.
app.post('/flush-cache', async (c) => {
  const flushed = await invalidatePoweredByNamefi3PDomainsCache();
  if (!flushed) {
    return c.json({ status: 'error', message: 'cache flush failed' }, 502);
  }
  return c.json({ status: 'flushed' });
});

// DNS-over-JSON endpoints CoreDNS forwards to: /v1/json, /v2/json, /v2.1/json,
// /v2.2/json, /v1/dnssec, /v1/tracking.
app.route('/', dnsRouter);

logger.info(`ns-json-api listening on :${PORT}`);

// Bun serves the default export (https://hono.dev/docs/getting-started/bun).
export default {
  port: PORT,
  fetch: app.fetch,
};
