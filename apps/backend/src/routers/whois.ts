import { createLogger } from '#lib/logger';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { Hono } from 'hono';
import { convertRdapDomainToWhois } from '../lib/whois/rdap-to-whois';
import { lookupRdapDomain, type RdapErrorData } from './rdap';

const _logger = createLogger({ context: 'WHOIS' });

export const whoisRouter = new Hono();

whoisRouter.use(async (_c, next) => {
  _logger.assign({ context: 'WHOIS', noindex: true });
  return next();
});

whoisRouter.get('/', async (c) => {
  const rawDomain = c.req.query('domain')?.trim();
  if (!rawDomain) {
    return c.text('Missing required query parameter: domain', 400);
  }

  const domainName = validateDomain(rawDomain);
  if (!domainName) {
    return c.text(
      'Invalid domain. Provide a valid domain with at least one dot.',
      400,
    );
  }

  return resolveWhoisFromRdap(domainName);
});

whoisRouter.get('/:domain', async (c) => {
  const rawDomain = c.req.param('domain')?.trim();
  if (!rawDomain) {
    return c.text('Domain is required in path.', 400);
  }

  const domainName = validateDomain(rawDomain);
  if (!domainName) {
    return c.text(
      'Invalid domain. Provide a valid domain with at least one dot.',
      400,
    );
  }

  return resolveWhoisFromRdap(domainName);
});

whoisRouter.use('/*', async (c) => {
  return c.text('Not Found', 404);
});

function validateDomain(domainName: string) {
  try {
    const normalized = toPunycodeDomainName(domainName.toLowerCase());
    if (!normalized.includes('.')) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

async function resolveWhoisFromRdap(domainName: string) {
  const lookup = await lookupRdapDomain(domainName);
  if (!lookup.ok) {
    return mapRdapErrorToWhois(lookup.error, domainName);
  }

  const whois = convertRdapDomainToWhois(lookup.rdapDomain);
  return new Response(whois, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

function mapRdapErrorToWhois(error: RdapErrorData, domainName: string) {
  switch (error.errorCode) {
    case 400:
      return new Response(
        'Invalid domain. Provide a valid domain with at least one dot.\r\n',
        {
          status: 400,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
          },
        },
      );
    case 404:
      return new Response(`No match for "${domainName.toUpperCase()}".\r\n`, {
        status: 404,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      });
    case 503:
      return new Response('WHOIS service is temporarily unavailable.\r\n', {
        status: 503,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      });
    default:
      return new Response('WHOIS lookup failed.\r\n', {
        status: 502,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      });
  }
}
