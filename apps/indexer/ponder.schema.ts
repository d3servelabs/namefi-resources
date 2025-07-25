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
