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
  type SimplifiedPrivyUser,
} from '../../../trpc/routers/admin/privyUserCache';

const logger = createLogger({ module: 'privy-cache-activities' });

const PRIVY_CACHE_TABLE_NAME = 'privy_users_cache';
const PRIVY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PRIVY_REFRESH_LOCK_ID = 1234567890;

/**
 * SQL escape helper for string literals in raw SQL
 * Doubles single quotes to prevent SQL injection
 */
function escapeSqlLiteral(input: string): string {
  return input.replace(/'/g, "''");
}

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
    logger.info('Fetching fresh Privy user data');
    const simplified = await buildSimplifiedPrivyUsers();

    logger.info({ userCount: simplified.length }, 'Fetched Privy users');

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
        logger.info('Another process is refreshing Privy table, skipping');
        throw new Error('Could not acquire lock - another refresh in progress');
      }

      // Create table if it doesn't exist
      await tx.execute(sql`
        CREATE UNLOGGED TABLE IF NOT EXISTS ${sql.raw(PRIVY_CACHE_TABLE_NAME)} (
          privy_user_id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          display_name TEXT NOT NULL,
          wallets TEXT[] NOT NULL,
          expires_at TIMESTAMP NOT NULL
        )
      `);

      // Create indexes if they don't exist
      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_privy_email
        ON ${sql.raw(PRIVY_CACHE_TABLE_NAME)} (email)
      `);
      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_privy_display_name
        ON ${sql.raw(PRIVY_CACHE_TABLE_NAME)} (display_name)
      `);
      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_privy_wallets
        ON ${sql.raw(PRIVY_CACHE_TABLE_NAME)} USING GIN (wallets)
      `);
      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_privy_expires_at
        ON ${sql.raw(PRIVY_CACHE_TABLE_NAME)} (expires_at)
      `);

      // Truncate and insert fresh data
      await tx.execute(sql`TRUNCATE ${sql.raw(PRIVY_CACHE_TABLE_NAME)}`);

      // Insert all users
      if (simplified.length > 0) {
        const valuesRows = simplified.map((u) => {
          const walletsArray = u.wallets.length
            ? `ARRAY[${u.wallets.map((w) => `'${escapeSqlLiteral(w)}'`).join(',')}]`
            : 'ARRAY[]::text[]';
          return `('${escapeSqlLiteral(u.privyUserId)}','${escapeSqlLiteral(u.email)}','${escapeSqlLiteral(
            u.displayName,
          )}', ${walletsArray}, '${expiresAt.toISOString()}')`;
        });

        await tx.execute(sql`
          INSERT INTO ${sql.raw(PRIVY_CACHE_TABLE_NAME)}
            (privy_user_id, email, display_name, wallets, expires_at)
          VALUES ${sql.raw(valuesRows.join(','))}
        `);
      }

      logger.info(
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
