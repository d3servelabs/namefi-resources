import { text, timestamp, jsonb, pgSchema, index } from 'drizzle-orm/pg-core';

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
export const internalSchema = pgSchema('__internal__');
export const privyUsersTableSchema = internalSchema.table(
  'privy_users',
  {
    // Primary identifier from Privy
    privyUserId: text('privy_user_id').primaryKey().notNull(),

    // User contact information
    email: text('email').notNull(),

    // Display name (typically derived from email prefix)
    displayName: text('display_name').notNull(),

    // Array of Ethereum wallet addresses associated with this user
    // Includes both main wallet and linked wallets
    wallets: text('wallets').array().notNull(),

    // Twitter/X username (for quick access and filtering)
    twitterUsername: text('twitter_username'),

    // Full Twitter account details from Privy
    twitterDetails: jsonb('twitter_details').$type<{
      username?: string;
      name?: string;
      subject?: string;
      profilePictureUrl?: string;
    }>(),

    // When this cached data expires and should be refreshed
    // Stored in the table so we can query it directly
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    index('idx_privy_email').on(table.email),
    index('idx_privy_display_name').on(table.displayName),
    index('idx_privy_wallets').using('gin', table.wallets),
    index('idx_privy_twitter_username').on(table.twitterUsername),
    index('idx_privy_expires_at').on(table.expiresAt),
  ],
);
