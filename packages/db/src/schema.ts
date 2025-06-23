/**
 * Database schema definition for the Namefi application.
 * Note: Currently maintained in a single file for simplicity.
 * Consider splitting into multiple files if schema grows significantly.
 */

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { recordTypeEnum } from '@namefi-astra/zod-dns';
import { asc, eq, getTableColumns, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Common table columns for timestamp tracking
 * @property {timestamp} createdAt - When the record was created
 * @property {timestamp} updatedAt - When the record was last updated
 */
const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * Common columns for domain name storage
 * @property {text} normalizedDomainName - Normalized domain name in Namefi format
 * @see @namefi-astra/packages/utils/src/domain-name.ts
 */
const normalizedDomain = {
  /**
   * Namefi's normalized domain format:
   * - Lowercase FQDN without terminating dot
   * - Allows letters, digits, and hyphens
   * - Stores full domain (subdomain.domain.tld)
   */
  normalizedDomainName: text('normalized_domain_name').notNull(),
};

const randomUuid = {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
};

const amountInUsdCents = {
  amountInUSDCents: integer('amount_in_usd_cents').notNull(),
};

/**
 * Basic status values shared across multiple status enums
 */
const basicStatusValues = [
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;

/**
 * Creates a PostgreSQL enum with consistent ordering
 * @template T - Type of custom status values
 * @param name - Name of the enum in the database
 * @param customValues - Additional status values specific to this enum
 * @returns PostgreSQL enum with basic statuses followed by custom statuses
 */
const createStatusEnum = <T extends string>(
  name: string,
  customValues: readonly T[],
) => {
  return pgEnum(name, [...basicStatusValues, ...customValues] as const);
};

export const orderStatusEnum = createStatusEnum('order_status', [
  'PARTIALLY_COMPLETED',
] as const);

export const paymentStatusEnum = createStatusEnum('payment_status', [
  'REFUND_REQUESTED',
  'REQUIRES_CAPTURE',
] as const);

export const refundStatusEnum = createStatusEnum('refund_status', [
  'REQUIRES_ACTION',
] as const);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'STRIPE',
] as const);

/**
 * Users table
 * Stores basic user information
 */
export const usersTable = pgTable('users', {
  ...randomUuid,
  primaryEmail: text('primary_email').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  privyUserId: text('privy_user_id').notNull().unique(),
  ...timestamps,
});

export const itemTypeEnum = pgEnum('item_type', [
  'REGISTER',
  'IMPORT',
] as const);

/**
 * Cart items table
 * Stores individual items in a shopping cart
 */
export const cartItemsTable = pgTable(
  'cart_items',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    ...normalizedDomain,
    ...amountInUsdCents,
    durationInYears: integer('duration_in_years').notNull(),
    type: itemTypeEnum('type').notNull(),
    encryptionKeyId: text('encryption_key_id'),
    encryptedEppAuthorizationCode: text('encrypted_epp_authorization_code'),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    unique('cart_items_user_id_domain_unique').on(
      table.userId,
      table.normalizedDomainName,
    ),
    index('cart_items_user_id_idx').on(table.userId),
  ],
);

/**
 * Payments table
 * Stores payment transactions
 */
export const paymentsTable = pgTable(
  'payments',
  {
    ...randomUuid,
    ...amountInUsdCents,
    status: paymentStatusEnum('status').notNull().default('CREATED'),
    paymentProvider: paymentProviderEnum('payment_provider').notNull(),
    paymentProviderReferenceId: text('payment_provider_reference_id'),
    nfscPaymentDetails: jsonb('nfsc_payment_details').$type<{
      chainId: number;
      walletAddress: string;
    }>(),
    stripePaymentDetails: jsonb('stripe_payment_details').$type<{
      paymentMethodId?: string;
    }>(),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('payments_status_idx').on(table.status),
    unique('payments_provider_reference_unique').on(
      table.paymentProviderReferenceId,
    ),
  ],
);

/**
 * Refunds table
 * Stores refund transactions linked to payments
 */
export const refundsTable = pgTable(
  'refunds',
  {
    ...randomUuid,
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => paymentsTable.id, { onDelete: 'cascade' }),
    ...amountInUsdCents,
    status: refundStatusEnum('status').notNull().default('CREATED'),
    paymentProviderReferenceId: text('payment_provider_reference_id'),
    chainId: integer('chain_id'),
    walletAddress: text('wallet_address'),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('refunds_payment_id_idx').on(table.paymentId),
    index('refunds_status_idx').on(table.status),
    unique('refunds_provider_reference_unique').on(
      table.paymentProviderReferenceId,
    ),
  ],
);

/**
 * Orders table
 * Stores customer orders
 *
 * Cart vs Order differences:
 * - Cart: Mutable, OneToOne with user
 * - Order: Immutable items (except status), OneToMany with user
 */
export const ordersTable = pgTable(
  'orders',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .references(() => usersTable.id, {
        onDelete: 'set null',
      })
      .notNull(),
    status: orderStatusEnum('status').notNull().default('CREATED'),
    paymentId: uuid('payment_id')
      .references(() => paymentsTable.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    ...amountInUsdCents,
    totalAmountInUSDCents: integer('total_amount_in_usd_cents').notNull(),
    nftWalletAddress: text('nft_wallet_address').notNull(),
    nftChainId: integer('nft_chain_id').notNull(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
    /**
     * Future features:
     * - taxInUSDCents: integer("tax_in_usd_cents").notNull(),
     * - discountInUSDCents: integer("discount_in_usd_cents").notNull(),
     */
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    check(
      'total_amount_in_usd_cents_nonnegative',
      sql`total_amount_in_usd_cents >= 0`,
    ),
    index('orders_user_id_idx').on(table.userId),
    index('orders_payment_id_idx').on(table.paymentId),
    index('orders_status_idx').on(table.status),
    unique('orders_payment_id_unique').on(table.paymentId),
  ],
);

/**
 * Order items table
 * Stores individual items within an order
 */
export const orderItemsTable = pgTable(
  'order_items',
  {
    ...randomUuid,
    orderId: uuid('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    ...normalizedDomain,
    ...amountInUsdCents,
    durationInYears: integer('duration_in_years').notNull(),
    type: itemTypeEnum('type').notNull(),
    encryptionKeyId: text('encryption_key_id'),
    encryptedEppAuthorizationCode: text('encrypted_epp_authorization_code'),
    status: orderStatusEnum('status').default('CREATED'),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_status_idx').on(table.status),
  ],
);

export const recordTypePgEnum = pgEnum(
  'record_type_enum',
  recordTypeEnum.options,
);

/**
 * DNS records table
 * Stores DNS records for a given domain name
 *
 * Design discussion:
 *   We didnt create a dns_zones table because there seems to be no need for it.
 *   The ownership of a zone is tied to the NFT address, which is derived from the
 *   domain name.
 * Note the @link{normalizedDomainName} is treated as a Zone Name and is the primary key.
 * Only <subdomain> of PoweredByNamefiThirdPartyDomainName is allowed.
 * This is reistrcted at the API level.
 * Also the @link{name} field is restricted to be the <subdomain> part not the full domain name.
 */
export const dnsRecordsTable = pgTable(
  'dns_records',
  {
    ...randomUuid,
    zoneName: text('zone_name').notNull().$type<NamefiNormalizedDomain>(),
    /**
     * The owner name of this DNS record (RFC-1034 3.6, RFC-1035 3.2.1)
     *
     * This field follows RFC-1034 conventions where:
     * - For zone apex records: use "@" or empty string
     * - For subdomains: use the label only (e.g., "www" not "www.example.com")
     * - For records outside the zone: use the full name ending with "."
     *
     * Within a zone (e.g., "example.com"), a record with name "www" refers to
     * "www.example.com" and is stored in the database without the zone suffix.
     *
     * Note: Names are restricted to lowercase LDH (letters, digits, hyphens)
     * convention with additional "@" allowed for zone apex, and can include "."
     * for FQDN notation.
     */
    name: text('name').notNull().default('@'), // max 255 chars
    type: recordTypePgEnum('type').notNull(),
    class: text('class').notNull().default('IN'),
    ttl: integer('ttl').notNull().default(60),
    rdata: text('rdata').notNull(),
    metadata: jsonb('metadata').default({}).$type<any>(),
    ...timestamps,
  },
  (table) => [
    index('dns_records_domain_idx').on(table.zoneName),
    index('dns_records_name_idx').on(table.name),
    index('dns_records_type_idx').on(table.type),
    unique('dns_records_domain_name_type_class_rdata_unique').on(
      table.zoneName,
      table.name,
      table.type,
      table.class,
      table.rdata,
    ),
  ],
);

/**
 * In our specific indexer situation, for each domain name, only one chainId and one ownerAddress is possible.
 */
export const namefiNftTable = pgTable(
  'namefi_nft',
  {
    ...normalizedDomain, // is treated as an id and primary key
    chainId: integer('chain_id').notNull(),
    asOfBlockNumber: bigint('as_of_block_number', { mode: 'bigint' }).notNull(),
    ownerAddress: text('owner_address').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.normalizedDomainName] }),
    // TODO: in the future we can add an index of "parent domain" to speed up queries
    index('namefi_nft_owner_address_idx').on(table.ownerAddress),
    index('namefi_nft_chain_id_idx').on(table.chainId),
  ],
);

/**
 * Domain tags table
 * Stores individual tags for a domain name
 */
export const domainTagsTable = pgTable(
  'domain_tags',
  {
    ...randomUuid,
    ...normalizedDomain,
    tag: text('tag').notNull(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    index('domain_tags_tag_idx').on(table.tag),
    unique('domain_tags_tag_unique').on(table.normalizedDomainName, table.tag),
  ],
);

// view to get all tags for a domain name
export const domainTagsArrayView = pgView('domain_tags_array_view').as((qb) =>
  qb
    .select({
      normalizedDomainName: domainTagsTable.normalizedDomainName,
      tags: sql<string>`array_agg(${domainTagsTable.tag})`.as('tags'),
    })
    .from(domainTagsTable)
    .groupBy(domainTagsTable.normalizedDomainName)
    .orderBy(asc(domainTagsTable.normalizedDomainName)),
);

// view to join domain tags with nft
export const domainTagsWithNftView = pgView('domain_tags_with_nft_view').as(
  (qb) =>
    qb
      .select({
        tag: domainTagsTable.tag,
        ...getTableColumns(namefiNftTable),
      })
      .from(domainTagsTable)
      .leftJoin(
        namefiNftTable,
        eq(
          domainTagsTable.normalizedDomainName,
          namefiNftTable.normalizedDomainName,
        ),
      )
      .orderBy(
        asc(namefiNftTable.chainId),
        asc(domainTagsTable.normalizedDomainName),
      ),
);

// view to join domain tags with nft and order items
export const domainTagsWithNftAndOrderItemsView = pgView(
  'domain_tags_with_nft_and_order_items_view',
).as((qb) =>
  qb
    .select({
      tag: domainTagsTable.tag,
      chainId: namefiNftTable.chainId,
      ownerAddress: namefiNftTable.ownerAddress,
      asOfBlockNumber: namefiNftTable.asOfBlockNumber,
      ...getTableColumns(orderItemsTable),
      orderStatus: sql<string>`orders.status`.as('order_status'),
      orderUserId: sql<string>`orders.user_id`.as('order_user_id'),
      orderPaymentId: sql<string>`orders.payment_id`.as('order_payment_id'),
    })
    .from(domainTagsTable)
    .leftJoin(
      namefiNftTable,
      eq(
        domainTagsTable.normalizedDomainName,
        namefiNftTable.normalizedDomainName,
      ),
    )
    .leftJoin(
      orderItemsTable,
      eq(
        domainTagsTable.normalizedDomainName,
        orderItemsTable.normalizedDomainName,
      ),
    )
    .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .orderBy(
      asc(orderItemsTable.createdAt),
      asc(domainTagsTable.normalizedDomainName),
    ),
);

/**
 * Domain config table
 * Stores domain config for a given domain name
 */
export const domainConfigTable = pgTable(
  'domain_config',
  {
    ...randomUuid,
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    /**
     * @note: dnssec_enabled is defaulted to false, because it needs to be setup correctly before it can be enabled (enableDnssecWorkflow)
     */
    dnssecEnabled: boolean('dnssec_enabled').notNull().default(false),
    autoEnsEnabled: boolean('auto_ens_enabled').notNull().default(true),
    autoParkEnabled: boolean('auto_park_enabled').notNull().default(true),
    forwardTo: text('forward_to'),
    ...timestamps,
  },
  (table) => [
    index('domain_config_domain_idx').on(table.normalizedDomainName),
    unique('domain_config_domain_unique').on(table.normalizedDomainName),
  ],
);

/**
 * Domain user preferences table
 * Stores user preferences for a given domain name
 */
export const domainUserPreferencesTable = pgTable(
  'domain_user_preferences',
  {
    ...randomUuid,
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    /**
     * @note: auto_renew_enabled is defaulted to false, because the nft could be transferred to another wallet and inflict charges on another user
     */
    autoRenewEnabled: boolean('auto_renew_enabled').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('domain_user_preferences_domain_idx').on(table.normalizedDomainName),
    index('domain_user_preferences_user_id_idx').on(table.userId),
    unique('domain_user_preferences_domain_user_id_unique').on(
      table.normalizedDomainName,
      table.userId,
    ),
  ],
);

export const aiGenerationTypeEnum = pgEnum('ai_generation_type', [
  'logo',
  'marketing',
] as const);

export const aiGenerationsTable = pgTable(
  'ai_generations',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    domain: text('domain').notNull().$type<NamefiNormalizedDomain>(),
    type: aiGenerationTypeEnum('type').notNull(),
    referenceGenerationId: uuid('reference_generation_id'),
    tokenUsage: jsonb('token_usage')
      .$type<
        Array<{
          model: string;
          inputTokens: number;
          outputTokens: number;
        }>
      >()
      .notNull()
      .default([]),
    input: jsonb('input').notNull().$type<
      | {
          type: 'logo';
          logoType: string;
          logoStyle: string;
          description?: string;
        }
      | {
          type: 'marketing';
          description?: string;
        }
    >(),
    output: jsonb('output').notNull().$type<
      | {
          type: 'logo';
          url: string;
          externalId?: string;
        }
      | {
          type: 'marketing';
          url: string;
          externalId?: string;
        }
    >(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    index('ai_generations_user_domain_type_idx').on(
      table.userId,
      table.domain,
      table.type,
    ),
    index('ai_generations_user_domain_created_idx').on(
      table.userId,
      table.domain,
      table.createdAt,
    ),
    foreignKey({
      columns: [table.referenceGenerationId],
      foreignColumns: [table.id],
      name: 'ai_generations_reference_generation_fk',
    }).onDelete('set null'),
  ],
);
