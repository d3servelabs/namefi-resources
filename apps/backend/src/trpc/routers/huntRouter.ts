import {
  db,
  huntDomainStatsView,
  huntEdgesTable,
  huntAwardsTable,
  huntCampaignsTable,
  huntCampaignDomainsTable,
} from '@namefi-astra/db';
import { getTags } from '@namefi/cat';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { type SQL, and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { secrets } from '#lib/env';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  t,
} from '../base';
import { temporalClient } from '../../temporal/client';
import {
  campaignAwardWorkflow,
  campaignStatusWorkflow,
  periodAwardWorkflow,
} from '../../temporal/workflows';
import { TEMPORAL_QUEUES } from '../../temporal/shared';

// System user ID for automated operations
const NAMEFI_TEAM_USER_ID = 'NameFi_Team'; // NameFi_Team system user

// Type definitions
interface CampaignDetails {
  campaignKey: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
}

interface CampaignRanking {
  domainName: NamefiNormalizedDomain;
  rank: number;
  upvoteCount: number;
  reason?: string | null;
  awardedAt?: Date;
  isPinned: boolean;
  userHasUpvoted: boolean;
  tags: Array<{ id: string }>;
  description: string;
}

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
  timeRange: z
    .enum(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'ANYTIME'])
    .default('ANYTIME'),
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
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
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
 * Create time range filter SQL condition based on time range
 */
const createTimeRangeFilter = (
  timeRange: string,
  dateColumn: SQL.Aliased<Date>,
) => {
  // Precompute timestamps to allow index usage
  const now = new Date();

  switch (timeRange) {
    case 'TODAY': {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return sql`${dateColumn} >= ${oneDayAgo}`;
    }
    case 'THIS_WEEK': {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sql`${dateColumn} >= ${oneWeekAgo}`;
    }
    case 'THIS_MONTH': {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return sql`${dateColumn} >= ${oneMonthAgo}`;
    }
    case 'THIS_YEAR': {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return sql`${dateColumn} >= ${oneYearAgo}`;
    }
    case 'ANYTIME':
      return sql`1 = 1`;
    default:
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid time range',
      });
  }
};

/**
 * Helper function to add tags to domain items
 */
const addTagsToItems = <T extends { domainName: NamefiNormalizedDomain }>(
  items: T[],
): (T & { tags: Array<{ id: string }> })[] => {
  return items.map((item) => ({
    ...item,
    tags: getTags(item.domainName),
  }));
};

/**
 * Helper function to get domain stats
 */
const getDomainStats = async (domainNames: NamefiNormalizedDomain[]) =>
  db
    .select({
      domainName: huntDomainStatsView.domainName,
      upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
    })
    .from(huntDomainStatsView)
    .where(
      sql`${huntDomainStatsView.domainName} IN (${sql.join(
        domainNames.map((name) => sql`${name}`),
        sql`, `,
      )})`,
    );

/**
 * Helper function to batch query user's vote status for domains
 */
const getUserVoteStatus = async (
  userId: string,
  domainNames: NamefiNormalizedDomain[],
): Promise<Record<string, boolean>> => {
  if (domainNames.length === 0) {
    return {};
  }

  const userVoteRows = await db
    .select({
      targetId: huntEdgesTable.targetId,
    })
    .from(huntEdgesTable)
    .where(
      and(
        eq(huntEdgesTable.sourceType, 'USER'),
        eq(huntEdgesTable.sourceId, userId),
        eq(huntEdgesTable.targetType, 'DOMAIN'),
        eq(huntEdgesTable.action, 'UPVOTE'),
        sql`${huntEdgesTable.targetId} IN (${sql.join(
          domainNames.map((name) => sql`${name}`),
          sql`, `,
        )})`,
      ),
    );

  return userVoteRows.reduce(
    (acc, row) => {
      acc[row.targetId] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );
};

/**
 * Helper function to get campaign details
 */
const getCampaignDetails = async (
  campaignKey: string,
  tx?: Parameters<Parameters<(typeof db)['transaction']>[0]>[0],
) => {
  const [campaign] = await (tx || db)
    .select({
      campaignKey: huntCampaignsTable.campaignKey,
      name: huntCampaignsTable.name,
      title: huntCampaignsTable.title,
      description: huntCampaignsTable.description,
      logoUrl: huntCampaignsTable.logoUrl,
      startDate: huntCampaignsTable.startDate,
      endDate: huntCampaignsTable.endDate,
      status: huntCampaignsTable.status,
    })
    .from(huntCampaignsTable)
    .where(eq(huntCampaignsTable.campaignKey, campaignKey))
    .limit(1);

  if (!campaign) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Campaign not found',
    });
  }

  return campaign;
};

/**
 * Helper function to get campaign rankings
 */
const getCampaignRankings = async (
  campaignKey: string,
  campaign: CampaignDetails,
  offset: number,
  limit: number,
  userId?: string,
) => {
  let hasMore = false;
  let records: Array<
    Omit<CampaignRanking, 'tags' | 'userHasUpvoted' | 'rank'> &
      Partial<Pick<CampaignRanking, 'rank'>>
  > = [];

  if (campaign.status === 'AWARDED') {
    // Campaign ended, return finalized awards
    records = await db
      .select({
        domainName: huntAwardsTable.domainName,
        rank: huntAwardsTable.rank,
        upvoteCount: huntAwardsTable.upvoteCount,
        reason: huntAwardsTable.reason,
        awardedAt: huntAwardsTable.createdAt,
        isPinned: sql<boolean>`false`.as('is_pinned'),
        description:
          sql<string>`COALESCE(${huntCampaignDomainsTable.description}, '')`.as(
            'description',
          ),
      })
      .from(huntAwardsTable)
      .leftJoin(
        huntCampaignDomainsTable,
        and(
          eq(huntAwardsTable.domainName, huntCampaignDomainsTable.domainName),
          eq(huntCampaignDomainsTable.campaignKey, campaignKey),
        ),
      )
      .where(
        and(
          eq(huntAwardsTable.type, 'CAMPAIGN'),
          eq(huntAwardsTable.campaignKey, campaignKey),
        ),
      )
      .orderBy(huntAwardsTable.rank)
      .offset(offset)
      .limit(limit + 1);
  } else {
    // Campaign not awarded (DRAFT/ACTIVE/ENDED), return current live rankings
    // Use LEFT JOIN to ensure all campaign domains appear even if they have no votes
    records = await db
      .select({
        domainName: huntCampaignDomainsTable.domainName,
        upvoteCount: sql<number>`CAST(COALESCE(${huntDomainStatsView.upvoteCount}, 0) AS INTEGER)`,
        isPinned:
          sql<boolean>`COALESCE(${huntDomainStatsView.isPinned}, false)`.as(
            'is_pinned',
          ),
        description:
          sql<string>`COALESCE(${huntCampaignDomainsTable.description}, '')`.as(
            'description',
          ),
      })
      .from(huntCampaignDomainsTable)
      .leftJoin(
        huntDomainStatsView,
        eq(huntCampaignDomainsTable.domainName, huntDomainStatsView.domainName),
      )
      .where(eq(huntCampaignDomainsTable.campaignKey, campaignKey))
      .orderBy(
        desc(
          sql<number>`CAST(COALESCE(${huntDomainStatsView.upvoteCount}, 0) AS INTEGER)`,
        ),
        desc(
          sql<Date>`COALESCE(${huntDomainStatsView.lastUpvoteDate}, ${huntCampaignDomainsTable.createdAt})`,
        ),
        desc(
          sql<Date>`COALESCE(${huntDomainStatsView.firstSubmitDate}, ${huntCampaignDomainsTable.createdAt})`,
        ),
      )
      .offset(offset)
      .limit(limit + 1);
  }

  hasMore = records.length > limit;
  records = records.slice(0, limit);

  const userVotes = userId
    ? await getUserVoteStatus(
        userId,
        records.map((d) => d.domainName),
      )
    : {};

  const rankings: Array<CampaignRanking> = addTagsToItems(
    records.map((record, index) => ({
      ...record,
      rank: record.rank ?? offset + index + 1,
      userHasUpvoted: Boolean(userVotes[record.domainName]),
    })),
  );

  return {
    rankings,
    hasMore,
  };
};

/**
 * Get campaign details and rankings
 */
const getCampaign = async ({
  campaignKey,
  offset,
  limit,
  userId,
}: {
  campaignKey: string;
  offset: number;
  limit: number;
  userId?: string;
}) => {
  const campaign = await getCampaignDetails(campaignKey);
  const { rankings, hasMore } = await getCampaignRankings(
    campaignKey,
    campaign,
    offset,
    limit,
    userId,
  );
  return { campaign, rankings, hasMore };
};

const upvote = async (userId: string, domainName: NamefiNormalizedDomain) => {
  // Check if user has already upvoted this domain
  const [existingUpvote] = await db
    .select()
    .from(huntEdgesTable)
    .where(
      and(
        eq(huntEdgesTable.sourceType, 'USER'),
        eq(huntEdgesTable.sourceId, userId),
        eq(huntEdgesTable.targetType, 'DOMAIN'),
        eq(huntEdgesTable.targetId, domainName),
        eq(huntEdgesTable.action, 'UPVOTE'),
      ),
    );

  if (existingUpvote) {
    return { success: true, message: 'Already upvoted' };
  }

  // Create UPVOTE edge
  await db.insert(huntEdgesTable).values({
    sourceType: 'USER',
    sourceId: userId,
    targetType: 'DOMAIN',
    targetId: domainName,
    action: 'UPVOTE',
  });

  return { success: true, message: 'Upvoted successfully' };
};

/**
 * Create a Map from domain stats for efficient lookup
 */
const createStatsMap = (
  domainStats: Awaited<ReturnType<typeof getDomainStats>>,
) => {
  return new Map<
    NamefiNormalizedDomain,
    {
      domainName: NamefiNormalizedDomain;
      upvoteCount: number;
    }
  >(
    domainStats.map((stat) => [
      stat.domainName as NamefiNormalizedDomain,
      { ...stat, domainName: stat.domainName as NamefiNormalizedDomain },
    ]),
  );
};

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

      // Check if domain has already been submitted by anyone
      const [existingDomainSubmit] = await db
        .select()
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        );

      if (existingDomainSubmit) {
        // Upvote the domain
        await upvote(userId, domainName);

        return {
          success: true,
          domainName,
          submittedAt: existingDomainSubmit.createdAt,
          message: 'Domain already exists',
        };
      }

      // Create SUBMIT edge
      const [edge] = await db
        .insert(huntEdgesTable)
        .values({
          sourceType: 'USER',
          sourceId: userId,
          targetType: 'DOMAIN',
          targetId: domainName,
          action: 'SUBMIT',
        })
        .returning();

      // Upvote the domain
      await upvote(userId, domainName);

      return {
        success: true,
        domainName,
        submittedAt: edge.createdAt,
        message: 'Domain submitted successfully',
      };
    }),

  /**
   * Remove a domain
   */
  removeDomain: protectedProcedure
    .input(removeDomainSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;

      // Check if the SUBMIT edge exists and belongs to the user
      const [existingSubmit] = await db
        .select()
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        );

      if (!existingSubmit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Domain not found or you do not have permission to delete it',
        });
      }

      // Delete the SUBMIT edge
      await db
        .delete(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        );

      return { success: true };
    }),

  /**
   * Get domains submitted by the current user
   */
  getMySubmittedDomains: protectedProcedure
    .input(getMySubmittedDomainsSchema)
    .query(async ({ ctx, input }) => {
      const { offset, limit } = input;
      const userId = ctx.user.id;

      // Get user's submitted domains with basic info
      const submittedDomains = await db
        .select({
          domainName: huntEdgesTable.targetId,
          submittedAt: huntEdgesTable.createdAt,
        })
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        )
        .orderBy(desc(huntEdgesTable.createdAt))
        .offset(offset)
        .limit(limit + 1);

      const hasMore = submittedDomains.length > limit;
      const domainList = submittedDomains.slice(0, limit);

      if (domainList.length === 0) {
        return { items: [], hasMore: false };
      }

      // Batch get domain stats and user vote status
      const domainNames = domainList.map(
        (d) => d.domainName as NamefiNormalizedDomain,
      );

      const [domainStats, userVotes] = await Promise.all([
        // Get stats for these domains
        getDomainStats(domainNames),

        // Get user's vote status for these domains
        getUserVoteStatus(userId, domainNames),
      ]);

      // Combine all data
      const statsMap = createStatsMap(domainStats);
      const enrichedDomains = domainList.map((domain) => {
        const domainName = domain.domainName as NamefiNormalizedDomain;
        const stats = statsMap.get(domainName);
        return {
          domainName,
          submittedAt: domain.submittedAt,
          upvoteCount: stats?.upvoteCount || 0,
          userHasUpvoted: Boolean(userVotes[domain.domainName]),
        };
      });

      const items = addTagsToItems(enrichedDomains);

      return {
        items,
        hasMore,
      };
    }),

  /**
   * Get trending domains (public) - No authentication required
   * Returns trending domains without user-specific data
   */
  getTrendingDomainsPublic: publicProcedure
    .input(getTrendingDomainsSchema)
    .query(async ({ input }) => {
      const { offset, limit, timeRange, extension, excludeCampaignKey } = input;

      // Build the query with time range filter
      const timeFilter = createTimeRangeFilter(
        timeRange,
        huntDomainStatsView.firstSubmitDate,
      );

      // Build extension filter if provided (extension is already namefi normalized)
      const extensionFilter = extension
        ? sql`${huntDomainStatsView.domainName} LIKE ${`%.${extension}`}`
        : undefined;

      // Build campaign exclusion filter if provided
      const campaignExclusionFilter = excludeCampaignKey
        ? sql`${huntDomainStatsView.domainName} NOT IN (
            SELECT ${huntCampaignDomainsTable.domainName}
            FROM ${huntCampaignDomainsTable}
            WHERE ${huntCampaignDomainsTable.campaignKey} = ${excludeCampaignKey}
          )`
        : undefined;

      // Combine filters
      const whereConditions = [
        sql`(${huntDomainStatsView.pinWeight} > 0) OR (${timeFilter})`,
      ];
      if (extensionFilter) {
        whereConditions.push(extensionFilter);
      }
      if (campaignExclusionFilter) {
        whereConditions.push(campaignExclusionFilter);
      }

      // Get trending domains without user vote status
      const domains = await db
        .select({
          domainName: huntDomainStatsView.domainName,
          upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
          firstSubmitDate: huntDomainStatsView.firstSubmitDate,
          lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
          isPinned: huntDomainStatsView.isPinned,
        })
        .from(huntDomainStatsView)
        .where(
          whereConditions.length === 1
            ? whereConditions[0]
            : whereConditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} AND ${condition}`,
              ),
        )
        .orderBy(
          desc(huntDomainStatsView.pinWeight),
          desc(huntDomainStatsView.upvoteCount),
          desc(huntDomainStatsView.lastUpvoteDate),
          desc(huntDomainStatsView.firstSubmitDate),
        )
        .offset(offset)
        .limit(limit + 1);

      const hasMore = domains.length > limit;
      const domainList = domains.slice(0, limit);

      // For public access, all userHasUpvoted should be false
      const domainsWithoutUserData = domainList.map((domain, index) => ({
        ...domain,
        domainName: domain.domainName as NamefiNormalizedDomain,
        rank: offset + index + 1,
        userHasUpvoted: false,
      }));

      const items = addTagsToItems(domainsWithoutUserData);

      return {
        items,
        hasMore,
      };
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

      // Build the query with time range filter
      const timeFilter = createTimeRangeFilter(
        timeRange,
        huntDomainStatsView.firstSubmitDate,
      );

      // Build extension filter if provided (extension is already namefi normalized)
      const extensionFilter = extension
        ? sql`${huntDomainStatsView.domainName} LIKE ${`%.${extension}`}`
        : undefined;

      // Build campaign exclusion filter if provided
      const campaignExclusionFilter = excludeCampaignKey
        ? sql`${huntDomainStatsView.domainName} NOT IN (
            SELECT ${huntCampaignDomainsTable.domainName}
            FROM ${huntCampaignDomainsTable}
            WHERE ${huntCampaignDomainsTable.campaignKey} = ${excludeCampaignKey}
          )`
        : undefined;

      // Combine filters
      const whereConditions = [
        sql`(${huntDomainStatsView.pinWeight} > 0) OR (${timeFilter})`,
      ];
      if (extensionFilter) {
        whereConditions.push(extensionFilter);
      }
      if (campaignExclusionFilter) {
        whereConditions.push(campaignExclusionFilter);
      }

      // Get trending domains without user vote status
      const domains = await db
        .select({
          domainName: huntDomainStatsView.domainName,
          upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
          firstSubmitDate: huntDomainStatsView.firstSubmitDate,
          lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
          isPinned: huntDomainStatsView.isPinned,
        })
        .from(huntDomainStatsView)
        .where(
          whereConditions.length === 1
            ? whereConditions[0]
            : whereConditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} AND ${condition}`,
              ),
        )
        .orderBy(
          desc(huntDomainStatsView.pinWeight),
          desc(huntDomainStatsView.upvoteCount),
          desc(huntDomainStatsView.lastUpvoteDate),
          desc(huntDomainStatsView.firstSubmitDate),
        )
        .offset(offset)
        .limit(limit + 1);

      const hasMore = domains.length > limit;
      const domainList = domains.slice(0, limit);

      // Batch query user's vote status for the returned domains
      const userVotes = await getUserVoteStatus(
        userId,
        domainList.map((d) => d.domainName as NamefiNormalizedDomain),
      );

      // Combine results with user vote status
      const domainsWithVotes = domainList.map((domain, index) => ({
        ...domain,
        domainName: domain.domainName as NamefiNormalizedDomain,
        rank: offset + index + 1,
        userHasUpvoted: Boolean(userVotes[domain.domainName]),
      }));

      const items = addTagsToItems(domainsWithVotes);

      return {
        items,
        hasMore,
      };
    }),

  /**
   * Upvote a domain - Creates an UPVOTE edge
   */
  upvote: protectedProcedure
    .input(domainVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;
      return await upvote(userId, domainName);
    }),

  /**
   * Remove upvote from a domain - Deletes the UPVOTE edge
   */
  unvote: protectedProcedure
    .input(domainVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;

      // Check if the UPVOTE edge exists
      const [existingUpvote] = await db
        .select()
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'UPVOTE'),
          ),
        );

      if (!existingUpvote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Upvote not found',
        });
      }

      // Delete the UPVOTE edge
      await db
        .delete(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'UPVOTE'),
          ),
        );

      return { success: true, message: 'Upvote removed successfully' };
    }),

  /**
   * Check if user has upvoted a domain
   */
  checkUpvoteStatus: protectedProcedure
    .input(domainVoteSchema)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;

      const [upvote] = await db
        .select()
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'UPVOTE'),
          ),
        );

      return {
        hasUpvoted: !!upvote,
        upvotedAt: upvote?.createdAt || null,
      };
    }),

  /**
   * Get domains upvoted by the current user
   */
  getMyUpvotedDomains: protectedProcedure
    .input(getMyUpvotedDomainsSchema)
    .query(async ({ ctx, input }) => {
      const { offset, limit } = input;
      const userId = ctx.user.id;

      // Get user's upvoted domains with upvote date
      const upvotedDomains = await db
        .select({
          domainName: huntEdgesTable.targetId,
          upvotedAt: huntEdgesTable.createdAt,
        })
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.action, 'UPVOTE'),
          ),
        )
        .orderBy(desc(huntEdgesTable.createdAt))
        .offset(offset)
        .limit(limit + 1);

      const hasMore = upvotedDomains.length > limit;
      const domainList = upvotedDomains.slice(0, limit);

      if (domainList.length === 0) {
        return { items: [], hasMore: false };
      }

      const domainStats = await getDomainStats(
        domainList.map((d) => d.domainName as NamefiNormalizedDomain),
      );

      const statsMap = createStatsMap(domainStats);
      const enrichedDomains = domainList.map((domain) => {
        const domainName = domain.domainName as NamefiNormalizedDomain;
        const stats = statsMap.get(domainName);
        return {
          domainName,
          upvotedAt: domain.upvotedAt,
          upvoteCount: stats?.upvoteCount || 0,
          userHasUpvoted: true, // Always true for upvoted domains
        };
      });

      const items = addTagsToItems(enrichedDomains);

      return {
        items,
        hasMore,
      };
    }),

  /**
   * Check if current user is the submitter of a domain
   */
  checkDomainOwnership: protectedProcedure
    .input(domainVoteSchema)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;

      const [submit] = await db
        .select()
        .from(huntEdgesTable)
        .where(
          and(
            eq(huntEdgesTable.sourceType, 'USER'),
            eq(huntEdgesTable.sourceId, userId),
            eq(huntEdgesTable.targetType, 'DOMAIN'),
            eq(huntEdgesTable.targetId, domainName),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        );

      return {
        isOwner: !!submit,
        submittedAt: submit?.createdAt || null,
      };
    }),

  /**
   * Get comprehensive domain details in split queries for consistency
   */
  getDomainDetail: protectedProcedure
    .input(getDomainDetailSchema)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      const userId = ctx.user.id;

      // Get domain stats and user interactions in parallel
      const [domainStats, userInteractions] = await Promise.all([
        // Get domain basic stats
        db
          .select({
            domainName: huntDomainStatsView.domainName,
            upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
            firstSubmitDate: huntDomainStatsView.firstSubmitDate,
            lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
          })
          .from(huntDomainStatsView)
          .where(eq(huntDomainStatsView.domainName, domainName))
          .limit(1),

        // Get user's interactions with this domain
        db
          .select({
            action: huntEdgesTable.action,
            createdAt: huntEdgesTable.createdAt,
          })
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.sourceType, 'USER'),
              eq(huntEdgesTable.sourceId, userId),
              eq(huntEdgesTable.targetType, 'DOMAIN'),
              eq(huntEdgesTable.targetId, domainName),
            ),
          ),
      ]);

      const [domainDetail] = domainStats;
      if (!domainDetail) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found in hunt system',
        });
      }

      // Process user interactions
      const userUpvote = userInteractions.find(
        (interaction) => interaction.action === 'UPVOTE',
      );
      const userSubmit = userInteractions.find(
        (interaction) => interaction.action === 'SUBMIT',
      );

      const enrichedDomain = {
        ...domainDetail,
        domainName: domainDetail.domainName as NamefiNormalizedDomain,
        userHasUpvoted: Boolean(userUpvote),
        userUpvotedAt: userUpvote?.createdAt || null,
        isOwner: Boolean(userSubmit),
        userSubmittedAt: userSubmit?.createdAt || null,
      };

      // Add tags to the domain
      const domainWithTags = addTagsToItems([enrichedDomain])[0];

      return {
        ...domainWithTags,
        // Transform to match existing interface expectations
        hasUpvoted: domainWithTags.userHasUpvoted,
        upvotedAt: domainWithTags.userUpvotedAt,
        submittedAt: domainWithTags.userSubmittedAt,
      };
    }),

  /**
   * Get domain details (public) - No authentication required
   * Returns domain details without user-specific data
   */
  getDomainDetailPublic: publicProcedure
    .input(getDomainDetailSchema)
    .query(async ({ input }) => {
      const { domainName } = input;

      // Get domain stats
      const [domainDetail] = await db
        .select({
          domainName: huntDomainStatsView.domainName,
          upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
          firstSubmitDate: huntDomainStatsView.firstSubmitDate,
          lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
        })
        .from(huntDomainStatsView)
        .where(eq(huntDomainStatsView.domainName, domainName))
        .limit(1);

      if (!domainDetail) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found in hunt system',
        });
      }

      const enrichedDomain = {
        ...domainDetail,
        domainName: domainDetail.domainName as NamefiNormalizedDomain,
        userHasUpvoted: false,
        userUpvotedAt: null,
        isOwner: false,
        userSubmittedAt: null,
        hasUpvoted: false,
        upvotedAt: null,
        submittedAt: null,
      };

      // Add tags to the domain
      const domainWithTags = addTagsToItems([enrichedDomain])[0];

      return domainWithTags;
    }),

  /**
   * Get awards for a specific period
   * Returns finalized award rankings for a specific time period
   */
  getPeriodAwards: publicProcedure
    .input(getPeriodAwardsSchema)
    .query(async ({ input }) => {
      const { type, periodKey, offset, limit } = input;

      // Query awards table for the specific period
      const awards = await db
        .select({
          domainName: huntAwardsTable.domainName,
          rank: huntAwardsTable.rank,
          upvoteCount: huntAwardsTable.upvoteCount,
          reason: huntAwardsTable.reason,
          awardedAt: huntAwardsTable.createdAt,
          isPinned: sql<boolean>`false`.as('is_pinned'), // Awards are historical, not pinned
        })
        .from(huntAwardsTable)
        .where(
          and(
            eq(huntAwardsTable.type, type),
            eq(huntAwardsTable.periodKey, periodKey),
          ),
        )
        .orderBy(huntAwardsTable.rank)
        .offset(offset)
        .limit(limit + 1);

      const hasMore = awards.length > limit;
      const items = addTagsToItems(
        awards.slice(0, limit).map((award) => ({
          ...award,
          userHasUpvoted: false, // Public access
        })),
      );

      return {
        items,
        hasMore,
      };
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
   * Get all awards for a specific domain
   * Returns all awards won by a specific domain
   */
  getDomainAwards: publicProcedure
    .input(getDomainAwardsSchema)
    .query(async ({ input }) => {
      const { domainName } = input;

      return await db
        .select({
          id: huntAwardsTable.id,
          type: huntAwardsTable.type,
          campaignKey: huntAwardsTable.campaignKey,
          periodKey: huntAwardsTable.periodKey,
          rank: huntAwardsTable.rank,
          reason: huntAwardsTable.reason,
          upvoteCount: huntAwardsTable.upvoteCount,
          awardedAt: huntAwardsTable.createdAt,
        })
        .from(huntAwardsTable)
        .where(eq(huntAwardsTable.domainName, domainName))
        .orderBy(desc(huntAwardsTable.createdAt));
    }),

  // ===== Hunt Management =====

  /**
   * Health check endpoint that returns the status of award schedules.
   * Returns schedule statuses for monitoring purposes.
   */
  getAwardSchedulesHealth: apiKeyProtectedProcedure.query(async () => {
    const scheduleIds = [
      'weekly-award-schedule',
      'monthly-award-schedule',
      'campaign-award-schedule',
      'campaign-status-schedule',
    ];

    const schedules = await Promise.all(
      scheduleIds.map(async (scheduleId) => {
        try {
          const handle = temporalClient.schedule.getHandle(scheduleId);
          const description = await handle.describe();
          return {
            id: scheduleId,
            state: description.state,
            info: description.info,
          };
        } catch (error) {
          return {
            id: scheduleId,
            state: 'NOT_FOUND',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    const unhealthySchedules = schedules.filter((s) => s.error);
    const message =
      unhealthySchedules.length === 0
        ? 'all award schedules active'
        : `${schedules.length - unhealthySchedules.length}/${schedules.length} schedules active`;

    return {
      message,
      schedules,
      status: unhealthySchedules.length === 0 ? 'healthy' : 'unhealthy',
    };
  }),

  /**
   * Trigger period award workflow.
   * Starts a workflow to process awards for a specific time period.
   */
  triggerPeriodAward: apiKeyProtectedProcedure
    .input(
      z.object({
        type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
        date: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { type, date } = input;

      const handle = await temporalClient.workflow.start(periodAwardWorkflow, {
        taskQueue: TEMPORAL_QUEUES.HUNT,
        workflowId: `period-award-${type}-${date || 'latest'}-${Date.now()}`,
        args: [{ type, date }],
      });

      return {
        message: `Period award triggered for ${type}${date ? ` period ${date}` : ''}`,
        workflowId: handle.workflowId,
      };
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

      const handle = await temporalClient.workflow.start(
        campaignAwardWorkflow,
        {
          taskQueue: TEMPORAL_QUEUES.HUNT,
          workflowId: `campaign-award-${campaignKey}-${Date.now()}`,
          args: [{ campaignKey }],
        },
      );

      return {
        message: `Campaign award triggered for ${campaignKey}`,
        workflowId: handle.workflowId,
      };
    }),

  /**
   * Trigger campaign status workflow.
   * Starts a workflow to update expired ACTIVE campaigns to ENDED status.
   */
  triggerCampaignStatus: apiKeyProtectedProcedure
    .input(z.object({}))
    .mutation(async () => {
      const handle = await temporalClient.workflow.start(
        campaignStatusWorkflow,
        {
          taskQueue: TEMPORAL_QUEUES.HUNT,
          workflowId: `campaign-status-${Date.now()}`,
          args: [],
        },
      );

      return {
        message: 'Campaign status workflow triggered',
        workflowId: handle.workflowId,
      };
    }),

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

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Start date must be before end date',
        });
      }

      return await db.transaction(async (tx) => {
        // Check if campaign with the same name already exists
        const [existingCampaign] = await tx
          .select()
          .from(huntCampaignsTable)
          .where(eq(huntCampaignsTable.name, name));
        if (existingCampaign) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Campaign with this name already exists',
          });
        }

        // Create campaign
        const [campaign] = await tx
          .insert(huntCampaignsTable)
          .values({
            campaignKey,
            name,
            title,
            description: description || '',
            logoUrl: logoUrl || '',
            startDate: start,
            endDate: end,
            status: 'DRAFT',
          })
          .returning();
        if (!campaign) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create campaign',
          });
        }

        let domainsAdded = 0;
        // Add domains to campaign if provided
        if (domains && domains.length > 0) {
          // Insert campaign domains
          await tx.insert(huntCampaignDomainsTable).values(
            domains.map(({ domainName, description }) => ({
              campaignKey: campaign.campaignKey,
              domainName,
              description: description || '',
            })),
          );

          // Check for existing SUBMIT edges to avoid duplicates
          const existingEdges = await tx
            .select()
            .from(huntEdgesTable)
            .where(
              and(
                eq(huntEdgesTable.targetType, 'DOMAIN'),
                eq(huntEdgesTable.action, 'SUBMIT'),
                sql`${huntEdgesTable.targetId} IN (${sql.join(
                  domains.map(({ domainName }) => sql`${domainName}`),
                  sql`, `,
                )})`,
              ),
            );
          const existingDomainNames = new Set(
            existingEdges.map((edge) => edge.targetId),
          );

          // Only create edges for domains that don't already have SUBMIT edges
          const newDomains = domains.filter(
            ({ domainName }) => !existingDomainNames.has(domainName),
          );
          if (newDomains.length > 0) {
            await tx.insert(huntEdgesTable).values(
              newDomains.map(({ domainName }) => ({
                sourceType: 'USER' as const,
                sourceId: NAMEFI_TEAM_USER_ID,
                targetType: 'DOMAIN' as const,
                targetId: domainName,
                action: 'SUBMIT' as const,
              })),
            );
          }
          domainsAdded = domains.length;
        }

        return {
          campaignKey: campaign.campaignKey,
          name: campaign.name,
          title: campaign.title,
          description: campaign.description,
          logoUrl: campaign.logoUrl,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          status: campaign.status,
          createdAt: campaign.createdAt,
          domainsAdded,
        };
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

      return await db.transaction(async (tx) => {
        // Get campaign details to ensure it exists
        const campaign = await getCampaignDetails(campaignKey, tx);
        if (!campaign) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Campaign not found',
          });
        }

        // Check if domains already exist in the campaign
        const existingDomains = await tx
          .select()
          .from(huntCampaignDomainsTable)
          .where(
            and(
              eq(huntCampaignDomainsTable.campaignKey, campaignKey),
              sql`${huntCampaignDomainsTable.domainName} IN (${sql.join(
                domains.map(({ domainName }) => sql`${domainName}`),
                sql`, `,
              )})`,
            ),
          );
        const existingDomainNames = new Set(
          existingDomains.map((domain) => domain.domainName),
        );

        // Filter out domains that already exist in the campaign
        const newDomains = domains.filter(
          ({ domainName }) => !existingDomainNames.has(domainName),
        );
        if (newDomains.length === 0) {
          return {
            campaignKey,
            domains: [],
            domainsAdded: 0,
            message: 'All domains are already in this campaign',
          };
        }

        // Insert new domain entries
        await tx.insert(huntCampaignDomainsTable).values(
          newDomains.map(({ domainName, description }) => ({
            campaignKey,
            domainName,
            description: description || '',
          })),
        );

        // Check for existing SUBMIT edges to avoid duplicates
        const existingEdges = await tx
          .select()
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.targetType, 'DOMAIN'),
              eq(huntEdgesTable.action, 'SUBMIT'),
              sql`${huntEdgesTable.targetId} IN (${sql.join(
                newDomains.map(({ domainName }) => sql`${domainName}`),
                sql`, `,
              )})`,
            ),
          );
        const existingEdgeDomainNames = new Set(
          existingEdges.map((edge) => edge.targetId),
        );

        // Only create edges for domains that don't already have SUBMIT edges
        const domainsNeedingEdges = newDomains.filter(
          ({ domainName }) => !existingEdgeDomainNames.has(domainName),
        );
        if (domainsNeedingEdges.length > 0) {
          await tx.insert(huntEdgesTable).values(
            domainsNeedingEdges.map(({ domainName }) => ({
              sourceType: 'USER' as const,
              sourceId: NAMEFI_TEAM_USER_ID,
              targetType: 'DOMAIN' as const,
              targetId: domainName,
              action: 'SUBMIT' as const,
            })),
          );
        }

        return {
          campaignKey,
          domains: newDomains,
          domainsAdded: newDomains.length,
          edgesCreated: domainsNeedingEdges.length,
        };
      });
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

      return await db.transaction(async (tx) => {
        // Get campaign details to ensure it exists
        const campaign = await getCampaignDetails(campaignKey, tx);
        if (!campaign) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Campaign not found',
          });
        }

        // Validate status transition
        const currentStatus = campaign.status;
        const validTransitions: Record<string, string[]> = {
          DRAFT: ['ACTIVE', 'CANCELLED'],
          ACTIVE: ['DRAFT', 'CANCELLED'],
          CANCELLED: ['DRAFT', 'ACTIVE'],
        };
        if (!validTransitions[currentStatus]?.includes(status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid status transition from ${currentStatus} to ${status}. Valid transitions from ${currentStatus} are: ${validTransitions[currentStatus]?.join(', ')}`,
          });
        }

        // Update campaign status
        const [updatedCampaign] = await tx
          .update(huntCampaignsTable)
          .set({
            status,
            updatedAt: new Date(),
          })
          .where(eq(huntCampaignsTable.campaignKey, campaignKey))
          .returning();
        if (!updatedCampaign) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update campaign status',
          });
        }

        return {
          campaignKey: updatedCampaign.campaignKey,
          name: updatedCampaign.name,
          title: updatedCampaign.title,
          description: updatedCampaign.description,
          logoUrl: updatedCampaign.logoUrl,
          startDate: updatedCampaign.startDate,
          endDate: updatedCampaign.endDate,
          status: updatedCampaign.status,
          createdAt: updatedCampaign.createdAt,
          updatedAt: updatedCampaign.updatedAt,
          previousStatus: currentStatus,
        };
      });
    }),
});
