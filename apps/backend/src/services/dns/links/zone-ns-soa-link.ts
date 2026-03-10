import {
  db,
  dnsLabelsFromText,
  labelsExactMatch,
  namefiNftCte,
  namefiNftOwnersCte,
  namefiNftOwnersView,
  namefiNftView,
  stringArrayMatchCount,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { config } from '#lib/env';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import type { DnsResponse } from '#lib/dns/types';
import {
  SEPARATE_ZONES_FOR_SUBDOMAINS,
  nameserverAdminPrefixRegex,
} from './helpers';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';

const logger = createLogger({ context: 'NS-SOA-Link' });

import type {
  DnsAnswerResolver,
  DnsQuestion,
  DnsRequestContext,
  DnsRequestLink,
} from '../dns-request-handler.types';
import { equals, isNotNil, filter, split, pipe, isNotEmpty, both } from 'ramda';
import { createLogger } from '#lib/logger';

export interface DnsRequestLinkDependencies {
  getNsAndSoaRecords: DnsAnswerResolver;
  getAnswerFromPreferences: DnsAnswerResolver;
  getAnswerFromDnsRecords: DnsAnswerResolver;
  getAnswerFromMockTable: DnsAnswerResolver;
}

export interface CreateDefaultDnsRequestHandlerOptions {
  links?: DnsRequestLink[];
  createInitialContext?: (question: DnsQuestion) => DnsRequestContext;
  dependencies?: Partial<DnsRequestLinkDependencies>;
  useMockDnsTable?: boolean;
}

export function createZoneNsAndSoaLink(): DnsRequestLink {
  return async (context, next) => {
    const { recordName, recordType } = context.question;

    const result = await next();
    if (
      result &&
      isNotNil(result.RCODE) &&
      ((result.RCODE === 0 && !!result?.Answer?.length) || result.RCODE !== 0)
    ) {
      return result;
    }

    const nsAndSoa = await getZoneNsAndSoaFromRecord(recordName);
    context.logger.info({ recordName, nsAndSoa }, 'zone NS and SOA found');

    if (!nsAndSoa) {
      return { RCODE: 3, Answer: [] };
    }

    const { nsRecords, soaRecords, zone } = nsAndSoa;

    if (
      recordType === 'NS' &&
      isRecordZoneApex(recordName, zone) &&
      nsRecords &&
      nsRecords.length > 0
    ) {
      return {
        Answer: nsRecords,
        RCODE: 0,
      };
    }
    if (
      recordType === 'SOA' &&
      isRecordZoneApex(recordName, zone) &&
      soaRecords &&
      soaRecords.length > 0
    ) {
      return {
        Answer: soaRecords,
        RCODE: 0,
      };
    }
    return { RCODE: 3, Answer: [], Authority: soaRecords ? soaRecords : [] };
  };
}

export function createLoggingLink(): DnsRequestLink {
  return async (context, next) => {
    logger.assign({
      query: {
        name: context.question.rawName,
        type: context.question.rawType,
      },
      heartbeat: context.meta.heartbeat ? true : undefined,
    });

    return next();
  };
}

export async function getZoneNsAndSoaFromRecord(
  recordName: NamefiNormalizedDomain,
) {
  const parsedDomainName = parseDomainName(recordName);
  if (!parsedDomainName.valid) {
    return null;
  }

  const poweredByNamefiDomains = await getPoweredByNamefi3PDomains();
  const isPoweredByNamefi = poweredByNamefiDomains.includes(recordName);

  logger.trace({ isPoweredByNamefi, recordName }, 'Is powered by namefi?');

  let zone: string | null = null;
  if (isPoweredByNamefi) {
    //todo
    zone = recordName;
  } else {
    const nft = await db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, recordName))
      .limit(1);
    zone = nft[0]?.normalizedDomainName ?? null;
    if (!nft[0]) {
      logger.trace({ recordName }, 'No NFT found for NS or SOA answer');
      const matches = db.$with('matches').as((qb) =>
        qb
          .with(namefiNftCte)
          .select({
            matchCount: stringArrayMatchCount(
              dnsLabelsFromText(namefiNftView.normalizedDomainName),
              dnsLabelsFromText(recordName),
              'end',
            ).as('match_count'),
            domainLabelCount:
              sql<number>`cardinality(${dnsLabelsFromText(namefiNftView.normalizedDomainName)})`.as(
                'domain_label_count',
              ),
            exact: labelsExactMatch(
              dnsLabelsFromText(namefiNftView.normalizedDomainName),
              dnsLabelsFromText(recordName),
            ).as('exact'),
            normalizedDomainName: namefiNftView.normalizedDomainName,
          })
          .from(namefiNftView),
      );
      const res = await db
        .with(matches)
        .select()
        .from(matches)
        .where(
          and(
            gt(matches.matchCount, 1),
            eq(matches.domainLabelCount, matches.matchCount),
          ),
        )
        .orderBy(desc(matches.matchCount), desc(matches.exact))
        .limit(1);
      logger.trace({ res }, 'Zone for recordName ');
      zone = res?.[0]?.normalizedDomainName ?? null;
    }
    const parsedZoneName = zone
      ? parseDomainName(zone as NamefiNormalizedDomain)
      : null;

    if (
      parsedZoneName?.valid &&
      !SEPARATE_ZONES_FOR_SUBDOMAINS &&
      parsedZoneName.registryType === 'subdomain'
    ) {
      return null;
    }
    logger.trace({ nft: nft[0], recordName }, 'NFT found for NS or SOA answer');
  }
  if (!zone) {
    const requestFallsToPoweredByNamefiZone = poweredByNamefiDomains.find((d) =>
      recordName.endsWith(`.${d}`),
    );
    if (!requestFallsToPoweredByNamefiZone) {
      return null;
    }
    zone = requestFallsToPoweredByNamefiZone;
  }

  const { nsRecords, soaRecords } = buildNsAndSoaRecords(zone);

  return {
    nsRecords,
    soaRecords,
    zone,
  };
}

const toParts = pipe(split('.'), filter(both(isNotNil, isNotEmpty)));

const isRecordZoneApex = (
  recordName: NamefiNormalizedDomain,
  zone: string,
): boolean => {
  return equals(toParts(recordName), toParts(zone));
};

function buildNsAndSoaRecords(zone: string): {
  nsRecords: DnsResponse['Answer'];
  soaRecords: DnsResponse['Answer'];
} {
  const nsRecords = config.NAMEFI_ASTRA_NAMESERVERS.map((nameserver) => ({
    name: zone,
    type: dnsRecordTypeCodes.get('NS') as number,
    TTL: 300,
    data: nameserver,
  }));
  const primaryNameserver = config.NAMEFI_ASTRA_NAMESERVERS[0];
  const soaRecords = [
    {
      name: zone,
      type: dnsRecordTypeCodes.get('SOA') as number,
      TTL: 300,
      data: `${primaryNameserver} ${primaryNameserver.replace(nameserverAdminPrefixRegex, 'admin.')} 2023080901 60 30 300 60`,
    },
  ];
  return { nsRecords, soaRecords };
}
