import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
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

// Type exports
export type ManagedNamefiNft = typeof managedNamefiNftTable.$inferSelect;
export type ManagedNamefiNftInsert = typeof managedNamefiNftTable.$inferInsert;

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
