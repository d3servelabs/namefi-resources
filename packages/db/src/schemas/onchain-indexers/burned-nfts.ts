import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { sql } from 'drizzle-orm';
import { pgView, QueryBuilder, timestamp } from 'drizzle-orm/pg-core';
import { db } from '../../client';
import { bigint, integer, text } from 'drizzle-orm/pg-core';

/**
 * A temporary view to map a timestamp to a timestamp
 */
const mapper = pgView('mapper', {
  time: timestamp('time_mapper').notNull(),
}).existing();
const qb = new QueryBuilder();

/**
 * [REPLACE WITH CTE]
 * BurnedNamefiNftView - View for accessing burned NFT logs from indexer
 * This view provides access to historical burn events from the ponder indexer.
 *
 * Note: View is created manually in SQL, this is just the Drizzle type definition.
 */
export const burnedNamefiNftCte = qb.$with('burned_namefi_nft_cte').as((qb) => {
  return qb
    .select({
      tokenId: sql<bigint>`token_id`.as('token_id'),
      normalizedDomainName:
        sql<NamefiNormalizedDomain>`normalized_domain_name`.as(
          'normalized_domain_name',
        ),
      fromAddress: sql<string>`from_address`.as('from_address'),
      chainId: sql<number>`chain_id`.as('chain_id'),
      burnedBlock: sql<bigint>`burned_block`.as('burned_block'),
      burnedTimestamp: sql<bigint>`burned_timestamp`.as('burned_timestamp'),
      burnedTime: sql<Date>`to_timestamp(burned_timestamp)`
        .mapWith(mapper.time)
        .as('burned_time'),
      transactionHash: sql<string>`transaction_hash`.as('transaction_hash'),
    })
    .from(sql`indexed_onchain_data."BurnedNamefiNftLog"`);
});

/**
 * [REPLACED WITH CTE] (deprecated view)
 * This is a workaround because drizzle does not handle column disambiguation correctly with CTEs.
 * We need to create a view to avoid column name conflicts.
 * @deprecated This view is deprecated and will be removed in the future.
 * @see burnedNamefiNftCte for the new CTE.
 * you still need to include the CTE in the query like this:
 * ```typescript
 * const result = await db
 *   .with(burnedNamefiNftCte)
 *   .select()
 *   .from(burnedNamefiNftView)
 *   .limit(1);
 * ```
 */
export const burnedNamefiNftView = pgView('burned_namefi_nft_cte', {
  tokenId: bigint('token_id', { mode: 'bigint' }).notNull(),
  normalizedDomainName: text('normalized_domain_name')
    .notNull()
    .$type<NamefiNormalizedDomain>(),
  fromAddress: text('from_address').notNull(),
  chainId: integer('chain_id').notNull(),
  burnedBlock: bigint('burned_block', { mode: 'bigint' }).notNull(),
  burnedTimestamp: bigint('burned_timestamp', { mode: 'bigint' }).notNull(),
  burnedTime: timestamp('burned_time').notNull(), // Derived from burnedTimestamp
  transactionHash: text('transaction_hash').notNull(),
}).existing();

async function _selectFromBurnedNamefiNftView() {
  const res = await db
    .with(burnedNamefiNftCte)
    .select()
    .from(burnedNamefiNftCte)
    .limit(1);
  return res[0];
}

export type BurnedNamefiNftSelect = Awaited<
  ReturnType<typeof _selectFromBurnedNamefiNftView>
>;
