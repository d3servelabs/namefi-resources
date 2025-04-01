import type { AnyPgTable } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import type { z } from 'zod';
import {
  cartItemsTable,
  cartsTable,
  dnsRecordsTable,
  orderItemsTable,
  ordersTable,
  type paymentProviderEnum,
  type paymentStatusEnum,
  paymentsTable,
  type refundStatusEnum,
  refundsTable,
  usersTable,
} from './schema';

// TODO: types are not being exported correctly
/**
 * Utility to create all necessary Zod schemas for a table
 * @param table The Drizzle table to create schemas for
 * @param prefix The prefix to use for the schema names
 * @returns Object containing insert, select, and update schemas
 * @deprecated
 */
const _createTableSchemas = <T extends AnyPgTable>(
  table: T,
  prefix: string,
) => ({
  [`${prefix}InsertSchema`]: createInsertSchema(table),
  [`${prefix}SelectSchema`]: createSelectSchema(table),
  [`${prefix}UpdateSchema`]: createUpdateSchema(table),
});

/**
 * Zod schemas for type-safe operations
 */
export const userInsertSchema = createInsertSchema(usersTable);
export const userSelectSchema = createSelectSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);

export const cartInsertSchema = createInsertSchema(cartsTable);
export const cartSelectSchema = createSelectSchema(cartsTable);
export const cartUpdateSchema = createUpdateSchema(cartsTable);

export const cartItemInsertSchema = createInsertSchema(cartItemsTable);
export const cartItemSelectSchema = createSelectSchema(cartItemsTable);
export const cartItemUpdateSchema = createUpdateSchema(cartItemsTable);

export const paymentInsertSchema = createInsertSchema(paymentsTable);
export const paymentSelectSchema = createSelectSchema(paymentsTable);
export const paymentUpdateSchema = createUpdateSchema(paymentsTable);

export const refundInsertSchema = createInsertSchema(refundsTable);
export const refundSelectSchema = createSelectSchema(refundsTable);
export const refundUpdateSchema = createUpdateSchema(refundsTable);

export const orderInsertSchema = createInsertSchema(ordersTable);
export const orderSelectSchema = createSelectSchema(ordersTable);
export const orderUpdateSchema = createUpdateSchema(ordersTable);

export const orderItemInsertSchema = createInsertSchema(orderItemsTable);
export const orderItemSelectSchema = createSelectSchema(orderItemsTable);
export const orderItemUpdateSchema = createUpdateSchema(orderItemsTable);

/**
 * DNS Record schemas
 */
export const dnsRecordInsertSchema = createInsertSchema(dnsRecordsTable);
export const dnsRecordSelectSchema = createSelectSchema(dnsRecordsTable);
export const dnsRecordUpdateSchema = createUpdateSchema(dnsRecordsTable);

/**
 * Inferred Zod types for API and validation
 */

// User types
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserSelect = z.infer<typeof userSelectSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

// Cart types
export type CartInsert = z.infer<typeof cartInsertSchema>;
export type CartSelect = z.infer<typeof cartSelectSchema>;
export type CartUpdate = z.infer<typeof cartUpdateSchema>;

// CartItem types
export type CartItemInsert = z.infer<typeof cartItemInsertSchema>;
export type CartItemSelect = z.infer<typeof cartItemSelectSchema>;
export type CartItemUpdate = z.infer<typeof cartItemUpdateSchema>;

// Payment types
export type PaymentInsert = z.infer<typeof paymentInsertSchema>;
export type PaymentSelect = z.infer<typeof paymentSelectSchema>;
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>;

// Refund types
export type RefundInsert = z.infer<typeof refundInsertSchema>;
export type RefundSelect = z.infer<typeof refundSelectSchema>;
export type RefundUpdate = z.infer<typeof refundUpdateSchema>;

// Order types
export type OrderInsert = z.infer<typeof orderInsertSchema>;
export type OrderSelect = z.infer<typeof orderSelectSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;

// OrderItem types
export type OrderItemInsert = z.infer<typeof orderItemInsertSchema>;
export type OrderItemSelect = z.infer<typeof orderItemSelectSchema>;
export type OrderItemUpdate = z.infer<typeof orderItemUpdateSchema>;

// DNS Record types
export type DnsRecordInsert = z.infer<typeof dnsRecordInsertSchema>;
export type DnsRecordSelect = z.infer<typeof dnsRecordSelectSchema>;
export type DnsRecordUpdate = z.infer<typeof dnsRecordUpdateSchema>;

/**
 * Enum types from pgEnums
 */

// PaymentEnums
export type PaymentProvider = (typeof paymentProviderEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type RefundStatus = (typeof refundStatusEnum.enumValues)[number];

export type NfscPaymentDetails = { chainId: number; walletAddress: string };
export type StripePaymentDetails = { paymentMethodId?: string };

export type PaymentProviderDetails =
  | {
      paymentProvider: Extract<PaymentProvider, 'STRIPE'>;
      stripePaymentDetails: StripePaymentDetails;
    }
  | {
      paymentProvider: Extract<
        PaymentProvider,
        'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA'
      >;
      nfscPaymentDetails: NfscPaymentDetails;
    };
