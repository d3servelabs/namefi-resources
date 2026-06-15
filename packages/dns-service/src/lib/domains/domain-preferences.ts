import {
  db,
  domainConfigTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { matchAny } from '@namefi-astra/utils/match';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { RecordType } from '@namefi-astra/zod-dns';
import { eq } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { isNotNil } from 'ramda';
import {
  dnsRecordTypeCodes,
  type DnsStringRecordTypeCode,
} from '#lib/dns/record-type-codes';
import type { DnsResponse } from '#lib/dns/types';
import { logger } from '#lib/logger';
import {
  ENS_TXT_PREFIX,
  FORWARDING_TXT_PREFIX,
  PARKED_DOMAIN_RECORDS,
} from '#services/dns/managed-records';

/**
 * Thrown when a queried domain has no Namefi NFT owner. The standalone DNS
 * service is tRPC-free, so this replaces the backend's
 * `TRPCError('NOT_FOUND')`. The backend re-export wraps it back into a
 * `TRPCError` so backend (tRPC / temporal) callers see the original type.
 */
export class DomainNotFoundError extends Error {
  constructor(message = 'Domain not found') {
    super(message);
    this.name = 'DomainNotFoundError';
  }
}

/**
 * Domain config (non-user-specific) used by the DNS resolution path. The
 * backend's richer `DomainPreferencesAndConfig` extends this with
 * `autoRenewEnabled` (user-specific, not needed for resolution).
 */
export type DomainConfigPreferences = {
  autoEnsEnabled: boolean;
  autoParkEnabled: boolean;
  ownerAddress: string;
  forwardTo?: string;
};

/**
 * Update the domain config
 * @param domainName - The name of the domain
 * @param config - The config to update
 */
export const updateDomainConfig = async (
  domainName: NamefiNormalizedDomain,
  config: Omit<
    Partial<typeof domainConfigTable.$inferSelect>,
    'normalizedDomainName' | 'id'
  >,
  tx?: PgTransaction<any, any, any>,
) => {
  await (tx ?? db)
    .insert(domainConfigTable)
    .values({
      ...config,
      normalizedDomainName: domainName,
    })
    .onConflictDoUpdate({
      target: [domainConfigTable.normalizedDomainName],
      set: config,
    });
};

export const getNonUserSpecificDomainPreferencesAndConfig = async (
  domainName: NamefiNormalizedDomain,
): Promise<DomainConfigPreferences> => {
  const [nftResult, domainConfig] = await Promise.all([
    db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, domainName))
      .limit(1),
    db.query.domainConfigTable.findFirst({
      where: eq(domainConfigTable.normalizedDomainName, domainName),
    }),
  ]);
  logger.trace({ nftResult, domainConfig }, 'NFT and domain config');
  const nft = nftResult[0];

  if (!nft) {
    throw new DomainNotFoundError();
  }
  return {
    autoEnsEnabled: domainConfig?.autoEnsEnabled ?? false,
    autoParkEnabled: domainConfig?.autoParkEnabled ?? true,
    ownerAddress: nft.ownerAddress,
    forwardTo: domainConfig?.forwardTo ?? undefined,
  };
};

/**
 * Get the DNS response for a given record name and type
 * @param recordName - The name of the DNS record
 * @param qTypeEnum - The type of the DNS record
 * @returns The DNS response
 */
export const getAnswerForDnsQueryFromPreferences = async (
  recordName: NamefiNormalizedDomain,
  qTypeEnum: DnsStringRecordTypeCode,
): Promise<DnsResponse | null> => {
  logger.trace(
    { recordName, qTypeEnum },
    'getAnswerForDnsQueryFromPreferences',
  );
  const result: DnsResponse = {
    RCODE: undefined,
    Answer: [],
  };

  if (
    !matchAny(
      qTypeEnum,
      RecordType.A,
      RecordType.AAAA,
      RecordType.TXT,
      RecordType.CAA,
    )
  ) {
    logger.trace({ qTypeEnum }, 'No match for qTypeEnum');
    return null;
  }
  const preferencesResponse = await resolve(
    getNonUserSpecificDomainPreferencesAndConfig(recordName),
  );
  logger.trace({ preferencesResponse }, 'Preferences response');
  if (!preferencesResponse.result) {
    return null;
  }

  const preferences = preferencesResponse.result;
  logger.trace({ preferences }, 'Preferences');
  const forwardToTrimmed = preferences.forwardTo?.trim();
  const forwardTo =
    isNotNil(forwardToTrimmed) && forwardToTrimmed !== ''
      ? forwardToTrimmed
      : null;
  if (
    (preferences.autoParkEnabled || isNotNil(forwardTo)) &&
    matchAny(qTypeEnum, RecordType.A, RecordType.AAAA, RecordType.CAA)
  ) {
    //Final Answer RCODE is 0
    return {
      RCODE: 0,
      Answer: PARKED_DOMAIN_RECORDS.filter((record) =>
        matchAny(record.type, qTypeEnum),
      ).map((record) => ({
        name: recordName,
        type: dnsRecordTypeCodes.get(record.type) as number,
        TTL: record.ttl,
        data: record.rdata,
      })),
    } as DnsResponse;
  }
  if (matchAny(qTypeEnum, RecordType.TXT)) {
    if (preferences.autoEnsEnabled && isNotNil(preferences.ownerAddress)) {
      result.Answer?.push({
        name: recordName,
        type: dnsRecordTypeCodes.get(RecordType.TXT) as number,
        TTL: 60,
        data: `"${ENS_TXT_PREFIX} ${preferences.ownerAddress}"`,
      });
    }
    if (isNotNil(forwardTo)) {
      result.Answer?.push({
        name: recordName,
        type: dnsRecordTypeCodes.get(RecordType.TXT) as number,
        TTL: 60,
        data: `"${FORWARDING_TXT_PREFIX}${forwardTo}"`,
      });
    }
  }

  return result;
};
