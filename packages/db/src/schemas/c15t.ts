import {
  pgTable,
  varchar,
  boolean,
  text,
  timestamp,
  json,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// c15t v2 tenant columns are nullable while existing rows stay single-tenant.
// Keep upstream ID-scoped FKs until a tenant backfill can make tenantId required.
export const subject = pgTable('c15t_subject', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  isIdentified: boolean('isIdentified').notNull().default(false),
  externalId: text('externalId'),
  identityProvider: text('identityProvider'),
  lastIpAddress: text('lastIpAddress'),
  subjectTimezone: text('subjectTimezone'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  tenantId: text('tenantId'),
});

export const subjectRelations = relations(subject, ({ many }) => ({
  consents: many(consent, {
    relationName: 'consent_subject',
  }),
  consentRecords: many(consentRecord, {
    relationName: 'consentRecord_subject',
  }),
  auditLogs: many(auditLog, {
    relationName: 'auditLog_subject',
  }),
}));

export const domain = pgTable('c15t_domain', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
  allowedOrigins: json('allowedOrigins'),
  isVerified: boolean('isVerified').notNull().default(true),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  tenantId: text('tenantId'),
});

export const domainRelations = relations(domain, ({ many }) => ({
  consents: many(consent, {
    relationName: 'consent_domain',
  }),
}));

export const consentPolicy = pgTable('c15t_consentPolicy', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  version: text('version').notNull(),
  type: text('type').notNull(),
  name: text('name'),
  hash: text('hash'),
  effectiveDate: timestamp('effectiveDate').notNull(),
  expirationDate: timestamp('expirationDate'),
  content: text('content'),
  contentHash: text('contentHash'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  tenantId: text('tenantId'),
});

export const consentPolicyRelations = relations(consentPolicy, ({ many }) => ({
  consents: many(consent, {
    relationName: 'consent_consentPolicy',
  }),
  runtimePolicyDecisions: many(runtimePolicyDecision, {
    relationName: 'runtimePolicyDecision_consentPolicy',
  }),
}));

export const runtimePolicyDecision = pgTable(
  'c15t_runtimePolicyDecision',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    tenantId: text('tenantId'),
    policyId: text('policyId').notNull(),
    fingerprint: text('fingerprint').notNull(),
    matchedBy: text('matchedBy').notNull(),
    countryCode: text('countryCode'),
    regionCode: text('regionCode'),
    jurisdiction: text('jurisdiction').notNull(),
    language: text('language'),
    model: text('model').notNull(),
    policyI18n: json('policyI18n'),
    uiMode: text('uiMode'),
    bannerUi: json('bannerUi'),
    dialogUi: json('dialogUi'),
    categories: json('categories'),
    preselectedCategories: json('preselectedCategories'),
    proofConfig: json('proofConfig'),
    dedupeKey: text('dedupeKey').notNull().unique(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.policyId],
      foreignColumns: [consentPolicy.id],
      name: 'runtimePolicyDecision_consentPolicy_policy_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
  ],
);

export const runtimePolicyDecisionRelations = relations(
  runtimePolicyDecision,
  ({ one, many }) => ({
    policy: one(consentPolicy, {
      relationName: 'runtimePolicyDecision_consentPolicy',
      fields: [runtimePolicyDecision.policyId],
      references: [consentPolicy.id],
    }),
    consents: many(consent, {
      relationName: 'consent_runtimePolicyDecision',
    }),
  }),
);

export const consentPurpose = pgTable('c15t_consentPurpose', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  code: text('code').notNull(),
  name: text('name'),
  description: text('description'),
  isEssential: boolean('isEssential').notNull().default(false),
  dataCategory: text('dataCategory'),
  legalBasis: text('legalBasis'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  tenantId: text('tenantId'),
});

export const consent = pgTable(
  'c15t_consent',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    subjectId: text('subjectId').notNull(),
    domainId: text('domainId').notNull(),
    policyId: text('policyId'),
    purposeIds: json('purposeIds').notNull(),
    metadata: json('metadata'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    status: text('status').notNull().default('active'),
    withdrawalReason: text('withdrawalReason'),
    givenAt: timestamp('givenAt').notNull().defaultNow(),
    validUntil: timestamp('validUntil'),
    isActive: boolean('isActive').notNull().default(true),
    jurisdiction: text('jurisdiction'),
    jurisdictionModel: text('jurisdictionModel'),
    tcString: text('tcString'),
    uiSource: text('uiSource'),
    consentAction: text('consentAction'),
    runtimePolicyDecisionId: text('runtimePolicyDecisionId'),
    runtimePolicySource: text('runtimePolicySource'),
    tenantId: text('tenantId'),
  },
  (table) => [
    foreignKey({
      columns: [table.subjectId],
      foreignColumns: [subject.id],
      name: 'consent_subject_subject_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domain.id],
      name: 'consent_domain_domain_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.policyId],
      foreignColumns: [consentPolicy.id],
      name: 'consent_consentPolicy_policy_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.runtimePolicyDecisionId],
      foreignColumns: [runtimePolicyDecision.id],
      name: 'consent_runtimePolicyDecision_runtimePolicyDecision_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
  ],
);

export const consentRelations = relations(consent, ({ one, many }) => ({
  subject: one(subject, {
    relationName: 'consent_subject',
    fields: [consent.subjectId],
    references: [subject.id],
  }),
  domain: one(domain, {
    relationName: 'consent_domain',
    fields: [consent.domainId],
    references: [domain.id],
  }),
  policy: one(consentPolicy, {
    relationName: 'consent_consentPolicy',
    fields: [consent.policyId],
    references: [consentPolicy.id],
  }),
  runtimePolicyDecision: one(runtimePolicyDecision, {
    relationName: 'consent_runtimePolicyDecision',
    fields: [consent.runtimePolicyDecisionId],
    references: [runtimePolicyDecision.id],
  }),
  consentRecords: many(consentRecord, {
    relationName: 'consentRecord_consent',
  }),
}));

export const auditLog = pgTable(
  'c15t_auditLog',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    entityType: text('entityType').notNull(),
    entityId: text('entityId').notNull(),
    actionType: text('actionType').notNull(),
    subjectId: text('subjectId'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    changes: json('changes'),
    metadata: json('metadata'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    eventTimezone: text('eventTimezone').notNull().default('UTC'),
    tenantId: text('tenantId'),
  },
  (table) => [
    foreignKey({
      columns: [table.subjectId],
      foreignColumns: [subject.id],
      name: 'auditLog_subject_subject_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
  ],
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  subject: one(subject, {
    relationName: 'auditLog_subject',
    fields: [auditLog.subjectId],
    references: [subject.id],
  }),
}));

export const consentRecord = pgTable(
  'c15t_consentRecord',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    subjectId: text('subjectId').notNull(),
    consentId: text('consentId'),
    actionType: text('actionType').notNull(),
    details: json('details'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.subjectId],
      foreignColumns: [subject.id],
      name: 'consentRecord_subject_subject_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.consentId],
      foreignColumns: [consent.id],
      name: 'consentRecord_consent_consent_fk',
    })
      .onUpdate('restrict')
      .onDelete('restrict'),
  ],
);

export const consentRecordRelations = relations(consentRecord, ({ one }) => ({
  subject: one(subject, {
    relationName: 'consentRecord_subject',
    fields: [consentRecord.subjectId],
    references: [subject.id],
  }),
  consent: one(consent, {
    relationName: 'consentRecord_consent',
    fields: [consentRecord.consentId],
    references: [consent.id],
  }),
}));

export const private_c15t_settings = pgTable('c15t_private_c15t_settings', {
  id: varchar('id', { length: 255 }).primaryKey().notNull(),
  version: varchar('version', { length: 255 }).notNull().default('1.0.0'),
});
