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
