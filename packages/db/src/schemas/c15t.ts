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

export const subject = pgTable('subject', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  isIdentified: boolean('isIdentified').notNull().default(false),
  externalId: text('externalId'),
  identityProvider: text('identityProvider'),
  lastIpAddress: text('lastIpAddress'),
  subjectTimezone: text('subjectTimezone'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const subjectRelations = relations(subject, ({ one, many }) => ({
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

export const domain = pgTable('domain', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
  allowedOrigins: json('allowedOrigins'),
  isVerified: boolean('isVerified').notNull().default(true),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const domainRelations = relations(domain, ({ one, many }) => ({
  consents: many(consent, {
    relationName: 'consent_domain',
  }),
}));

export const consentPolicy = pgTable('consentPolicy', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  version: text('version').notNull(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  effectiveDate: timestamp('effectiveDate').notNull(),
  expirationDate: timestamp('expirationDate'),
  content: text('content').notNull(),
  contentHash: text('contentHash').notNull(),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const consentPolicyRelations = relations(
  consentPolicy,
  ({ one, many }) => ({
    consents: many(consent, {
      relationName: 'consent_consentPolicy',
    }),
  }),
);

export const consentPurpose = pgTable('consentPurpose', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isEssential: boolean('isEssential').notNull(),
  dataCategory: text('dataCategory'),
  legalBasis: text('legalBasis'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const consent = pgTable(
  'consent',
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
  consentRecords: many(consentRecord, {
    relationName: 'consentRecord_consent',
  }),
}));

export const auditLog = pgTable(
  'auditLog',
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

export const auditLogRelations = relations(auditLog, ({ one, many }) => ({
  subject: one(subject, {
    relationName: 'auditLog_subject',
    fields: [auditLog.subjectId],
    references: [subject.id],
  }),
}));

export const consentRecord = pgTable(
  'consentRecord',
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

export const consentRecordRelations = relations(
  consentRecord,
  ({ one, many }) => ({
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
  }),
);

export const private_c15t_settings = pgTable('private_c15t_settings', {
  id: varchar('id', { length: 255 }).primaryKey().notNull(),
  version: varchar('version', { length: 255 }).notNull().default('1.0.0'),
});
