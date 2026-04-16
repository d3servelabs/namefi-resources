import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import type {
  ScheduleExecutionResult,
  ScheduleExecutionStartWorkflowActionResult,
} from '../types/temporal';
import { z } from 'zod';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the hunt router.
 *
 * The router (`apps/backend/src/trpc/routers/hunt/huntRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof huntContract>`. Middleware varies
 * per procedure (`protectedProcedure`, `publicProcedure`, and a custom
 * `apiKeyProtectedProcedure` for trigger/management ops). All middleware
 * decisions stay at the router file — the contract only pins IO shapes.
 *
 * Most outputs are service-layer aggregates (domain rows joined with
 * vote counts, campaign rankings, period award leaderboards, etc.) and
 * are modeled with `z.custom<T>()` escape hatches.
 */

// ---------------------------------------------------------------------------
// Enums mirrored from `apps/backend/src/services/hunt/schema.ts`
// ---------------------------------------------------------------------------

const trendingDomainTimeRangeSchema = z.enum([
  'TODAY',
  'THIS_WEEK',
  'THIS_MONTH',
  'THIS_YEAR',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'ANYTIME',
]);

const huntPeriodAwardTypeSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
]);

const campaignStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'CANCELLED']);

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const domainNameInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const paginationInputSchema = z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(50).default(20),
});

const getTrendingDomainsInputSchema = paginationInputSchema.extend({
  timeRange: trendingDomainTimeRangeSchema.default('ANYTIME'),
  extension: namefiNormalizedDomainSchema.optional(),
  excludeCampaignKey: z.string().optional(),
});

const getPeriodAwardsInputSchema = paginationInputSchema.extend({
  type: huntPeriodAwardTypeSchema,
  periodKey: z.string().min(1),
});

const getCampaignInputSchema = paginationInputSchema.extend({
  campaignKey: z.string().min(1),
});

const triggerPeriodAwardInputSchema = z.object({
  type: huntPeriodAwardTypeSchema,
  date: z.string().optional(),
});

const triggerCampaignAwardInputSchema = z.object({
  campaignKey: z.string().min(1),
});

const createCampaignInputSchema = z.object({
  campaignKey: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  domains: z
    .array(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        description: z.string().optional(),
      }),
    )
    .optional(),
});

const addDomainsToCampaignInputSchema = z.object({
  campaignKey: z.string().min(1),
  domains: z.array(
    z.object({
      domainName: namefiNormalizedDomainSchema,
      description: z.string().optional(),
    }),
  ),
});

const updateCampaignStatusInputSchema = z.object({
  campaignKey: z.string().min(1),
  status: campaignStatusSchema,
});

const updateCampaignInputSchema = z.object({
  campaignKey: z.string().min(1),
  name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Outputs — backend service aggregates modeled via z.custom<T>()
// ---------------------------------------------------------------------------

/**
 * Hunt output schemas — every top-level procedure output is a real
 * `z.object(...)` so tRPC's caller-side type helpers propagate through
 * `queryOptions(...)` cleanly. Large joined shapes (e.g. campaign rows
 * with live voting data) use `z.array(z.any())` for the row itself — the
 * wrapper shape is structured so consumers still get autocomplete on
 * `items`, `hasMore`, `tags`, etc.
 */

const submitDomainResultSchema = z.object({
  success: z.boolean(),
  domainName: namefiNormalizedDomainSchema.optional(),
  submittedAt: z.date().optional(),
  message: z.string(),
});

const removeDomainResultSchema = z.object({
  success: z.boolean(),
});

const tagSchema = z.object({ id: z.string() });

/**
 * Row shapes returned by `getMySubmittedDomains`, `getMyUpvotedDomains`,
 * and `getTrendingDomains` differ slightly (one has `submittedAt`, one
 * has `upvotedAt`, trending adds `rank`/`firstSubmitDate`/etc.). Using
 * `z.any()` for `items` keeps the contract tractable — the wrapper shape
 * still gives tRPC a real object to infer through.
 */
const huntDomainListSchema = z.object({
  items: z.array(z.any()),
  hasMore: z.boolean(),
});

const trendingDomainsResultSchema = z.object({
  items: z.array(z.any()),
  hasMore: z.boolean(),
  total: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

const voteResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const checkDomainOwnershipResultSchema = z.object({
  isOwner: z.boolean(),
  submittedAt: z.date().nullable(),
});

const domainDetailResultSchema = z.object({
  upvoteCount: z.number(),
  firstSubmitDate: z.date(),
  lastUpvoteDate: z.date(),
  domainName: namefiNormalizedDomainSchema,
  userHasUpvoted: z.boolean(),
  userUpvotedAt: z.date().nullable(),
  userIsOwner: z.boolean(),
  userSubmittedAt: z.date().nullable(),
  tags: z.array(tagSchema),
});

const campaignInfoSchema = z.object({
  campaignKey: z.string(),
  name: z.string(),
  title: z.string(),
  description: z.string(),
  logoUrl: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['ACTIVE', 'AWARDED', 'CANCELLED', 'DRAFT', 'ENDED']),
});

const campaignResultSchema = z.object({
  campaign: campaignInfoSchema,
  rankings: z.array(z.any()),
  hasMore: z.boolean(),
});

const periodAwardsResultSchema = z.object({
  items: z.array(z.any()),
  hasMore: z.boolean(),
});

const domainAwardsResultSchema = z.array(
  z.object({
    id: z.string(),
    type: z.enum(['CAMPAIGN', 'DAILY', 'MONTHLY', 'WEEKLY', 'YEARLY']),
    campaignKey: z.string().nullable(),
    periodKey: z.string().nullable(),
    rank: z.number(),
    reason: z.string().nullable(),
    upvoteCount: z.number(),
    awardedAt: z.date(),
  }),
);

const awardSchedulesHealthSchema = z.custom<{
  message: string;
  schedules: Array<
    | {
        readonly error?: undefined;
        id: string;
        state: {
          paused: boolean;
          note?: string;
          remainingActions?: number;
        };
        info: {
          recentActions: ScheduleExecutionResult[];
          nextActionTimes: Date[];
          numActionsTaken: number;
          numActionsMissedCatchupWindow: number;
          numActionsSkippedOverlap: number;
          createdAt: Date;
          lastUpdatedAt: Date | undefined;
          runningActions: ScheduleExecutionStartWorkflowActionResult[];
        };
      }
    | {
        info?: undefined;
        id: string;
        state: string;
        error: string;
      }
  >;
  status: string;
}>(() => true);

const triggerWorkflowResultSchema = z.custom<{
  message: string;
  workflowId: string;
}>(() => true);

/**
 * `createCampaign` / `addDomainsToCampaign` / `updateCampaignStatus` /
 * `updateCampaign` return differently-shaped flat payloads — the bare
 * `campaignKey` is the only common field. We type that one concretely
 * and leave the rest as loose fields so each handler's variant assigns
 * without friction.
 */
const campaignMutationResultSchema = z
  .object({
    campaignKey: z.string(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const huntContract = {
  submitDomain: {
    type: 'mutation',
    input: domainNameInputSchema,
    output: submitDomainResultSchema,
  },
  removeDomain: {
    type: 'mutation',
    input: domainNameInputSchema,
    output: removeDomainResultSchema,
  },
  getMySubmittedDomains: {
    type: 'query',
    input: paginationInputSchema,
    output: huntDomainListSchema,
  },
  getMyUpvotedDomains: {
    type: 'query',
    input: paginationInputSchema,
    output: huntDomainListSchema,
  },
  getTrendingDomainsPublic: {
    type: 'query',
    input: getTrendingDomainsInputSchema,
    output: trendingDomainsResultSchema,
  },
  getTrendingDomains: {
    type: 'query',
    input: getTrendingDomainsInputSchema,
    output: trendingDomainsResultSchema,
  },
  upvote: {
    type: 'mutation',
    input: domainNameInputSchema,
    output: voteResultSchema,
  },
  unvote: {
    type: 'mutation',
    input: domainNameInputSchema,
    output: voteResultSchema,
  },
  checkDomainOwnership: {
    type: 'query',
    input: domainNameInputSchema,
    output: checkDomainOwnershipResultSchema,
  },
  getDomainDetail: {
    type: 'query',
    input: domainNameInputSchema,
    output: domainDetailResultSchema,
  },
  getDomainDetailPublic: {
    type: 'query',
    input: domainNameInputSchema,
    output: domainDetailResultSchema,
  },
  getCampaignPublic: {
    type: 'query',
    input: getCampaignInputSchema,
    output: campaignResultSchema,
  },
  getCampaign: {
    type: 'query',
    input: getCampaignInputSchema,
    output: campaignResultSchema,
  },
  getPeriodAwards: {
    type: 'query',
    input: getPeriodAwardsInputSchema,
    output: periodAwardsResultSchema,
  },
  getDomainAwards: {
    type: 'query',
    input: domainNameInputSchema,
    output: domainAwardsResultSchema,
  },
  getAwardSchedulesHealth: {
    type: 'query',
    input: z.void(),
    output: awardSchedulesHealthSchema,
  },
  triggerPeriodAward: {
    type: 'mutation',
    input: triggerPeriodAwardInputSchema,
    output: triggerWorkflowResultSchema,
  },
  triggerCampaignAward: {
    type: 'mutation',
    input: triggerCampaignAwardInputSchema,
    output: triggerWorkflowResultSchema,
  },
  triggerCampaignStatus: {
    type: 'mutation',
    input: z.object({}),
    output: triggerWorkflowResultSchema,
  },
  createCampaign: {
    type: 'mutation',
    input: createCampaignInputSchema,
    output: campaignMutationResultSchema,
  },
  addDomainsToCampaign: {
    type: 'mutation',
    input: addDomainsToCampaignInputSchema,
    output: campaignMutationResultSchema,
  },
  updateCampaignStatus: {
    type: 'mutation',
    input: updateCampaignStatusInputSchema,
    output: campaignMutationResultSchema,
  },
  updateCampaign: {
    type: 'mutation',
    input: updateCampaignInputSchema,
    output: campaignMutationResultSchema,
  },
} as const satisfies RouterContract;

export type HuntContract = typeof huntContract;
