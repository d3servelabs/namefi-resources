import { db, domainConfigTable } from '@namefi-astra/db';
import { eq, ilike, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import { prepareDnsQuestion, SEPARATE_ZONES_FOR_SUBDOMAINS } from './ns-json';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import { parseDomainName } from '@namefi-astra/utils';

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
  _logger.debug('Received request');

  const [maybeResponse, question] = await prepareDnsQuestion(
    {
      name: c.req.query('name') || '',
      type: dnsRecordTypeCodes.get('ANY')?.toString() || '',
    },
    c,
  );
  if (maybeResponse) {
    return maybeResponse;
  }
  const { recordName, wildcard } = question;

  if (wildcard) {
    return c.json({
      keyOwner: '.',
      dnssecEnabled: false,
    });
  }

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

  _logger.debug({ domainConfig }, 'Domain config found');
  if (domainConfig.length > 0) {
    const { normalizedDomainName, dnssecEnabled } = domainConfig[0];
    let keyOwner = `${normalizedDomainName}.`;

    if (!SEPARATE_ZONES_FOR_SUBDOMAINS) {
      const parseResult = parseDomainName(normalizedDomainName);
      if (!parseResult.valid) {
        c.status(412);
        return c.json({
          message: 'invalid domain',
        });
      }
      if (parseResult.registryType === 'subdomain') {
        keyOwner = `${parseResult.immediateParentDomain}.`;
      }
    }

    return c.json({
      keyOwner,
      dnssecEnabled,
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
  _logger.trace(`Unhandled request: ${c.req.method} ${c.req.url}`);
  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

export { dnssecRouter };
