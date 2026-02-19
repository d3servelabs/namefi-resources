import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db } from '../../client';
import { mapper } from '../common';

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
      expirationTimeAtBurn: sql<bigint>`expiration_time_at_burn`.as(
        'expiration_time_at_burn',
      ),
      expirationTimeAtBurnDate: sql<Date>`
    CASE WHEN expiration_time_at_burn IS NULL
      OR expiration_time_at_burn = 0 THEN
      NULL
    ELSE
      to_timestamp(expiration_time_at_burn)
    END
    `
        .mapWith(mapper.time)
        .as('expiration_time_at_burn_date'),
      transactionHash: sql<string>`transaction_hash`.as('transaction_hash'),
    })
    .from(sql`indexed_onchain_data."BurnedNamefiNftLog"`);
});

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
