import { db, huntDomainStatsView, huntEdgesTable } from '@namefi-astra/db';
import { getTags } from '@namefi/cat';
import { TRPCError } from '@trpc/server';
import { type SQL, and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';

// Input schemas
const submitDomainSchema = z.object({
  domainName: z.string().min(1),
});

const removeDomainSchema = z.object({
  domainName: z.string().min(1),
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
});

const domainVoteSchema = z.object({
  domainName: z.string().min(1),
});

const getDomainDetailSchema = z.object({
  domainName: z.string().min(1),
});

/**
 * Create time range filter SQL condition based on time range
 */
function createTimeRangeFilter(
  timeRange: string,
  dateColumn: SQL.Aliased<Date>,
) {
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
}

/**
 * Helper function to add tags to domain items
 */
function addTagsToItems<T extends { domainName: string }>(
  items: T[],
): (T & { tags: Array<{ id: string }> })[] {
  return items.map((item) => ({
    ...item,
    tags: getTags(item.domainName),
  }));
}

const upvote = async (userId: string, domainName: string) => {
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

      // Batch get domain stats
      const domainNames = domainList.map((d) => d.domainName);
      const [domainStats, userVotes] = await Promise.all([
        // Get stats for these domains
        db
          .select({
            domainName: huntDomainStatsView.domainName,
            upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
            firstSubmitDate: huntDomainStatsView.firstSubmitDate,
          })
          .from(huntDomainStatsView)
          .where(
            sql`${huntDomainStatsView.domainName} IN (${sql.join(
              domainNames.map((name) => sql`${name}`),
              sql`, `,
            )})`,
          ),

        // Get user's vote status for these domains
        db
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
          ),
      ]);

      // Combine all data
      const statsMap = new Map(
        domainStats.map((stat) => [stat.domainName, stat]),
      );
      const votesSet = new Set(userVotes.map((vote) => vote.targetId));
      const enrichedDomains = domainList.map((domain) => {
        const stats = statsMap.get(domain.domainName);
        return {
          domainName: domain.domainName,
          submittedAt: domain.submittedAt,
          upvoteCount: stats?.upvoteCount || 0,
          firstSubmitDate: stats?.firstSubmitDate || domain.submittedAt,
          userHasUpvoted: votesSet.has(domain.domainName),
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
      const { offset, limit, timeRange } = input;

      // Build the query with time range filter
      const timeFilter = createTimeRangeFilter(
        timeRange,
        huntDomainStatsView.firstSubmitDate,
      );

      // Get trending domains without user vote status
      const domains = await db
        .select({
          domainName: huntDomainStatsView.domainName,
          upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
          firstSubmitDate: huntDomainStatsView.firstSubmitDate,
          lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
        })
        .from(huntDomainStatsView)
        .where(timeFilter)
        .orderBy(
          desc(huntDomainStatsView.upvoteCount),
          desc(huntDomainStatsView.lastUpvoteDate),
          desc(huntDomainStatsView.firstSubmitDate),
        )
        .offset(offset)
        .limit(limit + 1);

      const hasMore = domains.length > limit;
      const domainList = domains.slice(0, limit);

      // For public access, all userHasUpvoted should be false
      const domainsWithoutUserData = domainList.map((domain) => ({
        ...domain,
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
      const { offset, limit, timeRange } = input;
      const userId = ctx.user.id;

      // Build the query with time range filter
      const timeFilter = createTimeRangeFilter(
        timeRange,
        huntDomainStatsView.firstSubmitDate,
      );

      // Get trending domains without user vote status
      const domains = await db
        .select({
          domainName: huntDomainStatsView.domainName,
          upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
          firstSubmitDate: huntDomainStatsView.firstSubmitDate,
          lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
        })
        .from(huntDomainStatsView)
        .where(timeFilter)
        .orderBy(
          desc(huntDomainStatsView.upvoteCount),
          desc(huntDomainStatsView.lastUpvoteDate),
          desc(huntDomainStatsView.firstSubmitDate),
        )
        .offset(offset)
        .limit(limit + 1);

      const hasMore = domains.length > limit;
      const domainList = domains.slice(0, limit);

      // Batch query user's vote status for the returned domains
      let userVotes: Record<string, boolean> = {};
      if (domainList.length > 0) {
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
                domainList.map((d) => sql`${d.domainName}`),
                sql`, `,
              )})`,
            ),
          );

        userVotes = userVoteRows.reduce(
          (acc, row) => {
            acc[row.targetId] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }

      // Combine results with user vote status
      const domainsWithVotes = domainList.map((domain) => ({
        ...domain,
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

      // Get domain stats for upvoted domains
      const domainNames = domainList.map((d) => d.domainName);
      const domainStats = await db
        .select({
          domainName: huntDomainStatsView.domainName,
          upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
          firstSubmitDate: huntDomainStatsView.firstSubmitDate,
        })
        .from(huntDomainStatsView)
        .where(
          sql`${huntDomainStatsView.domainName} IN (${sql.join(
            domainNames.map((name) => sql`${name}`),
            sql`, `,
          )})`,
        );

      // Combine data
      const statsMap = new Map(
        domainStats.map((stat) => [stat.domainName, stat]),
      );
      const enrichedDomains = domainList.map((domain) => {
        const stats = statsMap.get(domain.domainName);
        return {
          domainName: domain.domainName,
          upvotedAt: domain.upvotedAt,
          upvoteCount: stats?.upvoteCount || 0,
          firstSubmitDate: stats?.firstSubmitDate || domain.upvotedAt,
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
});
