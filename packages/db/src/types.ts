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
  orderItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
  usersTable,
} from './schema';

/**
 * Utility to create all necessary Zod schemas for a table
 * @param table The Drizzle table to create schemas for
 * @param prefix The prefix to use for the schema names
 * @returns Object containing insert, select, and update schemas
 */
const createTableSchemas = <T extends AnyPgTable>(
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
export const { userInsertSchema, userSelectSchema, userUpdateSchema } =
  createTableSchemas(usersTable, 'user');

export const { cartInsertSchema, cartSelectSchema, cartUpdateSchema } =
  createTableSchemas(cartsTable, 'cart');

export const {
  cartItemInsertSchema,
  cartItemSelectSchema,
  cartItemUpdateSchema,
} = createTableSchemas(cartItemsTable, 'cartItem');

export const { paymentInsertSchema, paymentSelectSchema, paymentUpdateSchema } =
  createTableSchemas(paymentsTable, 'payment');

export const { refundInsertSchema, refundSelectSchema, refundUpdateSchema } =
  createTableSchemas(refundsTable, 'refund');

export const { orderInsertSchema, orderSelectSchema, orderUpdateSchema } =
  createTableSchemas(ordersTable, 'order');

export const {
  orderItemInsertSchema,
  orderItemSelectSchema,
  orderItemUpdateSchema,
} = createTableSchemas(orderItemsTable, 'orderItem');

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
