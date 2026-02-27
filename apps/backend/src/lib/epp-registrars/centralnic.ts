import {
  db,
  namefiNftCte,
  indexedDomainsTable,
  namefiNftView,
} from '@namefi-astra/db';
import { CentralNicRegistrarService } from '@namefi-astra/registrars/registrars/sub-registrars';

import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { and, eq, isNull, or } from 'drizzle-orm';
import { secrets } from '#lib/env';
import { createLogger, logger } from '#lib/logger';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type { DomainIndexFunctions } from '@namefi-astra/registrars/registrars/centralnic/domain-index';
import { addYears } from 'date-fns';

const UnclaimedDomainsIndex = (key: Registrars) => {
  const baseQuery = db
    .with(namefiNftCte)
    .select({
      normalizedDomainName: namefiNftView.normalizedDomainName,
    })
    .from(namefiNftView)
    .leftJoin(
      indexedDomainsTable,
      eq(
        namefiNftView.normalizedDomainName,
        indexedDomainsTable.normalizedDomainName,
      ),
    )
    .$dynamic();
  const baseCondition = or(
    isNull(indexedDomainsTable.registrarKey),
    eq(indexedDomainsTable.registrarKey, key),
  );

  return {
    async addDomainsToIndex(_domains) {
      try {
        const result = await db.insert(indexedDomainsTable).values(
          _domains.map((domain) => ({
            normalizedDomainName: domain.domainName,
            registrarKey: key,
            expirationTime: domain.expirationDate ?? addYears(new Date(), 1), //TODO
          })),
        );
        logger.trace('Domains added to index:', result);
        return result.rowCount ?? 0;
      } catch (error) {
        logger.warn('Error adding domains to index:', error);
        return 0;
      }
    },
    async removeDomainsFromIndex(_domains) {
      return 1;
    },
    async updateDomainsInIndex(_domains) {
      return 1;
    },
    async listDomainsInIndex() {
      const res = await baseQuery.where(baseCondition);

      return {
        total: res.length,
        domains: res.map((row) => ({
          domainName: toPunycodeDomainName(row.normalizedDomainName),
        })),
      };
    },
    async getDomainFromIndex(domainName) {
      const res = await baseQuery
        .where(
          and(baseCondition, eq(namefiNftCte.normalizedDomainName, domainName)),
        )
        .limit(1);

      const domain = res[0];
      return domain
        ? {
            domainName: toPunycodeDomainName(domain.normalizedDomainName),
          }
        : undefined;
    },
    async domainExistsInIndex(domainName) {
      const domain = await this.getDomainFromIndex?.(domainName);
      return domain !== undefined;
    },
  } satisfies DomainIndexFunctions;
};

function getCentralnicRegistrarOte1(connection: any) {
  if (
    !secrets.CENTRALNIC_CLID ||
    !secrets.CENTRALNIC_PASS ||
    !secrets.CENTRALNIC_HOST ||
    !secrets.EPP_AUTH_GEN_PRIVATE_KEY
  ) {
    throw new Error('CentralNic credentials not set');
  }
  return new CentralNicRegistrarService({
    overrideRegistrarKey: Registrars.CentralNic_OTE_01,
    clID: secrets.CENTRALNIC_CLID,
    pw: secrets.CENTRALNIC_PASS,
    supportedTlds: CENTRALNIC_OTE_TLDS,
    tls: true,
    domainIndex: UnclaimedDomainsIndex(Registrars.CentralNic_OTE_01),
    host: secrets.CENTRALNIC_HOST,
    port: 700,
    logParsed: true,
    customLogger: createLogger({
      registrar: Registrars.CentralNic_OTE_01,
    }) as any,
    connection,
    eppAuthCodePrivateKey: secrets.EPP_AUTH_GEN_PRIVATE_KEY,
    defaultRegistrant: 'H1609236457',
    defaultContacts: [
      {
        type: 'admin',
        id: 'H1609236457',
      },
      {
        type: 'billing',
        id: 'H1609236457',
      },
      {
        type: 'tech',
        id: 'H1609236457',
      },
    ],
  });
}

function getCentralnicRegistrarOte2(connection: any) {
  if (
    !secrets.CENTRALNIC_OTE2_CLID ||
    !secrets.CENTRALNIC_OTE2_PASS ||
    !secrets.CENTRALNIC_OTE2_HOST ||
    !secrets.EPP_AUTH_GEN_PRIVATE_KEY
  ) {
    throw new Error('CentralNic OTE2 credentials not set');
  }
  return new CentralNicRegistrarService({
    overrideRegistrarKey: Registrars.CentralNic_OTE_02,
    clID: secrets.CENTRALNIC_OTE2_CLID,
    pw: secrets.CENTRALNIC_OTE2_PASS,
    supportedTlds: CENTRALNIC_OTE_TLDS,
    tls: true,
    domainIndex: UnclaimedDomainsIndex(Registrars.CentralNic_OTE_02),
    host: secrets.CENTRALNIC_OTE2_HOST,
    port: 700,
    logParsed: true,
    customLogger: createLogger({
      registrar: Registrars.CentralNic_OTE_02,
    }) as any,
    connection,
    eppAuthCodePrivateKey: secrets.EPP_AUTH_GEN_PRIVATE_KEY,
    defaultRegistrant: secrets.CENTRALNIC_OTE2_DEFAULT_REGISTRANT ?? '',
    defaultContacts: secrets.CENTRALNIC_OTE2_DEFAULT_REGISTRANT
      ? [
          { type: 'admin', id: secrets.CENTRALNIC_OTE2_DEFAULT_REGISTRANT },
          { type: 'billing', id: secrets.CENTRALNIC_OTE2_DEFAULT_REGISTRANT },
          { type: 'tech', id: secrets.CENTRALNIC_OTE2_DEFAULT_REGISTRANT },
        ]
      : undefined,
  });
}

function getCentralnicRegistrarLive(connection: any) {
  if (
    !secrets.CENTRALNIC_CLID ||
    !secrets.CENTRALNIC_PASS ||
    !secrets.CENTRALNIC_HOST ||
    !secrets.EPP_AUTH_GEN_PRIVATE_KEY
  ) {
    throw new Error('CentralNic credentials not set');
  }
  return new CentralNicRegistrarService({
    clID: secrets.CENTRALNIC_CLID,
    pw: secrets.CENTRALNIC_PASS,
    supportedTlds: ['xyz'],
    tls: true,
    domainIndex: UnclaimedDomainsIndex(Registrars.CentralNic),
    host: secrets.CENTRALNIC_HOST,
    port: 700,
    logParsed: true,
    defaultRegistrant: secrets.CENTRALNIC_DEFAULT_REGISTRANT ?? '',
    defaultContacts: secrets.CENTRALNIC_DEFAULT_REGISTRANT
      ? [
          { type: 'admin', id: secrets.CENTRALNIC_DEFAULT_REGISTRANT },
          { type: 'billing', id: secrets.CENTRALNIC_DEFAULT_REGISTRANT },
          { type: 'tech', id: secrets.CENTRALNIC_DEFAULT_REGISTRANT },
        ]
      : undefined,
    customLogger: createLogger({
      registrar: Registrars.CentralNic,
    }) as any,
    connection,
    eppAuthCodePrivateKey: secrets.EPP_AUTH_GEN_PRIVATE_KEY,
  });
}

export function getCentralnicRegistrar(key: Registrars, connection: any) {
  if (key === Registrars.CentralNic_OTE_01) {
    return getCentralnicRegistrarOte1(connection);
  }
  if (key === Registrars.CentralNic_OTE_02) {
    return getCentralnicRegistrarOte2(connection);
  }
  if (key === Registrars.CentralNic) {
    return getCentralnicRegistrarLive(connection);
  }
  throw new Error(`Unknown CentralNic key: ${key}`);
}

/**
 * Get OTE2 registrar instance for admin testing
 * This is a standalone function for use in admin routes
 */
export function getCentralnicOte2Registrar(connection?: any) {
  return getCentralnicRegistrarOte2(connection);
}
export const CENTRALNIC_OTE_TLDS = [
  'pw',
  'fm',
  'fo',
  'co.com',
  'web.in',
  'gd',
  'vg',
  'br.com',
  'cn.com',
  'eu.com',
  'gb.net',
  'uk.com',
  'uk.net',
  'us.com',
  'ru.com',
  'sa.com',
  'se.net',
  'za.com',
  'de.com',
  'jpn.com',
  'ae.org',
  'us.org',
  'gr.com',
  'com.de',
  'jp.net',
  'hu.net',
  'in.net',
  'mex.com',
  'za.bz',
  'com.se',
  'com.fm',
  'edu.fm',
  'net.fm',
  'org.fm',
  'radio.fm',
  'radio.am',
  'co.no',
  'co.nl',
  'shop.ro',
  'co.ro',
  'edu.vg',
  'edu.gd',
  'bh',
  'com.bh',
  'org.bh',
  'xn--mgbcpq6gpa1a',
  'biz.bh',
  'cc.bh',
  'edu.bh',
  'info.bh',
  'net.bh',
  'me.bh',
  'name.bh',
  'gl',
  'my',
  'co.gl',
  'com.gl',
  'edu.gl',
  'net.gl',
  'org.gl',
  'gov.gl',
  'mil.gl',
  'tel.gl',
  'com.my',
  'biz.my',
  'org.my',
  'net.my',
  'edu.my',
  'gov.my',
  'mil.my',
  'name.my',
  'coop.my',
  'smoketestcnic.ruhr',
  'eclipse',
  'eaptest1',
  'co.site',
  'my.site',
  'co.store',
  'my.store',
  'sunrise.my.store',
  '3gppnetwork.org',
  'ipxnetwork.org',
];
