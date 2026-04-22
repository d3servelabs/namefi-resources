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
import { SEPARATE_ZONES_FOR_SUBDOMAINS } from './helpers';
import { buildNsAndSoaRecordsForZone, isRecordZoneApex } from './zone-helpers';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';

const logger = createLogger({ context: 'NS-SOA-Link' });

import type {
  DnsAnswerResolver,
  DnsQuestion,
  DnsRequestContext,
  DnsRequestLink,
} from '../dns-request-handler.types';
import { isNotNil } from 'ramda';
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

/**
 * Owns NS/SOA and negative-response Authority for Namefi-authoritative
 * (NFT / powered-by-namefi) zones — the mirror of
 * `relay-zone-authority-link.ts` but for real zones rather than the
 * synthetic relay zone.
 *
 * The link calls `next()` first so the resolver chain can answer, then on
 * unwind:
 *
 * 1. If a non-empty `Answer` came back, pass it through.
 * 2. If downstream set a non-0/non-3 RCODE (e.g. SERVFAIL), pass it
 *    through.
 * 3. Otherwise locate the authoritative zone via
 *    `getZoneNsAndSoaFromRecord` and:
 *    - For NS/SOA queries at the zone apex, synthesize the Answer.
 *    - For everything else, attach the zone SOA in Authority so that
 *      both NXDOMAIN (RCODE=3) and NODATA (RCODE=0, empty Answer)
 *      responses can be negative-cached per RFC 2308 §3.
 *
 * Contributes to the tree-semantic response described in
 * `../TREE-SEMANTICS.md`. The tree-level NXDOMAIN-vs-NODATA decision is
 * made upstream by `getAnswerForDnsQueryFromDnsRecords` in `./helpers.ts`;
 * this link only dresses the resulting response with the correct
 * Authority section.
 */
export function createZoneNsAndSoaLink(): DnsRequestLink {
  return async (context, next) => {
    const { recordName, recordType } = context.question;

    const result = await next();
    if (
      result &&
      isNotNil(result.RCODE) &&
      ((result.RCODE === 0 && !!result?.Answer?.length) ||
        (result.RCODE !== 0 && result.RCODE !== 3))
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

    // Attach zone SOA in Authority for every empty-Answer negative
    // response (NXDOMAIN *and* NODATA/ENT) — RFC 2308 §3.
    const Rcode = result?.RCODE ?? 3;
    return {
      RCODE: Rcode,
      Answer: [],
      Authority: soaRecords ?? [],
    };
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
      zone = null;
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

  const { nsRecords, soaRecords } = buildNsAndSoaRecordsForZone(zone);

  return {
    nsRecords,
    soaRecords,
    zone,
  };
}
