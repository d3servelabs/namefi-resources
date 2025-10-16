import { db, namefiNftView, usersTable } from '@namefi-astra/db';
import { sql, eq, or, type SQL } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { privyClient } from '../../utils';
import { logger } from '#lib/logger';

/**
 * Unlogged table for Privy user cache
 * This replaces the on-the-fly CTE approach with a persistent temporary table
 *
 * UNLOGGED tables in PostgreSQL:
 * - Not written to WAL (Write-Ahead Log), making writes faster
 * - Not crash-safe (data lost on server crash, but acceptable for cache)
 * - Perfect for temporary data that can be regenerated
 *
 * Benefits over CTE approach:
 * - No need to send full dataset with every query
 * - Can be indexed for faster searches
 * - Reduced network overhead and query size
 *
 * Refresh strategy:
 * - Check expiration before each query
 * - DROP and recreate when expired (5 minute TTL)
 * - Atomic recreation to avoid race conditions
 */
const PRIVY_CACHE_TABLE_NAME = 'privy_users_cache';

const privyUsersTableSchema = pgTable(PRIVY_CACHE_TABLE_NAME, {
  // Primary identifier from Privy
  privyUserId: text('privy_user_id').primaryKey().notNull(),

  // User contact information
  email: text('email').notNull(),

  // Display name (typically derived from email prefix)
  displayName: text('display_name').notNull(),

  // Array of Ethereum wallet addresses associated with this user
  // Includes both main wallet and linked wallets
  wallets: text('wallets').array().notNull(),

  // When this cached data expires and should be refreshed
  // Stored in the table so we can query it directly
  expiresAt: timestamp('expires_at').notNull(),
});

/**
 * Cache TTL is 5 minutes to balance freshness with API call reduction
 */
const PRIVY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Per-user cache storing individual Privy user objects
 * Key format: `privy:${privyUserId}`
 * Still used for single-user lookups
 */
const privyUserCache = new Map<string, { value: any; expiresAt: number }>();

/**
 * Cache for all Privy users (used for table population)
 * Cached as a single array to avoid repeated full-list fetches
 */
const allPrivyUsersCache: { value: any[]; expiresAt: number } = {
  value: [],
  expiresAt: 0,
};

/**
 * Advisory lock ID for Privy table refresh operations
 * Using a unique hash to avoid conflicts with other advisory locks
 * Hash derived from table name: privy_users_cache
 */
const PRIVY_REFRESH_LOCK_ID = 1234567890;

/**
 * Fetches a single Privy user by ID with caching
 * Returns null if user not found or on error (non-blocking)
 */
async function getPrivyUserCached(privyUserId: string): Promise<any | null> {
  try {
    const now = Date.now();
    const key = `privy:${privyUserId}`;
    const cached = privyUserCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }
    const user = await privyClient.getUserById(privyUserId);
    privyUserCache.set(key, {
      value: user,
      expiresAt: now + PRIVY_CACHE_TTL_MS,
    });
    return user;
  } catch (error) {
    logger.warn(
      { privyUserId, error },
      'Failed to fetch Privy user; continuing',
    );
    return null;
  }
}

/**
 * Fetches all Privy users with caching
 * Used to build CTE for efficient user searches
 */
async function getAllPrivyUsersCached(): Promise<any[]> {
  const now = Date.now();
  if (allPrivyUsersCache.value.length && allPrivyUsersCache.expiresAt > now) {
    return allPrivyUsersCache.value;
  }
  try {
    const users = await privyClient.getUsers();
    allPrivyUsersCache.value = users;
    allPrivyUsersCache.expiresAt = now + PRIVY_CACHE_TTL_MS;
    return users;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch all Privy users');
    return [];
  }
}

/**
 * SQL escape helper for string literals in raw SQL
 * Doubles single quotes to prevent SQL injection
 */
function escapeSqlLiteral(input: string): string {
  return input.replace(/'/g, "''");
}

/**
 * Simplified user structure for CTE construction
 * Contains essential fields needed for searching and joining
 */
type SimplifiedPrivyUser = {
  privyUserId: string;
  email: string;
  displayName: string;
  wallets: string[];
};

/**
 * Builds simplified Privy user objects from raw Privy API data
 * Extracts email, wallets, and display name for efficient CTE usage
 */
async function buildSimplifiedPrivyUsers(): Promise<SimplifiedPrivyUser[]> {
  const allPrivy = await getAllPrivyUsersCached();
  return allPrivy.map((p: any) => {
    // Extract all Ethereum wallets from linked accounts
    const wallets: string[] = (p.linkedAccounts || [])
      .filter(
        (la: any) => la?.type === 'wallet' && la?.chainType === 'ethereum',
      )
      .map((la: any) => String(la.address || '').toLowerCase())
      .filter(Boolean);

    const email = String(p.email?.address || '').toLowerCase();
    // Use email prefix as display name (e.g., "john" from "john@example.com")
    const displayName = email ? email.split('@')[0] : '';

    // Include main wallet if not already in wallets array
    const mainWallet = String(p.wallet?.address || '').toLowerCase();
    if (mainWallet && !wallets.includes(mainWallet)) wallets.push(mainWallet);

    return {
      privyUserId: String(p.id || ''),
      email,
      displayName,
      wallets,
    };
  });
}
let _memoizedTableRefreshTime: Date | null = null;
/**
 * Checks if the unlogged Privy table needs refresh by querying expiresAt from table
 * Returns true if table is expired or doesn't exist
 */
async function needsTableRefresh(): Promise<boolean> {
  if (
    _memoizedTableRefreshTime &&
    _memoizedTableRefreshTime.getTime() > Date.now()
  ) {
    return false;
  }

  try {
    // Query the first row's expiresAt to check freshness
    // All rows have same expiresAt, so we only need to check one
    const result = await db
      .select({ expiresAt: privyUsersTableSchema.expiresAt })
      .from(privyUsersTableSchema)
      .limit(1);

    if (!result || result.length === 0) {
      // Table is empty or doesn't exist
      return true;
    }

    const expiresAt = new Date(result[0].expiresAt);
    _memoizedTableRefreshTime = expiresAt;
    const now = new Date();

    return expiresAt <= now;
  } catch (error) {
    // Table doesn't exist or query failed
    logger.debug({ error }, 'Table check failed, needs refresh');
    return true;
  }
}

/**
 * Creates or updates the unlogged Privy users table
 * Uses CREATE IF NOT EXISTS + UPSERT approach for better performance
 * Acquires transaction-level advisory lock to prevent concurrent refreshes
 * All operations wrapped in a transaction that auto-releases lock on commit/rollback
 */
async function ensurePrivyTableFresh(): Promise<void> {
  // Quick check before acquiring lock
  if (!(await needsTableRefresh())) {
    return;
  }

  // Get fresh Privy data before transaction (external API call)
  const simplified = await buildSimplifiedPrivyUsers();

  try {
    // Use transaction with xact advisory lock
    await db.transaction(async (tx) => {
      // Acquire transaction-level advisory lock
      // pg_try_advisory_xact_lock automatically releases on transaction end
      const lockResult = await tx.execute<{ locked: boolean }>(sql`
        SELECT pg_try_advisory_xact_lock(${PRIVY_REFRESH_LOCK_ID}) as locked
      `);

      const lockAcquired = lockResult.rows?.[0]?.locked;

      if (!lockAcquired) {
        // Another process is refreshing, skip this attempt
        logger.debug('Another process is refreshing Privy table, skipping');
        return;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + PRIVY_CACHE_TTL_MS);
      _memoizedTableRefreshTime = expiresAt;
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

      // Drop stale rows so the snapshot matches Privy exactly
      await tx.execute(sql`TRUNCATE ${sql.raw(PRIVY_CACHE_TABLE_NAME)}`);

      // Upsert all users (INSERT ... ON CONFLICT DO UPDATE)
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
          ON CONFLICT (privy_user_id)
          DO UPDATE SET
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            wallets = EXCLUDED.wallets,
            expires_at = EXCLUDED.expires_at
        `);
      }

      logger.info(
        { count: simplified.length, expiresAt },
        'Refreshed Privy users unlogged table with upsert',
      );

      // Transaction commits here, automatically releasing xact lock
    });
  } catch (error) {
    // If there's a lock conflict or another process is holding the lock, that's ok
    if (
      error instanceof Error &&
      error.message.includes('could not obtain lock')
    ) {
      logger.debug(
        'Could not obtain advisory lock, another process is refreshing',
      );
      return;
    }

    logger.error({ error }, 'Failed to refresh Privy users table');
    throw error;
  }
}

/**
 * Builds WHERE clause for searching Privy users using Drizzle ORM
 * Supports searching by:
 * - Email (ILIKE)
 * - Display name (ILIKE)
 * - Privy user ID (ILIKE)
 * - Wallets array (ILIKE ANY)
 *
 * @param term - Search term
 * @param tableRef - Optional table reference (defaults to privyUsersTableSchema)
 */
function buildPrivySearchWhereClause(
  term: string,
  tableRef = privyUsersTableSchema,
): SQL | null {
  if (!term || term.length === 0) {
    return null;
  }
  // Search across multiple fields with ILIKE
  const likeTerm = `%${term}%`;
  return or(
    sql`${tableRef.email} ILIKE ${likeTerm}`,
    sql`${tableRef.displayName} ILIKE ${likeTerm}`,
    sql`${tableRef.privyUserId} ILIKE ${likeTerm}`,
    sql`EXISTS (
      SELECT 1
      FROM unnest(${tableRef.wallets}) AS w
      WHERE w ILIKE ${likeTerm}
    )`,
  )!;
}

// Build CTE with aggregated NFT data and count
// Join wallets array with namefiNftView to get all NFTs owned by the user
const userNftsCTE = db.$with('user_nfts').as(
  db
    .select({
      userId: usersTable.id,
      nfts: sql<
        Array<{
          chainId: number;
          normalizedDomainName: string;
          tokenId: string;
          expirationTime: Date;
        }>
      >`
              COALESCE(
                json_agg(
                   json_build_object(
                    'chainId', ${namefiNftView.chainId},
                    'normalizedDomainName', ${namefiNftView.normalizedDomainName},
                    'tokenId', ${namefiNftView.tokenId}::text,
                    'expirationTime', ${namefiNftView.expirationTime}
                  )
                  ORDER BY ${namefiNftView.expirationTime} ASC
                ) FILTER (WHERE ${namefiNftView.tokenId} IS NOT NULL),
                '[]'::json
              )
            `.as('nfts'),
      nftCount: sql<number>`
              COUNT(${namefiNftView.tokenId})
            `.as('nft_count'),
    })
    .from(usersTable)
    .leftJoin(
      privyUsersTableSchema,
      eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
    )
    .leftJoin(
      namefiNftView,
      sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
    )
    .groupBy(usersTable.id),
);

export {
  privyUsersTableSchema,
  getPrivyUserCached,
  getAllPrivyUsersCached,
  buildSimplifiedPrivyUsers,
  buildPrivySearchWhereClause,
  ensurePrivyTableFresh,
  userNftsCTE,
  type SimplifiedPrivyUser,
};
