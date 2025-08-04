import { relations } from 'drizzle-orm';
import {
  aiGenerationsTable,
  cartItemsTable,
  huntEdgesTable,
  linkSharesTable,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
  usersTable,
  wishlistedDomainsTable,
} from './schema';

// User relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orders: many(ordersTable),
  aiGenerations: many(aiGenerationsTable),
  wishlistedDomains: many(wishlistedDomainsTable),
  linkShares: many(linkSharesTable),
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

// AI generations relations
export const aiGenerationsRelations = relations(
  aiGenerationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [aiGenerationsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

// Hunt relations
export const huntEdgesRelations = relations(huntEdgesTable, ({ one }) => ({
  // Relation to users table when source is a user
  sourceUser: one(usersTable, {
    fields: [huntEdgesTable.sourceId],
    references: [usersTable.id],
    relationName: 'huntEdgeSourceUser',
  }),
  // Relation to users table when target is a user
  targetUser: one(usersTable, {
    fields: [huntEdgesTable.targetId],
    references: [usersTable.id],
    relationName: 'huntEdgeTargetUser',
  }),
}));

// Link shares relations
export const linkSharesRelations = relations(linkSharesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [linkSharesTable.userId],
    references: [usersTable.id],
  }),
}));
