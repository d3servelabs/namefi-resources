// Router for NS JSON

import { db, domainConfigTable } from '@namefi-astra/db';
import { fqdnLowercaseToNamefiNormalizedDomain } from '@namefi-astra/utils';
import { fqdnLowercaseSchema } from '@namefi-astra/zod-dns';
import { eq, ilike, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { createLogger } from '#lib/logger';

const _logger = createLogger({ context: 'DNSSEC' });

const dnssecRouter = new Hono();

dnssecRouter.use(async (_c, next) => {
  _logger.assign({ context: 'DNSSEC', noindex: true });
  return next();
});

dnssecRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

interface DnssecResponse {
  keyOwner: string;
  dnssecEnabled: boolean;
}

// Define route handler for DNS API endpoint
//
// biome-ignore lint/suspicious/useAwait: <explanation>
dnssecRouter.get('/', async (c) => {
  _logger.assign({ query: c.req.query() });
  _logger.info('Received request');

  const qnameResult = fqdnLowercaseSchema.safeParse(c.req.query('name'));

  if (!qnameResult.success) {
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: `Invalid parameters, expecting name and type but got errors. ${
        qnameResult.error ? `name: ${qnameResult.error}` : ''
      }`,
    });
  }

  const qname = qnameResult.data;

  const recordName = fqdnLowercaseToNamefiNormalizedDomain(qname);

  const domainConfig = await db
    .select()
    .from(domainConfigTable)
    .where(
      or(
        ilike(
          sql`${recordName}`,
          sql`CONCAT('%.', ${domainConfigTable.normalizedDomainName})`,
        ),
        eq(domainConfigTable.normalizedDomainName, recordName),
      ),
    );

  _logger.info({ domainConfig }, 'Domain config found');
  if (domainConfig.length > 0) {
    return c.json({
      keyOwner: `${domainConfig[0].normalizedDomainName}.`,
      dnssecEnabled: domainConfig[0].dnssecEnabled,
    });
  }

  return c.json({
    keyOwner: '.',
    dnssecEnabled: false,
  });
});

// fallback route when not captured
// biome-ignore lint/suspicious/useAwait: to be added
dnssecRouter.use('/*', async (c) => {
  _logger.assign({ query: c.req.query() });
  _logger.error(`Unhandled request: ${c.req.method} ${c.req.url}`);
  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

export { dnssecRouter };
