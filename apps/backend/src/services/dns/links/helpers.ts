/**
 * DNS resolver helpers and the tree-semantic decision for the
 * `dns_records`-backed answer path. See `../TREE-SEMANTICS.md` for the
 * authoritative explanation of NXDOMAIN vs NODATA vs NOERROR+Answer,
 * RFC references, and how `dns_records` rows map onto tree nodes.
 *
 * In particular, `getAnswerForDnsQueryFromDnsRecords` is the single place
 * where NXDOMAIN is decided: it first looks for records AT the queried
 * node, and only declares NXDOMAIN if the node has no descendants either
 * (i.e. it is not an Empty Non-Terminal). Downstream Authority SOA
 * injection lives in `zone-ns-soa-link.ts` and
 * `relay-zone-authority-link.ts`.
 */

import {
  db,
  dnsLabelsFromText,
  dnsRecordsTable,
  isSecondDescendantOfFirst,
  labelsExactMatch,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import { resolve, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import type { DnsStringRecordTypeCode } from '#lib/dns/record-type-codes';

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
import { isNotNil } from 'ramda';

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

export function mergeResponses(
  target: DnsResponse,
  response: DnsResponse,
  { overrideRCODE }: { overrideRCODE?: boolean } = { overrideRCODE: true },
) {
  if (hasAnswers(response)) {
    target.Answer = [...(target.Answer ?? []), ...(response.Answer ?? [])];
  }
  if (isNotNil(response.RCODE) && overrideRCODE) {
    target.RCODE = response.RCODE; //TODO(): needs to account for edge cases like target.RCODE = 0 & response.RCODE = 3
  }
}

/**
 * SQL expression that yields the full FQDN of a `dns_records` row as text,
 * collapsing the `@` / empty-string apex sentinels onto the zone name.
 * Used as the input to `dns_labels_from_text` wherever we need to compare
 * a stored record against a query by tree position (see TREE-SEMANTICS.md).
 */
const dnsRecordFqdnSql = sql<string>`
  CASE
    WHEN ${dnsRecordsTable.name} IN ('@', '') THEN ${dnsRecordsTable.zoneName}
    ELSE ${dnsRecordsTable.name} || '.' || ${dnsRecordsTable.zoneName}
  END`;

/**
 * Decides NXDOMAIN vs NODATA vs NOERROR+Answer for a query against
 * `dns_records`.
 *
 * - Records AT the queried node with the requested `recordType`
 *   → `{ RCODE: 0, Answer: [...] }`.
 * - Records AT the node but of other types
 *   → `{ RCODE: 0, Answer: [] }` (NODATA on a real node).
 * - No records at the node but **descendants exist** (the name is an
 *   Empty Non-Terminal per RFC 8020)
 *   → `{ RCODE: 0, Answer: [] }` (NODATA via ENT).
 * - No records at or below the node, no managed-records fallback
 *   → `{ RCODE: 3, Answer: [] }` (NXDOMAIN).
 *
 * CNAME and NS records at the node short-circuit the type check, per
 * the existing managed-record behavior.
 *
 * See `../TREE-SEMANTICS.md` for the full model and RFC references.
 */
export async function getAnswerForDnsQueryFromDnsRecords(
  recordName: NamefiNormalizedDomain,
  recordType: DnsStringRecordTypeCode,
): Promise<DnsResponse | null> {
  const recordLabels = dnsLabelsFromText(dnsRecordFqdnSql);
  const queryLabels = dnsLabelsFromText(recordName);

  const records = await db.query.dnsRecordsTable.findMany({
    where: labelsExactMatch(recordLabels, queryLabels),
  });

  logger.trace({ records }, 'DNS records lookup result');

  if (records.length === 0) {
    // The node has no records of its own. It may still *exist* in the tree
    // as an Empty Non-Terminal if any record is stored strictly below it.
    // Checking this before emitting NXDOMAIN is RFC 8020 compliance.
    const descendantProbe = await db
      .select({ one: sql<number>`1` })
      .from(dnsRecordsTable)
      .where(isSecondDescendantOfFirst(queryLabels, recordLabels))
      .limit(1);

    if (descendantProbe.length > 0) {
      return { RCODE: 0, Answer: [] }; // NODATA via ENT.
    }

    // No records at or below the node. Fall back to the managed-records
    // flags (parking / forwarding / ENS), and only return NXDOMAIN if
    // nothing claims the name.
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

  // The node exists with records of other types; query type has no match.
  // NODATA at a real node.
  return { RCODE: 0, Answer: [] };
}

export async function getNsAndSoaRecords(
  recordName: NamefiNormalizedDomain,
  recordType: DnsStringRecordTypeCode,
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
