import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { eq, sql } from 'drizzle-orm';
import { pgView, QueryBuilder, timestamp } from 'drizzle-orm/pg-core';
import { db } from '../../client';
import { bigint, boolean, integer, text } from 'drizzle-orm/pg-core';
import { nftIndexSchema } from './schema-def';

/**
 * A temporary view to map a timestamp to a timestamp
 */
const mapper = pgView('mapper', {
  time: timestamp('time_mapper').notNull(),
}).existing();
const qb = new QueryBuilder();

/**
 * [REPLACED WITH CTE] (deprecated view)
 * NamefiNftView - View based on NamefiNft schema from ponder indexer
 * This view provides a stable interface to query NFT data with dates and metadata
 * from the ponder indexer, insulating the application from schema changes.
 *
 * Note: View is created manually in SQL, this is just the Drizzle type definition.
 */

export const namefiNftCte = qb.$with('namefi_nft_cte').as((qb) => {
  return qb
    .select({
      tokenId: sql<bigint>`token_id`.as('token_id'),
      normalizedDomainName:
        sql<NamefiNormalizedDomain>`normalized_domain_name`.as(
          'normalized_domain_name',
        ),
      expirationTimeInSeconds: sql<bigint>`expiration_time_in_seconds`.as(
        'expiration_time_in_seconds',
      ),
      expirationTime: sql<Date>`
    CASE WHEN expiration_time_in_seconds IS NULL
      OR expiration_time_in_seconds = 0 THEN
      NULL
    ELSE
      to_timestamp(expiration_time_in_seconds)
    END
    `
        .mapWith(mapper.time)
        .as('expiration_time'), // This is the expiration time in UTC derived from expirationTimeInSeconds
      isLocked: sql<boolean>`is_locked`.as('is_locked'),
      ownerAddress: sql<string>`owner_address`.as('owner_address'),
      chainId: sql<number>`chain_id`.as('chain_id'),
      lastUpdatedBlock: sql<bigint>`last_updated_block`.as(
        'last_updated_block',
      ),
      lastUpdatedTimestamp: sql<bigint>`last_updated_timestamp`.as(
        'last_updated_timestamp',
      ),
    })
    .from(sql`${nftIndexSchema}."NamefiNft"`);
});

/**
 * [REPLACED WITH CTE] (deprecated view)
 * This is a workaround because drizzle does not handle column disambiguation correctly with CTEs.
 * We need to create a view to avoid column name conflicts.
 * @deprecated This view is deprecated and will be removed in the future.
 * @see namefiNftCte for the new CTE.
 * you still need to include the CTE in the query like this:
 * ```typescript
 * const result = await db
 *   .with(namefiNftCte)
 *   .select()
 *   .from(namefiNftView)
 *   .limit(1);
 * ```
 */
export const namefiNftView = pgView('namefi_nft_cte', {
  tokenId: bigint('token_id', { mode: 'bigint' }).notNull(),
  normalizedDomainName: text('normalized_domain_name')
    .notNull()
    .$type<NamefiNormalizedDomain>(),
  expirationTimeInSeconds: bigint('expiration_time_in_seconds', {
    mode: 'bigint',
  }).notNull(),
  expirationTime: timestamp('expiration_time').notNull(), // This is the expiration time in UTC derived from expirationTimeInSeconds
  isLocked: boolean('is_locked').default(false),
  ownerAddress: text('owner_address').notNull(),
  chainId: integer('chain_id').notNull(), //todo change to bigint
  lastUpdatedBlock: bigint('last_updated_block', { mode: 'bigint' }).notNull(),
  lastUpdatedTimestamp: bigint('last_updated_timestamp', {
    mode: 'bigint',
  }).notNull(),
}).existing();

/**
 * [REPLACE WITH CTE]
 * NamefiNftOwnersView - Simplified view for owner-based queries
 * This view provides the essential NFT ownership data that replaces most
 * namefiNftTable queries, providing a stable interface during schema migrations.
 * Based on namefiNftView with only the essential columns for ownership queries.
 *
 * Note: View is created manually in SQL, this is just the Drizzle type definition.
 */
export const namefiNftOwnersCte = qb.$with('namefi_nft_owners_cte').as((qb) => {
  return qb
    .with(namefiNftCte)
    .select({
      normalizedDomainName: namefiNftView.normalizedDomainName,
      chainId: namefiNftView.chainId,
      ownerAddress: namefiNftView.ownerAddress,
      asOfBlockNumber: sql<bigint>`${namefiNftView.lastUpdatedBlock}`.as(
        'as_of_block_number',
      ),
    })
    .from(namefiNftView);
});

/**
 * [REPLACED WITH CTE] (deprecated view)
 * This is a workaround because drizzle does not handle column disambiguation correctly with CTEs.
 * We need to create a view to avoid column name conflicts.
 * @deprecated This view is deprecated and will be removed in the future.
 * @see namefiNftOwnersCte for the new CTE.
 * you still need to include the CTE in the query like this:
 * ```typescript
 * const result = await db
 *   .with(namefiNftOwnersCte)
 *   .select()
 *   .from(namefiNftOwnersView)
 *   .limit(1);
 * ```
 */
export const namefiNftOwnersView = pgView('namefi_nft_owners_cte', {
  normalizedDomainName: text('normalized_domain_name')
    .notNull()
    .$type<NamefiNormalizedDomain>(),
  chainId: integer('chain_id').notNull(),
  ownerAddress: text('owner_address').notNull(),
  asOfBlockNumber: bigint('as_of_block_number', { mode: 'bigint' }).notNull(),
}).existing();

async function _selectFromNamefiNftView() {
  const res = await db.with(namefiNftCte).select().from(namefiNftCte).limit(1);
  return res[0];
}

async function _selectFromNamefiNftOwnersView() {
  const res = await db
    .with(namefiNftOwnersCte)
    .select()
    .from(namefiNftOwnersCte)
    .limit(1);
  return res[0];
}

export type NamefiNftSelect = Awaited<
  ReturnType<typeof _selectFromNamefiNftView>
>;

export type NamefiNftOwnersSelect = Awaited<
  ReturnType<typeof _selectFromNamefiNftOwnersView>
>;
