import { EMAIL_CAMPAIGN_KEY_LIST } from '../../email-campaigns';
import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin email-campaigns sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/emailCampaignsRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminEmailCampaignsContract>`. Procedures
 * use `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 */

const emailCampaignKeySchema = z.enum(EMAIL_CAMPAIGN_KEY_LIST);

const campaignKeyInputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
});

const getEligibleUsersInputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
  searchTerm: z.string().optional(),
});

const getDomainTrafficSurgeFunnelDebugInputSchema = z.object({
  searchTerm: z.string().optional(),
  limit: z.number().min(1).max(1000).default(250),
});

const sendNowInputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
  userId: z.string().uuid(),
});

/**
 * `ScheduleStatus` mirror from
 * `apps/backend/src/temporal/schedules/types.ts`. Inlined here to avoid
 * a cross-contract import.
 */
const scheduleStatusSchema = z.object({
  scheduleId: z.string(),
  name: z.string(),
  description: z.string(),
  paused: z.boolean(),
  cronExpressions: z.array(z.string()),
  nextActionTimes: z.array(z.date()),
  recentActions: z.array(z.any()),
  category: z.string(),
  owner: z.string(),
});

const getScheduleStatusOutputSchema = z.union([
  z.object({
    campaignKey: emailCampaignKeySchema,
    scheduleId: z.string(),
    isConfigured: z.boolean(),
    status: scheduleStatusSchema,
    message: z.null(),
  }),
  z.object({
    campaignKey: emailCampaignKeySchema,
    scheduleId: z.string(),
    isConfigured: z.boolean(),
    status: z.null(),
    message: z.string(),
  }),
]);

const scheduleActionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  campaignKey: emailCampaignKeySchema,
  scheduleId: z.string(),
});

/**
 * `getEligibleUsers` returns an opaque list of eligible-user rows. The
 * top-level shape is concrete so tRPC inference works; `users[]` is
 * typed as `z.any()` rows because `EligibleUserRow` has many
 * conditionally-set fields. Using `z.array(z.any())` (rather than bare
 * `z.any()`) keeps `.users.map(...)` callbacks correctly typed as `any`.
 */
const getEligibleUsersOutputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
  periodStart: z.date(),
  dreamOrderLookbackDays: z.number().nullable(),
  trafficWeeklyThreshold: z.number().nullable(),
  trafficWindowStartUtc: z.string().nullable(),
  trafficWindowEndUtc: z.string().nullable(),
  users: z.array(z.any()),
});

const getDomainTrafficSurgeFunnelDebugOutputSchema = z.object({
  periodStart: z.date(),
  trafficWeeklyThreshold: z.number(),
  trafficWindowStartUtc: z.string(),
  trafficWindowEndUtc: z.string(),
  summary: z.object({
    totalUsers: z.number(),
    droppedAtOwnership: z.number(),
    droppedAtNameservers: z.number(),
    droppedAtThreshold: z.number(),
    droppedAtAlreadySent: z.number(),
    fullyEligible: z.number(),
  }),
  users: z.array(z.any()),
});

const sendNowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  campaignKey: emailCampaignKeySchema,
  workflowId: z.string(),
  periodStart: z.date(),
});

export const adminEmailCampaignsContract = {
  getScheduleStatus: {
    type: 'query',
    input: campaignKeyInputSchema,
    output: getScheduleStatusOutputSchema,
  },
  pauseSchedule: {
    type: 'mutation',
    input: campaignKeyInputSchema,
    output: scheduleActionOutputSchema,
  },
  resumeSchedule: {
    type: 'mutation',
    input: campaignKeyInputSchema,
    output: scheduleActionOutputSchema,
  },
  getEligibleUsers: {
    type: 'query',
    input: getEligibleUsersInputSchema,
    output: getEligibleUsersOutputSchema,
  },
  getDomainTrafficSurgeFunnelDebug: {
    type: 'query',
    input: getDomainTrafficSurgeFunnelDebugInputSchema,
    output: getDomainTrafficSurgeFunnelDebugOutputSchema,
  },
  sendNow: {
    type: 'mutation',
    input: sendNowInputSchema,
    output: sendNowOutputSchema,
  },
} as const satisfies RouterContract;

export type AdminEmailCampaignsContract = typeof adminEmailCampaignsContract;
