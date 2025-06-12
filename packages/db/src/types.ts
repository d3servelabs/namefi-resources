import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';
import {
  aiGenerationsTable,
  cartItemsTable,
  dnsRecordsTable,
  orderItemsTable,
  orderStatusEnum,
  ordersTable,
  paymentProviderEnum,
  paymentStatusEnum,
  paymentsTable,
  refundStatusEnum,
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
export const dnsRecordInsertSchema = createInsertSchema(dnsRecordsTable, {
  zoneName: namefiNormalizedDomainSchema,
});
export const dnsRecordSelectSchema = createSelectSchema(dnsRecordsTable, {
  zoneName: namefiNormalizedDomainSchema,
});
export const dnsRecordUpdateSchema = createUpdateSchema(dnsRecordsTable, {
  zoneName: namefiNormalizedDomainSchema,
});

/**
 * AI Generation schemas
 */
export const aiGenerationInsertSchema = createInsertSchema(aiGenerationsTable);
export const aiGenerationSelectSchema = createSelectSchema(aiGenerationsTable);
export const aiGenerationUpdateSchema = createUpdateSchema(aiGenerationsTable);

/**
 * Inferred Zod types for API and validation
 */

// User types
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserSelect = z.infer<typeof userSelectSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

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

// AI Generation types
export type AiGenerationInsert = z.infer<typeof aiGenerationInsertSchema>;
export type AiGenerationSelect = z.infer<typeof aiGenerationSelectSchema>;
export type AiGenerationUpdate = z.infer<typeof aiGenerationUpdateSchema>;

/**
 * Enum types from pgEnums
 */

export const paymentProviderSchema = z.enum(paymentProviderEnum.enumValues);
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export const paymentStatusSchema = z.enum(paymentStatusEnum.enumValues);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export const refundStatusSchema = z.enum(refundStatusEnum.enumValues);
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export const orderStatusSchema = z.enum(orderStatusEnum.enumValues);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export type NfscPaymentDetails = Exclude<
  z.infer<typeof paymentInsertSchema.shape.nfscPaymentDetails>,
  undefined | null
>;
// Note: A bug or limitation of drizzle-zod seems to be that optional fields in json are inferred as unknown. Hence defining the type here.
const stripePaymentDetailsSchema = z.object({
  paymentMethodId: z.string().optional(),
});
export type StripePaymentDetails = z.infer<typeof stripePaymentDetailsSchema>;

export const nfscPaymentProviderSchema = z.enum([
  paymentProviderSchema.Values.NFSC_BASE,
  paymentProviderSchema.Values.NFSC_ETHEREUM,
  paymentProviderSchema.Values.NFSC_ETHEREUM_SEPOLIA,
]);
export type NfscPaymentProvider = z.infer<typeof nfscPaymentProviderSchema>;

export const stripePaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.Values.STRIPE),
  stripePaymentDetails: stripePaymentDetailsSchema,
});

export type StripePaymentProviderDetails = z.infer<
  typeof stripePaymentProviderDetailsSchema
>;

export const nfscPaymentProviderDetailsSchema = z.object({
  paymentProvider: nfscPaymentProviderSchema,
  nfscPaymentDetails: paymentInsertSchema.shape.nfscPaymentDetails
    .unwrap()
    .refine((d) => d !== null),
});

export type NfscPaymentProviderDetails = z.infer<
  typeof nfscPaymentProviderDetailsSchema
>;

export const paymentProviderDetailsSchema = z.discriminatedUnion(
  'paymentProvider',
  [stripePaymentProviderDetailsSchema, nfscPaymentProviderDetailsSchema],
);

export type PaymentProviderDetails = z.infer<
  typeof paymentProviderDetailsSchema
>;

/**
 * Type guard function to check if payment details are Stripe payment details
 * @param details The payment provider details to check
 * @returns Narrowed type with Stripe payment details if applicable
 */
export function isStripePayment(
  details: unknown,
): details is StripePaymentProviderDetails {
  return stripePaymentProviderDetailsSchema.safeParse(details).success;
}

/**
 * Type guard function to check if payment details are NFSC payment details
 * @param details The payment provider details to check
 * @returns Narrowed type with NFSC payment details if applicable
 */
export function isNfscPayment(
  details: unknown,
): details is NfscPaymentProviderDetails {
  return nfscPaymentProviderDetailsSchema.safeParse(details).success;
}

export const orderItemStatusSchema = z.enum(orderStatusEnum.enumValues);
export type OrderItemStatus = z.infer<typeof orderItemStatusSchema>;
