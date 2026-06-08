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
import { mapper } from '../common';
import { inFlightNftTxTable } from '../managed-indexer-data/tables';
import type { InFlightNftChangeType } from '../managed-indexer-data/tables';
import { nftIndexSchema } from './schema-def';

const qb = new QueryBuilder();

/**
 * The optimistic NFT `state` exposed by {@link namefiNftView}. `IDLE`
 * means no in-flight operation; the others mirror {@link InFlightNftChangeType}.
 * When several operations are in flight at once, `state` is the single dominant
 * one (priority MINTING > CHANGING_EXPIRATION > CHANGING_LOCK); the full set is
 * in `pendingStates`.
 */
export type NamefiNftPendingState = 'IDLE' | InFlightNftChangeType;

/**
 * Placeholder tx hash surfaced by the overlay while any operation for the domain
 * is still pending. Real per-row hashes live on `in_flight_nft_tx.tx_hash`.
 */
export const PENDING_NFT_TX_HASH_PLACEHOLDER = '0x0';

/**
 * namefiNftCte / namefiNftView — the DEFAULT NFT read view: real on-chain NFT
 * state with an optimistic in-flight overlay applied, so user-facing surfaces
 * show deferred on-chain operations ("Minting…", "Updating expiration…",
 * "Updating lock…") before the Ponder indexer reflects them. Consumers that need
 * REAL, confirmed-only state (renewal-limit computation, burn/expiry jobs,
 * migration, reconciliation, metrics/anomaly reports, and on-chain ops like
 * export/burn) must instead use `committedNamefiNftCte`/`committedNamefiNftView`
 * from `./namefi-nft`.
 *
 * Shape:
 *  1. Collapse the in-flight log into ONE effective pending row per
 *     `(chainId, normalizedDomainName)` via field-level last-write-wins: for each
 *     overridable field, take the latest non-null value ordered by
 *     `(created_at, seq)`. MINTING sets owner+expiration+lock; CHANGING_EXPIRATION
 *     sets only expiration; CHANGING_LOCK sets only lock.
 *  2. FULL OUTER JOIN the real `NamefiNft` row with the collapsed pending row on
 *     `(chainId, normalizedDomainName)` and COALESCE pending-over-real per field.
 *     - MINTING with no real row yet -> a fully synthesized virtual NFT row.
 *     - CHANGING_* on an existing row -> only the pending field is overridden.
 *     - No pending row -> the real row passes through unchanged (state = IDLE).
 *
 * The real side interpolates `${nftIndexSchema}` (env-swapped to
 * `indexed_onchain_data` on preview clones) exactly like `namefiNftCte`; the
 * pending side references the fixed `managed_indexer_data.in_flight_nft_tx`
 * object, so the overlay is correct in every environment.
 */
export const namefiNftCte = qb.$with('namefi_nft_with_pending_cte').as((qb) => {
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
      expirationTime: sql<Date | null>`
          CASE WHEN expiration_time_in_seconds IS NULL
            OR expiration_time_in_seconds = 0 THEN
            NULL
          ELSE
            to_timestamp(expiration_time_in_seconds)
          END
        `
        .mapWith(mapper.time)
        .as('expiration_time'),
      isLocked: sql<boolean>`is_locked`.as('is_locked'),
      ownerAddress: sql<string>`owner_address`.as('owner_address'),
      chainId: sql<number>`chain_id`.as('chain_id'),
      lastUpdatedBlock: sql<bigint | null>`last_updated_block`.as(
        'last_updated_block',
      ),
      lastUpdatedTimestamp: sql<bigint | null>`last_updated_timestamp`.as(
        'last_updated_timestamp',
      ),
      // Dominant pending operation, or IDLE when no overlay applies.
      state: sql<NamefiNftPendingState>`state`.as('state'),
      // Full set of in-flight operations for the domain (text[]; '{}' = none).
      pendingStates: sql<InFlightNftChangeType[]>`pending_states`.as(
        'pending_states',
      ),
      // '0x0' placeholder while any operation is pending, else NULL.
      txHash: sql<string | null>`tx_hash`.as('tx_hash'),
    })
    .from(
      sql`(
          SELECT
            COALESCE(r.token_id, p.token_id)                                  AS token_id,
            COALESCE(r.normalized_domain_name, p.normalized_domain_name)      AS normalized_domain_name,
            COALESCE(p.pending_expiration_time_in_seconds, r.expiration_time_in_seconds) AS expiration_time_in_seconds,
            COALESCE(p.pending_owner_address, r.owner_address)                AS owner_address,
            COALESCE(p.pending_is_locked, r.is_locked)                        AS is_locked,
            COALESCE(r.chain_id, p.chain_id)                                  AS chain_id,
            COALESCE(r.last_updated_block, 0)                                AS last_updated_block,
            COALESCE(r.last_updated_timestamp, 0)                            AS last_updated_timestamp,
            COALESCE(p.dominant_state, 'IDLE')                               AS state,
            COALESCE(p.pending_states, '{}')                                 AS pending_states,
            CASE WHEN p.normalized_domain_name IS NOT NULL
              THEN ${PENDING_NFT_TX_HASH_PLACEHOLDER}
              ELSE NULL
            END                                                              AS tx_hash
          FROM ${nftIndexSchema}."NamefiNft" r
          FULL OUTER JOIN (
            SELECT
              chain_id,
              normalized_domain_name,
              token_id,
              owner_arr[array_length(owner_arr, 1)] AS pending_owner_address,
              exp_arr[array_length(exp_arr, 1)]     AS pending_expiration_time_in_seconds,
              lock_arr[array_length(lock_arr, 1)]   AS pending_is_locked,
              pending_states,
              dominant_state
            FROM (
              SELECT
                chain_id,
                normalized_domain_name,
                (array_agg(token_id ORDER BY created_at, seq))[1] AS token_id,
                array_agg(owner_address ORDER BY created_at, seq)
                  FILTER (WHERE owner_address IS NOT NULL)                AS owner_arr,
                array_agg(expiration_time_in_seconds ORDER BY created_at, seq)
                  FILTER (WHERE expiration_time_in_seconds IS NOT NULL)  AS exp_arr,
                array_agg(is_locked ORDER BY created_at, seq)
                  FILTER (WHERE is_locked IS NOT NULL)                   AS lock_arr,
                array_agg(DISTINCT change_type)                          AS pending_states,
                CASE
                  WHEN bool_or(change_type = 'MINTING')             THEN 'MINTING'
                  WHEN bool_or(change_type = 'CHANGING_EXPIRATION') THEN 'CHANGING_EXPIRATION'
                  WHEN bool_or(change_type = 'CHANGING_LOCK')       THEN 'CHANGING_LOCK'
                END                                                      AS dominant_state
              FROM ${inFlightNftTxTable}
              -- Include CONFIRMED rows too: a mint/expiration tx may be confirmed
              -- on-chain before the Ponder indexer reflects it. Keeping the
              -- overlay until reconciliation/TTL removes the row avoids the domain
              -- briefly disappearing (MINTING) or flickering to a stale value
              -- (CHANGING_*) in that window. Only FAILED and expired rows drop out.
              WHERE status <> 'FAILED' AND expires_at > now()
              GROUP BY chain_id, normalized_domain_name
            ) agg
          ) p
            ON r.chain_id = p.chain_id
           AND r.normalized_domain_name = p.normalized_domain_name
        ) AS namefi_nft_with_pending`,
    );
});

/**
 * Typed `.existing()` handle whose name matches {@link namefiNftCte}.
 * Query like:
 * ```ts
 * await db
 *   .with(namefiNftCte)
 *   .select()
 *   .from(namefiNftView);
 * ```
 * (Same disambiguation workaround as `committedNamefiNftView`.)
 *
 * Column types intentionally mirror `committedNamefiNftView` so the ~50 existing
 * consumers' types are unchanged by the overlay swap. Note: a MINTING-only
 * synthetic row has no real block info, so `lastUpdatedBlock` /
 * `lastUpdatedTimestamp` can transiently be null at runtime despite the
 * not-null typing (matching the pre-existing behavior of the committed view).
 */
export const namefiNftView = pgView('namefi_nft_with_pending_cte', {
  tokenId: bigint('token_id', { mode: 'bigint' }).notNull(),
  normalizedDomainName: text('normalized_domain_name')
    .notNull()
    .$type<NamefiNormalizedDomain>(),
  expirationTimeInSeconds: bigint('expiration_time_in_seconds', {
    mode: 'bigint',
  }).notNull(),
  expirationTime: timestamp('expiration_time').notNull(),
  isLocked: boolean('is_locked').default(false),
  ownerAddress: text('owner_address').notNull(),
  chainId: integer('chain_id').notNull(),
  lastUpdatedBlock: bigint('last_updated_block', { mode: 'bigint' }).notNull(),
  lastUpdatedTimestamp: bigint('last_updated_timestamp', {
    mode: 'bigint',
  }).notNull(),
  // Dominant pending operation, or IDLE when no overlay applies.
  state: text('state').$type<NamefiNftPendingState>().notNull(),
  // Full set of in-flight operations for the domain ('{}' = none).
  pendingStates: text('pending_states')
    .array()
    .$type<InFlightNftChangeType[]>(),
  // '0x0' placeholder while any operation is pending, else null.
  txHash: text('tx_hash'),
}).existing();

/**
 * namefiNftOwnersCte / namefiNftOwnersView — pending-aware owners projection,
 * mirroring `committedNamefiNftOwnersView`'s shape. This is what makes the
 * ownership guard (`assertAuthenticatedUserIsDomainOwner`) recognize a user as
 * the owner of a domain whose mint is still in flight (owner = the recipient
 * wallet). Destructive ops (export / burn / marketplace listing) must use the
 * strict `committedNamefiNftOwnersView` instead.
 */
export const namefiNftOwnersCte = qb
  .$with('namefi_nft_owners_with_pending_cte')
  .as((qb) => {
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

export const namefiNftOwnersView = pgView(
  'namefi_nft_owners_with_pending_cte',
  {
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    chainId: integer('chain_id').notNull(),
    ownerAddress: text('owner_address').notNull(),
    asOfBlockNumber: bigint('as_of_block_number', { mode: 'bigint' }).notNull(),
  },
).existing();
