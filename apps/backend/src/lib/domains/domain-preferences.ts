import {
  db,
  domainConfigTable,
  domainUserPreferencesTable,
  usersTable,
} from '@namefi-astra/db';
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from '@namefi-astra/common/contract/entity-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, getTableColumns } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { keys, omit, pick } from 'ramda';
import {
  DomainNotFoundError,
  getAnswerForDnsQueryFromPreferences,
  getNonUserSpecificDomainPreferencesAndConfig as getNonUserSpecificDomainPreferencesAndConfigBase,
  updateDomainConfig,
} from '@namefi-astra/dns-service/lib/domains/domain-preferences';
import { privyClient } from '../../trpc/utils';
import { logger } from '#lib/logger';

// The DNS resolution read-path now lives in @namefi-astra/dns-service. These
// are re-exported so existing `#lib/domains/domain-preferences` importers keep
// working unchanged.
export { getAnswerForDnsQueryFromPreferences, updateDomainConfig };

// #region User Preferences

/**
 * Read a user's GLOBAL preferences (autoEns / autoRenew). The `users.preferences`
 * column is NOT NULL with a backfilled default, but we still merge over
 * DEFAULT_USER_PREFERENCES so any newly added preference field is
 * forward-compatible for rows written before it existed.
 */
export const getUserDefaultDomainsPreferences = async (
  userId: string,
): Promise<UserPreferences> => {
  const [row] = await db
    .select({ preferences: usersTable.preferences })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return { ...DEFAULT_USER_PREFERENCES, ...(row?.preferences ?? {}) };
};

/**
 * Merge a partial update into a user's GLOBAL preferences and persist it.
 * Returns the resulting preferences.
 */
export const updateUserDefaultDomainsPreferences = async (
  userId: string,
  partial: Partial<UserPreferences>,
): Promise<UserPreferences> => {
  const next = {
    ...(await getUserDefaultDomainsPreferences(userId)),
    ...partial,
  };
  await db
    .update(usersTable)
    .set({ preferences: next })
    .where(eq(usersTable.id, userId));
  return next;
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

/**
 * Backend wrapper over the package read-path that restores the original
 * `TRPCError('NOT_FOUND')` contract for backend (tRPC / temporal) callers,
 * which the standalone DNS service can't depend on.
 */
export const getNonUserSpecificDomainPreferencesAndConfig = async (
  domainName: NamefiNormalizedDomain,
): Promise<Omit<DomainPreferencesAndConfig, 'autoRenewEnabled'>> => {
  try {
    return await getNonUserSpecificDomainPreferencesAndConfigBase(domainName);
  } catch (error) {
    if (error instanceof DomainNotFoundError) {
      throw new TRPCError({ code: 'NOT_FOUND', message: error.message });
    }
    throw error;
  }
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
  } catch (error) {
    logger.warn({ error }, 'Error getting user domain preferences');
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
export type UpdateDomainPreferencesAndConfig = Omit<
  Partial<typeof domainUserPreferencesTable.$inferSelect>,
  'userId' | 'normalizedDomainName' | 'id' | 'createdAt' | 'updatedAt'
> &
  Omit<
    Partial<typeof domainConfigTable.$inferSelect>,
    'normalizedDomainName' | 'id' | 'createdAt' | 'updatedAt'
  >;

/**
 * Update the domain config
 * @param domainName - The name of the domain
 * @param config - The config to update
 */
export const updateDomainPreferencesAndConfig = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
  domainPreferencesAndConfig: UpdateDomainPreferencesAndConfig,
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
