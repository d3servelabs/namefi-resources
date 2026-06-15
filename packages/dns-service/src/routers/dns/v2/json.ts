import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import {
  createDnsRequestHandlerV2,
  type CreateDefaultDnsRequestHandlerOptions,
} from '#services/dns/factory';
import type { DnsRequestHandler } from '#services/dns/dns-request-handler.types';
import { parseDnsQuestion } from '#services/dns/dns-request-question';

const logger = createLogger({ context: 'NS-JSON-HANDLER' });

export interface CreateNsJsonHandlerRouterOptions {
  dnsRequestHandler?: DnsRequestHandler;
  dnsRequestHandlerOptions?: CreateDefaultDnsRequestHandlerOptions;
}

export function createNsJsonHandlerRouter(
  options: CreateNsJsonHandlerRouterOptions = {},
) {
  const router = new Hono();
  const dnsRequestHandler =
    options.dnsRequestHandler ??
    createDnsRequestHandlerV2(options.dnsRequestHandlerOptions);

  router.use(async (_context, next) => {
    logger.assign({ context: 'NS-JSON-HANDLER', noindex: true });

    return next();
  });

  router.get('/healthz', (context) => context.json({ message: 'OK' }));

  router.get('/', async (context) => {
    logger.assign({ query: context.req.query() });

    const parseResult = parseDnsQuestion({
      name: context.req.query('name') || '',
      type: context.req.query('type') || '',
    });

    if (!parseResult.ok) {
      if (parseResult.kind === 'response') {
        return context.json(parseResult.response);
      }

      context.status(parseResult.error.statusCode);

      return context.json({
        error: 'Precondition Failed',
        message: parseResult.error.message,
      });
    }

    const response = await dnsRequestHandler.handle(parseResult.question);

    logger.trace({ response }, 'Response from dnsRequestHandler');

    return context.json(response);
  });

  router.use('/*', async (context) => {
    logger.assign({ query: context.req.query() });
    logger.trace(`Unhandled request: ${context.req.method} ${context.req.url}`);
    context.status(404);

    return context.json({
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
    });
  });

  return router;
}
