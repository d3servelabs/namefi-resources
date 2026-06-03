/**
 * Database schema definition for the Namefi application.
 * Note: Currently maintained in a single file for simplicity.
 * Consider splitting into multiple files if schema grows significantly.
 */

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { recordTypeValues } from '@namefi-astra/zod-dns';
import {
  cartItemMetadataSchema,
  orderItemMetadataSchema,
  orderMetadataSchema,
  orderNfscItemMetadataSchema,
  paymentMetadataSchema,
  type CartItemMetadata,
  type OrderItemMetadata,
  type OrderMetadata,
  type OrderNfscItemMetadata,
  type PaymentMetadata,
} from '@namefi-astra/common/contract/entity-schemas';
import {
  itemTypeValues,
  freeClaimClaimingStatusValues,
  notificationBodyTypeValues,
  notificationPriorityValues,
  notificationResourceTypeValues,
  orderStatusValues,
  paymentProviderValues,
  paymentStatusValues,
  refundStatusValues,
  type NotificationRelatedResource,
  type NotificationResourceType,
} from '@namefi-astra/common/shared-schemas';
import { asc, eq, getTableColumns, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  numeric,
  check,
  date,
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
  varchar,
} from 'drizzle-orm/pg-core';
import type { Json } from 'drizzle-zod';
import type { Permission } from '@namefi-astra/utils';
import { z } from 'zod';
import type { PaymentPayload } from './x402/types';
import { lifecycleTimestamps, randomUuid, timestamps } from './schemas/common';
import { huntCampaignsTable } from './schemas/hunt';

export {
  cartItemMetadataSchema,
  legacyOrderItemMetadataSchema,
  legacyOrderMetadataSchema,
  nfscMintReconciliationSchema,
  orderItemFailureDetailsSchema,
  orderItemFailureResolutionSchema,
  orderItemMetadataSchema,
  orderItemRequiredActionSchema,
  orderMetadataSchema,
  orderMintTransactionMetadataSchema,
  orderNfscItemMetadataSchema,
  paymentMetadataSchema,
  postProcessOrderItemSchema,
} from '@namefi-astra/common/contract/entity-schemas';
export type {
  CartItemMetadata,
  NfscMintReconciliation,
  OrderItemMetadata,
  OrderMintTransactionMetadata,
  OrderMetadata,
  OrderNfscItemMetadata,
  PaymentMetadata,
  PostProcessOrderItem,
} from '@namefi-astra/common/contract/entity-schemas';

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

const amountInUsdCents = {
  amountInUSDCents: integer('amount_in_usd_cents').notNull(),
};

export const orderStatusEnum = pgEnum('order_status', orderStatusValues);
export const paymentStatusEnum = pgEnum('payment_status', paymentStatusValues);
export const refundStatusEnum = pgEnum('refund_status', refundStatusValues);
export const paymentProviderEnum = pgEnum(
  'payment_provider',
  paymentProviderValues,
);

export const emailCampaignSendStatusEnum = pgEnum(
  'email_campaign_send_status',
  ['PENDING', 'SENT', 'FAILED'] as const,
);

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

export const itemTypeEnum = pgEnum('item_type', itemTypeValues);

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

/**
 * user_login_history — one row per unique Privy session per user.
 *
 * ## Identifier & value notes
 * - `id`: UUID, generated by Postgres `gen_random_uuid()` (see `randomUuid`).
 * - `sessionId`: pass-through of Privy's session claim; nullable because some
 *   auth paths (API keys, skip-auth) don't produce one. Nulls are treated as
 *   distinct by the UNIQUE constraint.
 * - `geoLat` / `geoLng`: decimal degrees, WGS84. Sourced from Google LB's
 *   `X-Client-Geo-Location-City-Coordinates` when available.
 * - `isNewIp` / `isNewLocation`: computed at insert time against the last
 *   90 days of prior rows for this user. Not kept in sync if later rows
 *   change the picture — these flags represent the state *at sign-in*.
 */
export const userLoginHistoryTable = pgTable(
  'user_login_history',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    signedInAt: timestamp('signed_in_at').notNull(),
    lastAccessedAt: timestamp('last_accessed_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    os: text('os'),
    browser: text('browser'),
    device: text('device'),
    loginMethod: text('login_method'),
    geoCity: text('geo_city'),
    geoSubdivision: text('geo_subdivision'),
    geoRegionCode: text('geo_region_code'),
    geoLat: numeric('geo_lat', { precision: 9, scale: 6 }),
    geoLng: numeric('geo_lng', { precision: 9, scale: 6 }),
    isGoogleLB: boolean('is_google_lb').notNull().default(false),
    isNewIp: boolean('is_new_ip').notNull().default(false),
    isNewLocation: boolean('is_new_location').notNull().default(false),
    isFirstSession: boolean('is_first_session').notNull().default(false),
    /**
     * FingerprintJS visitorId from the browser, sent on every tRPC
     * request via `X-Browser-Fingerprint`. Null when the client didn't
     * send one (privacy mode, blocker) or for non-browser callers
     * (server scripts, API key consumers). Used as a third recognition
     * signal alongside IP and geolocation.
     */
    browserFingerprint: text('browser_fingerprint'),
    /**
     * True iff the browser fingerprint wasn't seen on this user's prior
     * 90 days of sessions. Forced false when the current sign-in didn't
     * carry a fingerprint at all (no signal contributed). Parallel to
     * `is_new_ip` / `is_new_location` so the UI / email can show a
     * "New Browser" badge consistently.
     */
    isNewFingerprint: boolean('is_new_fingerprint').notNull().default(false),
    notificationSent: boolean('notification_sent').notNull().default(false),
    /**
     * True iff the system considered this session's IP and location
     * already-known at sign-in time (`!isNewIp && !isNewLocation`).
     * Materially redundant with the novelty flags above, but stored so
     * we can index on it (e.g. "all sessions the system flagged but the
     * user never reviewed") and so the value remains stable as-of-record
     * if novelty thresholds change later.
     */
    systemRecognizedSessionDetails: boolean('system_recognized_session_details')
      .notNull()
      .default(false),
    /**
     * The row owner's (or an admin acting on their behalf) decision:
     * `null` = no action yet, `true` = recognized ("yes that was me"),
     * `false` = rejected ("no that wasn't me"). Combined with
     * `systemRecognizedSessionDetails` to drive the row's warning
     * color: a row is flagged iff
     * `!(systemRecognizedSessionDetails || userRecognizedSessionDetails === true)`.
     */
    userRecognizedSessionDetails: boolean('user_recognized_session_details'),
    metadata: jsonb('metadata').default({}).$type<{
      protocol?: string;
      deviceType?: string;
      userAgentFamily?: string;
      source?: string;
    }>(),
    ...timestamps,
  },
  (table) => [
    unique('user_login_history_user_session_uniq').on(
      table.userId,
      table.sessionId,
    ),
    index('user_login_history_user_signed_in_idx').on(
      table.userId,
      table.signedInAt,
    ),
    index('user_login_history_ip_idx').on(table.ipAddress),
    // Composite (userId, fingerprint) so novelty detection can answer
    // "has this user signed in with this fingerprint before?" without a
    // full table scan.
    index('user_login_history_user_fingerprint_idx').on(
      table.userId,
      table.browserFingerprint,
    ),
  ],
);

export const emailCampaignSendMetadataSchema = z
  .object({
    variantIndex: z.number().int().min(0).optional(),
    cartItemCount: z.number().int().min(0).optional(),
    cartItemTotalUsdCents: z.number().int().min(0).optional(),
    cartItemDomains: z.array(z.string().min(1)).optional(),
    trafficDomainCount: z.number().int().min(0).optional(),
    trafficDomains: z.array(z.string().min(1)).optional(),
    leadgenRunId: z.string().uuid().optional(),
    leadgenSourceDomain: z.string().min(1).optional(),
    leadgenLeadCount: z.number().int().min(0).optional(),
  })
  .strict();

export type EmailCampaignSendMetadata = z.infer<
  typeof emailCampaignSendMetadataSchema
>;

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

const legacyStripeRefundDetailSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
  status: z.string().min(1, 'Status is required'),
  createdAt: z.string().min(1, 'Creation date is required'),
  paymentProviderReferenceId: z
    .string()
    .min(1, 'Payment provider reference ID is required'),
});

const legacyStripeRefundSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  fullRefund: z.boolean(),
  totalRefundAmount: z
    .number()
    .min(0, 'Total refund amount must be non-negative'),
  refundsDetails: z.array(legacyStripeRefundDetailSchema),
});

const legacyNfscRefundDetailSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
  txHash: z.string().min(1, 'Transaction hash is required'),
  chainId: z.number().optional(),
  walletAddress: z.string().min(1, 'Wallet address is required').optional(),
});

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
    metadata: jsonb('metadata').$type<PaymentMetadata>(),
    x402PaymentDetails: jsonb('x402_payment_details').$type<{
      buyerWalletAddress: string;
      /** The wallet address that received the x402 payment (USDC) */
      receiverWalletAddress: string;
      network: string; // CAIP-2 format: eip155:84532
      paymentPayload?: PaymentPayload;
      /** Encryption version used for x402 payload encryption */
      paymentPayloadEncryptionVersion?: 'v1';
      /** Whether the payment was pre-settled before the workflow started */
      presettled?: boolean;
      /** Transaction hash from the x402 facilitator settlement */
      settlementTxHash?: string;
      /** ISO timestamp when the settlement was completed */
      settledAt?: string;
      /** Transaction hash from USDC refund transfer (if refunded) */
      refundTxHash?: string;
    }>(),
    ...timestamps,
    ...lifecycleTimestamps,
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

export const refundsMetadataSchema = z.object({
  legacyRefundMetadata: z.union([
    z.object({
      stripeRefund: legacyStripeRefundSchema,
    }),
    z.object({
      nfscRefund: legacyNfscRefundDetailSchema,
    }),
  ]),
});
export type RefundsMetadata = z.infer<typeof refundsMetadataSchema>;
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
    metadata: jsonb('metadata').$type<RefundsMetadata>(),
    ...timestamps,
    ...lifecycleTimestamps,
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
    ...lifecycleTimestamps,
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
    ...lifecycleTimestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_status_idx').on(table.status),
  ],
);

/**
 * Order NFSC items table.
 *
 * One row per NFSC top-up order item. Kept separate from `order_items`
 * because that table is strictly domain-shaped (NOT NULL
 * normalized_domain_name / duration_in_years / registrar, and a `type` enum
 * of REGISTER | IMPORT | RENEW). An order is an NFSC top-up order iff it has
 * one or more `order_nfsc_items` rows and no `order_items` rows.
 *
 * Monetary units:
 * - `amount_in_usd_cents` is USD cents and is the financial source of truth.
 * - `nfsc_amount` is the NFSC token amount (an 18-decimal on-chain token)
 *   stored as an exact decimal. At the fixed 1 USD = 1 NFSC rate it equals
 *   amount_in_usd_cents / 100; it is stored explicitly so the row is
 *   self-describing and resilient to a future rate change.
 *
 * The recipient wallet/chain live on the item (not on the order's
 * domain-NFT `nft_wallet_address` / `nft_chain_id` columns, which stay NULL
 * for NFSC orders).
 */
export const orderNfscItemsTable = pgTable(
  'order_nfsc_items',
  {
    ...randomUuid,
    orderId: uuid('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    ...amountInUsdCents,
    nfscAmount: numeric('nfsc_amount', { precision: 38, scale: 18 }).notNull(),
    recipientWalletAddress: text('recipient_wallet_address').notNull(),
    chainId: integer('chain_id').notNull(),
    mintTxHash: text('mint_tx_hash'),
    status: orderStatusEnum('status').default('CREATED'),
    metadata: jsonb('metadata').$type<OrderNfscItemMetadata>().default({}),
    ...timestamps,
    ...lifecycleTimestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('order_nfsc_items_order_id_idx').on(table.orderId),
    index('order_nfsc_items_status_idx').on(table.status),
    // Drives reconcileNfscMint's "recent NFSC mints to this wallet+chain" query.
    index('order_nfsc_items_recipient_chain_idx').on(
      table.recipientWalletAddress,
      table.chainId,
    ),
  ],
);

/**
 * Email campaign sends table
 * Tracks scheduled marketing email sends to prevent duplicates per period
 */
export const emailCampaignSendsTable = pgTable(
  'email_campaign_sends',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    campaignKey: text('campaign_key').notNull(),
    periodStart: timestamp('period_start').notNull(),
    status: emailCampaignSendStatusEnum('status').notNull().default('PENDING'),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastError: text('last_error'),
    sentAt: timestamp('sent_at'),
    metadata: jsonb('metadata').$type<EmailCampaignSendMetadata>().default({}),
    ...timestamps,
  },
  (table) => [
    index('email_campaign_sends_user_id_idx').on(table.userId),
    index('email_campaign_sends_campaign_period_idx').on(
      table.campaignKey,
      table.periodStart,
    ),
    index('email_campaign_sends_status_idx').on(table.status),
    unique('email_campaign_sends_user_campaign_period_unique').on(
      table.userId,
      table.campaignKey,
      table.periodStart,
    ),
    check(
      'email_campaign_sends_attempt_count_nonnegative',
      sql`attempt_count >= 0`,
    ),
  ],
);

/**
 * Aggregate per-campaign open counts. One row per `campaignKey`,
 * incremented atomically each time the tracking pixel for an email tagged
 * with `type: 'campaign_email_open'` is loaded. Counts every pixel hit
 * (no per-recipient deduplication).
 *
 * `campaignKey` is a free-form string sharing the same convention as
 * `email_campaign_sends.campaign_key` (e.g. `cart-domains-popular`).
 */
export const emailCampaignOpensTable = pgTable(
  'email_campaign_opens',
  {
    ...randomUuid,
    campaignKey: text('campaign_key').notNull(),
    openCount: integer('open_count').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique('email_campaign_opens_campaign_key_unique').on(table.campaignKey),
    check('email_campaign_opens_open_count_nonnegative', sql`open_count >= 0`),
    // Defense-in-depth against rows inserted outside the API layer
    // (e.g. ad-hoc psql, future migrations). The contract already enforces
    // `min(1)`; this keeps the aggregate buckets well-formed at the DB level.
    check(
      'email_campaign_opens_campaign_key_nonempty',
      sql`length(trim(campaign_key)) > 0`,
    ),
  ],
);

/**
 * Aggregate per-link click counts for email campaigns. One row per
 * (`campaignKey`, `groupIdentifier`) pair, incremented atomically each time
 * the click-tracking redirect endpoint is hit for a link whose JWT carries
 * `type: 'campaign_link_click'`. Counts every redirect hit (no
 * per-recipient deduplication).
 *
 * `groupIdentifier` is set by the click route handler as follows:
 *   1. The explicit `groupIdentifier` from the JWT payload, if present
 *      (e.g. `cta-button`, `footer-link`).
 *   2. Otherwise `${destination.hostname}${destination.pathname}` of the
 *      redirect URL, so distinct destinations within a campaign aggregate
 *      separately even when the template author didn't tag them.
 *
 * Stored as `''` only for legacy rows; new inserts always carry a derived
 * value, which lets the composite unique constraint be enforced without
 * NULL handling.
 */
export const emailCampaignClicksTable = pgTable(
  'email_campaign_clicks',
  {
    ...randomUuid,
    campaignKey: text('campaign_key').notNull(),
    groupIdentifier: text('group_identifier').notNull().default(''),
    clickCount: integer('click_count').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique('email_campaign_clicks_campaign_group_unique').on(
      table.campaignKey,
      table.groupIdentifier,
    ),
    check(
      'email_campaign_clicks_click_count_nonnegative',
      sql`click_count >= 0`,
    ),
    // See comment on `email_campaign_opens_campaign_key_nonempty`.
    check(
      'email_campaign_clicks_campaign_key_nonempty',
      sql`length(trim(campaign_key)) > 0`,
    ),
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
  'animation',
] as const);

export const aiGenerationStatusEnum = pgEnum('ai_generation_status', [
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
] as const);

export const leadgenRunStatusEnum = pgEnum('leadgen_run_status', [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
] as const);

export const leadgenReasoningEffortEnum = pgEnum('leadgen_reasoning_effort', [
  'low',
  'medium',
  'high',
] as const);

export const leadgenOpportunityStatusEnum = pgEnum(
  'leadgen_opportunity_status',
  [
    'checking',
    'contact_now',
    'validate_first',
    'low_priority',
    'suppressed',
  ] as const,
);

export const leadgenRiskLevelEnum = pgEnum('leadgen_risk_level', [
  'low',
  'medium',
  'high',
] as const);

export const leadgenContactReadinessEnum = pgEnum('leadgen_contact_readiness', [
  'not_searched',
  'contact_found',
  'generic_fallback',
  'not_found',
] as const);

type AiGenerationTokenUsage = Array<{
  model: string;
  inputTokens: number;
  outputTokens: number;
}>;

type LeadgenTokenUsage = AiGenerationTokenUsage;

type LeadgenRunInput = {
  domain: NamefiNormalizedDomain;
  reasoningEffort: 'low' | 'medium' | 'high';
  runProfile?: 'full' | 'campaign_short';
  source?: string;
  // Optional seller ask in USD; forwarded to triage only as deal context.
  askingPriceUsd?: number;
  // Optional cap for selected discovery recipes; 0 disables recipe expansion.
  selectedRecipeLimit?: number;
  // Optional cap for raw candidate signals before filtering; 0 disables discovery.
  rawCandidateLimit?: number;
  // Optional cap for public-contact searches; early and final passes share it.
  contactDiscoveryLimit?: number;
};

type LeadgenMetadata = Record<string, unknown>;

type CinematicAnimationModel =
  | 'veo-3.1-generate-preview'
  | 'veo-3.1-fast-generate-preview';

type LoopedAnimationModel =
  | 'bytedance/seedance-2.0'
  | 'bytedance/seedance-2.0-fast'
  | 'bytedance/seedance-v1.5-pro'
  | 'bytedance/seedance-v1.0-pro';

type AnimationModel = CinematicAnimationModel | LoopedAnimationModel;

type AnimationSheetImageModel = 'gpt-image-2';

type CinematicAnimationMotionPreset =
  | 'let-ai-choose'
  | 'orbital-reveal'
  | 'energy-surge'
  | 'atmospheric-rise'
  | 'dimensional-parallax'
  | 'prismatic-bloom';

type LoopedAnimationMotionPreset =
  | 'let-ai-choose'
  | 'breathe'
  | 'light-sweep'
  | 'shimmer'
  | 'glow-pulse'
  | 'contour-trace'
  | 'ambient-orbit'
  | 'micro-parallax'
  | 'gradient-drift';

type AnimationMotionIntensity = 'subtle' | 'balanced' | 'bold';

type AiGenerationInput =
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
    }
  | {
      type: 'animation';
      mode: 'cinematic';
      description?: string;
      sourceMode?: 'exact-frame' | 'subject-reference';
      motionPreset: CinematicAnimationMotionPreset;
      model: CinematicAnimationModel;
    }
  | {
      type: 'animation';
      mode: 'looped';
      description?: string;
      motionPreset: LoopedAnimationMotionPreset;
      motionIntensity: AnimationMotionIntensity;
      model: LoopedAnimationModel;
    }
  | {
      type: 'animation';
      mode: 'sheet-guided';
      description?: string;
      motionPreset?: CinematicAnimationMotionPreset;
      model: LoopedAnimationModel;
      sheetModel?: AnimationSheetImageModel;
    };

type AiGenerationOutput =
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
  | {
      type: 'animation';
      storagePath?: string;
      thumbnailStoragePath: string;
      mimeType: 'video/mp4';
      model: AnimationModel;
    };

type ExternalAiGenerationInput =
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
  | {
      type: 'animation';
      mode: 'cinematic';
      description?: string;
      sourceMode?: 'exact-frame' | 'subject-reference';
      motionPreset: CinematicAnimationMotionPreset;
      model?: CinematicAnimationModel;
      referenceLogoUrl?: string;
    }
  | {
      type: 'animation';
      mode: 'looped';
      description?: string;
      motionPreset: LoopedAnimationMotionPreset;
      motionIntensity: AnimationMotionIntensity;
      model?: LoopedAnimationModel;
      referenceLogoUrl?: string;
    }
  | {
      type: 'animation';
      mode: 'sheet-guided';
      description?: string;
      motionPreset?: CinematicAnimationMotionPreset;
      model?: LoopedAnimationModel;
      sheetModel?: AnimationSheetImageModel;
      referenceLogoUrl?: string;
    };

type ExternalAiGenerationOutput =
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
  | {
      type: 'animation';
      storagePath?: string;
      thumbnailStoragePath: string;
      mimeType: 'video/mp4';
      model?: AnimationModel;
    };

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
 * Daily DNSSEC analysis status for an indexed domain, derived from the leaf
 * zone's `delegation.status` field in the `dnsviz grok` JSON output.
 *
 * - SECURE: full DNSSEC chain of trust validates
 * - INSECURE: zone has no DS at parent (no DNSSEC)
 * - BOGUS: signatures or DS digests fail to validate (the actionable case)
 * - ERROR: probe or grok itself failed before a verdict could be reached
 */
export const dnsvizAnalysisStatusEnum = pgEnum('dnsviz_analysis_status', [
  'SECURE',
  'INSECURE',
  'BOGUS',
  'ERROR',
]);

export type DnsvizAnalysisStatus =
  (typeof dnsvizAnalysisStatusEnum.enumValues)[number];

/**
 * Small derived snapshot of a `dnsviz grok` result, kept under ~2 KB so it can
 * be queried/aggregated cheaply without unpacking the full grok blob.
 *
 * `ignoredErrorsCount` / `ignoredWarningsCount` count the entries that were
 * suppressed by the default `DEFAULT_IGNORED_DNSVIZ_ERROR_CODES` filter
 * (see `apps/backend/src/lib/dnsviz/parse-grok.ts`). They're optional
 * because rows written before the field was added don't have them set.
 */
export type DnsvizAnalysisSummary = {
  delegationStatus: string | null;
  zoneStatus: string | null;
  parentChainStatuses: Record<string, string>;
  topErrors: string[];
  topWarnings: string[];
  ignoredErrorsCount?: number;
  ignoredWarningsCount?: number;
};

/**
 * One row per (domain, day) DNSViz analysis. Populated by the daily digest
 * Temporal workflow, consumed by the admin graph endpoint and the failure
 * summary email. Bounded by the cleanup workflow which deletes rows past
 * `expires_at`.
 *
 * `probe_data` and `grok_data` hold the raw dnsviz JSON outputs as jsonb;
 * `probe_data` is required by the `/v1/dnsviz/analyses/:id/graph` endpoint
 * which streams it through `dnsviz graph`.
 */
export const dnsvizAnalysesTable = pgTable(
  'dnsviz_analyses',
  {
    ...randomUuid,
    normalizedDomainName: text('normalized_domain_name')
      .notNull()
      .$type<NamefiNormalizedDomain>(),
    registrarKey: text('registrar_key').notNull(),
    analysisDate: date('analysis_date').notNull(),
    analysisStartedAt: timestamp('analysis_started_at').notNull().defaultNow(),
    durationMs: integer('duration_ms'),
    status: dnsvizAnalysisStatusEnum('status').notNull(),
    errorsCount: integer('errors_count').notNull().default(0),
    warningsCount: integer('warnings_count').notNull().default(0),
    summary: jsonb('summary').$type<DnsvizAnalysisSummary>(),
    probeData: jsonb('probe_data'),
    grokData: jsonb('grok_data'),
    errorMessage: text('error_message'),
    workflowRunId: text('workflow_run_id'),
    expiresAt: timestamp('expires_at').notNull(),
    ...timestamps,
  },
  (table) => [
    index('dnsviz_analyses_domain_date_idx').on(
      table.normalizedDomainName,
      table.analysisDate.desc(),
    ),
    index('dnsviz_analyses_analysis_date_idx').on(table.analysisDate.desc()),
    index('dnsviz_analyses_status_idx').on(table.status),
    index('dnsviz_analyses_expires_at_idx').on(table.expiresAt),
    unique('dnsviz_analyses_domain_date_unique').on(
      table.normalizedDomainName,
      table.analysisDate,
    ),
  ],
);

/**
 * Domain export transfer status enum
 * Tracks the lifecycle of a domain being exported/transferred out
 */
export const domainExportStatusEnum = pgEnum('domain_export_status', [
  'NO_SIGNAL', // Explicitly checked and found no transfer evidence
  'UNDETERMINED', // Check completed but evidence was ambiguous/unavailable
  'PENDING_TRANSFER', // Transfer has been initiated (EPP status: pendingTransfer)
  'TRANSFER_PERIOD', // Transfer completed, in 60-day lock period (EPP status: transferPeriod)
  'TRANSFER_COMPLETED', // Transfer fully completed and domain no longer in our account
  'TRANSFER_FAILED', // Transfer failed or was cancelled
  'NEEDS_ADMIN_REVIEW', // Awaiting admin review before user-facing side effects
  'NOTIFIED', // User/admin notification delivered after approval
  'RESOLVED', // Tracking item was resolved or dismissed
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
    latestEvidence: jsonb('latest_evidence').$type<{
      checkedAt: string;
      evidenceSource: 'DIRECT_REGISTRAR' | 'RDAP' | 'WHOIS' | 'NONE';
      decisionAction: string;
      decisionReason: string;
      accountCheck: {
        inOurAccount: boolean;
        confirmed: boolean;
      };
      rdapTransferEvent: {
        detected: boolean;
        eventAction?: string;
        eventDate?: string;
      };
      hasPendingTransfer: boolean;
      hasTransferPeriod: boolean;
      hasExportConfirmedFinished: boolean;
      undetermined: boolean;
      directPendingTransferStatus?: string;
      eppStatuses?: string[];
    }>(),

    // Registrar information
    registrarKey: text('registrar_key'),

    // Timestamps
    statusChangedAt: timestamp('status_changed_at').notNull().defaultNow(),
    firstDetectedAt: timestamp('first_detected_at').notNull().defaultNow(),
    lastCheckedAt: timestamp('last_checked_at').notNull().defaultNow(),
    transferCompletedAt: timestamp('transfer_completed_at'),

    // User notification tracking
    pendingNotifiedAt: timestamp('pending_notified_at'),
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
    status: aiGenerationStatusEnum('status').notNull().default('SUCCEEDED'),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    errorMessage: text('error_message'),
    tokenUsage: jsonb('token_usage')
      .$type<AiGenerationTokenUsage>()
      .notNull()
      .default([]),
    input: jsonb('input').notNull().$type<AiGenerationInput>(),
    output: jsonb('output').notNull().$type<AiGenerationOutput>(),
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
    index('ai_generations_status_idx').on(table.status),
    foreignKey({
      columns: [table.referenceGenerationId],
      foreignColumns: [table.id],
      name: 'ai_generations_reference_generation_fk',
    }).onDelete('set null'),
  ],
);

export const aiCreditAwardsTable = pgTable(
  'ai_credit_awards',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    awardedByAdminUserId: uuid('awarded_by_admin_user_id').references(
      () => usersTable.id,
      { onDelete: 'set null' },
    ),
    amountCredits: integer('amount_credits').notNull(),
    reason: text('reason').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    metadata: jsonb('metadata').default({}).$type<{
      batchId?: string;
    }>(),
    ...timestamps,
  },
  (table) => [
    index('ai_credit_awards_user_idx').on(table.userId),
    index('ai_credit_awards_admin_idx').on(table.awardedByAdminUserId),
    index('ai_credit_awards_expires_at_idx').on(table.expiresAt),
    index('ai_credit_awards_created_at_idx').on(table.createdAt),
    check('ai_credit_awards_amount_positive', sql`${table.amountCredits} > 0`),
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
      .$type<AiGenerationTokenUsage>()
      .notNull()
      .default([]),
    input: jsonb('input').notNull().$type<ExternalAiGenerationInput>(),
    output: jsonb('output').notNull().$type<ExternalAiGenerationOutput>(),
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
      .$type<AiGenerationTokenUsage>()
      .notNull()
      .default([]),
    input: jsonb('input').notNull().$type<ExternalAiGenerationInput>(),
    output: jsonb('output').notNull().$type<ExternalAiGenerationOutput>(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    index('ai_internal_generations_domain_idx').on(table.domain),
    index('ai_internal_generations_type_idx').on(table.type),
    index('ai_internal_generations_batch_id_idx').on(table.batchId),
  ],
);

export const leadgenRunsTable = pgTable(
  'leadgen_runs',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    domain: text('domain').notNull().$type<NamefiNormalizedDomain>(),
    status: leadgenRunStatusEnum('status').notNull().default('QUEUED'),
    reasoningEffort: leadgenReasoningEffortEnum('reasoning_effort')
      .notNull()
      .default('medium'),
    workflowId: text('workflow_id').unique(),
    errorMessage: text('error_message'),
    summary: text('summary'),
    leadCount: integer('lead_count').notNull().default(0),
    contactCount: integer('contact_count').notNull().default(0),
    draftCount: integer('draft_count').notNull().default(0),
    tokenUsage: jsonb('token_usage')
      .$type<LeadgenTokenUsage>()
      .notNull()
      .default([]),
    input: jsonb('input').notNull().$type<LeadgenRunInput>(),
    metadata: jsonb('metadata').default({}).$type<LeadgenMetadata>(),
    ...lifecycleTimestamps,
    ...timestamps,
  },
  (table) => [
    index('leadgen_runs_user_created_idx').on(table.userId, table.createdAt),
    index('leadgen_runs_user_status_idx').on(table.userId, table.status),
    index('leadgen_runs_domain_idx').on(table.domain),
  ],
);

export const leadgenEventsTable = pgTable(
  'leadgen_events',
  {
    ...randomUuid,
    runId: uuid('run_id')
      .notNull()
      .references(() => leadgenRunsTable.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    stage: text('stage'),
    message: text('message'),
    payload: jsonb('payload').default({}).$type<LeadgenMetadata>(),
    transient: boolean('transient').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('leadgen_events_run_created_idx').on(table.runId, table.createdAt),
  ],
);

export const leadgenLeadsTable = pgTable(
  'leadgen_leads',
  {
    ...randomUuid,
    runId: uuid('run_id')
      .notNull()
      .references(() => leadgenRunsTable.id, { onDelete: 'cascade' }),
    businessDomain: text('business_domain').notNull(),
    companyName: text('company_name'),
    status: leadgenOpportunityStatusEnum('status')
      .notNull()
      .default('checking'),
    score: integer('score').notNull().default(0),
    riskLevel: leadgenRiskLevelEnum('risk_level').notNull().default('low'),
    riskNote: text('risk_note'),
    contactReadiness: leadgenContactReadinessEnum('contact_readiness')
      .notNull()
      .default('not_searched'),
    query: text('query').notNull(),
    rationale: text('rationale').notNull(),
    content: text('content').notNull(),
    rank: integer('rank').notNull().default(0),
    metadata: jsonb('metadata').default({}).$type<LeadgenMetadata>(),
    ...timestamps,
  },
  (table) => [
    index('leadgen_leads_run_status_rank_idx').on(
      table.runId,
      table.status,
      table.rank,
    ),
    unique('leadgen_leads_run_domain_unique').on(
      table.runId,
      table.businessDomain,
    ),
  ],
);

export const leadgenLeadSignalsTable = pgTable(
  'leadgen_lead_signals',
  {
    ...randomUuid,
    runId: uuid('run_id')
      .notNull()
      .references(() => leadgenRunsTable.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leadgenLeadsTable.id, { onDelete: 'cascade' }),
    recipe: text('recipe').notNull(),
    signalType: text('signal_type').notNull(),
    query: text('query').notNull(),
    evidenceUrl: text('evidence_url'),
    evidenceSnippet: varchar('evidence_snippet', { length: 700 }).notNull(),
    metadata: jsonb('metadata').default({}).$type<LeadgenMetadata>(),
    ...timestamps,
  },
  (table) => [
    index('leadgen_lead_signals_run_lead_idx').on(table.runId, table.leadId),
    unique('leadgen_lead_signals_lead_signal_unique').on(
      table.leadId,
      table.recipe,
      table.signalType,
      table.evidenceSnippet,
    ),
  ],
);

export const leadgenContactsTable = pgTable(
  'leadgen_contacts',
  {
    ...randomUuid,
    runId: uuid('run_id')
      .notNull()
      .references(() => leadgenRunsTable.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').references(() => leadgenLeadsTable.id, {
      onDelete: 'set null',
    }),
    businessDomain: text('business_domain').notNull(),
    email: text('email').notNull(),
    name: text('name'),
    title: text('title'),
    sourceUrl: text('source_url'),
    context: text('context'),
    notes: text('notes'),
    errorMessage: text('error_message'),
    fromCache: boolean('from_cache').notNull().default(false),
    metadata: jsonb('metadata').default({}).$type<LeadgenMetadata>(),
    ...timestamps,
  },
  (table) => [
    index('leadgen_contacts_run_domain_idx').on(
      table.runId,
      table.businessDomain,
    ),
    unique('leadgen_contacts_run_domain_email_unique').on(
      table.runId,
      table.businessDomain,
      table.email,
    ),
  ],
);

export const leadgenEmailDraftsTable = pgTable(
  'leadgen_email_drafts',
  {
    ...randomUuid,
    runId: uuid('run_id')
      .notNull()
      .references(() => leadgenRunsTable.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').references(() => leadgenLeadsTable.id, {
      onDelete: 'set null',
    }),
    contactId: uuid('contact_id').references(() => leadgenContactsTable.id, {
      onDelete: 'set null',
    }),
    businessDomain: text('business_domain').notNull(),
    contactEmail: text('contact_email').notNull(),
    subject: text('subject').notNull(),
    fullEmail: text('full_email').notNull(),
    fromCache: boolean('from_cache').notNull().default(false),
    metadata: jsonb('metadata').default({}).$type<LeadgenMetadata>(),
    ...timestamps,
  },
  (table) => [
    index('leadgen_email_drafts_run_domain_idx').on(
      table.runId,
      table.businessDomain,
    ),
    unique('leadgen_email_drafts_run_domain_email_unique').on(
      table.runId,
      table.businessDomain,
      table.contactEmail,
    ),
  ],
);

/**
 * Free claims table
 * Stores rows that determine whether users qualify for free domain claims
 * Each row can only be used once and is atomic to prevent concurrency issues
 */
export const freeClaimClaimingStatusEnum = pgEnum(
  'free_claim_claiming_status',
  freeClaimClaimingStatusValues,
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

    // ============ PLAIN key restrictions ============
    // These fields only apply to PLAIN keys, not PUBLIC_PRIVATE keys

    // Allowed IP addresses and CIDR ranges (e.g., ['192.168.1.1', '10.0.0.0/8', '2001:db8::/32'])
    // null or empty array = no IP restriction (allow all)
    allowedIps: text('allowed_ips').array(),

    // Allowed origins with wildcard support (e.g., ['https://example.com', 'https://*.example.com'])
    // null or empty array = no origin restriction (allow all)
    allowedOrigins: text('allowed_origins').array(),

    // Whether to allow requests with Origin header (browser requests)
    // Default false for new keys (secure by default)
    allowBrowserRequests: boolean('allow_browser_requests')
      .notNull()
      .default(false),

    // Whether to allow requests without Origin header (server-to-server requests)
    // Default false for new keys (secure by default)
    allowServerRequests: boolean('allow_server_requests')
      .notNull()
      .default(false),

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

/**
 * x402 purchase status enum
 * Tracks the state of x402 protocol purchases
 */
export const x402PurchaseStatusEnum = pgEnum('x402_purchase_status', [
  'PENDING_SETTLEMENT', // Waiting for payment to be settled
  'PENDING_VERIFICATION', // Payment received, pending verification (legacy)
  'VERIFIED', // Payment verified by facilitator (legacy)
  'PROCESSING', // Domain registration in progress
  'SETTLING', // Payment settlement in progress (legacy)
  'SETTLED', // Payment settled on-chain
  'COMPLETED', // Purchase fully completed (domain registered + payment settled)
  'FAILED', // Purchase failed
  'REFUNDING', // Refund in progress
  'REFUNDED', // Payment refunded
] as const);

/**
 * x402 purchases table
 * Stores x402 protocol domain purchases
 *
 * Flow:
 * 1. Client sends payment payload via x402 header
 * 2. Server verifies payment with facilitator
 * 3. Server processes domain registration
 * 4. Server settles payment with facilitator
 * 5. Domain is minted to buyer's wallet
 */
export const x402PurchasesTable = pgTable(
  'x402_purchases',
  {
    ...randomUuid,
    ...normalizedDomain,
    ...amountInUsdCents,
    /**
     * Buyer's wallet address (from x402 payment)
     */
    buyerWalletAddress: text('buyer_wallet_address').notNull(),
    /**
     * Wallet address that should receive the NFT, defaults to the buyer wallet
     */
    nftReceivingWalletAddress: text('nft_receiving_wallet_address'),
    /**
     * Wallet address recovered from the EIP-3009 payment signature via recoverTypedDataAddress
     */
    signerWalletAddress: text('signer_wallet_address'),
    /**
     * Network in CAIP-2 format (e.g., eip155:8453 for Base)
     */
    network: text('network').notNull(),
    /**
     * Duration of registration in years
     */
    durationInYears: integer('duration_in_years').notNull().default(1),
    /**
     * Current status of the purchase
     */
    status: x402PurchaseStatusEnum('status')
      .notNull()
      .default('PENDING_SETTLEMENT'),
    /**
     * Payment nonce from the x402 payload - used for deduplication
     * This is extracted from paymentPayload.payload.nonce
     */
    paymentNonce: text('payment_nonce').notNull(),
    /**
     * Optional linked user ID (may be null for new users created from wallet)
     */
    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    /**
     * Optional linked order ID (created after verification)
     */
    orderId: uuid('order_id').references(() => ordersTable.id, {
      onDelete: 'set null',
    }),
    /**
     * x402 payment payload for verification/settlement
     */
    paymentPayload: jsonb('payment_payload').$type<PaymentPayload>(),
    /**
     * Transaction hash from settlement
     */
    settlementTxHash: text('settlement_tx_hash'),
    /**
     * Timestamp when settlement was completed
     */
    settledAt: timestamp('settled_at', { withTimezone: true }),
    /**
     * Error message if purchase failed
     */
    errorMessage: text('error_message'),
    /**
     * Temporal workflow ID for tracking
     */
    workflowId: text('workflow_id'),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_positive', sql`amount_in_usd_cents > 0`),
    index('x402_purchases_buyer_wallet_idx').on(table.buyerWalletAddress),
    index('x402_purchases_status_idx').on(table.status),
    index('x402_purchases_user_id_idx').on(table.userId),
    index('x402_purchases_order_id_idx').on(table.orderId),
    index('x402_purchases_domain_idx').on(table.normalizedDomainName),
    // Unique constraint on payment nonce to prevent duplicate purchases
    unique('x402_purchases_payment_nonce_unique').on(table.paymentNonce),
  ],
);

/**
 * In-app notifications
 *
 * Backing table for the bell/inbox UI. Designed for speed over durability:
 * the table is created UNLOGGED (see post-Drizzle SQL edit in the migration)
 * because short-lived UX surfacings are acceptable to lose on a DB crash.
 * Hot reads (unread count) are additionally cached in Redis.
 *
 * `isSeen` / `isArchived` are derived in the API layer from `seenAt` /
 * `archivedAt` (truthy iff non-null) rather than via a generated column.
 */
export const notificationBodyTypeEnum = pgEnum(
  'notification_body_type',
  notificationBodyTypeValues,
);
export const notificationPriorityEnum = pgEnum(
  'notification_priority',
  notificationPriorityValues,
);
export type { NotificationRelatedResource, NotificationResourceType };

export type NotificationMetadata = {
  autoMarkedAsSeen?: boolean;
  source?: string;
  [k: string]: unknown;
};

export const notificationsTable = pgTable(
  'notifications',
  {
    ...randomUuid,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    body: text('body').notNull(),
    bodyType: notificationBodyTypeEnum('body_type').notNull().default('plain'),
    /**
     * Urgency hint that drives the audio cue on rise. `silent` / `low`
     * never play a sound; `normal` and above do. Defaults to `normal`
     * for existing rows (Drizzle adds the column with this default,
     * which backfills history in place).
     */
    priority: notificationPriorityEnum('priority').notNull().default('normal'),
    relatedResources: jsonb('related_resources')
      .$type<NotificationRelatedResource[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    metadata: jsonb('metadata')
      .$type<NotificationMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    seenAt: timestamp('seen_at'),
    archivedAt: timestamp('archived_at'),
    ...timestamps,
  },
  (table) => [
    index('notifications_user_created_idx').on(
      table.userId,
      table.createdAt.desc(),
    ),
    index('notifications_user_unseen_idx')
      .on(table.userId)
      .where(sql`${table.seenAt} IS NULL AND ${table.archivedAt} IS NULL`),
    index('notifications_related_resources_gin_idx').using(
      'gin',
      table.relatedResources,
    ),
  ],
);
