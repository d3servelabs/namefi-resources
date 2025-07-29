#!/usr/bin/env bun tsx

import { privyClient } from '../trpc/utils';
import type { User } from '@privy-io/server-auth';
import { logger } from '../lib/logger';
import { secrets, config } from '../lib/env';
import { db, usersTable } from '@namefi-astra/db';
import {
  privyCustomMetadataSchema,
  privyStorageToPrivyCustomMetadata,
  type PrivyCustomMetadata,
} from '../trpc/types';
import Bottleneck from 'bottleneck';
import pMap from 'p-map';

interface ListmonkSubscriber {
  email: string;
  name?: string;
  status: 'enabled' | 'disabled';
  attribs: {
    privyUserId?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
  lists: number[];
}

interface PrivyUserWithDbUser extends User {
  dbUserId?: string;
}

interface ListmonkConfig {
  baseUrl: string;
  username: string;
  password: string;
  defaultListId: number;
}

/**
 * Configuration for Listmonk - uses environment variables from secrets
 */
const LISTMONK_CONFIG: ListmonkConfig = {
  baseUrl: secrets.LISTMONK_BASE_URL || 'http://localhost:9000',
  username: secrets.LISTMONK_USERNAME || 'listmonk',
  password: secrets.LISTMONK_PASSWORD || '',
  defaultListId: config.LISTMONK_NAMEFI_LIST_ID,
};

const limiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 1000,
});

/**
 * Listmonk API client
 */
class ListmonkClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ListmonkConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
  }

  /**
   * Add or update a subscriber in Listmonk
   */
  async upsertSubscriber(subscriber: ListmonkSubscriber): Promise<void> {
    await limiter.schedule(() => this._upsertSubscriberInternal(subscriber));
  }

  private async _upsertSubscriberInternal(
    subscriber: ListmonkSubscriber,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify(subscriber),
      });

      if (!response.ok) {
        // If subscriber already exists, try to update instead
        if (response.status === 409) {
          await this.updateExistingSubscriber(subscriber);
          return;
        }

        const errorText = await response.text();
        throw new Error(
          `Failed to create subscriber: ${response.status} ${errorText}`,
        );
      }

      logger.info(
        { email: subscriber.email },
        'Successfully added subscriber to Listmonk',
      );
    } catch (error) {
      logger.error(
        { error, email: subscriber.email },
        'Failed to upsert subscriber',
      );
      throw error;
    }
  }

  /**
   * Update an existing subscriber by email
   */
  private async updateExistingSubscriber(
    subscriber: ListmonkSubscriber,
  ): Promise<void> {
    try {
      // First, find the subscriber by email
      const searchResponse = await fetch(
        `${this.baseUrl}/api/subscribers?query=subscribers.email='${encodeURIComponent(subscriber.email)}'`,
        {
          headers: {
            Authorization: this.authHeader,
          },
        },
      );

      if (!searchResponse.ok) {
        throw new Error(
          `Failed to search for subscriber: ${searchResponse.status}`,
        );
      }

      const searchData = await searchResponse.json();
      const existingSubscriber = searchData.data?.results?.[0];

      if (!existingSubscriber) {
        throw new Error('Subscriber not found for update');
      }

      // Update the subscriber
      const updateResponse = await fetch(
        `${this.baseUrl}/api/subscribers/${existingSubscriber.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
          body: JSON.stringify({
            ...subscriber,
            id: existingSubscriber.id,
          }),
        },
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(
          `Failed to update subscriber: ${updateResponse.status} ${errorText}`,
        );
      }

      logger.info(
        { email: subscriber.email },
        'Successfully updated subscriber in Listmonk',
      );
    } catch (error) {
      logger.error(
        { error, email: subscriber.email },
        'Failed to update existing subscriber',
      );
      throw error;
    }
  }

  /**
   * Test connection to Listmonk
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        headers: {
          Authorization: this.authHeader,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Listmonk');
      return false;
    }
  }
}

/**
 * Extract name from Privy user's custom metadata using the proper schema
 */
function extractNameFromPrivyUser(user: User): {
  firstName?: string;
  lastName?: string;
  fullName?: string;
} {
  try {
    // Parse the custom metadata using the proper schema
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

    // Extract fullName from the schema
    if (metadata.fullName) {
      const fullName = metadata.fullName.trim();

      // Try to split fullName into first and last name
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

/**
 * Convert Privy user to Listmonk subscriber format
 */
function privyUserToListmonkSubscriber(
  user: PrivyUserWithDbUser,
  listId: number,
): ListmonkSubscriber | null {
  // Skip users without email
  if (!user.email?.address) {
    logger.warn({ userId: user.id }, 'Skipping user without email address');
    return null;
  }

  const nameInfo = extractNameFromPrivyUser(user);

  return {
    email: user.email.address,
    name: nameInfo.fullName,
    status: 'enabled',
    attribs: {
      privyUserId: user.id,
      userId: user.dbUserId,
      firstName: nameInfo.firstName,
      lastName: nameInfo.lastName,
      // Include parsed custom metadata as additional attributes
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
    lists: [listId],
  };
}

/**
 * Enrich Privy users with database user IDs
 */
async function enrichPrivyUsersWithDbIds(
  privyUsers: User[],
): Promise<PrivyUserWithDbUser[]> {
  logger.info(
    { totalUsers: privyUsers.length },
    'Enriching Privy users with database IDs...',
  );

  // Get all users from database
  const dbUsers = await db
    .select({
      id: usersTable.id,
      privyUserId: usersTable.privyUserId,
    })
    .from(usersTable);

  // Create a map for quick lookup
  const privyIdToDbId = new Map<string, string>();
  for (const dbUser of dbUsers) {
    privyIdToDbId.set(dbUser.privyUserId, dbUser.id);
  }

  // Enrich Privy users with database IDs
  const enrichedUsers: PrivyUserWithDbUser[] = privyUsers.map((user) => ({
    ...user,
    dbUserId: privyIdToDbId.get(user.id),
  }));

  const usersWithDbId = enrichedUsers.filter((user) => user.dbUserId).length;
  logger.info(
    {
      totalPrivyUsers: privyUsers.length,
      dbUsers: dbUsers.length,
      usersWithDbId,
      usersWithoutDbId: privyUsers.length - usersWithDbId,
    },
    'Enrichment complete',
  );

  return enrichedUsers;
}

/**
 * Fetch all users from Privy
 */
async function fetchAllPrivyUsers(): Promise<User[]> {
  logger.info('Starting to fetch users from Privy...');

  try {
    const users = await privyClient.getUsers();

    logger.info(
      { totalUsers: users.length },
      'Finished fetching all users from Privy',
    );
    return users;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch users from Privy');
    throw error;
  }
}

/**
 * Main function to sync Privy users to Listmonk
 */
async function syncPrivyUsersToListmonk() {
  try {
    // Validate environment variables
    if (!LISTMONK_CONFIG.password) {
      throw new Error('LISTMONK_PASSWORD environment variable is required');
    }

    logger.info('Starting Privy to Listmonk sync...');

    // Initialize Listmonk client
    const listmonk = new ListmonkClient(LISTMONK_CONFIG);

    // Test connection to Listmonk
    logger.info('Testing connection to Listmonk...');
    const connected = await listmonk.testConnection();
    if (!connected) {
      throw new Error(
        'Failed to connect to Listmonk. Check your configuration.',
      );
    }

    logger.info('Successfully connected to Listmonk');

    // Fetch all users from Privy
    const privyUsers = await fetchAllPrivyUsers();

    // Enrich with database user IDs
    const enrichedUsers = await enrichPrivyUsersWithDbIds(privyUsers);

    // Filter users with email addresses and convert to Listmonk format
    const subscribers = enrichedUsers
      .map((user) =>
        privyUserToListmonkSubscriber(user, LISTMONK_CONFIG.defaultListId),
      )
      .filter(
        (subscriber): subscriber is ListmonkSubscriber => subscriber !== null,
      );

    logger.info(
      {
        totalPrivyUsers: privyUsers.length,
        enrichedUsers: enrichedUsers.length,
        usersWithEmail: subscribers.length,
      },
      'Converted Privy users to Listmonk subscribers',
    );

    // Sync subscribers to Listmonk
    let successCount = 0;
    let errorCount = 0;

    pMap(
      subscribers,
      async (subscriber) => {
        try {
          await listmonk.upsertSubscriber(subscriber);
          successCount++;
        } catch (error) {
          errorCount++;
          logger.error(
            { error, email: subscriber.email },
            'Failed to sync subscriber to Listmonk',
          );
        }

        // Add a small delay between requests to avoid overwhelming Listmonk
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
      { concurrency: 20 },
    );

    logger.info(
      {
        totalSubscribers: subscribers.length,
        successCount,
        errorCount,
      },
      'Completed Privy to Listmonk sync',
    );

    if (errorCount > 0) {
      logger.warn(
        { errorCount, totalSubscribers: subscribers.length },
        'Some subscribers failed to sync. Check the logs above for details.',
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to sync Privy users to Listmonk');
    process.exit(1);
  }
}

// Run the script if called directly
// if (require.main === module) {
syncPrivyUsersToListmonk();
// }

export {
  syncPrivyUsersToListmonk,
  privyUserToListmonkSubscriber,
  extractNameFromPrivyUser,
};
