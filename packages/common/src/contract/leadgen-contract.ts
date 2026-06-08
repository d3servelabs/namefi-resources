import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';

export const leadgenReasoningEffortSchema = z.enum(['low', 'medium', 'high']);

export const leadgenRunStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
]);

const leadgenLeadRankingStateSchema = z.enum(['checking', 'ranked']);

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
  email: z.string(),
  name: z.string().nullable(),
  title: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  context: z.string().nullable(),
});

const leadgenDraftSchema = z.object({
  contactEmail: z.string(),
  subject: z.string(),
  fullEmail: z.string(),
});

const leadgenLeadSchema = z.object({
  id: z.string(),
  businessDomain: z.string(),
  rankingState: leadgenLeadRankingStateSchema,
  initialOutreachCandidate: z.boolean(),
  organizationState: leadgenUserSignalStateSchema,
  rationale: z.string(),
  content: z.string(),
  contacts: z.array(leadgenContactSchema).default([]),
  drafts: z.array(leadgenDraftSchema).default([]),
});

const leadgenEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  stage: z.string().nullable(),
  message: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
});

const leadgenRunBaseSchema = z.object({
  id: z.string(),
  domain: namefiNormalizedDomainSchema,
  status: leadgenRunStatusSchema,
  reasoningEffort: leadgenReasoningEffortSchema,
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  errorMessage: z.string().nullable(),
  summary: z.string().nullable(),
  leadCount: z.number(),
  contactCount: z.number(),
  draftCount: z.number(),
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
