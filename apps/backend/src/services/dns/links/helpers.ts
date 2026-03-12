import {
  db,
  dnsRecordsTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import { resolve, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import type { RecordType } from '@namefi-astra/zod-dns';
import { and, eq, sql } from 'drizzle-orm';
import { config } from '#lib/env';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import type { DnsResponse } from '#lib/dns/types';
import { createLogger } from '#lib/logger';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import type {
  DnsAnswerResolver,
  DnsQuestion,
  DnsRequestContext,
  DnsRequestLink,
} from '../dns-request-handler.types';
import { getNonUserSpecificDomainPreferencesAndConfig } from '#lib/domains/domain-preferences';

const logger = createLogger({ context: 'DNS-Request-Handler' });
export const nameserverAdminPrefixRegex = /^.*?\./;

export const DEFAULT_USE_MOCK_DNS_TABLE = false;
export const SEPARATE_ZONES_FOR_SUBDOMAINS = false;

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

export function hasAnswers(response: DnsResponse) {
  return (response.Answer?.length ?? 0) > 0;
}

export function appendAnswers(target: DnsResponse, response: DnsResponse) {
  if (!hasAnswers(response)) {
    return;
  }

  target.Answer = [...(target.Answer ?? []), ...(response.Answer ?? [])];
}

export async function getAnswerForDnsQueryFromDnsRecords(
  recordName: NamefiNormalizedDomain,
  recordType: RecordType,
): Promise<DnsResponse | null> {
  const records = await db.query.dnsRecordsTable.findMany({
    where: and(
      eq(
        sql`ARRAY_TO_STRING( ARRAY[ CASE WHEN ${dnsRecordsTable.name} = '@' THEN NULL ELSE lower(${dnsRecordsTable.name}) END, lower(${dnsRecordsTable.zoneName})], '.')`,
        recordName,
      ),
      // eq(dnsRecordsTable.type, recordType),
    ),
  });

  logger.trace({ records }, 'DNS records lookup result');

  if (records.length === 0) {
    const result = await resolve(
      getNonUserSpecificDomainPreferencesAndConfig(recordName),
    );
    if (result.success) {
      const { autoEnsEnabled, autoParkEnabled, forwardTo } = result.result;
      const hasRecords = !!forwardTo || autoEnsEnabled || autoParkEnabled;
      return { RCODE: hasRecords ? 0 : 3, Answer: [] };
    }

    return { RCODE: 3, Answer: [] };
  }

  const cnameRecord = records.find((record) => record.type === 'CNAME');
  const hasCname = !!cnameRecord;
  if (hasCname) {
    return {
      RCODE: 0,
      Answer: [
        {
          name: recordName,
          type: dnsRecordTypeCodes.get('CNAME') as number,
          TTL: cnameRecord.ttl,
          data: cnameRecord.rdata,
        },
      ],
    };
  }

  const nsRecords = records.filter((record) => record.type === 'NS');
  const hasNs = nsRecords.length > 0;
  if (hasNs) {
    return {
      RCODE: 0,
      Answer: nsRecords.map((record) => ({
        name: recordName,
        type: dnsRecordTypeCodes.get('NS') as number,
        TTL: record.ttl,
        data: record.rdata,
      })),
    };
  }

  const requestedType = records.filter((record) => record.type === recordType);
  const hasRequestedType = requestedType.length > 0;

  if (hasRequestedType) {
    return {
      RCODE: 0,
      Answer: requestedType.map((record) => ({
        name: recordName,
        type: dnsRecordTypeCodes.get(record.type) as number,
        TTL: record.ttl,
        data: record.rdata,
      })),
    };
  }

  return { RCODE: 0, Answer: [] };
}

export async function getNsAndSoaRecords(
  recordName: NamefiNormalizedDomain,
  recordType: RecordType,
): Promise<DnsResponse | null> {
  if (recordType !== 'NS' && recordType !== 'SOA') {
    logger.trace({ recordName, recordType }, 'Not returning NS or SOA records');
    return null;
  }

  const parsedDomainName = parseDomainName(recordName);
  if (
    !parsedDomainName.valid ||
    (!SEPARATE_ZONES_FOR_SUBDOMAINS &&
      parsedDomainName.registryType === 'subdomain')
  ) {
    return null;
  }

  const isPoweredByNamefi = (await getPoweredByNamefi3PDomains()).includes(
    recordName,
  );

  logger.trace({ isPoweredByNamefi, recordName }, 'Is powered by namefi?');

  if (!isPoweredByNamefi) {
    const nft = await db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, recordName))
      .limit(1);

    if (!nft[0]) {
      logger.trace({ recordName }, 'No NFT found for NS or SOA answer');
      return null;
    }

    logger.trace({ nft: nft[0], recordName }, 'NFT found for NS or SOA answer');
  }

  const nsRecords = config.NAMEFI_ASTRA_NAMESERVERS.map((nameserver) => ({
    name: recordName,
    type: dnsRecordTypeCodes.get('NS') as number,
    TTL: 300,
    data: nameserver,
  }));
  const primaryNameserver = config.NAMEFI_ASTRA_NAMESERVERS[0];
  const soaRecord = [
    {
      name: recordName,
      type: dnsRecordTypeCodes.get('SOA') as number,
      TTL: 300,
      data: `${primaryNameserver} ${primaryNameserver.replace(nameserverAdminPrefixRegex, 'admin.')} 2023080901 60 30 300 60`,
    },
  ];

  logger.trace({ recordName, recordType }, 'Returning NS or SOA records');

  return {
    RCODE: 0,
    Answer: recordType === 'NS' ? nsRecords : soaRecord,
  };
}
