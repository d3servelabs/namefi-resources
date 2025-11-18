import {
  db,
  domainConfigTable,
  domainUserPreferencesTable,
  namefiNftOwnersView,
  namefiNftOwnersCte,
  usersTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { matchAny } from '@namefi-astra/utils/match';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { RecordType } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq, getTableColumns } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { isNotNil, keys, omit, pick } from 'ramda';
import { PARKED_DOMAIN_RECORDS } from '../../services/dns/parking';
import { privyClient } from '../../trpc/utils';
import { dnsRecordTypeCodes } from '../dns/record-type-codes';
import type { DnsResponse } from '../dns/types';
import { logger } from '#lib/logger';

// #region Domain Config

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

// #endregion

// #region Domain Users Preferences

/**
 * Get the user domain preferences by owner address
 * @param domainName - The name of the domain
 * @param ownerAddress - The address of the owner
 * @returns The user domain preferences
 */
const getUserSpecificDomainPreferencesByOwnerAddress = async (
  domainName: NamefiNormalizedDomain,
  ownerAddress: string,
) => {
  const privyUser = await privyClient.getUserByWalletAddress(ownerAddress);
  if (!privyUser) {
    return null;
  }
  const userDomainPreferences = await db
    .select({
      user: usersTable,
      preferences: domainUserPreferencesTable,
    })
    .from(usersTable)
    .where(eq(usersTable.privyUserId, privyUser.id))
    .innerJoin(
      domainUserPreferencesTable,
      and(
        eq(usersTable.id, domainUserPreferencesTable.userId),
        eq(domainUserPreferencesTable.normalizedDomainName, domainName),
      ),
    )
    .execute();
  return userDomainPreferences[0];
};

/**
 * Update the user domain preferences
 * @param domainName - The name of the domain
 * @param userId - The ID of the user
 * @param preferences - The preferences to update
 */
export const updateUserSpecificDomainPreferences = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
  preferences: Omit<
    Partial<typeof domainUserPreferencesTable.$inferSelect>,
    'userId' | 'normalizedDomainName' | 'id'
  >,
  tx?: PgTransaction<any, any, any>,
) => {
  await (tx ?? db)
    .insert(domainUserPreferencesTable)
    .values({
      ...preferences,
      userId: userId,
      normalizedDomainName: domainName,
    })
    .onConflictDoUpdate({
      target: [
        domainUserPreferencesTable.userId,
        domainUserPreferencesTable.normalizedDomainName,
      ],
      set: preferences,
    });
};

// #endregion

type DomainPreferencesAndConfig = {
  autoRenewEnabled: boolean;
  autoEnsEnabled: boolean;
  autoParkEnabled: boolean;
  ownerAddress: string;
  forwardTo?: string;
};

export const getNonUserSpecificDomainPreferencesAndConfig = async (
  domainName: NamefiNormalizedDomain,
): Promise<Omit<DomainPreferencesAndConfig, 'autoRenewEnabled'>> => {
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
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Domain not found',
    });
  }
  return {
    autoEnsEnabled: domainConfig?.autoEnsEnabled ?? false,
    autoParkEnabled: domainConfig?.autoParkEnabled ?? false,
    ownerAddress: nft.ownerAddress,
    forwardTo: domainConfig?.forwardTo ?? undefined,
  };
};

/**
 * Get the domain preferences
 * @param domainName - The name of the domain
 * @returns The domain preferences
 */
export const getDomainPreferencesAndConfig = async (
  domainName: NamefiNormalizedDomain,
): Promise<DomainPreferencesAndConfig> => {
  const domainConfig =
    await getNonUserSpecificDomainPreferencesAndConfig(domainName);
  logger.trace({ domainConfig }, 'Domain config');
  let userDomainPreferences: Awaited<
    ReturnType<typeof getUserSpecificDomainPreferencesByOwnerAddress>
  > | null = null;
  try {
    userDomainPreferences =
      await getUserSpecificDomainPreferencesByOwnerAddress(
        domainName,
        domainConfig.ownerAddress,
      );
    logger.trace({ userDomainPreferences }, 'User domain preferences');
  } catch (error) {
    logger.error({ error }, 'Error getting user domain preferences');
    throw error;
  }

  return {
    autoRenewEnabled:
      userDomainPreferences?.preferences.autoRenewEnabled ?? false,
    autoEnsEnabled: domainConfig.autoEnsEnabled,
    autoParkEnabled: domainConfig.autoParkEnabled,
    ownerAddress: domainConfig.ownerAddress,
    forwardTo: domainConfig.forwardTo,
  };
};

/**
 * Update the domain config
 * @param domainName - The name of the domain
 * @param config - The config to update
 */
export const updateDomainPreferencesAndConfig = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
  domainPreferencesAndConfig: Omit<
    Partial<typeof domainUserPreferencesTable.$inferSelect>,
    'userId' | 'normalizedDomainName' | 'id' | 'createdAt' | 'updatedAt'
  > &
    Omit<
      Partial<typeof domainConfigTable.$inferSelect>,
      'normalizedDomainName' | 'id' | 'createdAt' | 'updatedAt'
    >,
) => {
  const userDomainPreferencesColumns = keys(
    omit(
      ['id', 'createdAt', 'updatedAt', 'userId', 'normalizedDomainName'],
      getTableColumns(domainUserPreferencesTable),
    ),
  );
  const domainConfigColumns = keys(
    omit(
      ['id', 'createdAt', 'updatedAt', 'normalizedDomainName'],
      getTableColumns(domainConfigTable),
    ),
  );

  const userDomainPreferences = pick(
    userDomainPreferencesColumns,
    domainPreferencesAndConfig,
  );
  const domainConfig = pick(domainConfigColumns, domainPreferencesAndConfig);

  await db.transaction(async (tx) => {
    if (Object.keys(userDomainPreferences).length > 0) {
      await updateUserSpecificDomainPreferences(
        domainName,
        userId,
        userDomainPreferences,
        tx,
      );
    }
    if (Object.keys(domainConfig).length > 0) {
      await updateDomainConfig(domainName, domainConfig, tx);
    }
  });
};

/**
 * Get the DNS response for a given record name and type
 * @param recordName - The name of the DNS record
 * @param qTypeEnum - The type of the DNS record
 * @returns The DNS response
 */
export const getAnswerForDnsQueryFromPreferences = async (
  recordName: NamefiNormalizedDomain,
  qTypeEnum: RecordType,
): Promise<DnsResponse | null> => {
  logger.trace(
    { recordName, qTypeEnum },
    'getAnswerForDnsQueryFromPreferences',
  );
  const result: DnsResponse = {
    RCODE: undefined,
    Answer: [],
  };

  if (!matchAny(qTypeEnum, RecordType.A, RecordType.AAAA, RecordType.TXT)) {
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
    matchAny(qTypeEnum, RecordType.A, RecordType.AAAA)
  ) {
    logger.trace({ qTypeEnum, PARKED_DOMAIN_RECORDS }, 'PARKED_DOMAIN_RECORDS');
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
        data: `"ENS1 dnsname.ens.eth ${preferences.ownerAddress}"`,
      });
    }
    if (isNotNil(forwardTo)) {
      result.Answer?.push({
        name: recordName,
        type: dnsRecordTypeCodes.get(RecordType.TXT) as number,
        TTL: 60,
        data: `"--nfi-redirect=${forwardTo}"`,
      });
    }
  }

  return result;
};
