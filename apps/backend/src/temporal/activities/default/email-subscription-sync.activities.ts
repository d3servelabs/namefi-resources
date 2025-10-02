import { privyClient } from '../../../trpc/utils';
import type { User as PrivyUser } from '@privy-io/server-auth';
import { logger } from '../../../lib/logger';
import { db, usersTable } from '@namefi-astra/db';
import {
  privyStorageToPrivyCustomMetadata,
  type PrivyCustomMetadata,
} from '../../../trpc/types';
import pMap from 'p-map';
import { eq } from 'drizzle-orm';
import { LISTMONK_CONFIG } from '#lib/listmonk';
import { ListmonkClient } from '#lib/listmonk';
import type { ListmonkSubscriber } from '#lib/listmonk';
import type { EnrichedUser } from '#lib/listmonk';

function extractNameFromPrivyUser(user: PrivyUser): {
  firstName?: string;
  lastName?: string;
  fullName?: string;
} {
  try {
    const parsedMetadata = privyStorageToPrivyCustomMetadata.safeParse(
      user.customMetadata,
    );

    if (!parsedMetadata.success) {
      logger.debug(
        { userId: user.id },
        'No valid custom metadata found for user',
      );
      return {};
    }

    const metadata: PrivyCustomMetadata = parsedMetadata.data;

    if (metadata.fullName) {
      const fullName = metadata.fullName.trim();
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;

      return {
        firstName,
        lastName,
        fullName,
      };
    }

    return {};
  } catch (error) {
    logger.warn(
      { error, userId: user.id },
      'Failed to extract name from custom metadata',
    );
    return {};
  }
}

function privyUserToListmonkSubscriber(
  user: PrivyUser,
  dbUserId: string,
  listId: number,
  optedIn: boolean,
): ListmonkSubscriber | null {
  if (!user.email?.address) {
    logger.warn({ userId: user.id }, 'Skipping user without email address');
    return null;
  }

  const nameInfo = extractNameFromPrivyUser(user);

  return {
    email: user.email.address,
    name: nameInfo.fullName,
    status: optedIn ? 'enabled' : 'blocklisted',
    attribs: {
      privyUserId: user.id,
      userId: dbUserId,
      firstName: nameInfo.firstName,
      lastName: nameInfo.lastName,
      ...(() => {
        const parsedMetadata = privyStorageToPrivyCustomMetadata.safeParse(
          user.customMetadata,
        );
        if (parsedMetadata.success) {
          return {
            address: parsedMetadata.data.address
              ? JSON.stringify(parsedMetadata.data.address)
              : undefined,
          };
        }
        return {};
      })(),
    },
    lists: optedIn ? [listId] : [],
  };
}

/**
 * Activity: Test Listmonk connection
 */
export async function testListmonkConnectionActivity(): Promise<boolean> {
  if (!LISTMONK_CONFIG.password) {
    throw new Error('LISTMONK_PASSWORD environment variable is required');
  }

  const listmonk = new ListmonkClient(LISTMONK_CONFIG);
  return await listmonk.testConnection();
}

/**
 * Activity: Fetch all users from Privy and enrich with database data
 */
export async function fetchAndEnrichPrivyUsersActivity(): Promise<
  Array<{
    privyUser: PrivyUser;
    dbUserId: string;
    subscribeToEmails: boolean;
  }>
> {
  logger.info('Fetching users from Privy...');

  try {
    const privyUsers = await privyClient.getUsers();
    logger.info(
      { totalUsers: privyUsers.length },
      'Finished fetching all users from Privy',
    );

    // Get all users from database with their opt-in status
    const dbUsers = await db
      .select({
        id: usersTable.id,
        privyUserId: usersTable.privyUserId,
        subscribeToEmails: usersTable.subscribeToEmails,
      })
      .from(usersTable);

    // Create maps for quick lookup
    const privyIdToDbId = new Map<string, string>();
    const privyIdToOptIn = new Map<string, boolean>();
    for (const dbUser of dbUsers) {
      privyIdToDbId.set(dbUser.privyUserId, dbUser.id);
      privyIdToOptIn.set(dbUser.privyUserId, dbUser.subscribeToEmails);
    }

    // Enrich Privy users with database data
    const enrichedUsers = privyUsers.map((privyUser) => ({
      privyUser,
      dbUserId: privyIdToDbId.get(privyUser.id),
      subscribeToEmails: privyIdToOptIn.get(privyUser.id) ?? true, // Default to true
    }));

    const usersWithDbId = enrichedUsers.filter((u) => u.dbUserId).length;
    logger.info(
      {
        totalPrivyUsers: privyUsers.length,
        dbUsers: dbUsers.length,
        usersWithDbId,
        usersWithoutDbId: privyUsers.length - usersWithDbId,
      },
      'Enrichment complete',
    );

    return enrichedUsers as Array<EnrichedUser>;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch users from Privy');
    throw error;
  }
}

/**
 * Activity: Sync users to Listmonk
 */
export async function syncUsersToListmonkActivity(
  enrichedUsers: Array<EnrichedUser>,
): Promise<{ successCount: number; errorCount: number }> {
  if (!LISTMONK_CONFIG.password) {
    throw new Error('LISTMONK_PASSWORD environment variable is required');
  }

  const listmonk = new ListmonkClient(LISTMONK_CONFIG);

  // Filter users with email addresses and convert to Listmonk format
  const subscribers = enrichedUsers
    .map(({ privyUser, dbUserId, subscribeToEmails }) =>
      privyUserToListmonkSubscriber(
        privyUser,
        dbUserId,
        LISTMONK_CONFIG.defaultListId,
        subscribeToEmails,
      ),
    )
    .filter(
      (subscriber): subscriber is ListmonkSubscriber => subscriber !== null,
    );

  logger.info(
    {
      totalUsers: enrichedUsers.length,
      usersWithEmail: subscribers.length,
    },
    'Converted users to Listmonk subscribers',
  );

  // Sync subscribers to Listmonk using the isolated sync function
  let successCount = 0;
  let errorCount = 0;

  await pMap(
    enrichedUsers,
    async ({ privyUser, dbUserId, subscribeToEmails }) => {
      try {
        const subscriber = privyUserToListmonkSubscriber(
          privyUser,
          dbUserId,
          LISTMONK_CONFIG.defaultListId,
          subscribeToEmails,
        );

        if (!subscriber) {
          logger.warn(
            { userId: dbUserId },
            'User has no email address, skipping sync',
          );
          return;
        }

        // Use the isolated sync function
        await listmonk.syncUserSubscription(
          subscriber,
          subscribeToEmails,
          dbUserId,
          LISTMONK_CONFIG.defaultListId,
        );

        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(
          { error, userId: dbUserId },
          'Failed to sync user to Listmonk',
        );
      }

      // Add a small delay between requests to avoid overwhelming Listmonk
      await new Promise((resolve) => setTimeout(resolve, 10));
    },
    { concurrency: 20 },
  );

  logger.info(
    {
      totalUsers: enrichedUsers.length,
      successCount,
      errorCount,
    },
    'Completed user sync to Listmonk',
  );

  return { successCount, errorCount };
}

/**
 * Activity: Sync single user to Listmonk
 */
export async function syncSingleUserToListmonkActivity(
  userId: string,
): Promise<void> {
  if (!LISTMONK_CONFIG.password) {
    throw new Error('LISTMONK_PASSWORD environment variable is required');
  }

  const listmonk = new ListmonkClient(LISTMONK_CONFIG);

  // Get user from database
  const dbUser = await db
    .select({
      id: usersTable.id,
      privyUserId: usersTable.privyUserId,
      subscribeToEmails: usersTable.subscribeToEmails,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (dbUser.length === 0) {
    throw new Error(`User not found: ${userId}`);
  }

  const user = dbUser[0];

  try {
    // Get user from Privy
    const privyUser = await privyClient.getUserById(user.privyUserId);

    const enrichedUser = {
      ...privyUser,
      dbUserId: user.id,
    };

    const subscriber = privyUserToListmonkSubscriber(
      enrichedUser,
      user.id,
      LISTMONK_CONFIG.defaultListId,
      user.subscribeToEmails,
    );

    if (!subscriber) {
      logger.warn({ userId }, 'User has no email address, skipping sync');
      return;
    }

    // Use the isolated sync function
    await listmonk.syncUserSubscription(
      subscriber,
      user.subscribeToEmails,
      userId,
      LISTMONK_CONFIG.defaultListId,
    );
  } catch (error) {
    logger.error({ error, userId }, 'Failed to sync user to Listmonk');
    throw error;
  }
}
