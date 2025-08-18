import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secrets } from '#lib/env';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  t,
} from '../../base';
import {
  trendingDomainTimeRangeEnum,
  huntPeriodAwardTypeEnum,
} from '../../../services/hunt/schema';
import {
  checkDomainOwnership,
  submitDomain,
  removeDomain,
  getSubmittedDomainsByUser,
  getUpvotedDomainsByUser,
  getTrendingDomains,
  getDomainDetail,
  upvote,
  unvote,
} from '../../../services/hunt/domain.service';
import {
  getCampaign,
  createCampaign,
  addDomainsToCampaign,
  updateCampaignStatus,
  updateCampaign,
} from '../../../services/hunt/campaign.service';
import {
  getPeriodAwards,
  getDomainAwards,
} from '../../../services/hunt/award.service';
import {
  getAwardSchedulesHealth,
  triggerPeriodAward,
  triggerCampaignAward,
  triggerCampaignStatus,
} from '../../../services/hunt/schedule.service';

// Input schemas
const submitDomainSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const removeDomainSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const getMySubmittedDomainsSchema = z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(50).default(20),
});

const getMyUpvotedDomainsSchema = z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(50).default(20),
});

const getTrendingDomainsSchema = z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(50).default(20),
  timeRange: trendingDomainTimeRangeEnum.default('ANYTIME'),
  extension: namefiNormalizedDomainSchema.optional(),
  excludeCampaignKey: z.string().optional(),
});

const domainVoteSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const getDomainDetailSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const getPeriodAwardsSchema = z.object({
  type: huntPeriodAwardTypeEnum,
  periodKey: z.string().min(1),
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(50).default(20),
});

const getCampaignSchema = z.object({
  campaignKey: z.string().min(1),
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(50).default(20),
});

const getDomainAwardsSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

/**
 * Middleware for verifying API key authentication.
 *
 * This middleware will verify the API key from the x-api-key header.
 */
const verifyApiKey = t.middleware(async ({ ctx, next }) => {
  const apiKey = ctx.req.header('x-api-key');

  if (apiKey !== secrets.API_AUTH_KEY) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid API key',
    });
  }

  return next();
});

/**
 * API key protected procedure
 */
const apiKeyProtectedProcedure = publicProcedure.use(verifyApiKey);

export const huntRouter = createTRPCRouter({
  /**
   * Submit a domain - Creates a SUBMIT edge between user and domain
   */
  submitDomain: protectedProcedure
    .input(submitDomainSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await submitDomain(domainName, userId);
    }),

  /**
   * Remove a domain
   */
  removeDomain: protectedProcedure
    .input(removeDomainSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await removeDomain(domainName, userId);
    }),

  /**
   * Get domains submitted by the current user
   */
  getMySubmittedDomains: protectedProcedure
    .input(getMySubmittedDomainsSchema)
    .query(async ({ ctx, input }) => {
      const { offset, limit } = input;
      const userId = ctx.user.id;
      return await getSubmittedDomainsByUser(userId, offset, limit);
    }),

  /**
   * Get domains upvoted by the current user
   */
  getMyUpvotedDomains: protectedProcedure
    .input(getMyUpvotedDomainsSchema)
    .query(async ({ ctx, input }) => {
      const { offset, limit } = input;
      const userId = ctx.user.id;
      return await getUpvotedDomainsByUser(userId, offset, limit);
    }),

  /**
   * Get trending domains (public) - No authentication required
   * Returns trending domains without user-specific data
   */
  getTrendingDomainsPublic: publicProcedure
    .input(getTrendingDomainsSchema)
    .query(async ({ input }) => {
      const { offset, limit, timeRange, extension, excludeCampaignKey } = input;

      return await getTrendingDomains({
        offset,
        limit,
        timeRange,
        extension,
        excludeCampaignKey,
      });
    }),

  /**
   * Get trending domains with ranking and filtering (authenticated)
   * Returns trending domains with user-specific voting data
   */
  getTrendingDomains: protectedProcedure
    .input(getTrendingDomainsSchema)
    .query(async ({ ctx, input }) => {
      const { offset, limit, timeRange, extension, excludeCampaignKey } = input;
      const userId = ctx.user.id;

      return await getTrendingDomains({
        offset,
        limit,
        timeRange,
        extension,
        excludeCampaignKey,
        currentUserId: userId,
      });
    }),

  /**
   * Upvote a domain - Creates an UPVOTE edge
   */
  upvote: protectedProcedure
    .input(domainVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await upvote(domainName, userId);
    }),

  /**
   * Remove upvote from a domain - Deletes the UPVOTE edge
   */
  unvote: protectedProcedure
    .input(domainVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await unvote(domainName, userId);
    }),

  /**
   * Check if current user is the submitter of a domain
   */
  checkDomainOwnership: protectedProcedure
    .input(domainVoteSchema)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await checkDomainOwnership(domainName, userId);
    }),

  /**
   * Get comprehensive domain details in split queries for consistency
   */
  getDomainDetail: protectedProcedure
    .input(getDomainDetailSchema)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await getDomainDetail(domainName, userId);
    }),

  /**
   * Get domain details (public) - No authentication required
   * Returns domain details without user-specific data
   */
  getDomainDetailPublic: publicProcedure
    .input(getDomainDetailSchema)
    .query(async ({ input }) => {
      const { domainName } = input;
      return await getDomainDetail(domainName);
    }),

  /**
   * Get campaign details and rankings (public) - No authentication required
   * Returns campaign info and either finalized results or current live rankings without user-specific data
   */
  getCampaignPublic: publicProcedure
    .input(getCampaignSchema)
    .query(async ({ input }) => {
      const { campaignKey, offset, limit } = input;

      return await getCampaign({
        campaignKey,
        offset,
        limit,
      });
    }),

  /**
   * Get campaign details and rankings (authenticated)
   * Returns campaign info and either finalized results or current live rankings with user-specific voting data
   */
  getCampaign: protectedProcedure
    .input(getCampaignSchema)
    .query(async ({ ctx, input }) => {
      const { campaignKey, offset, limit } = input;
      const userId = ctx.user.id;

      return await getCampaign({
        campaignKey,
        offset,
        limit,
        userId,
      });
    }),

  /**
   * Get awards for a specific period
   * Returns finalized award rankings for a specific time period
   */
  getPeriodAwards: publicProcedure
    .input(getPeriodAwardsSchema)
    .query(async ({ input }) => {
      const { type, periodKey, offset, limit } = input;
      return await getPeriodAwards({ type, periodKey, offset, limit });
    }),

  /**
   * Get all awards for a specific domain
   * Returns all awards won by a specific domain
   */
  getDomainAwards: publicProcedure
    .input(getDomainAwardsSchema)
    .query(async ({ input }) => {
      const { domainName } = input;
      return await getDomainAwards(domainName);
    }),

  // ===== Hunt Management =====

  /**
   * Health check endpoint that returns the status of award schedules.
   * Returns schedule statuses for monitoring purposes.
   */
  getAwardSchedulesHealth: apiKeyProtectedProcedure.query(async () =>
    getAwardSchedulesHealth(),
  ),

  /**
   * Trigger period award workflow.
   * Starts a workflow to process awards for a specific time period.
   */
  triggerPeriodAward: apiKeyProtectedProcedure
    .input(
      z.object({
        type: huntPeriodAwardTypeEnum,
        date: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { type, date } = input;
      return await triggerPeriodAward({ type, date });
    }),

  /**
   * Trigger campaign award workflow.
   * Starts a workflow to process awards for a specific campaign.
   */
  triggerCampaignAward: apiKeyProtectedProcedure
    .input(
      z.object({
        campaignKey: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { campaignKey } = input;
      return await triggerCampaignAward(campaignKey);
    }),

  /**
   * Trigger campaign status workflow.
   * Starts a workflow to update expired ACTIVE campaigns to ENDED status.
   */
  triggerCampaignStatus: apiKeyProtectedProcedure
    .input(z.object({}))
    .mutation(async () => triggerCampaignStatus()),

  /**
   * Create a new campaign.
   * This is a system-only operation to create a new campaign.
   */
  createCampaign: apiKeyProtectedProcedure
    .input(
      z.object({
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
      }),
    )
    .mutation(async ({ input }) => {
      const {
        campaignKey,
        name,
        title,
        description,
        logoUrl,
        startDate,
        endDate,
        domains,
      } = input;
      return await createCampaign({
        campaignKey,
        name,
        title,
        description,
        logoUrl,
        startDate,
        endDate,
        domains,
      });
    }),

  /**
   * Add domains to an existing campaign.
   * This is a system-only operation to add domains to a campaign.
   */
  addDomainsToCampaign: apiKeyProtectedProcedure
    .input(
      z.object({
        campaignKey: z.string().min(1),
        domains: z.array(
          z.object({
            domainName: namefiNormalizedDomainSchema,
            description: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { campaignKey, domains } = input;
      return await addDomainsToCampaign({ campaignKey, domains });
    }),

  /**
   * Update campaign status.
   * This is a system-only operation to update campaign status.
   * Only allows transitions between DRAFT, ACTIVE, and CANCELLED statuses.
   */
  updateCampaignStatus: apiKeyProtectedProcedure
    .input(
      z.object({
        campaignKey: z.string().min(1),
        status: z.enum(['DRAFT', 'ACTIVE', 'CANCELLED']),
      }),
    )
    .mutation(async ({ input }) => {
      const { campaignKey, status } = input;
      return await updateCampaignStatus({ campaignKey, status });
    }),

  /**
   * Update campaign information.
   * This is a system-only operation to update campaign details.
   */
  updateCampaign: apiKeyProtectedProcedure
    .input(
      z.object({
        campaignKey: z.string().min(1),
        name: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        campaignKey,
        name,
        title,
        description,
        logoUrl,
        startDate,
        endDate,
      } = input;
      return await updateCampaign(campaignKey, {
        name,
        title,
        description,
        logoUrl,
        startDate,
        endDate,
      });
    }),
});
