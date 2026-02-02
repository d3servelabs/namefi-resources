/**
 * Database schema definition for the Namefi application.
 * Note: Currently maintained in a single file for simplicity.
 * Consider splitting into multiple files if schema grows significantly.
 */

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { recordTypeValues } from '@namefi-astra/zod-dns';
import { asc, eq, getTableColumns, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  numeric,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Json } from 'drizzle-zod';
import type { Permission } from '@namefi-astra/utils';
import { z } from 'zod';

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
  normalizedDomainName: text('normalized_domain_name')
    .notNull()
    .$type<NamefiNormalizedDomain>(),
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
  /** @deprecated */
  primaryEmail: text('primary_email').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  privyUserId: text('privy_user_id').notNull().unique(),
  subscribeToEmails: boolean('subscribe_to_emails').notNull().default(true),
  lastSignInAt: timestamp('last_sign_in_at'),
  lastAccessedSessionAt: timestamp('last_accessed_session_at'),
  ...timestamps,
});

export const itemTypeEnum = pgEnum('item_type', [
  'REGISTER',
  'IMPORT',
  'RENEW',
] as const);

export const userContactsTable = pgTable('user_contacts', {
  ...randomUuid,
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  firstName: text('first_name'),
  lastName: text('last_name'),
  organizationName: text('organization_name'),
  phoneNumber: text('phone_number'),
  phoneNumberVerified: boolean('phone_number_verified'),
  email: text('email'),
  emailVerified: boolean('email_verified'),
  fax: text('fax'),
  addressLines: text('address_lines'),
  city: text('city'),
  contactType: text('contact_type'),
  countryCode: text('country_code'),
  state: text('state'),
  zipCode: text('zip_code'),
  extraParams: jsonb('extra_params'),
  ...timestamps,
});

export const feedbackResponsesTable = pgTable(
  'feedback_responses',
  {
    ...randomUuid,
    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    ipAddress: text('ip_address').notNull().default('unknown'),
    rating: integer('rating').notNull(),
    message: text('message'),
    metadata: jsonb('metadata').default({}).$type<{
      path?: string;
      poweredByNamefiDomain?: string | null;
      sessionId?: string | null;
      userAgent?: string;
      referer?: string;
    }>(),
    ...timestamps,
  },
  (table) => [
    index('feedback_user_idx').on(table.userId),
    index('feedback_ip_idx').on(table.ipAddress),
    check('feedback_rating_bounds', sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const orderMintTransactionMetadataSchema = z.object({
  txHash: z.string(),
  recordedAt: z.string(),
});

export type OrderMintTransactionMetadata = z.infer<
  typeof orderMintTransactionMetadataSchema
>;

const claimMetadataShape = {
  freeClaim: z.boolean().optional(),
  groupOrCampaignKey: z.string().optional(),
  claimId: z.string().optional(),
};

export const cartItemMetadataSchema = z.object(claimMetadataShape).loose();

export type CartItemMetadata = z.infer<typeof cartItemMetadataSchema>;

const postProcessDnsRecordSchema = z.object({
  name: z.string(),
  type: z.enum(recordTypeValues),
  rdata: z.string(),
  ttl: z.number().int().min(0).max(2147483647).optional(),
});

const postProcessOrderItemActionSchema = z.object({
  scope: z.literal('dns-records'),
  action: z.enum(['add', 'set']),
  records: z.array(postProcessDnsRecordSchema).min(1),
});

export const postProcessOrderItemSchema = z
  .object({
    actions: z.array(postProcessOrderItemActionSchema).min(1),
  })
  .loose();

export type PostProcessOrderItem = z.infer<typeof postProcessOrderItemSchema>;
export const orderItemRequiredActionSchema = z.enum([
  'EPP_UNLOCK_REQUIRED',
  'EPP_AUTH_CODE_UPDATE_REQUIRED',
]);

export const orderItemMetadataSchema = cartItemMetadataSchema.extend({
  mintTransaction: orderMintTransactionMetadataSchema.optional(),
  postProcessOrderItem: postProcessOrderItemSchema.optional(),
  requiredAction: orderItemRequiredActionSchema.optional(),
});

export type OrderItemMetadata = z.infer<typeof orderItemMetadataSchema>;

export const orderMetadataSchema = z
  .object({
    ...claimMetadataShape,
    mintTransactions: z
      .record(z.string(), orderMintTransactionMetadataSchema)
      .optional(),
  })
  .loose();

export type OrderMetadata = z.infer<typeof orderMetadataSchema>;

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
    registrar: text('registrar').notNull(),
    encryptionKeyId: text('encryption_key_id'),
    encryptedEppAuthorizationCode: text('encrypted_epp_authorization_code'),
    metadata: jsonb('metadata').$type<CartItemMetadata>().default({}),
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
    // Stage 3: one-to-many (orders -> payments). FK will be added via SQL migration to avoid circular init.
    orderId: uuid('order_id'),
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
    index('payments_order_id_idx').on(table.orderId),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersTable.id],
    }).onDelete('restrict'),
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
        onDelete: 'restrict',
      })
      .notNull(),
    status: orderStatusEnum('status').notNull().default('CREATED'),
    ...amountInUsdCents,
    nftWalletAddress: text('nft_wallet_address'),
    nftChainId: integer('nft_chain_id'),
    metadata: jsonb('metadata').$type<OrderMetadata>().default({}),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
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
    registrar: text('registrar').notNull(),
    encryptionKeyId: text('encryption_key_id'),
    encryptedEppAuthorizationCode: text('encrypted_epp_authorization_code'),
    status: orderStatusEnum('status').default('CREATED'),
    metadata: jsonb('metadata').$type<OrderItemMetadata>().default({}),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_status_idx').on(table.status),
  ],
);

/**
 * Order payments join table (Stage 3)
 * Links orders to multiple payments; isPrimary marks the primary payment.
 * Note: Deferrable constraints (unique on payment_id, etc.) will be applied via raw SQL migrations.
 */
// order_payments join table removed in favor of payments.order_id one-to-many

export const recordTypePgEnum = pgEnum('record_type_enum', recordTypeValues);

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
    // TODO: [HIGH-IMPACT TYPE SAFETY] Using $type<any>() defeats TypeScript's type checking.
    // This allows any data to be stored in metadata without compile-time validation, which can lead to:
    // 1. Runtime errors when accessing expected properties that don't exist
    // 2. Inconsistent data shapes across records making queries unreliable
    // 3. Difficulty refactoring or understanding what metadata is expected
    // Impact: High - Could cause runtime crashes or silent data corruption.
    // Fix: Define a proper Zod schema for DNS record metadata (e.g., z.object({ source?: z.string(), ... }))
    // and use .$type<z.infer<typeof dnsRecordMetadataSchema>>() for type safety.
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
      // orderPaymentId removed in Stage 3 (orders.payment_id dropped)
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

/**
 * Indexed domains table - stores a cached index of all domains from all registrars
 * This table is populated by a Temporal workflow that calls listAllDomains on each registrar
 */
export type IndexedDomainDnssecStatus = {
  supportsDnssec: boolean;
  hasDelegationSigner: boolean;
  isUsingNamefiDelegationSigner: boolean;
  zoneHasActiveDnssec: boolean;
};

export const indexedDomainsTable = pgTable(
  'indexed_domains',
  {
    ...randomUuid,
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    registrarKey: text('registrar_key').notNull(),
    expirationTime: timestamp('expiration_time').notNull(),
    lastIndexedAt: timestamp('last_indexed_at').notNull().defaultNow(),
    nameservers: jsonb('nameservers').$type<string[]>().notNull().default([]),
    nameserversLastUpdatedAt: timestamp('nameservers_last_updated_at'),
    isUsingNamefiNameservers: boolean('is_using_namefi_nameservers')
      .notNull()
      .default(false),
    dnssecStatus: jsonb(
      'dnssec_status',
    ).$type<IndexedDomainDnssecStatus | null>(),
    dnssecLastUpdatedAt: timestamp('dnssec_last_updated_at'),
    isMissingFromRegistrar: boolean('is_missing_from_registrar')
      .notNull()
      .default(false),
    missingFromRegistrarSince: timestamp('missing_from_registrar_since'),
    ...timestamps,
  },
  (table) => [
    // Primary lookup indexes
    index('indexed_domains_domain_name_idx').on(table.normalizedDomainName),
    index('indexed_domains_registrar_key_idx').on(table.registrarKey),
    index('indexed_domains_expiration_time_idx').on(table.expirationTime),

    // Composite indexes for common queries
    index('indexed_domains_registrar_domain_idx').on(
      table.registrarKey,
      table.normalizedDomainName,
    ),

    // Indexing metadata
    index('indexed_domains_last_indexed_at_idx').on(table.lastIndexedAt),

    // Unique constraint to prevent duplicates
    unique('indexed_domains_registrar_domain_unique').on(
      table.registrarKey,
      table.normalizedDomainName,
    ),
  ],
);

/**
 * Domain export transfer status enum
 * Tracks the lifecycle of a domain being exported/transferred out
 */
export const domainExportStatusEnum = pgEnum('domain_export_status', [
  'PENDING_TRANSFER', // Transfer has been initiated (EPP status: pendingTransfer)
  'TRANSFER_PERIOD', // Transfer completed, in 60-day lock period (EPP status: transferPeriod)
  'TRANSFER_COMPLETED', // Transfer fully completed and domain no longer in our account
  'TRANSFER_FAILED', // Transfer failed or was cancelled
]);

/**
 * Domain export tracking table
 * Tracks domains that are being exported/transferred out of Namefi
 * Used for monitoring export status and notifying users of status changes
 */
export const domainExportTrackingTable = pgTable(
  'domain_export_tracking',
  {
    ...randomUuid,
    ...normalizedDomain,
    chainId: integer('chain_id').notNull(),
    ownerAddress: text('owner_address').notNull(),

    // Status tracking
    status: domainExportStatusEnum('status').notNull(),
    previousStatus: domainExportStatusEnum('previous_status'),
    statusHistory: jsonb('status_history')
      .$type<
        Array<{
          timestamp: string;
          status: string;
          eppStatuses?: string[];
        }>
      >()
      .default([]),

    // EPP/RDAP/WHOIS data
    eppStatuses: jsonb('epp_statuses').$type<string[]>(),
    whoisData: jsonb('whois_data').$type<Json>(),

    // Registrar information
    registrarKey: text('registrar_key'),

    // Timestamps
    statusChangedAt: timestamp('status_changed_at').notNull().defaultNow(),
    firstDetectedAt: timestamp('first_detected_at').notNull().defaultNow(),
    lastCheckedAt: timestamp('last_checked_at').notNull().defaultNow(),
    transferCompletedAt: timestamp('transfer_completed_at'),

    // User notification tracking
    userNotified: boolean('user_notified').notNull().default(false),
    notifiedAt: timestamp('notified_at'),

    // Approval tracking for safe NFT burning
    clientApprovedAt: timestamp('client_approved_at'),
    // TODO: [HIGH-IMPACT BUG] Column name typo: 'verfyingAdminId' should be 'verifyingAdminId'.
    // This typo in the database column name ('verifying_admin_id' is correct in SQL but the JS property
    // is misspelled as 'verfyingAdminId') will cause confusion and potential bugs when accessing this
    // field in application code. Any code using `row.verfyingAdminId` works, but developers may
    // mistakenly use `row.verifyingAdminId` (correct spelling) which would be undefined.
    // Impact: Medium-High - Could cause silent failures in admin verification workflows.
    // Fix: Requires a database migration to rename the column and update all references.
    verfyingAdminId: uuid('verifying_admin_id'),
    adminVerifiedAt: timestamp('admin_verified_at'),

    // Time-based confirmation tracking
    confirmedOutOfAccountAt: timestamp('confirmed_out_of_account_at'),

    // NFT burn tracking
    nftBurnedAt: timestamp('nft_burned_at'),
    nftBurnTxHash: text('nft_burn_tx_hash'),

    ...timestamps,
  },
  (table) => [
    // Primary lookup indexes
    index('domain_export_tracking_domain_idx').on(table.normalizedDomainName),
    index('domain_export_tracking_status_idx').on(table.status),
    index('domain_export_tracking_owner_idx').on(table.ownerAddress),
    index('domain_export_tracking_chain_idx').on(table.chainId),

    // Composite indexes for common queries
    index('domain_export_tracking_domain_status_idx').on(
      table.normalizedDomainName,
      table.status,
    ),
    index('domain_export_tracking_owner_status_idx').on(
      table.ownerAddress,
      table.status,
    ),

    // Time-based queries
    index('domain_export_tracking_status_changed_idx').on(
      table.statusChangedAt,
    ),
    index('domain_export_tracking_last_checked_idx').on(table.lastCheckedAt),

    // Notification queries
    index('domain_export_tracking_unnotified_idx')
      .on(table.userNotified)
      .where(sql`${table.userNotified} = false`),

    // Unique constraint to prevent duplicate tracking entries
    unique('domain_export_tracking_domain_chain_unique').on(
      table.normalizedDomainName,
      table.chainId,
    ),
  ],
);

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
          textTreatment?: string;
          typography?: string;
        }
      | {
          type: 'marketing';
          description?: string;
          collateralType:
            | 'billboard'
            | 'apparel'
            | 'vehicle'
            | 'product'
            | 'let_ai_choose';
        }
    >(),
    output: jsonb('output').notNull().$type<
      | {
          type: 'logo';
          storagePath: string;
          logoType?: string;
          logoStyle?: string;
          textTreatment?: string;
          typography?: string;
        }
      | {
          type: 'marketing';
          storagePath: string;
          collateralType:
            | 'billboard'
            | 'apparel'
            | 'vehicle'
            | 'product'
            | 'let_ai_choose';
        }
    >(),
    metadata: jsonb('metadata').default({}),
    featured: boolean('featured').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
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

export const publicAiGenerationsTable = pgTable(
  'public_ai_generations',
  {
    ...randomUuid,
    externalUserId: text('external_user_id').notNull(),
    domain: text('domain').notNull().$type<NamefiNormalizedDomain>(),
    type: aiGenerationTypeEnum('type').notNull(),
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
          imageModel?: string;
          textTreatment?: string;
          typography?: string;
        }
      | {
          type: 'marketing';
          description?: string;
          collateralType:
            | 'billboard'
            | 'apparel'
            | 'vehicle'
            | 'product'
            | 'let_ai_choose';
          imageModel?: string;
          referenceLogoUrl?: string;
        }
    >(),
    output: jsonb('output').notNull().$type<
      | {
          type: 'logo';
          storagePath: string;
          logoType?: string;
          logoStyle?: string;
          textTreatment?: string;
          typography?: string;
          imageModel?: string;
        }
      | {
          type: 'marketing';
          storagePath: string;
          collateralType:
            | 'billboard'
            | 'apparel'
            | 'vehicle'
            | 'product'
            | 'let_ai_choose';
          imageModel?: string;
        }
    >(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    index('public_ai_generations_external_user_idx').on(table.externalUserId),
    index('public_ai_generations_domain_type_idx').on(table.domain, table.type),
  ],
);

/**
 * Internal AI generations table
 * Stores AI-generated assets created by background jobs (non user-facing)
 * Mirrors the public aiGenerationsTable shape but without user linkage, for operational pipelines.
 */
export const internalAiGenerationsTable = pgTable(
  'internal_ai_generations',
  {
    ...randomUuid,
    domain: text('domain').notNull().$type<NamefiNormalizedDomain>(),
    type: aiGenerationTypeEnum('type').notNull(),
    // Optional grouping identifier to associate a batch run across many domains
    batchId: text('batch_id'),
    // Model/provider params used for this generation (e.g., model id, temperature)
    params: jsonb('params').$type<{
      model: string;
      [key: string]: unknown;
    }>(),
    // Aggregate token usage across steps (e.g., analysis + image gen)
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
          textTreatment?: string;
          typography?: string;
        }
      | {
          type: 'marketing';
          description?: string;
          collateralType:
            | 'billboard'
            | 'apparel'
            | 'vehicle'
            | 'product'
            | 'let_ai_choose';
        }
    >(),
    output: jsonb('output').notNull().$type<
      | {
          type: 'logo';
          storagePath: string;
          logoType?: string;
          logoStyle?: string;
          textTreatment?: string;
          typography?: string;
        }
      | {
          type: 'marketing';
          storagePath: string;
          collateralType: 'billboard' | 'apparel' | 'vehicle' | 'product';
        }
    >(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    index('ai_internal_generations_domain_idx').on(table.domain),
    index('ai_internal_generations_type_idx').on(table.type),
    index('ai_internal_generations_batch_id_idx').on(table.batchId),
  ],
);

/**
 * Hunt system tables
 */
export const huntActionEnum = pgEnum('hunt_action', ['UPVOTE', 'SUBMIT']);

export const huntEntityTypeEnum = pgEnum('hunt_entity_type', [
  'USER',
  'DOMAIN',
]);

/**
 * Hunt edges table
 * Stores relationships between entities in the hunt system
 *
 * Examples:
 * - USER upvotes DOMAIN: sourceType='USER', sourceId=userId, targetType='DOMAIN', targetId=domainName, action='UPVOTE'
 * - USER submits DOMAIN: sourceType='USER', sourceId=userId, targetType='DOMAIN', targetId=domainName, action='SUBMIT'
 * - USER upvotes USER: sourceType='USER', sourceId=userId, targetType='USER', targetId=otherUserId, action='UPVOTE'
 *
 * TODO: [HIGH-IMPACT DATA INTEGRITY] Missing referential integrity for USER entity types.
 * When sourceType='USER' or targetType='USER', the corresponding sourceId/targetId should
 * reference usersTable.id, but there's no foreign key constraint. This means:
 * 1. If a user is deleted, their hunt edges become orphaned (sourceId/targetId point to non-existent users)
 * 2. Invalid user IDs can be inserted without database-level validation
 * 3. Queries joining hunt_edges with users may silently return incomplete results
 * Impact: High - Could lead to data corruption and incorrect leaderboard/stats calculations.
 * Fix: Consider adding a trigger or application-level cleanup when users are deleted,
 * or restructure to use proper foreign keys with conditional constraints.
 */
export const huntEdgesTable = pgTable(
  'hunt_edges',
  {
    ...randomUuid,
    sourceType: huntEntityTypeEnum('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    targetType: huntEntityTypeEnum('target_type').notNull(),
    targetId: text('target_id').notNull(),
    action: huntActionEnum('action').notNull(),
    ...timestamps,
  },
  (table) => [
    // Core index for user-specific queries (e.g., getMySubmittedDomains, checkUpvoteStatus)
    index('hunt_edges_user_action_idx').on(
      table.sourceType,
      table.sourceId,
      table.action,
      table.createdAt, // For ordering user's actions by time
    ),
    // Core index for domain-specific queries (e.g., domain stats, duplicate submit checks)
    index('hunt_edges_domain_action_idx').on(
      table.targetType,
      table.targetId,
      table.action,
      table.createdAt, // For first submit date and last upvote date
    ),
    // Composite index for specific user-domain-action lookups (duplicate checks, vote status)
    index('hunt_edges_user_domain_action_idx').on(
      table.sourceType,
      table.sourceId,
      table.targetType,
      table.targetId,
      table.action,
    ),
    // Time-based filtering optimization for trending domains
    index('hunt_edges_time_filter_idx').on(
      table.targetType,
      table.action,
      table.createdAt, // For efficient time range filtering on submit dates
    ),
  ],
);

/**
 * Pinned domains for hunt system
 */
export const huntPinnedDomainsTable = pgTable(
  'hunt_pinned_domains',
  {
    ...randomUuid,
    domainName: text('domain_name').notNull().$type<NamefiNormalizedDomain>(),
    weight: integer('weight').notNull().default(100),
    ...timestamps,
  },
  (table) => [
    unique('hunt_pinned_domains_domain_unique').on(table.domainName),
    index('hunt_pinned_domains_weight_idx').on(table.weight),
  ],
);

/**
 * Hunt awards system
 */
export const huntAwardTypeEnum = pgEnum('hunt_award_type', [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
  'CAMPAIGN',
]);

export const huntCampaignStatusEnum = pgEnum('hunt_campaign_status', [
  'DRAFT',
  'ACTIVE',
  'ENDED',
  'AWARDED',
  'CANCELLED',
]);

/**
 * Hunt awards table
 * Stores finalized award rankings for domains in specific time periods or campaigns
 * This table serves as a historical record of domain rankings after each award period ends
 */
export const huntAwardsTable = pgTable(
  'hunt_awards',
  {
    ...randomUuid,
    domainName: text('domain_name').notNull().$type<NamefiNormalizedDomain>(),
    type: huntAwardTypeEnum('type').notNull(),

    // Campaign key for campaign-type awards (e.g., 'CV-2025', 'CTA-2025')
    campaignKey: text('campaign_key'),

    // Period key for time-based awards (e.g., 'DAILY-2025-01-01', 'WEEKLY-2025-01', 'MONTHLY-2025-01', 'YEARLY-2025')
    periodKey: text('period_key'),

    rank: integer('rank').notNull(),
    reason: text('reason'), // Display text for the award (e.g., "July 8th, 2025")
    upvoteCount: integer('upvote_count').notNull(), // Snapshot of upvote count at award time

    ...timestamps,
  },
  (table) => [
    // Core indexes for efficient queries
    index('hunt_awards_domain_idx').on(table.domainName),
    index('hunt_awards_type_period_idx').on(table.type, table.periodKey),
    index('hunt_awards_campaign_idx').on(table.campaignKey),

    // Ensure either campaignKey or periodKey is provided
    check(
      'hunt_awards_key_check',
      sql`(${table.campaignKey} IS NOT NULL) OR (${table.periodKey} IS NOT NULL)`,
    ),

    // Ensure rank is positive
    check('hunt_awards_rank_positive', sql`${table.rank} > 0`),

    // Ensure upvote count is non-negative
    check(
      'hunt_awards_upvote_count_nonnegative',
      sql`${table.upvoteCount} >= 0`,
    ),
  ],
);

/**
 * Hunt campaigns table
 * Stores configuration for campaign-type awards
 */
export const huntCampaignsTable = pgTable(
  'hunt_campaigns',
  {
    ...randomUuid,
    campaignKey: text('campaign_key').notNull().unique(),
    name: text('name').notNull().default(''),
    title: text('title').notNull().default(''),
    description: text('description').notNull().default(''),
    logoUrl: text('logo_url').notNull().default(''),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: huntCampaignStatusEnum('status').notNull().default('DRAFT'),
    ...timestamps,
  },
  (table) => [
    index('hunt_campaigns_dates_idx').on(table.startDate, table.endDate),
    index('hunt_campaigns_status_idx').on(table.status),

    // Ensure end date is after start date
    check(
      'hunt_campaigns_dates_valid',
      sql`${table.endDate} > ${table.startDate}`,
    ),
  ],
);

/**
 * Hunt campaign domains table
 * Stores which domains are eligible for specific campaigns
 */
export const huntCampaignDomainsTable = pgTable(
  'hunt_campaign_domains',
  {
    ...randomUuid,
    campaignKey: text('campaign_key')
      .notNull()
      .references(() => huntCampaignsTable.campaignKey, {
        onDelete: 'cascade',
      }),
    domainName: text('domain_name').notNull().$type<NamefiNormalizedDomain>(),
    description: text('description').notNull().default(''),
    ...timestamps,
  },
  (table) => [
    unique('hunt_campaign_domains_unique').on(
      table.campaignKey,
      table.domainName,
    ),
    index('hunt_campaign_domains_campaign_idx').on(table.campaignKey),
    index('hunt_campaign_domains_domain_idx').on(table.domainName),
  ],
);

/**
 * Domain hunt stats view
 * Pre-computed statistics for domains in the hunt system
 * This view aggregates upvote counts, submit dates, and pinned information for efficient leaderboard queries
 */
export const huntDomainStatsView = pgView('hunt_domain_stats_view').as((qb) =>
  qb
    .select({
      domainName: huntEdgesTable.targetId,
      upvoteCount:
        sql<number>`COUNT(CASE WHEN ${huntEdgesTable.action} = 'UPVOTE' THEN 1 END)`.as(
          'upvote_count',
        ),
      firstSubmitDate:
        sql<Date>`MIN(CASE WHEN ${huntEdgesTable.action} = 'SUBMIT' THEN ${huntEdgesTable.createdAt} END)`.as(
          'first_submit_date',
        ),
      lastUpvoteDate:
        sql<Date>`MAX(CASE WHEN ${huntEdgesTable.action} = 'UPVOTE' THEN ${huntEdgesTable.createdAt} END)`.as(
          'last_upvote_date',
        ),
      // Use weight for pinned domains, 0 for non-pinned domains (higher weight = higher priority)
      pinWeight: sql<number>`COALESCE(${huntPinnedDomainsTable.weight}, 0)`.as(
        'pin_weight',
      ),
      isPinned:
        sql<boolean>`CASE WHEN ${huntPinnedDomainsTable.domainName} IS NOT NULL THEN true ELSE false END`.as(
          'is_pinned',
        ),
    })
    .from(huntEdgesTable)
    .leftJoin(
      huntPinnedDomainsTable,
      eq(huntEdgesTable.targetId, huntPinnedDomainsTable.domainName),
    )
    .where(eq(huntEdgesTable.targetType, 'DOMAIN'))
    .groupBy(
      huntEdgesTable.targetId,
      huntPinnedDomainsTable.weight,
      huntPinnedDomainsTable.domainName,
    ),
);

/**
 * Free claims table
 * Stores rows that determine whether users qualify for free domain claims
 * Each row can only be used once and is atomic to prevent concurrency issues
 */
export const freeClaimClaimingStatusEnum = pgEnum(
  'free_claim_claiming_status',
  ['IDLE', 'CLAIMING', 'CLAIMED'],
);

export const freeClaimsTable = pgTable(
  'free_claims',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    /**
     * Identifier for categorizing free claims - can be either a group or campaign key.
     *
     * This field serves two purposes:
     *
     * **For campaign-based claims**: Should match the `campaignKey` from hunt_campaigns table
     * to maintain consistency with existing campaign infrastructure.
     *
     * **For non-campaign claims**: Acts as a group identifier for categorizing
     * different types of free domain allocations.
     *
     * @example
     * ```typescript
     * // Campaign-based claim (matches hunt_campaigns.campaign_key)
     * groupOrCampaignKey: "CV-2025"
     *
     * // Group identifier (non-campaign allocations)
     * groupOrCampaignKey: "early-adopter-2024"
     * groupOrCampaignKey: "referral-bonus"
     * groupOrCampaignKey: "hackathon-winner"
     * ```
     */
    groupOrCampaignKey: text('group_or_campaign_key').notNull(),
    /**
     * Human-readable reason or description for this specific claim.
     *
     * This provides dynamic, user-facing text that explains why the user
     * received this particular free claim. Can be used for display purposes
     * in UI, notifications, or claim history.
     *
     * @example
     * ```typescript
     * reason: "Early adopter reward for joining in 2024"
     * reason: "Referral bonus for bringing 5+ friends"
     * reason: "Community contributor recognition"
     * reason: "Hackathon winner prize - 1st place"
     * reason: "CV 2025 campaign participation"
     * ```
     */
    reason: text('reason'),
    // Exact domain name that can be claimed (if specified)
    exactDomainName: text('exact_domain_name').$type<NamefiNormalizedDomain>(),
    // Parent domain for which child domains can be claimed (if specified)
    parentDomain: text('parent_domain').$type<NamefiNormalizedDomain>(),
    expirationDate: timestamp('expiration_date'),
    // Reference to the order item created when this claim is used
    orderItemId: uuid('order_item_id').references(() => orderItemsTable.id, {
      onDelete: 'set null',
    }),
    // Status of the claim
    claimingStatus: freeClaimClaimingStatusEnum('claiming_status')
      .notNull()
      .default('IDLE'),
    /**
     * The domain name that was claimed, this is set when the claim is used and in case of exact match, it is equal to the exactDomainName
     */
    claimedDomainName: text(
      'claimed_domain_name',
    ).$type<NamefiNormalizedDomain>(),
    claimedAt: timestamp('claimed_at'),
    // Metadata for the claim
    metadata: jsonb('metadata').default({}).$type<any>(),
    ...timestamps,
  },
  (table) => [
    // Primary lookup indexes
    index('free_claims_user_claim_idx').on(
      table.userId,
      table.groupOrCampaignKey,
    ),
    index('free_claims_expiration_idx').on(table.expirationDate),
    index('free_claims_claiming_status_idx').on(table.claimingStatus),

    // Domain-specific indexes
    index('free_claims_exact_domain_idx').on(table.exactDomainName),
    index('free_claims_parent_domain_idx').on(table.parentDomain),

    // Composite indexes for claim validation
    index('free_claims_user_domain_status_idx').on(
      table.userId,
      table.exactDomainName,
      table.parentDomain,
      table.claimingStatus,
      table.expirationDate,
    ),

    // State invariants: If CLAIMED, claimedDomainName and claimedAt must be present
    check(
      'free_claims_claimed_consistency',
      sql`(${table.claimingStatus} != 'CLAIMED') OR (${table.claimedDomainName} IS NOT NULL AND ${table.claimedAt} IS NOT NULL)`,
    ),
    // Ensure either exactDomainName or parentDomain is provided
    // TODO: [HIGH-IMPACT DATA INTEGRITY] This check allows BOTH exactDomainName AND parentDomain to be set,
    // but the business logic likely requires XOR (exactly one must be set, not both).
    // Current: (exactDomainName IS NOT NULL) OR (parentDomain IS NOT NULL) - allows both to be set
    // Should be: (exactDomainName IS NOT NULL) XOR (parentDomain IS NOT NULL)
    // SQL XOR: ((exactDomainName IS NULL) <> (parentDomain IS NULL))
    // Impact: High - Could create ambiguous claims where both exact and parent domain are specified,
    // leading to unpredictable claim matching behavior.
    check(
      'free_claims_domain_check',
      sql`(${table.exactDomainName} IS NOT NULL) OR (${table.parentDomain} IS NOT NULL)`,
    ),
    // NOTE: [INTENTIONAL DESIGN] This unique constraint only includes exactDomainName, not parentDomain.
    // This is intentional: when a user has a parent-domain based claim (exactDomainName is NULL),
    // they are allowed to have multiple claims for the same parentDomain within the same campaign.
    // This enables subdomain campaign scenarios where users can claim multiple different subdomains
    // (e.g., alice.0x.city, bob.0x.city) under the same parent domain in a single campaign.
    // The uniqueness is enforced at the exactDomainName level to prevent duplicate claims for
    // the exact same domain, while allowing flexibility for parent-domain based campaigns.
    unique('free_claims_user_domain_unique').on(
      table.userId,
      table.groupOrCampaignKey,
      table.exactDomainName,
    ),
  ],
);

/**
 * Wishlisted domains table
 * Allows users to wishlist domains (userId + normalizedDomainName)
 */
export const wishlistedDomainsTable = pgTable(
  'wishlisted_domains',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    ...normalizedDomain,
    ...timestamps,
  },
  (table) => [
    unique('wishlisted_domains_user_domain_unique').on(
      table.userId,
      table.normalizedDomainName,
    ),
    index('wishlisted_domains_user_id_idx').on(table.userId),
    index('wishlisted_domains_domain_idx').on(table.normalizedDomainName),
  ],
);

export const linkType = pgEnum('link_type', ['twitter']);

/**
 * Link shares table
 * Stores social media share submissions for verification and reward qualification
 */
export const linkSharesTable = pgTable(
  'link_shares',
  {
    ...randomUuid,
    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    externalIdentifier: text('external_identifier').notNull(),
    type: linkType('type').notNull(),
    ...normalizedDomain,
    postUrl: text('post_url').notNull(),
    sharedUrl: text('shared_url').notNull(),
    campaignKey: text('campaign_key').references(
      () => huntCampaignsTable.campaignKey,
      {
        onDelete: 'set null',
      },
    ),
    metadata: jsonb('metadata').default({}).$type<Json>(),
    verified: boolean('verified').notNull().default(false),
    verifiedAt: timestamp('verified_at'),
    verificationNotes: text('verification_notes'),
    ...timestamps,
  },
  (table) => [
    // Globally unique post URLs - each link can only be shared once
    unique('link_shares_post_url_unique').on(table.postUrl),
    index('link_shares_user_domain_idx').on(
      table.userId,
      table.normalizedDomainName,
    ),
    index('link_shares_domain_recent_idx').on(
      table.normalizedDomainName,
      table.createdAt,
    ),
    index('link_shares_verification_idx').on(table.verified, table.createdAt),
    index('link_shares_campaign_idx').on(table.campaignKey),
  ],
);

/**
 * AI Analysis System Schema and Tables
 * Domain analysis data including explanations, appraisals, and Unicode processing
 */
export const namefiAiSchema = pgSchema('namefi_ai');

/**
 * Zod schemas for AI-related data structures
 */

// Schema for the inner appraisal object that gets stored in the database
export const aiAppraisalDataSchema = z.object({
  valueUpperRange: z.number(),
  valueLowerRange: z.number(),
  report: z.string(), // Markdown-formatted detailed report
});

export type AiAppraisalData = z.infer<typeof aiAppraisalDataSchema>;

/**
 * AI Collection table - stores AI-generated content for domains
 * This complements the existing aiGenerationsTable which handles image generation
 */
export const domainAiAnalysisTable = namefiAiSchema.table(
  'domain_ai_analysis',
  {
    tokenId: numeric('token_id', { precision: 78, scale: 0 }).primaryKey(),
    explain: text('explain'),
    appraisal: jsonb('appraisal').$type<AiAppraisalData>(),
    namefiGptVersion: text('namefi_gpt_version'),
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>()
      .unique(),
    dirty: boolean('dirty').default(false),
    ...timestamps,
  },
  (table) => [
    // Index for finding domains that need processing
    index('domain_ai_analysis_dirty_idx')
      .on(table.dirty)
      .where(sql`${table.dirty} = TRUE`),
    index('domain_ai_analysis_updated_at_idx').on(table.updatedAt),
    // Indexes for finding domains missing specific content
    index('domain_ai_analysis_explain_null_idx')
      .on(table.tokenId)
      .where(sql`${table.explain} IS NULL`),
    index('domain_ai_analysis_appraisal_null_idx')
      .on(table.tokenId)
      .where(sql`${table.appraisal} IS NULL`),
  ],
);

/**
 * Hidden configuration schema to store app-level configuration state
 */
export const appConfigSchema = pgSchema('__config');

/**
 * User permissions mapping table stored under hidden schema __config
 *
 * - Stores per-user granted permissions as plain text strings
 * - The authoritative list of permissions is maintained in TypeScript enum `Permission`
 * - Database uses a composite primary key (user_id, permission)
 */
export const userPermissionsTable = appConfigSchema.table(
  'user_permissions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    /**
     * using a multi row structure for each user is simpler than arrays when it comes to constraints and indexing
     * and it's easier to query for a single user's permission, and at the same time it's easier to query for all users with a given permission.
     * also atomicity is easier to maintain when using a multi row structure.
     *
     * and since this table is for internal use only, it's not likely to get big enough and if we decide to create a permissions system we won't be using this table.
     *
     */
    permission: text('permission').notNull().$type<Permission>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.permission] }),
    index('user_permissions_user_id_idx').on(table.userId),
    index('user_permissions_permission_idx').on(table.permission),
  ],
);

/**
 * Campaign limits table for controlling free claim grants per campaign
 * This provides database-level limit enforcement since we can't use unique constraints
 * due to variable per-campaign limits. Supports source-specific limits within campaigns.
 */
export const freeClaimCampaignLimitsTable = pgTable(
  'free_claim_campaign_limits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    campaignKey: text('campaign_key').notNull(),
    parentDomain: text('parent_domain')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    source: text('source'), // NULL = applies to all sources combinedy, otherwise specific source
    maxClaimsPerUser: integer('max_claims_per_user'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    ...timestamps,
  },
  (table) => [
    // Unique constraint: one limit rule per (campaign, domain, source) combination
    unique('unique_campaign_domain_source').on(
      table.campaignKey,
      table.parentDomain,
      table.source,
    ),
  ],
);

export const poweredbyNamefiDomainsTable = pgTable(
  'poweredby_namefi_domains',
  {
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    additionalAllowedHostnames: text('additional_allowed_hostnames')
      .notNull()
      .array()
      .default([]),
    additionalReservedNames: text('additional_reserved_names')
      .notNull()
      .array()
      .default([]),
    durationConstraints: jsonb('duration_constraints').notNull().$type<{
      minDurationInYears: number;
      maxDurationInYears: number;
    }>(),
    costPerYearInUsdCents: integer('cost_per_year_in_usd_cents').notNull(),
    metadata: jsonb('metadata').default({}),
    ownerId: uuid('owner_id'),
    enabled: boolean('enabled').notNull().default(true),
    startRolloutAt: timestamp('start_rollout_at'),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.normalizedDomainName] }),
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [usersTable.id],
      name: 'poweredby_namefi_domains_owner_id_fk',
    }).onDelete('set null'),
    index('poweredby_namefi_domains_enabled_idx').on(table.enabled),
    index('poweredby_namefi_domains_start_rollout_at_idx').on(
      table.startRolloutAt,
    ),
    index('poweredby_namefi_domains_allowed_hostnames_gin').using(
      'gin',
      table.additionalAllowedHostnames,
    ),
    check(
      'pb_namefi_cost_nonnegative',
      sql`${table.costPerYearInUsdCents} >= 0`,
    ),
    check(
      'pb_namefi_duration_valid',
      sql`(((${table.durationConstraints}) ->> 'minDurationInYears')::int > 0)
            AND (((${table.durationConstraints}) ->> 'maxDurationInYears')::int >= (((${table.durationConstraints}) ->> 'minDurationInYears')::int))`,
    ),
  ],
);

/**
 * Reservation status enum for PBN issuance reservations
 */
export const reservationStatusEnum = pgEnum('pbn_issuance_reservation_status', [
  'CREATED',
  'CANCELLED',
]);

/**
 * API Key type enum
 * - PLAIN: Traditional API key (random string, stored as hash)
 * - PUBLIC_PRIVATE: ECDSA keypair where user stores private key, we store public key
 */
export const apiKeyTypeEnum = pgEnum('api_key_type', [
  'PLAIN',
  'PUBLIC_PRIVATE',
]);

/**
 * API Keys table
 * Stores API keys for programmatic access to user accounts
 *
 * Security considerations:
 * - PLAIN keys: Only the hash is stored, original key shown once at creation
 * - PUBLIC_PRIVATE: User generates keypair locally, only public key is stored
 * - All create/revoke operations require EIP-712 signature for added security
 */
export const apiKeysTable = pgTable(
  'api_keys',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    // User-provided label for identification
    name: text('name').notNull(),
    type: apiKeyTypeEnum('type').notNull(),

    // For PLAIN keys: bcrypt hash of the key
    // For PUBLIC_PRIVATE: null (public key stored in publicKey field)
    keyHash: text('key_hash'),

    // For PUBLIC_PRIVATE keys: hex-encoded public key (uncompressed, 65 bytes -> 130 hex chars)
    // For PLAIN keys: null
    publicKey: text('public_key'),

    // Key prefix for identification without revealing the full key
    // Format: "nfk_<first 8 chars>" for PLAIN keys
    // Format: "nfpk_<first 8 chars of public key>" for PUBLIC_PRIVATE keys
    keyPrefix: text('key_prefix').notNull(),

    // Expiration time - null means the key never expires
    expiresAt: timestamp('expires_at'),

    // Revocation time - null means the key is active
    revokedAt: timestamp('revoked_at'),

    // Last time the key was used for authentication
    lastUsedAt: timestamp('last_used_at'),

    ...timestamps,
  },
  (table) => [
    // Primary lookup indexes
    index('api_keys_user_id_idx').on(table.userId),
    index('api_keys_key_prefix_idx').on(table.keyPrefix),

    // For looking up active keys by user
    index('api_keys_user_active_idx')
      .on(table.userId, table.revokedAt)
      .where(sql`${table.revokedAt} IS NULL`),

    // Constraints
    // PLAIN keys must have keyHash, PUBLIC_PRIVATE keys must have publicKey
    check(
      'api_keys_type_fields_check',
      sql`(${table.type} = 'PLAIN' AND ${table.keyHash} IS NOT NULL AND ${table.publicKey} IS NULL)
          OR (${table.type} = 'PUBLIC_PRIVATE' AND ${table.publicKey} IS NOT NULL AND ${table.keyHash} IS NULL)`,
    ),
  ],
);

/**
 * PBN Issuance Reservations table - unified system for gifts and internal reservations
 * Replaces gift_free_claims with more flexible reservation system
 */
export const pbnIssuanceReservationsTable = pgTable(
  'pbn_issuance_reservations',
  {
    ...randomUuid,
    pbnDomain: text('pbn_domain')
      .notNull()
      .$type<NamefiNormalizedDomain>()
      .references(() => poweredbyNamefiDomainsTable.normalizedDomainName, {
        onDelete: 'cascade',
      }),
    recipientEmail: text('recipient_email'),
    recipientUserId: uuid('recipient_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    exactDomainName: text('exact_domain_name').$type<NamefiNormalizedDomain>(),
    parentDomain: text('parent_domain').$type<NamefiNormalizedDomain>(),
    reason: text('reason'),

    // Behavior flags
    issueFreeClaim: boolean('issue_free_claim').notNull().default(false),
    reserveHold: boolean('reserve_hold').notNull().default(true),

    // Creator of the reservation (PBN owner or admin)
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),
    personalMessage: text('personal_message'),

    // Status and metadata
    reservationExpirationDate: timestamp('reservation_expiration_date'),
    freeClaimExpirationDate: timestamp('free_claim_expiration_date'),
    status: reservationStatusEnum('status').notNull().default('CREATED'),
    claimedAt: timestamp('claimed_at'),
    freeClaimId: uuid('free_claim_id').references(() => freeClaimsTable.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').default({}).$type<{
      sendEmail?: boolean;
      emailSent?: boolean;
      emailSentAt?: string;
      source?: 'GIFT' | 'INTERNAL_RESERVATION' | 'ADMIN_GRANT';
      internalReason?: string;
      adminUserId?: string;
      [key: string]: any;
    }>(),
    ...timestamps,
  },
  (table) => [
    // Indexes
    index('pbn_reservations_recipient_user_idx').on(table.recipientUserId),
    index('pbn_reservations_pbn_domain_idx').on(table.pbnDomain),
    index('pbn_reservations_status_idx').on(table.status),
    index('pbn_reservations_reservation_expiration_idx').on(
      table.reservationExpirationDate,
    ),
    index('pbn_reservations_parent_domain_idx').on(table.parentDomain),
    index('pbn_reservations_creator_idx').on(table.creatorId),

    // Composite indexes
    index('pbn_reservations_recipient_status_idx').on(
      table.recipientEmail,
      table.status,
    ),
    index('pbn_reservations_creator_status_idx').on(
      table.creatorId,
      table.status,
    ),

    // !! there's a trigger that calls pbn_validate_hold_before_insert
    // Constraints
    // At least one behavior: cannot be neither
    check(
      'pbn_reservations_behavior_at_least_one',
      sql`${table.reserveHold} OR ${table.issueFreeClaim}`,
    ),
    // Holding is only allowed on exact (never on parent)
    check(
      'pbn_reservations_hold_on_exact_only',
      sql`(NOT ${table.reserveHold}) OR (${table.exactDomainName} IS NOT NULL AND ${table.parentDomain} IS NULL)`,
    ),
    // Parent domain allowed only when issuing a free-claim
    check(
      'pbn_reservations_parent_only_with_free_claim',
      sql`(${table.parentDomain} IS NULL) OR ${table.issueFreeClaim}`,
    ),
    // Provide either exactDomainName or parentDomain
    check(
      'pbn_reservations_exact_domain_xor_parent_domain',
      sql`(${table.exactDomainName} IS NULL) <> (${table.parentDomain} IS NULL)`,
    ),
    // Reservation expiration only relevant when reserve hold is true
    check(
      'pbn_reservations_expiration_when_no_hold_null',
      sql`${table.reserveHold} OR ${table.reservationExpirationDate} IS NULL`,
    ),
    // Free-claim expiration only when issuing free-claim
    check(
      'pbn_reservations_free_claim_expiration_only_when_issuing',
      sql`${table.issueFreeClaim} OR ${table.freeClaimExpirationDate} IS NULL`,
    ),
  ],
);
