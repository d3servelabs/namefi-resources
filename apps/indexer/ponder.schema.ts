import { index, onchainTable, primaryKey, uniqueIndex } from 'ponder';

export const DomainNft = onchainTable(
  'DomainNft',
  (t) => ({
    tokenId: t.bigint().notNull(),
    domainName: t.text().notNull(),
    expirationDate: t.bigint().notNull(), // Unix timestamp
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
    domainName: uniqueIndex('chain_id_domain_name_unique_index').on(
      table.chainId,
      table.domainName,
    ),
  }),
);
