import { TRPCError } from '@trpc/server';
import { secrets } from '#lib/env';
import { protectedProcedure, publicProcedure, t } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { huntContract } from '@namefi-astra/common/contract/hunt-contract';
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

export const huntRouter = createContractTRPCRouter<typeof huntContract>({
  /**
   * Submit a domain - Creates a SUBMIT edge between user and domain
   */
  submitDomain: protectedProcedure
    .input(huntContract.submitDomain.input)
    .output(huntContract.submitDomain.output)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await submitDomain(domainName, userId);
    }),

  /**
   * Remove a domain
   */
  removeDomain: protectedProcedure
    .input(huntContract.removeDomain.input)
    .output(huntContract.removeDomain.output)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await removeDomain(domainName, userId);
    }),

  /**
   * Get domains submitted by the current user
   */
  getMySubmittedDomains: protectedProcedure
    .input(huntContract.getMySubmittedDomains.input)
    .output(huntContract.getMySubmittedDomains.output)
    .query(async ({ ctx, input }) => {
      const { offset, limit } = input;
      const userId = ctx.user.id;
      return await getSubmittedDomainsByUser(userId, offset, limit);
    }),

  /**
   * Get domains upvoted by the current user
   */
  getMyUpvotedDomains: protectedProcedure
    .input(huntContract.getMyUpvotedDomains.input)
    .output(huntContract.getMyUpvotedDomains.output)
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
    .input(huntContract.getTrendingDomainsPublic.input)
    .output(huntContract.getTrendingDomainsPublic.output)
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
    .input(huntContract.getTrendingDomains.input)
    .output(huntContract.getTrendingDomains.output)
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
    .input(huntContract.upvote.input)
    .output(huntContract.upvote.output)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await upvote(domainName, userId);
    }),

  /**
   * Remove upvote from a domain - Deletes the UPVOTE edge
   */
  unvote: protectedProcedure
    .input(huntContract.unvote.input)
    .output(huntContract.unvote.output)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await unvote(domainName, userId);
    }),

  /**
   * Check if current user is the submitter of a domain
   */
  checkDomainOwnership: protectedProcedure
    .input(huntContract.checkDomainOwnership.input)
    .output(huntContract.checkDomainOwnership.output)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await checkDomainOwnership(domainName, userId);
    }),

  /**
   * Get comprehensive domain details in split queries for consistency
   */
  getDomainDetail: protectedProcedure
    .input(huntContract.getDomainDetail.input)
    .output(huntContract.getDomainDetail.output)
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
    .input(huntContract.getDomainDetailPublic.input)
    .output(huntContract.getDomainDetailPublic.output)
    .query(async ({ input }) => {
      const { domainName } = input;
      return await getDomainDetail(domainName);
    }),

  /**
   * Get campaign details and rankings (public) - No authentication required
   * Returns campaign info and either finalized results or current live rankings without user-specific data
   */
  getCampaignPublic: publicProcedure
    .input(huntContract.getCampaignPublic.input)
    .output(huntContract.getCampaignPublic.output)
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
    .input(huntContract.getCampaign.input)
    .output(huntContract.getCampaign.output)
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
    .input(huntContract.getPeriodAwards.input)
    .output(huntContract.getPeriodAwards.output)
    .query(async ({ input }) => {
      const { type, periodKey, offset, limit } = input;
      return await getPeriodAwards({ type, periodKey, offset, limit });
    }),

  /**
   * Get all awards for a specific domain
   * Returns all awards won by a specific domain
   */
  getDomainAwards: publicProcedure
    .input(huntContract.getDomainAwards.input)
    .output(huntContract.getDomainAwards.output)
    .query(async ({ input }) => {
      const { domainName } = input;
      return await getDomainAwards(domainName);
    }),

  // ===== Hunt Management =====

  /**
   * Health check endpoint that returns the status of award schedules.
   * Returns schedule statuses for monitoring purposes.
   */
  getAwardSchedulesHealth: apiKeyProtectedProcedure
    .input(huntContract.getAwardSchedulesHealth.input)
    .output(huntContract.getAwardSchedulesHealth.output)
    .query(async () => getAwardSchedulesHealth()),

  /**
   * Trigger period award workflow.
   * Starts a workflow to process awards for a specific time period.
   */
  triggerPeriodAward: apiKeyProtectedProcedure
    .input(huntContract.triggerPeriodAward.input)
    .output(huntContract.triggerPeriodAward.output)
    .mutation(async ({ input }) => {
      const { type, date } = input;
      return await triggerPeriodAward({ type, date });
    }),

  /**
   * Trigger campaign award workflow.
   * Starts a workflow to process awards for a specific campaign.
   */
  triggerCampaignAward: apiKeyProtectedProcedure
    .input(huntContract.triggerCampaignAward.input)
    .output(huntContract.triggerCampaignAward.output)
    .mutation(async ({ input }) => {
      const { campaignKey } = input;
      return await triggerCampaignAward(campaignKey);
    }),

  /**
   * Trigger campaign status workflow.
   * Starts a workflow to update expired ACTIVE campaigns to ENDED status.
   */
  triggerCampaignStatus: apiKeyProtectedProcedure
    .input(huntContract.triggerCampaignStatus.input)
    .output(huntContract.triggerCampaignStatus.output)
    .mutation(async () => triggerCampaignStatus()),

  /**
   * Create a new campaign.
   * This is a system-only operation to create a new campaign.
   */
  createCampaign: apiKeyProtectedProcedure
    .input(huntContract.createCampaign.input)
    .output(huntContract.createCampaign.output)
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
    .input(huntContract.addDomainsToCampaign.input)
    .output(huntContract.addDomainsToCampaign.output)
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
    .input(huntContract.updateCampaignStatus.input)
    .output(huntContract.updateCampaignStatus.output)
    .mutation(async ({ input }) => {
      const { campaignKey, status } = input;
      return await updateCampaignStatus({ campaignKey, status });
    }),

  /**
   * Update campaign information.
   * This is a system-only operation to update campaign details.
   */
  updateCampaign: apiKeyProtectedProcedure
    .input(huntContract.updateCampaign.input)
    .output(huntContract.updateCampaign.output)
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
