import { db, huntAwardsTable, huntDomainStatsView } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { and, desc, eq, sql } from 'drizzle-orm';
import { addTagsToItems } from './helpers';
import type { HuntPeriodAwardType } from './schema';

/**
 * Get awards for a specific period
 * Returns finalized award rankings for a specific time period
 */
export const getPeriodAwards = async ({
  type,
  periodKey,
  offset,
  limit,
}: {
  type: HuntPeriodAwardType;
  periodKey: string;
  offset: number;
  limit: number;
}) => {
  // Query awards table for the specific period with real-time vote counts
  const awards = await db
    .select({
      domainName: huntAwardsTable.domainName,
      rank: huntAwardsTable.rank,
      upvoteCount: sql<number>`CAST(COALESCE(hunt_domain_stats_view.upvote_count, 0) AS INTEGER)`,
      reason: huntAwardsTable.reason,
      awardedAt: huntAwardsTable.createdAt,
      isPinned: sql<boolean>`false`.as('is_pinned'), // Awards are historical, not pinned
    })
    .from(huntAwardsTable)
    .leftJoin(
      huntDomainStatsView,
      eq(huntAwardsTable.domainName, huntDomainStatsView.domainName),
    )
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
};

/**
 * Get all awards for a specific domain
 * Returns all awards won by a specific domain
 */
export const getDomainAwards = (domainName: NamefiNormalizedDomain) =>
  db
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
