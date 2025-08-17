import {
  db,
  huntCampaignDomainsTable,
  huntDomainStatsView,
  huntEdgesTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  addTagsToItems,
  createStatsMap,
  createTimeRangeFilter,
} from './helpers';
import type { trendingDomainTimeRangeEnum, UserUpvoteStatus } from './schema';

/**
 * Helper function to get domain stats
 */
export const getDomainStats = async (domainNames: NamefiNormalizedDomain[]) => {
  if (domainNames.length === 0) {
    return [];
  }
  return db
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
};

/**
 * Helper function to batch query user's vote status for domains
 */
export const getUserUpvoteStatus = async (
  domainNames: NamefiNormalizedDomain[],
  userId: string,
): Promise<Record<string, UserUpvoteStatus>> => {
  if (domainNames.length === 0) {
    return {};
  }

  const userVoteRows = await db
    .select({
      targetId: huntEdgesTable.targetId,
      createdAt: huntEdgesTable.createdAt,
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

  const results = userVoteRows.reduce(
    (acc, row) => {
      acc[row.targetId] = {
        hasUpvoted: true,
        upvotedAt: row.createdAt || null,
      };
      return acc;
    },
    {} as Record<string, UserUpvoteStatus>,
  );

  for (const domainName of domainNames) {
    if (!results[domainName]) {
      results[domainName] = {
        hasUpvoted: false,
        upvotedAt: null,
      };
    }
  }

  return results;
};

/**
 * Check if current user is the submitter of a domain
 */
export const checkDomainOwnership = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
) => {
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
};

/**
 * Submit a domain - Creates a SUBMIT edge between user and domain
 */
export const submitDomain = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
) => {
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
    await upvote(domainName, userId);

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
  await upvote(domainName, userId);

  return {
    success: true,
    domainName,
    submittedAt: edge.createdAt,
    message: 'Domain submitted successfully',
  };
};

/**
 * Remove a domain from the hunt
 */
export const removeDomain = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
) => {
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
      message: 'Domain not found or you do not have permission to delete it',
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
};

/**
 * Get submitted domains by user
 */
export const getSubmittedDomainsByUser = async (
  userId: string,
  offset: number,
  limit: number,
) => {
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

  const [domainStats, userUpvotes] = await Promise.all([
    // Get stats for these domains
    getDomainStats(domainNames),

    // Get user's upvote status for these domains
    getUserUpvoteStatus(domainNames, userId),
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
      userHasUpvoted: Boolean(userUpvotes[domain.domainName]?.hasUpvoted),
    };
  });

  const items = addTagsToItems(enrichedDomains);

  return {
    items,
    hasMore,
  };
};

/**
 * Get upvoted domains by user
 */
export const getUpvotedDomainsByUser = async (
  userId: string,
  offset: number,
  limit: number,
) => {
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
};

/**
 * Get trending domains
 */
export const getTrendingDomains = async ({
  offset,
  limit,
  timeRange,
  extension,
  excludeCampaignKey,
  currentUserId,
}: {
  offset: number;
  limit: number;
  timeRange: (typeof trendingDomainTimeRangeEnum.options)[number];
  extension?: string;
  excludeCampaignKey?: string;
  currentUserId?: string;
}) => {
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
      rank: sql<number>`CAST(RANK() OVER (
        ORDER BY 
          COALESCE(${huntDomainStatsView.upvoteCount}, 0) DESC
      ) AS INTEGER)`.as('rank'),
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

  // Batch query user's upvote status for the returned domains
  const userUpvotes = currentUserId
    ? await getUserUpvoteStatus(
        domainList.map((d) => d.domainName as NamefiNormalizedDomain),
        currentUserId,
      )
    : {};

  // For public access, all userHasUpvoted should be false
  const domainsWithoutUserData = domainList.map((domain) => ({
    ...domain,
    domainName: domain.domainName as NamefiNormalizedDomain,
    userHasUpvoted: Boolean(userUpvotes[domain.domainName]?.hasUpvoted),
  }));

  const items = addTagsToItems(domainsWithoutUserData);

  return {
    items,
    hasMore,
  };
};

/**
 * Get domain detail
 */
export const getDomainDetail = async (
  domainName: NamefiNormalizedDomain,
  userId?: string,
) => {
  // Get domain basic stats
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

  // Process user interactions
  const upvoteStatus = userId
    ? (await getUserUpvoteStatus([domainName], userId))[domainName]
    : null;
  const ownershipStatus = userId
    ? await checkDomainOwnership(domainName, userId)
    : null;

  const enrichedDomain = {
    ...domainDetail,
    domainName: domainDetail.domainName as NamefiNormalizedDomain,
    userHasUpvoted: Boolean(upvoteStatus?.hasUpvoted),
    userUpvotedAt: upvoteStatus?.upvotedAt || null,
    userIsOwner: Boolean(ownershipStatus?.isOwner),
    userSubmittedAt: ownershipStatus?.submittedAt || null,
  };

  // Add tags to the domain
  return addTagsToItems([enrichedDomain])[0];
};

/**
 * Upvote a domain
 */
export const upvote = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
) => {
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
 * Unvote a domain
 */
export const unvote = async (
  domainName: NamefiNormalizedDomain,
  userId: string,
) => {
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
};
