import { relations } from 'drizzle-orm';
import {
  aiGenerationsTable,
  aiCreditAwardsTable,
  apiKeysTable,
  cartItemsTable,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenLeadSignalsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
  namefiFeedIngestionRunsTable,
  namefiFeedListingReportsTable,
  namefiFeedListingsTable,
  namefiFeedPostsTable,
  linkSharesTable,
  orderItemsTable,
  orderNfscItemsTable,
  ordersTable,
  feedbackResponsesTable,
  paymentsTable,
  refundsTable,
  usersTable,
  wishlistedDomainsTable,
} from './schema';
import { huntEdgesTable } from './schemas/hunt';

// User relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orders: many(ordersTable),
  aiGenerations: many(aiGenerationsTable),
  aiCreditAwards: many(aiCreditAwardsTable),
  leadgenRuns: many(leadgenRunsTable),
  namefiFeedIngestionRuns: many(namefiFeedIngestionRunsTable),
  wishlistedDomains: many(wishlistedDomainsTable),
  linkShares: many(linkSharesTable),
  feedbackResponses: many(feedbackResponsesTable),
  apiKeys: many(apiKeysTable),
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
  items: many(orderItemsTable),
  nfscItems: many(orderNfscItemsTable),
  payments: many(paymentsTable),
}));

// Order items relations
export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id],
  }),
}));

// Order NFSC items relations
export const orderNfscItemsRelations = relations(
  orderNfscItemsTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [orderNfscItemsTable.orderId],
      references: [ordersTable.id],
    }),
  }),
);

// Payment relations
export const paymentsRelations = relations(paymentsTable, ({ one, many }) => ({
  order: one(ordersTable, {
    fields: [paymentsTable.orderId],
    references: [ordersTable.id],
  }),
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

export const aiCreditAwardsRelations = relations(
  aiCreditAwardsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [aiCreditAwardsTable.userId],
      references: [usersTable.id],
    }),
    awardedByAdmin: one(usersTable, {
      fields: [aiCreditAwardsTable.awardedByAdminUserId],
      references: [usersTable.id],
    }),
  }),
);

export const leadgenRunsRelations = relations(
  leadgenRunsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [leadgenRunsTable.userId],
      references: [usersTable.id],
    }),
    leads: many(leadgenLeadsTable),
    leadSignals: many(leadgenLeadSignalsTable),
    contacts: many(leadgenContactsTable),
    emailDrafts: many(leadgenEmailDraftsTable),
  }),
);

export const leadgenLeadsRelations = relations(
  leadgenLeadsTable,
  ({ one, many }) => ({
    run: one(leadgenRunsTable, {
      fields: [leadgenLeadsTable.runId],
      references: [leadgenRunsTable.id],
    }),
    signals: many(leadgenLeadSignalsTable),
    contacts: many(leadgenContactsTable),
    emailDrafts: many(leadgenEmailDraftsTable),
  }),
);

export const leadgenLeadSignalsRelations = relations(
  leadgenLeadSignalsTable,
  ({ one }) => ({
    run: one(leadgenRunsTable, {
      fields: [leadgenLeadSignalsTable.runId],
      references: [leadgenRunsTable.id],
    }),
    lead: one(leadgenLeadsTable, {
      fields: [leadgenLeadSignalsTable.leadId],
      references: [leadgenLeadsTable.id],
    }),
  }),
);

export const leadgenContactsRelations = relations(
  leadgenContactsTable,
  ({ one, many }) => ({
    run: one(leadgenRunsTable, {
      fields: [leadgenContactsTable.runId],
      references: [leadgenRunsTable.id],
    }),
    lead: one(leadgenLeadsTable, {
      fields: [leadgenContactsTable.leadId],
      references: [leadgenLeadsTable.id],
    }),
    emailDrafts: many(leadgenEmailDraftsTable),
  }),
);

export const leadgenEmailDraftsRelations = relations(
  leadgenEmailDraftsTable,
  ({ one }) => ({
    run: one(leadgenRunsTable, {
      fields: [leadgenEmailDraftsTable.runId],
      references: [leadgenRunsTable.id],
    }),
    lead: one(leadgenLeadsTable, {
      fields: [leadgenEmailDraftsTable.leadId],
      references: [leadgenLeadsTable.id],
    }),
    contact: one(leadgenContactsTable, {
      fields: [leadgenEmailDraftsTable.contactId],
      references: [leadgenContactsTable.id],
    }),
  }),
);

export const namefiFeedIngestionRunsRelations = relations(
  namefiFeedIngestionRunsTable,
  ({ one, many }) => ({
    requestedByUser: one(usersTable, {
      fields: [namefiFeedIngestionRunsTable.requestedByUserId],
      references: [usersTable.id],
    }),
    posts: many(namefiFeedPostsTable),
  }),
);

export const namefiFeedPostsRelations = relations(
  namefiFeedPostsTable,
  ({ one, many }) => ({
    ingestionRun: one(namefiFeedIngestionRunsTable, {
      fields: [namefiFeedPostsTable.ingestionRunId],
      references: [namefiFeedIngestionRunsTable.id],
    }),
    listings: many(namefiFeedListingsTable),
  }),
);

export const namefiFeedListingsRelations = relations(
  namefiFeedListingsTable,
  ({ one, many }) => ({
    post: one(namefiFeedPostsTable, {
      fields: [namefiFeedListingsTable.postId],
      references: [namefiFeedPostsTable.id],
    }),
    reports: many(namefiFeedListingReportsTable),
  }),
);

export const namefiFeedListingReportsRelations = relations(
  namefiFeedListingReportsTable,
  ({ one }) => ({
    listing: one(namefiFeedListingsTable, {
      fields: [namefiFeedListingReportsTable.listingId],
      references: [namefiFeedListingsTable.id],
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

export const feedbackResponsesRelations = relations(
  feedbackResponsesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [feedbackResponsesTable.userId],
      references: [usersTable.id],
    }),
  }),
);

// API keys relations
export const apiKeysRelations = relations(apiKeysTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [apiKeysTable.userId],
    references: [usersTable.id],
  }),
}));
