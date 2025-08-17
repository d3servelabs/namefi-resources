import {
  db,
  huntAwardsTable,
  huntCampaignDomainsTable,
  huntCampaignsTable,
  huntDomainStatsView,
  huntEdgesTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getUserUpvoteStatus } from './domain.service';
import { addTagsToItems } from './helpers';
import { NAMEFI_TEAM_USER_ID } from './schema';

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

/**
 * Helper function to get campaign details
 */
export const getCampaignDetails = async (
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
export const getCampaignRankings = async (
  campaignKey: string,
  campaign: CampaignDetails,
  offset: number,
  limit: number,
  userId?: string,
) => {
  let hasMore = false;
  let records: Array<Omit<CampaignRanking, 'tags' | 'userHasUpvoted'>> = [];

  if (campaign.status === 'AWARDED') {
    // Campaign ended, return finalized awards with real-time vote counts
    records = await db
      .select({
        domainName: huntAwardsTable.domainName,
        rank: huntAwardsTable.rank,
        upvoteCount: sql<number>`CAST(COALESCE(hunt_domain_stats_view.upvote_count, 0) AS INTEGER)`,
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
      .leftJoin(
        huntDomainStatsView,
        eq(huntAwardsTable.domainName, huntDomainStatsView.domainName),
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
        upvoteCount: sql<number>`CAST(COALESCE(hunt_domain_stats_view.upvote_count, 0) AS INTEGER)`,
        isPinned:
          sql<boolean>`COALESCE(${huntDomainStatsView.isPinned}, false)`.as(
            'is_pinned',
          ),
        description:
          sql<string>`COALESCE(${huntCampaignDomainsTable.description}, '')`.as(
            'description',
          ),
        rank: sql<number>`CAST(RANK() OVER (
            ORDER BY 
              COALESCE(${huntDomainStatsView.upvoteCount}, 0) DESC
          ) AS INTEGER)`.as('rank'),
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

  const userUpvotes = userId
    ? await getUserUpvoteStatus(
        records.map((d) => d.domainName),
        userId,
      )
    : {};

  const rankings: Array<CampaignRanking> = addTagsToItems(
    records.map((record) => ({
      ...record,
      userHasUpvoted: Boolean(userUpvotes[record.domainName]?.hasUpvoted),
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
export const getCampaign = async ({
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

/**
 * Create a new campaign.
 */
export const createCampaign = async ({
  campaignKey,
  name,
  title,
  description,
  logoUrl,
  startDate,
  endDate,
  domains,
}: {
  campaignKey: string;
  name: string;
  title: string;
  description?: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  domains?: { domainName: NamefiNormalizedDomain; description?: string }[];
}) => {
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
};

/**
 * Add domains to an existing campaign.
 */
export const addDomainsToCampaign = async ({
  campaignKey,
  domains,
}: {
  campaignKey: string;
  domains: { domainName: NamefiNormalizedDomain; description?: string }[];
}) =>
  db.transaction(async (tx) => {
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

/**
 * Update campaign status.
 * Only allows transitions between DRAFT, ACTIVE, and CANCELLED statuses.
 */
export const updateCampaignStatus = async ({
  campaignKey,
  status,
}: {
  campaignKey: string;
  status: 'DRAFT' | 'ACTIVE' | 'CANCELLED';
}) =>
  db.transaction(async (tx) => {
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
