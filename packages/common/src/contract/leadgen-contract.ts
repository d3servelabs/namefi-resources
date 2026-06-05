import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { aiTokenUsageEntrySchema } from '../ai-generation-credits';
import { createContract } from './create-contract';

export const leadgenReasoningEffortSchema = z.enum(['low', 'medium', 'high']);

export const leadgenRunStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
]);

export const leadgenOpportunityStatusSchema = z.enum([
  'checking',
  'contact_now',
  'validate_first',
  'low_priority',
  'suppressed',
]);

export const leadgenRiskLevelSchema = z.enum(['low', 'medium', 'high']);

export const leadgenContactReadinessSchema = z.enum([
  'not_searched',
  'contact_found',
  'generic_fallback',
  'not_found',
]);

export const leadgenUserSignalStateSchema = z.enum([
  'none',
  'bookmarked',
  'hidden',
]);

export type LeadgenUserSignalState = z.infer<
  typeof leadgenUserSignalStateSchema
>;

export const LEADGEN_USER_SIGNAL_RECIPE = 'user-prospect-organization';

export const leadgenUserSignalTypeByState = {
  none: 'user_cleared',
  bookmarked: 'user_bookmarked',
  hidden: 'user_hidden',
} as const satisfies Record<LeadgenUserSignalState, string>;

export const leadgenUserSignalEvidenceByState = {
  none: 'User returned this prospect to the regular prospect list.',
  bookmarked: 'User bookmarked this prospect.',
  hidden: 'User hid this prospect.',
} as const satisfies Record<LeadgenUserSignalState, string>;

const leadgenContactSchema = z.object({
  id: z.string(),
  runId: z.string(),
  leadId: z.string().nullable(),
  businessDomain: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  title: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  context: z.string().nullable(),
  notes: z.string().nullable(),
  errorMessage: z.string().nullable(),
  fromCache: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const leadgenDraftSchema = z.object({
  id: z.string(),
  runId: z.string(),
  leadId: z.string().nullable(),
  contactId: z.string().nullable(),
  businessDomain: z.string(),
  contactEmail: z.string(),
  subject: z.string(),
  fullEmail: z.string(),
  fromCache: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const leadgenSignalSchema = z.object({
  id: z.string(),
  runId: z.string(),
  leadId: z.string(),
  signalType: z.string(),
  evidenceUrl: z.string().nullable(),
  evidenceSnippet: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const leadgenLeadSchema = z.object({
  id: z.string(),
  runId: z.string(),
  businessDomain: z.string(),
  companyName: z.string().nullable(),
  status: leadgenOpportunityStatusSchema,
  score: z.number(),
  riskLevel: leadgenRiskLevelSchema,
  riskNote: z.string().nullable(),
  contactReadiness: leadgenContactReadinessSchema,
  rationale: z.string(),
  content: z.string(),
  rank: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  signals: z.array(leadgenSignalSchema).default([]),
  contacts: z.array(leadgenContactSchema).default([]),
  drafts: z.array(leadgenDraftSchema).default([]),
});

const leadgenEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  eventType: z.string(),
  stage: z.string().nullable(),
  message: z.string().nullable(),
  payload: z.unknown(),
  transient: z.boolean(),
  createdAt: z.date(),
});

const leadgenRunBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  domain: namefiNormalizedDomainSchema,
  status: leadgenRunStatusSchema,
  reasoningEffort: leadgenReasoningEffortSchema,
  workflowId: z.string().nullable(),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  errorMessage: z.string().nullable(),
  summary: z.string().nullable(),
  leadCount: z.number(),
  contactCount: z.number(),
  draftCount: z.number(),
  tokenUsage: z.array(aiTokenUsageEntrySchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const leadgenRunSnapshotSchema = leadgenRunBaseSchema.extend({
  intentQueries: z.array(z.string()),
  events: z.array(leadgenEventSchema),
  leads: z.array(leadgenLeadSchema),
});

const startRunInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  reasoningEffort: leadgenReasoningEffortSchema.default('medium'),
  askingPriceUsd: z.number().int().positive().max(100_000_000).optional(),
});

const runIdInputSchema = z.object({
  runId: z.string().uuid(),
});

const generateLeadOutreachInputSchema = runIdInputSchema.extend({
  leadId: z.string().uuid(),
});

const setLeadUserSignalInputSchema = runIdInputSchema.extend({
  leadId: z.string().uuid(),
  state: leadgenUserSignalStateSchema,
});

const setLeadUserSignalOutputSchema = z.object({
  runId: z.string(),
  leadId: z.string(),
  state: leadgenUserSignalStateSchema,
  signal: leadgenSignalSchema,
});

const listRunsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(12),
  })
  .default({ limit: 12 });

export const leadgenContract = createContract(
  { softOutput: true },
  {
    startRun: {
      type: 'mutation',
      input: startRunInputSchema,
      output: leadgenRunSnapshotSchema,
    },
    getRun: {
      type: 'query',
      input: runIdInputSchema,
      output: leadgenRunSnapshotSchema,
    },
    generateLeadOutreach: {
      type: 'mutation',
      input: generateLeadOutreachInputSchema,
      output: leadgenRunSnapshotSchema,
    },
    setLeadUserSignal: {
      type: 'mutation',
      input: setLeadUserSignalInputSchema,
      output: setLeadUserSignalOutputSchema,
    },
    listRuns: {
      type: 'query',
      input: listRunsInputSchema,
      output: z.array(leadgenRunBaseSchema),
    },
    watchRun: {
      type: 'subscription',
      input: runIdInputSchema,
      output: leadgenRunSnapshotSchema,
    },
  },
);

export type LeadgenContract = typeof leadgenContract;
