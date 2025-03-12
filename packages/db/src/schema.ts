/**
 * Database schema definition for the Namefi application.
 * Note: Currently maintained in a single file for simplicity.
 * Consider splitting into multiple files if schema grows significantly.
 */

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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

/**
 * Carts table
 * Stores shopping carts for users
 * One cart per user (OneToOne relationship)
 */
export const cartsTable = pgTable(
  'cart',
  {
    ...randomUuid,
    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (table) => [
    unique('user_id_idx').on(table.userId),
    index('cart_user_id_idx').on(table.userId),
  ],
);

/**
 * Cart items table
 * Stores individual items in a shopping cart
 */
export const cartItemsTable = pgTable(
  'cart_items',
  {
    ...randomUuid,
    cartId: uuid('cart_id')
      .notNull()
      .references(() => cartsTable.id, { onDelete: 'cascade' }),
    ...normalizedDomain,
    ...amountInUsdCents,
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    check('amount_in_usd_cents_nonnegative', sql`amount_in_usd_cents >= 0`),
    index('cart_items_cart_id_idx').on(table.cartId),
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
    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    status: orderStatusEnum('status').notNull().default('CREATED'),
    paymentId: uuid('payment_id').references(() => paymentsTable.id, {
      onDelete: 'restrict',
    }),
    ...amountInUsdCents,
    totalAmountInUSDCents: integer('total_amount_in_usd_cents').notNull(),
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

// Design discussion:
//   We didnt create a dns_zones table because there seems to be no need for it.
//   The ownership of a zone is tied to the NFT address, which is derived from the
//   domain name.
export const dnsRecordsTable = pgTable(
  'dns_records',
  {
    ...randomUuid,
    normalizedDomainName: text('normalized_domain_name').notNull(),
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
    type: text('type').notNull(),
    class: text('class').notNull().default('IN'),
    ttl: integer('ttl').notNull().default(120),
    rdata: text('rdata').notNull(),
    metadata: jsonb('metadata').default({}),
    ...timestamps,
  },
  (table) => [
    index('dns_records_domain_idx').on(table.normalizedDomainName),
    index('dns_records_name_idx').on(table.name),
    index('dns_records_type_idx').on(table.type),
    unique('dns_records_domain_name_type_class_rdata_unique').on(
      table.normalizedDomainName,
      table.name,
      table.type,
      table.class,
      table.rdata,
    ),
  ],
);
