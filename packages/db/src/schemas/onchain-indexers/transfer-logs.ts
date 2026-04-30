import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  integer,
  pgView,
  QueryBuilder,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { db } from '../../client';
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
 * TransferLogsView - View for accessing transfer logs from indexer
 * This view provides access to historical burn/mint/transfer events from the
 * ponder indexer.
 *
 * Note: View is created manually in SQL, this is just the Drizzle type definition.
 */
export const transferLogsCte = qb.$with('transfer_logs_cte').as((qb) => {
  return qb
    .select({
      tokenId: sql<bigint>`token_id`.as('token_id'),
      normalizedDomainName:
        sql<NamefiNormalizedDomain>`normalized_domain_name`.as(
          'normalized_domain_name',
        ),
      fromAddress: sql<string>`from_address`.as('from_address'),
      toAddress: sql<string>`to_address`.as('to_address'),
      chainId: sql<number>`chain_id`.as('chain_id'),

      blockNumber: sql<bigint>`block_number`.as('block_number'),
      blockTimestamp: sql<bigint>`block_timestamp`.as('block_timestamp'),
      blockTime: sql<Date>`to_timestamp(block_timestamp)`
        .mapWith(mapper.time)
        .as('block_time'),
      isBurn: sql<boolean>`is_burn`.as('is_burn'),
      isMint:
        sql<boolean>`from_address = '0x0000000000000000000000000000000000000000'`.as(
          'is_mint',
        ),
      transactionHash: sql<string>`transaction_hash`.as('transaction_hash'),
    })
    .from(sql`${nftIndexSchema}."TransferLog"`);
});

/**
 * [REPLACED WITH CTE] (deprecated view)
 * This is a workaround because drizzle does not handle column disambiguation
 * correctly with CTEs. We expose the CTE alias as a typed view so callers can
 * select columns through it without losing type info.
 * @deprecated This view is deprecated and will be removed in the future.
 * @see transferLogsCte for the new CTE.
 * you still need to include the CTE in the query like this:
 * ```typescript
 * const result = await db
 *   .with(transferLogsCte)
 *   .select()
 *   .from(transferLogsView)
 *   .limit(1);
 * ```
 */
export const transferLogsView = pgView('transfer_logs_cte', {
  tokenId: bigint('token_id', { mode: 'bigint' }).notNull(),
  normalizedDomainName: text('normalized_domain_name')
    .notNull()
    .$type<NamefiNormalizedDomain>(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  chainId: integer('chain_id').notNull(),
  blockNumber: bigint('block_number', { mode: 'bigint' }).notNull(),
  blockTimestamp: bigint('block_timestamp', { mode: 'bigint' }).notNull(),
  blockTime: timestamp('block_time').notNull(),
  isBurn: boolean('is_burn').notNull(),
  isMint: boolean('is_mint').notNull(),
  transactionHash: text('transaction_hash').notNull(),
}).existing();

async function _selectFromTransferLogsView() {
  const res = await db
    .with(transferLogsCte)
    .select()
    .from(transferLogsCte)
    .limit(10);
  return res[0];
}

export type TransferLogsSelect = Awaited<
  ReturnType<typeof _selectFromTransferLogsView>
>;
