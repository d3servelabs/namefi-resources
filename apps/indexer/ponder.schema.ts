import { index, onchainTable, primaryKey, uniqueIndex } from 'ponder';

export const NamefiNft = onchainTable(
  'NamefiNft',
  (t) => ({
    tokenId: t.bigint().notNull(),
    normalizedDomainName: t.text().notNull(),
    expirationTimeInSeconds: t.bigint().notNull(), // Unix timestamp
    isLocked: t.boolean().default(false),
    ownerAddress: t.text().notNull(),
    chainId: t.integer().notNull(),
    // Metadata fields for tracking updates
    lastUpdatedBlock: t.bigint().notNull(),
    lastUpdatedTimestamp: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.tokenId, table.chainId] }),
    isLocked: index('is_locked_index').on(table.isLocked),
    ownerAddress: index('owner_address_index').on(table.ownerAddress),
    chainId: index('chain_id_index').on(table.chainId),
    normalizedDomainName: uniqueIndex(
      'chain_id_normalized_domain_name_unique_index',
    ).on(table.chainId, table.normalizedDomainName),
  }),
);

export const BurnedNamefiNftLog = onchainTable(
  'BurnedNamefiNftLog',
  (t) => ({
    tokenId: t.bigint().notNull(),
    normalizedDomainName: t.text().notNull(),
    fromAddress: t.text().notNull(), // The address that burned the token
    chainId: t.integer().notNull(),
    burnedBlock: t.bigint().notNull(), // Block number when burned
    burnedTimestamp: t.bigint().notNull(), // Timestamp when burned
    transactionHash: t.text().notNull(), // Transaction hash of the burn
    expirationTimeAtBurn: t.bigint().notNull(), // Expiration time at the moment of burn
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.tokenId, table.chainId, table.burnedBlock],
    }),
    chainId: index('burned_chain_id_index').on(table.chainId),
    fromAddress: index('burned_from_address_index').on(table.fromAddress),
    burnedBlock: index('burned_block_index').on(table.burnedBlock),
  }),
);

export const TransferLog = onchainTable(
  'TransferLog',
  (t) => ({
    tokenId: t.bigint().notNull(),
    normalizedDomainName: t.text().notNull(),
    fromAddress: t.text().notNull(), // Address transferring from
    toAddress: t.text().notNull(), // Address transferring to
    chainId: t.integer().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
    transactionHash: t.text().notNull(),
    isBurn: t.boolean().default(false), // Marks if this was a burn
  }),
  (table) => ({
    pk: primaryKey({
      columns: [
        table.tokenId,
        table.chainId,
        table.blockNumber,
        table.transactionHash,
      ],
    }),
    chainId: index('transfer_chain_id_index').on(table.chainId),
    fromAddress: index('transfer_from_address_index').on(table.fromAddress),
    toAddress: index('transfer_to_address_index').on(table.toAddress),
    blockNumber: index('transfer_block_number_index').on(table.blockNumber),
    isBurn: index('transfer_is_burn_index').on(table.isBurn),
  }),
);

export const ExpirationChangeLog = onchainTable(
  'ExpirationChangeLog',
  (t) => ({
    tokenId: t.bigint().notNull(),
    normalizedDomainName: t.text().notNull(),
    previousExpiration: t.bigint().notNull(), // Old expiration time
    newExpiration: t.bigint().notNull(), // New expiration time
    changedBy: t.text().notNull(), // Address that made the change
    chainId: t.integer().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
    transactionHash: t.text().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [
        table.tokenId,
        table.chainId,
        table.blockNumber,
        table.transactionHash,
      ],
    }),
    chainId: index('expiration_chain_id_index').on(table.chainId),
    changedBy: index('expiration_changed_by_index').on(table.changedBy),
    blockNumber: index('expiration_block_number_index').on(table.blockNumber),
  }),
);
