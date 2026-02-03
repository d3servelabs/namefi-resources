/**
 * Temporal activities for managing the Privy users cache
 * These activities handle refreshing and querying the unlogged Privy users table
 */

import { db } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import {
  buildSimplifiedPrivyUsers,
  privyUsersTableSchema,
} from '../../../trpc/routers/admin/privyUserCache';
import { assoc, map } from 'ramda';

const logger = createLogger({ module: 'privy-cache-activities' });

const PRIVY_CACHE_TABLE_NAME = 'privy_users_cache';
const PRIVY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PRIVY_REFRESH_LOCK_ID = 1234567890;

export type PrivyCacheStatus = {
  exists: boolean;
  lastRefresh: Date | null;
  expiresAt: Date | null;
  recordCount: number;
};

/**
 * Get the current status of the Privy users cache
 */
export async function getPrivyCacheStatus(): Promise<PrivyCacheStatus> {
  try {
    // Check if table exists and get status
    const result = await db.execute<{
      expires_at: Date;
      count: string;
    }>(sql`
      SELECT
        MAX(expires_at)::timestamptz as expires_at,
        COUNT(*)::text as count
      FROM ${sql.raw(PRIVY_CACHE_TABLE_NAME)}
    `);

    if (
      !result.rows ||
      result.rows.length === 0 ||
      !result.rows[0].expires_at
    ) {
      return {
        exists: false,
        lastRefresh: null,
        expiresAt: null,
        recordCount: 0,
      };
    }

    const expiresAt = new Date(result.rows[0].expires_at);
    const count = Number.parseInt(result.rows[0].count || '0', 10);

    // Calculate when it was last refreshed (expires_at - TTL)
    const lastRefresh = new Date(expiresAt.getTime() - PRIVY_CACHE_TTL_MS);

    return {
      exists: true,
      lastRefresh,
      expiresAt,
      recordCount: count,
    };
  } catch (error) {
    // Table doesn't exist or query failed
    logger.debug({ error }, 'Failed to get Privy cache status');
    return {
      exists: false,
      lastRefresh: null,
      expiresAt: null,
      recordCount: 0,
    };
  }
}

export type RefreshPrivyCacheResult = {
  success: boolean;
  recordsUpdated: number;
  lastRefresh: Date;
  expiresAt: Date;
  error?: string;
};

/**
 * Refresh the Privy users cache table
 * This fetches all users from Privy and updates the unlogged table
 */
export async function refreshPrivyUsersCache(): Promise<RefreshPrivyCacheResult> {
  const startTime = Date.now();

  try {
    // Get fresh Privy data
    logger.debug('Fetching fresh Privy user data');
    const simplified = await buildSimplifiedPrivyUsers();

    logger.debug({ userCount: simplified.length }, 'Fetched Privy users');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PRIVY_CACHE_TTL_MS);

    // Use transaction with advisory lock
    await db.transaction(async (tx) => {
      // Acquire transaction-level advisory lock
      const lockResult = await tx.execute<{ locked: boolean }>(sql`
        SELECT pg_try_advisory_xact_lock(${PRIVY_REFRESH_LOCK_ID}) as locked
      `);

      const lockAcquired = lockResult.rows?.[0]?.locked;

      if (!lockAcquired) {
        // Another process is refreshing, skip this attempt
        logger.debug('Another process is refreshing Privy table, skipping');
        throw new Error('Could not acquire lock - another refresh in progress');
      }

      // Truncate and insert fresh data
      await tx.execute(sql`TRUNCATE ${privyUsersTableSchema}`);

      // Insert all users
      if (simplified.length > 0) {
        const values = map(assoc('expiresAt', expiresAt), simplified);

        await tx
          .insert(privyUsersTableSchema)
          .values(values)
          .onConflictDoUpdate({
            target: [privyUsersTableSchema.privyUserId],
            set: {
              email: sql`EXCLUDED.email`,
              displayName: sql`EXCLUDED.display_name`,
              wallets: sql`EXCLUDED.wallets`,
              twitterUsername: sql`EXCLUDED.twitter_username`,
              twitterDetails: sql`EXCLUDED.twitter_details`,
              expiresAt: sql`EXCLUDED.expires_at`,
            },
          });
      }

      logger.debug(
        {
          count: simplified.length,
          expiresAt,
          durationMs: Date.now() - startTime,
        },
        'Successfully refreshed Privy users cache',
      );
    });

    return {
      success: true,
      recordsUpdated: simplified.length,
      lastRefresh: now,
      expiresAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // If it's a lock conflict, that's not really an error
    if (errorMessage.includes('Could not acquire lock')) {
      logger.debug(
        'Privy cache refresh skipped - another process is refreshing',
      );
      const status = await getPrivyCacheStatus();
      return {
        success: false,
        recordsUpdated: 0,
        lastRefresh: status.lastRefresh || new Date(0),
        expiresAt: status.expiresAt || new Date(0),
        error: 'Another refresh in progress',
      };
    }

    logger.error({ error }, 'Failed to refresh Privy users cache');
    return {
      success: false,
      recordsUpdated: 0,
      lastRefresh: new Date(0),
      expiresAt: new Date(0),
      error: errorMessage,
    };
  }
}
