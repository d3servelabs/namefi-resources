/**
 * This is used for on_demad_tls in caddy
 */
import { db, domainConfigTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';

const _logger = createLogger({ context: 'TLS' });

export const tlsRouter = new Hono();

tlsRouter.use(async (_c, next) => {
  _logger.assign({ context: 'TLS', noindex: true });
  return next();
});

tlsRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

tlsRouter.get('/ask', async (c) => {
  _logger.assign({ query: c.req.query() });
  _logger.debug('Received request');

  const parsedQuery = namefiNormalizedDomainSchema.safeParse(
    c.req.query('domain'),
  );
  if (!parsedQuery.success) {
    c.status(412);
    return c.json(parsedQuery.error);
  }
  const normalizedDomainName = parsedQuery.data.replace(
    /^www\./,
    '',
  ) as NamefiNormalizedDomain;
  const domainConfig = await db
    .select()
    .from(domainConfigTable)
    .where(eq(domainConfigTable.normalizedDomainName, normalizedDomainName));

  _logger.debug({ domainConfig }, 'Domain config found');
  if (domainConfig.length > 0) {
    const { autoParkEnabled, normalizedDomainName, forwardTo } =
      domainConfig[0];
    c.status(200);
    if (!(forwardTo || autoParkEnabled)) {
      c.status(400);
    }
    return c.json({
      normalizedDomainName,
      autoParkEnabled,
      forwardTo,
    });
  }

  c.status(404);
  return c.json({ message: 'Domain Not Found' });
});

// fallback route when not captured
tlsRouter.use('/*', async (c) => {
  _logger.assign({ query: c.req.query() });
  _logger.trace(`Unhandled request: ${c.req.method} ${c.req.url}`);
  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});
