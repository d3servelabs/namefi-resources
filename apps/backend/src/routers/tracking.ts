/**
 * This is an endpoint that is used to track if a domain is served by Namefi.
 * It is used to track if a domain is served by Namefi.
 * This is used for plugins in coredns to determine if a domain is served by Namefi. and control specific behavior.
 */
import { Hono } from 'hono';
import { z } from 'zod';

import { db, namefiNftOwnersView } from '@namefi-astra/db';
import {
  fqdnLowercaseToNamefiNormalizedDomain,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { fqdnLowercaseSchema } from '@namefi-astra/zod-dns';
import { eq } from 'drizzle-orm';

import { createLogger } from '#lib/logger';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import {
  toPunycodeFqdn,
  type PunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';

const trackingRouter = new Hono();
const _logger = createLogger({ context: 'TRACKING' });

const fqdnLowercaseFromPunycodeSchema =
  fqdnLowercaseSchema as unknown as z.ZodType<string, PunycodeFqdn>;

const requestQuerySchema = z.object({
  name: z
    .string()
    .transform((name) => toPunycodeFqdn(name))
    .pipe(fqdnLowercaseFromPunycodeSchema),
});

trackingRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

trackingRouter.get('/', async (c) => {
  _logger.assign({ query: c.req.query() });

  const parsedQuery = requestQuerySchema.safeParse(c.req.query());
  if (!parsedQuery.success) {
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: `Invalid parameters. ${parsedQuery.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ')}`,
    });
  }

  let recordName: NamefiNormalizedDomain;
  try {
    recordName = fqdnLowercaseToNamefiNormalizedDomain(parsedQuery.data.name);
  } catch (err) {
    _logger.warn({ err }, 'Domain normalisation failed');
    c.status(400);
    return c.json({ error: 'Bad Request', message: (err as Error).message });
  }

  const parseResult = parseDomainName(recordName);
  if (!parseResult.valid) {
    c.status(400);
    return c.json({ error: 'Bad Request', ...parseResult });
  }
  const { publicSuffixPlusOne } = parseResult;
  const poweredByDomains = await getPoweredByNamefi3PDomains();

  const isPoweredByNamefi =
    poweredByDomains.includes(recordName) ||
    Boolean(
      publicSuffixPlusOne &&
        poweredByDomains.includes(
          publicSuffixPlusOne as NamefiNormalizedDomain,
        ),
    );

  if (isPoweredByNamefi) {
    return c.json({ served: true });
  }
  try {
    const nft = await db
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, recordName))
      .limit(1);

    if (nft[0]) {
      return c.json({ served: true });
    }

    c.status(404);
    return c.json({ served: false });
  } catch (err) {
    _logger.error({ err }, 'Error checking if domain is served by Namefi');
    c.status(500);
    return c.json({ served: false, error: 'Internal Server Error' });
  }
});

export { trackingRouter };
