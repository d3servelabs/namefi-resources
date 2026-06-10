import { db, indexedDomainsTable } from '@namefi-astra/db';
import { createRegistrarService } from '@namefi-astra/registrars/main-registrar';
import { R53RegistrarService } from '@namefi-astra/registrars/sub-registrars';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { toPunycodeDomainName } from '@namefi-astra/registrars/data/validations';

import type { AbstractRegistrarService } from '@namefi-astra/registrars/abstract-registrar/registrar-service';
import { eq, inArray } from 'drizzle-orm';
import { secrets, config } from '#lib/env';
import { createLogger, logger } from '#lib/logger';
import { Registrars } from '@namefi-astra/registrars/registrars-keys';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';

import { getCentralnicRegistrar } from './centralnic';
import { getDynadotRegistrars } from './dynadot';

// Add CentralNic if configured
export const sldRegistrar = createRegistrarService({
  registrars: (connection) => {
    const registrars: Record<Registrars, AbstractRegistrarService> = {};

    if (config.ALLOW_LIVE_REGISTRARS) {
      const { gdg, regular } = getDynadotRegistrars(connection);

      registrars[Registrars.Route53] = new R53RegistrarService({
        region: config.AWS_REGION,
        accessKeyId: secrets.AWS_ACCESS_KEY_ID,
        secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
        connection,
      });
      registrars[Registrars.DynadotGdg] = gdg;
      registrars[Registrars.DynadotRegular] = regular;
    }

    const centralnicKey = config.CENTRALNIC_KEY;
    if (centralnicKey) {
      registrars[centralnicKey] = getCentralnicRegistrar(
        centralnicKey,
        connection,
      );
    }
    return registrars;
  },
  getRegistrarKeyForExistingDomain: async (domain: NamefiNormalizedDomain) => {
    const indexedDomain = await db.query.indexedDomainsTable.findFirst({
      where: eq(indexedDomainsTable.normalizedDomainName, domain),
    });
    if (indexedDomain) {
      return indexedDomain.registrarKey;
    }
    return null;
  },
  getRegistrarKeysForExistingDomains: async (
    domains: NamefiNormalizedDomain[],
  ) => {
    try {
      const query = db.query.indexedDomainsTable.findMany({
        where: inArray(indexedDomainsTable.normalizedDomainName, domains),
      });
      const indexedDomains = await query.execute();
      //todo exclude expired domains
      return Object.fromEntries(
        indexedDomains.map((domain) => [
          toPunycodeDomainName(domain.normalizedDomainName),
          domain.registrarKey,
        ]),
      ) as Record<PunycodeDomainName, Registrars>;
    } catch (error) {
      logger.warn('error in getRegistrarKeysForExistingDomains', error);
      return {};
    }
  },
  customLogger: createLogger({ context: 'EppRegistrarsService' }),
  redisClientOptions: secrets.LIMITER_REDIS_HOST
    ? {
        host: secrets.LIMITER_REDIS_HOST,
        port: secrets.LIMITER_REDIS_PORT,
        username: secrets.LIMITER_REDIS_USER,
        password: secrets.LIMITER_REDIS_PASSWORD,
      }
    : undefined,
});
