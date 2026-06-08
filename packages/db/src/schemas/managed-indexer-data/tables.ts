import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  check,
  index,
  integer,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Schema for storing on-chain data synced from a remote Ponder indexer.
 * This provides actual tables that can be written to, unlike the views
 * in indexed_onchain_data which point to Ponder's tables.
 */
export const managedIndexerDataSchema = pgSchema('managed_indexer_data');

/**
 * NamefiNft table - stores current state of NameFI NFTs
 * Synced from Ponder's NamefiNft table
 */
export const managedNamefiNftTable = managedIndexerDataSchema.table(
  'NamefiNft',
  {
    tokenId: numeric('token_id', { precision: 78, scale: 0 }).notNull(),
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    expirationTimeInSeconds: numeric('expiration_time_in_seconds', {
      precision: 78,
      scale: 0,
    }).notNull(),
    isLocked: boolean('is_locked').default(false),
    ownerAddress: text('owner_address').notNull(),
    chainId: integer('chain_id').notNull(),
    lastUpdatedBlock: numeric('last_updated_block', {
      precision: 78,
      scale: 0,
    }).notNull(),
    lastUpdatedTimestamp: numeric('last_updated_timestamp', {
      precision: 78,
      scale: 0,
    }).notNull(),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tokenId, table.chainId] }),
    index('managed_namefi_nft_is_locked_idx').on(table.isLocked),
    index('managed_namefi_nft_owner_address_idx').on(table.ownerAddress),
    index('managed_namefi_nft_chain_id_idx').on(table.chainId),
    uniqueIndex('managed_namefi_nft_chain_domain_unique_idx').on(
      table.chainId,
      table.normalizedDomainName,
    ),
    index('managed_namefi_nft_last_updated_block_idx').on(
      table.lastUpdatedBlock,
    ),
  ],
);

/**
 * BurnedNamefiNftLog table - stores burned NFT events
 * Synced from Ponder's BurnedNamefiNftLog table
 */
export const managedBurnedNamefiNftLogTable = managedIndexerDataSchema.table(
  'BurnedNamefiNftLog',
  {
    tokenId: numeric('token_id', { precision: 78, scale: 0 }).notNull(),
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    fromAddress: text('from_address').notNull(),
    chainId: integer('chain_id').notNull(),
    burnedBlock: numeric('burned_block', { precision: 78, scale: 0 }).notNull(),
    burnedTimestamp: numeric('burned_timestamp', {
      precision: 78,
      scale: 0,
    }).notNull(),
    transactionHash: text('transaction_hash').notNull(),
    expirationTimeAtBurn: numeric('expiration_time_at_burn', {
      precision: 78,
      scale: 0,
    }).notNull(),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.tokenId, table.chainId, table.burnedBlock],
    }),
    index('managed_burned_nft_chain_id_idx').on(table.chainId),
    index('managed_burned_nft_from_address_idx').on(table.fromAddress),
    index('managed_burned_nft_burned_block_idx').on(table.burnedBlock),
  ],
);

/**
 * TransferLog table - stores NFT transfer events
 * Synced from Ponder's TransferLog table
 */
export const managedTransferLogTable = managedIndexerDataSchema.table(
  'TransferLog',
  {
    tokenId: numeric('token_id', { precision: 78, scale: 0 }).notNull(),
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    fromAddress: text('from_address').notNull(),
    toAddress: text('to_address').notNull(),
    chainId: integer('chain_id').notNull(),
    blockNumber: numeric('block_number', { precision: 78, scale: 0 }).notNull(),
    blockTimestamp: numeric('block_timestamp', {
      precision: 78,
      scale: 0,
    }).notNull(),
    transactionHash: text('transaction_hash').notNull(),
    isBurn: boolean('is_burn').default(false),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.tokenId,
        table.chainId,
        table.blockNumber,
        table.transactionHash,
      ],
    }),
    index('managed_transfer_log_chain_id_idx').on(table.chainId),
    index('managed_transfer_log_from_address_idx').on(table.fromAddress),
    index('managed_transfer_log_to_address_idx').on(table.toAddress),
    index('managed_transfer_log_block_number_idx').on(table.blockNumber),
    index('managed_transfer_log_is_burn_idx').on(table.isBurn),
  ],
);

/**
 * ExpirationChangeLog table - stores expiration change events
 * Synced from Ponder's ExpirationChangeLog table
 */
export const managedExpirationChangeLogTable = managedIndexerDataSchema.table(
  'ExpirationChangeLog',
  {
    tokenId: numeric('token_id', { precision: 78, scale: 0 }).notNull(),
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    previousExpiration: numeric('previous_expiration', {
      precision: 78,
      scale: 0,
    }).notNull(),
    newExpiration: numeric('new_expiration', {
      precision: 78,
      scale: 0,
    }).notNull(),
    changedBy: text('changed_by').notNull(),
    chainId: integer('chain_id').notNull(),
    blockNumber: numeric('block_number', { precision: 78, scale: 0 }).notNull(),
    blockTimestamp: numeric('block_timestamp', {
      precision: 78,
      scale: 0,
    }).notNull(),
    transactionHash: text('transaction_hash').notNull(),
    source: text('source').notNull().default('event'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.tokenId,
        table.chainId,
        table.blockNumber,
        table.transactionHash,
      ],
    }),
    index('managed_expiration_log_chain_id_idx').on(table.chainId),
    index('managed_expiration_log_changed_by_idx').on(table.changedBy),
    index('managed_expiration_log_block_number_idx').on(table.blockNumber),
  ],
);

/**
 * Sync checkpoints table - tracks sync progress for incremental updates
 */
export const syncCheckpointsTable = managedIndexerDataSchema.table(
  'sync_checkpoints',
  {
    tableName: text('table_name').primaryKey(),
    lastSyncedBlock: numeric('last_synced_block', {
      precision: 78,
      scale: 0,
    }).notNull(),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
    }).defaultNow(),
    recordsSynced: bigint('records_synced', { mode: 'number' }).default(0),
  },
);

/**
 * The kind of pending on-chain NFT operation a row in {@link inFlightNftTxTable}
 * represents. Each value owns the NFT field(s) it overrides while the operation
 * is in flight:
 * - `MINTING` establishes the base row (ownerAddress + expirationTimeInSeconds + isLocked=false)
 * - `CHANGING_EXPIRATION` overrides only expirationTimeInSeconds
 * - `CHANGING_LOCK` overrides only isLocked
 */
export type InFlightNftChangeType =
  | 'MINTING'
  | 'CHANGING_EXPIRATION'
  | 'CHANGING_LOCK';

/** Lifecycle of a single in-flight NFT transaction row. */
export type InFlightNftTxStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/**
 * InFlightNftTx — append-style log of optimistic, expected NFT state for
 * on-chain operations that have been deferred to run non-blocking in the
 * background (mint on register/import, expiration change on renew/extend, lock
 * change on export prep).
 *
 * ONE ROW PER PENDING OPERATION (not per domain): multiple operations can be in
 * flight on the same domain concurrently (e.g. an unconfirmed mint while the
 * user extends expiration). Rows for a given `(chainId, normalizedDomainName)`
 * are collapsed into one effective "pending NFT" via field-level last-write-wins
 * (ordered by `createdAt, seq`) before being overlaid onto the real
 * {@link managedNamefiNftTable} state — see `namefi-nft-with-pending.ts`.
 *
 * App-written (by `in-flight-nft-tx.activities.ts`), NOT Ponder-synced. Lives in
 * `managed_indexer_data` so the overlay references it via a fixed Drizzle object
 * regardless of the env-dependent `nftIndexSchema` swap used for the real NFT side.
 */
export const inFlightNftTxTable = managedIndexerDataSchema.table(
  'in_flight_nft_tx',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    chainId: integer('chain_id').notNull(),
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    // Synthesized at insert via `getTokenIdFromDomainName` so a MINTING-only row
    // (no real NamefiNft row yet) carries the same tokenId Ponder will produce.
    tokenId: numeric('token_id', { precision: 78, scale: 0 }).notNull(),
    changeType: text('change_type').notNull().$type<InFlightNftChangeType>(),
    // Field-override columns — nullable so the collapse fold can take the
    // "latest non-null value per field". A row only sets the field(s) its
    // changeType owns; the rest stay NULL and fall through to the real NFT row.
    ownerAddress: text('owner_address'),
    expirationTimeInSeconds: numeric('expiration_time_in_seconds', {
      precision: 78,
      scale: 0,
    }),
    isLocked: boolean('is_locked'),
    status: text('status')
      .notNull()
      .default('PENDING')
      .$type<InFlightNftTxStatus>(),
    // Real on-chain hash once the op resolves; the collapsed overlay still emits
    // '0x0' as a placeholder while any row for the domain is PENDING.
    txHash: text('tx_hash'),
    workflowId: text('workflow_id').notNull(),
    runId: text('run_id'),
    // Monotonic tiebreaker for rows sharing a `createdAt`; the fold orders by
    // `(createdAt, seq)` so field-level last-write-wins is deterministic.
    seq: bigserial('seq', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('in_flight_nft_tx_domain_status_idx').on(
      table.chainId,
      table.normalizedDomainName,
      table.status,
    ),
    index('in_flight_nft_tx_status_idx').on(table.status),
    index('in_flight_nft_tx_expires_at_idx').on(table.expiresAt),
    // Idempotency: a retried/replayed workflow re-inserts with
    // `onConflictDoNothing` and creates no duplicate PENDING row. Scoped to
    // PENDING so a later op reusing the same workflowId (after the prior one
    // resolved) can still insert a fresh row.
    uniqueIndex('in_flight_nft_tx_workflow_change_pending_unique_idx')
      .on(table.workflowId, table.changeType)
      .where(sql`${table.status} = 'PENDING'`),
    // Constrain to the closed sets the overlay fold + workflow idempotency
    // depend on; a bad write here would corrupt pending-state folding.
    check(
      'in_flight_nft_tx_change_type_check',
      sql`${table.changeType} IN ('MINTING', 'CHANGING_EXPIRATION', 'CHANGING_LOCK')`,
    ),
    check(
      'in_flight_nft_tx_status_check',
      sql`${table.status} IN ('PENDING', 'CONFIRMED', 'FAILED')`,
    ),
  ],
);

// Type exports
export type ManagedNamefiNft = typeof managedNamefiNftTable.$inferSelect;
export type ManagedNamefiNftInsert = typeof managedNamefiNftTable.$inferInsert;

export type InFlightNftTx = typeof inFlightNftTxTable.$inferSelect;
export type InFlightNftTxInsert = typeof inFlightNftTxTable.$inferInsert;

export type ManagedBurnedNamefiNftLog =
  typeof managedBurnedNamefiNftLogTable.$inferSelect;
export type ManagedBurnedNamefiNftLogInsert =
  typeof managedBurnedNamefiNftLogTable.$inferInsert;

export type ManagedTransferLog = typeof managedTransferLogTable.$inferSelect;
export type ManagedTransferLogInsert =
  typeof managedTransferLogTable.$inferInsert;

export type ManagedExpirationChangeLog =
  typeof managedExpirationChangeLogTable.$inferSelect;
export type ManagedExpirationChangeLogInsert =
  typeof managedExpirationChangeLogTable.$inferInsert;

export type SyncCheckpoint = typeof syncCheckpointsTable.$inferSelect;
export type SyncCheckpointInsert = typeof syncCheckpointsTable.$inferInsert;
