import {
  db,
  committedNamefiNftCte,
  committedNamefiNftView,
} from '@namefi-astra/db';
import { userContactsTable, usersTable } from '@namefi-astra/db/schema';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';
import type { User as PrivyUser } from '@privy-io/server-auth';
import { fromPairs, isNil, isNotNil, uniqBy } from 'ramda';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from '../../services/admin/privy-user-cache';
import * as workflow from '@temporalio/workflow';
import * as changeKeys from 'change-case/keys';

type LinkedAccountInput = Parameters<
  typeof privyClient.importUser
>[0]['linkedAccounts'];

const _logger = createLogger({ module: 'legacy-users-import-activities' });

export async function preparePrivyUserAccounts(
  walletAddresses: string[],
  primaryEmail?: string,
) {
  // check if user already exists for wallet address
  const existingUserByWallets = fromPairs(
    await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        const user = await privyClient.getUserByWalletAddress(walletAddress);
        return [walletAddress, user];
      }),
    ),
  );

  _logger.debug(`Creating/finding Privy user for wallets: ${walletAddresses}`);
  const newWalletAddresses = walletAddresses.filter(
    (walletAddress) => !existingUserByWallets[walletAddress],
  );
  const existingPrivyIds = Object.values(existingUserByWallets)
    .map((user) => user?.id)
    .filter(isNotNil);

  const existingPrivyUsers = Object.values(existingUserByWallets).filter(
    isNotNil,
  );

  // Build linked accounts array
  const linkedAccounts: any[] = newWalletAddresses.map((walletAddress) => ({
    type: 'wallet',
    chain_type: 'ethereum',
    address: walletAddress,
  }));

  // Add email account if email is provided and verified
  if (primaryEmail) {
    // check if user already exists for email
    const existingUserByEmail = await privyClient.getUserByEmail(primaryEmail);
    if (existingUserByEmail) {
      _logger.debug(`User already exists in Privy for email ${primaryEmail}`);

      existingPrivyUsers.push(existingUserByEmail);
      existingPrivyIds.push(existingUserByEmail.id);
      linkedAccounts.push({
        type: 'email',
        address: primaryEmail,
      });
      _logger.debug(
        `Including verified email ${primaryEmail} in Privy user creation`,
      );
    }
  }

  if (existingPrivyIds.length > 1) {
    // This case won't happen based on investigation of existing data. so it's dismissed instead of increasing the complexity of the code
    throw new workflow.ApplicationFailure(
      `Multiple users already exist in Privy for wallet ${walletAddresses}`,
    );
  }
  const existingPrivyId = existingPrivyIds[0];

  const existingUser = existingPrivyUsers.find(
    (user) => user.id === existingPrivyId,
  );

  const existingLinkedAccounts: any[] = [];
  if (existingUser) {
    existingLinkedAccounts.push(...(existingUser.linkedAccounts || []));
  }
  const newAccountsToBeLinked = linkedAccounts.filter(
    (account) =>
      !existingLinkedAccounts.some(
        (existingAccount) =>
          existingAccount.type === account.type &&
          existingAccount.address.toLowerCase() ===
            account.address.toLowerCase(),
      ),
  );

  const createNewPrivyUser =
    isNil(existingPrivyId) ||
    (existingPrivyId && newAccountsToBeLinked.length > 0);
  const existingLinkedAccountsSnakeCase = existingLinkedAccounts.map(
    (account) =>
      changeKeys.snakeCase({
        type: account.type,
        address: account.address,
      }),
  );

  return {
    newAccountsToBeLinked,
    existingLinkedAccounts: existingLinkedAccountsSnakeCase as any[],
    existingPrivyId,
    createNewPrivyUser,
  };
}

export async function deleteExistingPrivyUserActivity(
  existingPrivyId?: string,
) {
  if (!existingPrivyId) {
    return;
  }
  const deletedUser = await privyClient.deleteUser(existingPrivyId);
  _logger.debug(
    `Deleted existing Privy user for wallet ${existingPrivyId}: ${deletedUser}`,
  );
}
/**
 * Temporal activity to create or find Privy user
 */
export async function createPrivyUserActivity(
  newAccountsToBeLinked: any[],
  existingLinkedAccounts: any[],
  existingPrivyId?: string,
): Promise<{
  privyUserId: string;
  existingPrivyId?: string;
  newUserCreated: boolean;
}> {
  const distinctLinkedAccounts = uniqBy(
    (account) => `${account.type}-${account.address}`.toLowerCase(),
    [
      ...newAccountsToBeLinked,
      ...existingLinkedAccounts.map((account) => {
        const snakeCaseAccount = changeKeys.snakeCase(account) as any;
        if (
          snakeCaseAccount.type === 'wallet' &&
          snakeCaseAccount.address &&
          snakeCaseAccount.address.length === 42 &&
          snakeCaseAccount.address.startsWith('0x')
        ) {
          snakeCaseAccount.chain_type = 'ethereum';
        }
        return {
          ...snakeCaseAccount,
        };
      }),
    ],
  );

  try {
    const response = await fetch('https://auth.privy.io/api/v1/users/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': config.PRIVY_APP_ID,
        Authorization: `Basic ${Buffer.from(
          `${config.PRIVY_APP_ID}:${secrets.PRIVY_APP_SECRET}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        users: [
          {
            linked_accounts: distinctLinkedAccounts,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      _logger.error('Privy API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      // For 429 and other errors, let Temporal handle retries
      throw new workflow.ApplicationFailure(
        `Privy API failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();

    if (result.results?.[0]?.success) {
      const privyUserId = result.results[0].id;
      _logger.debug(`Created new Privy user: ${privyUserId}`);
      return {
        privyUserId,
        existingPrivyId,
        newUserCreated: true,
      };
    }

    const error = result.results?.[0]?.error || 'Unknown error';
    _logger.error(`Failed to create Privy user: ${error}`);
    throw new workflow.ApplicationFailure(
      `Privy user creation failed: ${error}`,
    );
  } catch (error) {
    _logger.error('Failed to create/find Privy user:', error);
    throw error;
  }
}

/**
 * Temporal activity to create PostgreSQL user
 */
export async function createPostgresUserActivity(
  newPrivyUserCreated: boolean,
  _newPrivyUserId?: string,
  oldPrivyId?: string,
  _stripeCustomerId?: string,
): Promise<string> {
  let newPrivyUserId = _newPrivyUserId;
  try {
    if (!newPrivyUserCreated) {
      if (!oldPrivyId) {
        throw new workflow.ApplicationFailure('oldPrivyId is required');
      }
      const existingNamefiUser = await db.query.usersTable.findFirst({
        where: (usersTable, { eq }) => eq(usersTable.privyUserId, oldPrivyId),
      });
      if (existingNamefiUser) {
        return existingNamefiUser.id;
      }
      // create new user with oldPrivyId if it doesn't exist in the database
      newPrivyUserId = oldPrivyId;
    }

    _logger.debug(
      `Creating PostgreSQL user for Privy ID: ${newPrivyUserId} ${oldPrivyId ? `replacing existing Privy ID: ${oldPrivyId}` : ''}`,
    );
    if (!newPrivyUserId) {
      throw new workflow.ApplicationFailure('newPrivyUserId is required');
    }
    if (oldPrivyId) {
      _logger.debug(`oldPrivyId is the same as privyUserId: ${oldPrivyId}`);
      const existingNamefiUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.privyUserId, oldPrivyId),
      });

      if (existingNamefiUser) {
        if (existingNamefiUser.stripeCustomerId && _stripeCustomerId) {
          _logger.debug(
            {
              existingNamefiUser,
              _stripeCustomerId,
              newPrivyUserId,
              oldPrivyId,
            },
            `stripeCustomerId already exists for user ${existingNamefiUser.id}, skipping update`,
          );
        }
        await db
          .update(usersTable)
          .set({
            stripeCustomerId:
              existingNamefiUser.stripeCustomerId ||
              _stripeCustomerId ||
              undefined,
            privyUserId: newPrivyUserId,
          })
          .where(eq(usersTable.id, existingNamefiUser.id))
          .returning();
        _logger.debug(
          `updated PostgreSQL user ${existingNamefiUser.id} with stripeCustomerId: ${_stripeCustomerId}`,
        );

        return existingNamefiUser.id;
      }
    }

    // Create new user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        privyUserId: newPrivyUserId,
        stripeCustomerId: _stripeCustomerId || undefined,
      })
      .returning();

    _logger.debug(`Created new PostgreSQL user: ${newUser.id}`);
    return newUser.id;
  } catch (error) {
    _logger.error(
      `Failed to create PostgreSQL user for Privy ID ${newPrivyUserId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get all user contacts with verified emails
 */
export async function getUserContactsWithVerifiedEmailsActivity(): Promise<
  Array<{
    userId: string;
    email: string;
    privyUserId: string;
  }>
> {
  try {
    _logger.debug('Getting user contacts with verified emails...');

    const userContactsWithVerifiedEmails = await db
      .select({
        userId: userContactsTable.userId,
        email: userContactsTable.email,
        privyUserId: usersTable.privyUserId,
      })
      .from(userContactsTable)
      .innerJoin(usersTable, eq(userContactsTable.userId, usersTable.id))
      .where(
        and(
          eq(userContactsTable.emailVerified, true),
          isNotNull(userContactsTable.email),
        ),
      );

    _logger.debug(
      `Found ${userContactsWithVerifiedEmails.length} user contacts with verified emails`,
    );

    return userContactsWithVerifiedEmails.filter(
      (contact): contact is typeof contact & { email: string } =>
        Boolean(contact.email),
    );
  } catch (error) {
    _logger.error('Failed to get user contacts with verified emails:', error);
    throw error;
  }
}

/**
 * Check if Privy user has the given email in their linked accounts
 */
export async function checkPrivyUserEmailLinkingActivity(
  privyUserId: string,
  email: string,
): Promise<{
  hasEmailLinked: boolean;
  needsRecreation: boolean;
  emailLinkedToAnotherAccount: boolean;
  hasDifferentEmailLinked: boolean;
  existingLinkedEmail?: string;
  existingPrivyUser?: PrivyUser;
}> {
  try {
    _logger.debug(
      `Checking email linking for Privy user ${privyUserId} with email ${email}`,
    );

    // Get the Privy user
    const privyUser = await privyClient.getUserById(privyUserId);
    if (!privyUser) {
      _logger.warn(`Privy user not found: ${privyUserId}`);
      return {
        hasEmailLinked: false,
        needsRecreation: true,
        emailLinkedToAnotherAccount: false,
        hasDifferentEmailLinked: false,
      };
    }

    // Check if the target email is linked to this user
    const hasEmailLinked = privyUser.linkedAccounts.some(
      (account) => account.type === 'email' && account.address === email,
    );

    if (hasEmailLinked) {
      _logger.debug(
        `Email ${email} is already linked to Privy user ${privyUserId}`,
      );
      return {
        hasEmailLinked: true,
        needsRecreation: false,
        emailLinkedToAnotherAccount: false,
        hasDifferentEmailLinked: false,
        existingPrivyUser: privyUser,
      };
    }

    // Check if this user already has a different email linked
    const existingEmailAccounts = privyUser.linkedAccounts.filter(
      (account) => account.type === 'email',
    );

    if (existingEmailAccounts.length > 0) {
      const existingLinkedEmail = existingEmailAccounts[0].address;
      _logger.warn(
        `Privy user ${privyUserId} already has a different email linked: ${existingLinkedEmail}, cannot add ${email}`,
      );
      return {
        hasEmailLinked: false,
        needsRecreation: false, // Can't recreate with 2 emails
        emailLinkedToAnotherAccount: false,
        hasDifferentEmailLinked: true,
        existingLinkedEmail,
        existingPrivyUser: privyUser,
      };
    }

    // Check if target email is linked to another user
    const existingUserByEmail = await privyClient.getUserByEmail(email);
    const emailLinkedToAnotherAccount =
      existingUserByEmail && existingUserByEmail.id !== privyUserId;

    if (emailLinkedToAnotherAccount) {
      _logger.warn(
        `Email ${email} is linked to another Privy user: ${existingUserByEmail?.id}`,
      );
      return {
        hasEmailLinked: false,
        needsRecreation: false, // Can't recreate if email is taken
        emailLinkedToAnotherAccount: true,
        hasDifferentEmailLinked: false,
        existingPrivyUser: privyUser,
      };
    }

    _logger.debug(
      `Email ${email} is not linked to Privy user ${privyUserId} and is available for linking`,
    );
    return {
      hasEmailLinked: false,
      needsRecreation: true,
      emailLinkedToAnotherAccount: false,
      hasDifferentEmailLinked: false,
      existingPrivyUser: privyUser,
    };
  } catch (error) {
    _logger.error(
      `Failed to check email linking for Privy user ${privyUserId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Delete Privy user account (destructive operation)
 */
export async function deletePrivyUserActivity(privyUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    _logger.debug(`Deleting Privy user: ${privyUserId}`);

    await privyClient.deleteUser(privyUserId);
    _logger.debug(`Successfully deleted Privy user: ${privyUserId}`);

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    _logger.error(`Failed to delete Privy user ${privyUserId}:`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create new Privy user with email included (non-destructive operation)
 */
export async function createPrivyUserWithEmailActivity(
  existingPrivyUser: PrivyUser,
  email: string,
): Promise<{
  success: boolean;
  newPrivyUserId?: string;
  error?: string;
}> {
  try {
    _logger.debug(
      `Creating new Privy user with email ${email} (replacing ${existingPrivyUser.id})`,
    );

    // Get all existing linked accounts
    const existingLinkedAccounts = existingPrivyUser.linkedAccounts || [];

    // Add the email account
    const allLinkedAccounts: LinkedAccountInput = [
      ...existingLinkedAccounts.map((account) => {
        if (account.type === 'wallet') {
          return {
            type: account.type,
            address: account.address,
            chainType: account.chainType || 'ethereum',
          };
        }
        if (account.type === 'email') {
          return {
            type: account.type,
            address: account.address,
          };
        }
        return account;
      }),
      {
        type: 'email',
        address: email,
      },
    ];
    const customMetadata = {
      ...(existingPrivyUser.customMetadata || {}),
    };

    const newPrivyUser = await privyClient.importUser({
      linkedAccounts: allLinkedAccounts,
      createEthereumSmartWallet: false,
      createEmbeddedWallet: false,
      createEthereumWallet: false,
      createSolanaWallet: false,
      customMetadata,
    });

    if (newPrivyUser?.id) {
      const newPrivyUserId = newPrivyUser.id;
      _logger.debug(
        `Successfully created new Privy user: ${newPrivyUserId} with email ${email}`,
      );
      return {
        success: true,
        newPrivyUserId,
      };
    }

    _logger.error('Failed to create new Privy user: No user ID returned');
    return {
      success: false,
      error: 'Privy user creation failed: No user ID returned',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    _logger.error(
      `Failed to create new Privy user for ${existingPrivyUser.id}:`,
      error,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update user's Privy user ID in the database
 */
export async function updateUserPrivyIdActivity(
  userId: string,
  newPrivyUserId: string,
): Promise<void> {
  try {
    _logger.debug(
      `Updating user ${userId} with new Privy user ID: ${newPrivyUserId}`,
    );

    await db
      .update(usersTable)
      .set({ privyUserId: newPrivyUserId })
      .where(eq(usersTable.id, userId));

    _logger.debug(
      `Successfully updated user ${userId} with new Privy user ID: ${newPrivyUserId}`,
    );
  } catch (error) {
    _logger.error(
      `Failed to update user ${userId} with new Privy user ID:`,
      error,
    );
    throw error;
  }
}

/**
 * Temporal activity to generate migration report
 * Collects statistics about the migration process
 */
export function generateMigrationReportActivity(): Promise<{
  timestamp: string;
  totalUsers: number;
  successfulMigrations: number;
  failedMigrations: number;
  successRate: number;
  estimatedCompletionTime?: string;
}> {
  try {
    _logger.debug('Generating migration report...');

    // In a real implementation, you would query the database for actual statistics
    // For now, we'll return a placeholder report
    const report = {
      timestamp: new Date().toISOString(),
      totalUsers: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      successRate: 0,
    };

    if (report.totalUsers > 0) {
      report.successRate =
        (report.successfulMigrations / report.totalUsers) * 100;
    }

    _logger.debug('Migration report generated:', report);
    return Promise.resolve(report);
  } catch (error) {
    _logger.error('Failed to generate migration report:', error);
    throw error;
  }
}

export type NftWalletUserBackfillCandidates = {
  totalWallets: number;
  walletsMissingPrivyUser: string[];
  privyUsersMissingDbUser: Array<{
    walletAddress: string;
    privyUserId: string;
  }>;
  ambiguousWallets: Array<{
    walletAddress: string;
    privyUserIds: string[];
  }>;
};

export async function getNftWalletUserBackfillCandidatesActivity(): Promise<NftWalletUserBackfillCandidates> {
  try {
    _logger.debug('Ensuring Privy cache is fresh before wallet scan');
    await ensurePrivyTableFresh();

    const walletAddressExpr = sql<string>`LOWER(${committedNamefiNftView.ownerAddress})`;

    const rows = await db
      .with(committedNamefiNftCte)
      .select({
        walletAddress: walletAddressExpr.as('wallet_address'),
        privyUserId: privyUsersTableSchema.privyUserId,
        userId: usersTable.id,
      })
      .from(committedNamefiNftView)
      .leftJoin(
        privyUsersTableSchema,
        sql`LOWER(${committedNamefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
      )
      .leftJoin(
        usersTable,
        eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
      )
      .groupBy(
        walletAddressExpr,
        privyUsersTableSchema.privyUserId,
        usersTable.id,
      );

    const walletMap = new Map<
      string,
      { privyUserIds: Set<string>; userIds: Set<string> }
    >();

    for (const row of rows) {
      const walletAddress = row.walletAddress?.toLowerCase();
      if (!walletAddress) continue;
      const entry = walletMap.get(walletAddress) ?? {
        privyUserIds: new Set<string>(),
        userIds: new Set<string>(),
      };
      if (row.privyUserId) {
        entry.privyUserIds.add(row.privyUserId);
      }
      if (row.userId) {
        entry.userIds.add(row.userId);
      }
      walletMap.set(walletAddress, entry);
    }

    const walletsMissingPrivyUser: string[] = [];
    const privyUsersMissingDbUser: Array<{
      walletAddress: string;
      privyUserId: string;
    }> = [];
    const ambiguousWallets: Array<{
      walletAddress: string;
      privyUserIds: string[];
    }> = [];

    for (const [walletAddress, entry] of walletMap.entries()) {
      const privyUserIds = Array.from(entry.privyUserIds);
      if (privyUserIds.length === 0) {
        walletsMissingPrivyUser.push(walletAddress);
        continue;
      }
      if (privyUserIds.length > 1) {
        ambiguousWallets.push({ walletAddress, privyUserIds });
        continue;
      }
      const privyUserId = privyUserIds[0];
      if (entry.userIds.size === 0) {
        privyUsersMissingDbUser.push({ walletAddress, privyUserId });
        continue;
      }
      if (entry.userIds.size > 1) {
        ambiguousWallets.push({ walletAddress, privyUserIds });
      }
    }

    _logger.debug(
      {
        totalWallets: walletMap.size,
        walletsMissingPrivyUser: walletsMissingPrivyUser.length,
        privyUsersMissingDbUser: privyUsersMissingDbUser.length,
        ambiguousWallets: ambiguousWallets.length,
      },
      'Computed NFT wallet backfill candidates',
    );

    return {
      totalWallets: walletMap.size,
      walletsMissingPrivyUser,
      privyUsersMissingDbUser,
      ambiguousWallets,
    };
  } catch (error) {
    _logger.error(
      { error },
      'Failed to compute NFT wallet backfill candidates',
    );
    throw error;
  }
}
