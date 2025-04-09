import { relations } from 'drizzle-orm';
import {
  cartItemsTable,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
  usersTable,
} from './schema';

// User relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orders: many(ordersTable),
}));

// Cart items relations
export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [cartItemsTable.userId],
    references: [usersTable.id],
  }),
}));

// Order relations
export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [ordersTable.userId],
    references: [usersTable.id],
  }),
  payment: one(paymentsTable, {
    fields: [ordersTable.paymentId],
    references: [paymentsTable.id],
  }),
  items: many(orderItemsTable),
}));

// Order items relations
export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id],
  }),
}));

// Payment relations
export const paymentsRelations = relations(paymentsTable, ({ one, many }) => ({
  order: one(ordersTable),
  refunds: many(refundsTable),
}));

// Refund relations
export const refundsRelations = relations(refundsTable, ({ one }) => ({
  payment: one(paymentsTable, {
    fields: [refundsTable.paymentId],
    references: [paymentsTable.id],
  }),
}));
