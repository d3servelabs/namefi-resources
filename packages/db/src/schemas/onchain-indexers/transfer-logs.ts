import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { sql } from 'drizzle-orm';
import { pgView, QueryBuilder, timestamp } from 'drizzle-orm/pg-core';
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
 * [REPLACE WITH CTE]
 * TransferLogsView - View for accessing transfer logs from indexer
 * This view provides access to historical burn events from the ponder indexer.
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
