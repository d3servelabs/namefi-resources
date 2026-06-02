import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { eq, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { randomUuid, timestamps } from './common';

export const namefiHuntSchema = pgSchema('namefi_hunt');

/**
 * Hunt system tables
 */
export const huntActionEnum = namefiHuntSchema.enum('hunt_action', [
  'UPVOTE',
  'SUBMIT',
]);

export const huntEntityTypeEnum = namefiHuntSchema.enum('hunt_entity_type', [
  'USER',
  'DOMAIN',
]);

/**
 * Hunt edges table
 * Stores relationships between entities in the hunt system
 *
 * Examples:
 * - USER upvotes DOMAIN: sourceType='USER', sourceId=userId, targetType='DOMAIN', targetId=domainName, action='UPVOTE'
 * - USER submits DOMAIN: sourceType='USER', sourceId=userId, targetType='DOMAIN', targetId=domainName, action='SUBMIT'
 * - USER upvotes USER: sourceType='USER', sourceId=userId, targetType='USER', targetId=otherUserId, action='UPVOTE'
 *
 * TODO: [HIGH-IMPACT DATA INTEGRITY] Missing referential integrity for USER entity types.
 * When sourceType='USER' or targetType='USER', the corresponding sourceId/targetId should
 * reference usersTable.id, but there's no foreign key constraint. This means:
 * 1. If a user is deleted, their hunt edges become orphaned (sourceId/targetId point to non-existent users)
 * 2. Invalid user IDs can be inserted without database-level validation
 * 3. Queries joining hunt_edges with users may silently return incomplete results
 * Impact: High - Could lead to data corruption and incorrect leaderboard/stats calculations.
 * Fix: Consider adding a trigger or application-level cleanup when users are deleted,
 * or restructure to use proper foreign keys with conditional constraints.
 */
export const huntEdgesTable = namefiHuntSchema.table(
  'hunt_edges',
  {
    ...randomUuid,
    sourceType: huntEntityTypeEnum('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    targetType: huntEntityTypeEnum('target_type').notNull(),
    targetId: text('target_id').notNull(),
    action: huntActionEnum('action').notNull(),
    ...timestamps,
  },
  (table) => [
    // Core index for user-specific queries (e.g., getMySubmittedDomains, checkUpvoteStatus)
    index('hunt_edges_user_action_idx').on(
      table.sourceType,
      table.sourceId,
      table.action,
      table.createdAt, // For ordering user's actions by time
    ),
    // Core index for domain-specific queries (e.g., domain stats, duplicate submit checks)
    index('hunt_edges_domain_action_idx').on(
      table.targetType,
      table.targetId,
      table.action,
      table.createdAt, // For first submit date and last upvote date
    ),
    // Composite index for specific user-domain-action lookups (duplicate checks, vote status)
    index('hunt_edges_user_domain_action_idx').on(
      table.sourceType,
      table.sourceId,
      table.targetType,
      table.targetId,
      table.action,
    ),
    // Time-based filtering optimization for trending domains
    index('hunt_edges_time_filter_idx').on(
      table.targetType,
      table.action,
      table.createdAt, // For efficient time range filtering on submit dates
    ),
  ],
);

/**
 * Pinned domains for hunt system
 */
export const huntPinnedDomainsTable = namefiHuntSchema.table(
  'hunt_pinned_domains',
  {
    ...randomUuid,
    domainName: text('domain_name').notNull().$type<NamefiNormalizedDomain>(),
    weight: integer('weight').notNull().default(100),
    ...timestamps,
  },
  (table) => [
    unique('hunt_pinned_domains_domain_unique').on(table.domainName),
    index('hunt_pinned_domains_weight_idx').on(table.weight),
  ],
);

/**
 * Hunt awards system
 */
export const huntAwardTypeEnum = namefiHuntSchema.enum('hunt_award_type', [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
  'CAMPAIGN',
]);

export const huntCampaignStatusEnum = namefiHuntSchema.enum(
  'hunt_campaign_status',
  ['DRAFT', 'ACTIVE', 'ENDED', 'AWARDED', 'CANCELLED'],
);

/**
 * Hunt awards table
 * Stores finalized award rankings for domains in specific time periods or campaigns
 * This table serves as a historical record of domain rankings after each award period ends
 */
export const huntAwardsTable = namefiHuntSchema.table(
  'hunt_awards',
  {
    ...randomUuid,
    domainName: text('domain_name').notNull().$type<NamefiNormalizedDomain>(),
    type: huntAwardTypeEnum('type').notNull(),

    // Campaign key for campaign-type awards (e.g., 'CV-2025', 'CTA-2025')
    campaignKey: text('campaign_key'),

    // Period key for time-based awards (e.g., 'DAILY-2025-01-01', 'WEEKLY-2025-01', 'MONTHLY-2025-01', 'YEARLY-2025')
    periodKey: text('period_key'),

    rank: integer('rank').notNull(),
    reason: text('reason'), // Display text for the award (e.g., "July 8th, 2025")
    upvoteCount: integer('upvote_count').notNull(), // Snapshot of upvote count at award time

    ...timestamps,
  },
  (table) => [
    // Core indexes for efficient queries
    index('hunt_awards_domain_idx').on(table.domainName),
    index('hunt_awards_type_period_idx').on(table.type, table.periodKey),
    index('hunt_awards_campaign_idx').on(table.campaignKey),

    // Ensure either campaignKey or periodKey is provided
    check(
      'hunt_awards_key_check',
      sql`(${table.campaignKey} IS NOT NULL) OR (${table.periodKey} IS NOT NULL)`,
    ),

    // Ensure rank is positive
    check('hunt_awards_rank_positive', sql`${table.rank} > 0`),

    // Ensure upvote count is non-negative
    check(
      'hunt_awards_upvote_count_nonnegative',
      sql`${table.upvoteCount} >= 0`,
    ),
  ],
);

/**
 * Hunt campaigns table
 * Stores configuration for campaign-type awards
 */
export const huntCampaignsTable = namefiHuntSchema.table(
  'hunt_campaigns',
  {
    ...randomUuid,
    campaignKey: text('campaign_key').notNull().unique(),
    name: text('name').notNull().default(''),
    title: text('title').notNull().default(''),
    description: text('description').notNull().default(''),
    logoUrl: text('logo_url').notNull().default(''),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: huntCampaignStatusEnum('status').notNull().default('DRAFT'),
    ...timestamps,
  },
  (table) => [
    index('hunt_campaigns_dates_idx').on(table.startDate, table.endDate),
    index('hunt_campaigns_status_idx').on(table.status),

    // Ensure end date is after start date
    check(
      'hunt_campaigns_dates_valid',
      sql`${table.endDate} > ${table.startDate}`,
    ),
  ],
);

/**
 * Hunt campaign domains table
 * Stores which domains are eligible for specific campaigns
 */
export const huntCampaignDomainsTable = namefiHuntSchema.table(
  'hunt_campaign_domains',
  {
    ...randomUuid,
    campaignKey: text('campaign_key')
      .notNull()
      .references(() => huntCampaignsTable.campaignKey, {
        onDelete: 'cascade',
      }),
    domainName: text('domain_name').notNull().$type<NamefiNormalizedDomain>(),
    description: text('description').notNull().default(''),
    ...timestamps,
  },
  (table) => [
    unique('hunt_campaign_domains_unique').on(
      table.campaignKey,
      table.domainName,
    ),
    index('hunt_campaign_domains_campaign_idx').on(table.campaignKey),
    index('hunt_campaign_domains_domain_idx').on(table.domainName),
  ],
);

/**
 * Domain hunt stats view
 * Pre-computed statistics for domains in the hunt system
 * This view aggregates upvote counts, submit dates, and pinned information for efficient leaderboard queries
 */
export const huntDomainStatsView = namefiHuntSchema
  .view('hunt_domain_stats_view')
  .as((qb) =>
    qb
      .select({
        domainName: huntEdgesTable.targetId,
        upvoteCount:
          sql<number>`COUNT(CASE WHEN ${huntEdgesTable.action} = 'UPVOTE' THEN 1 END)`.as(
            'upvote_count',
          ),
        firstSubmitDate:
          sql<Date>`MIN(CASE WHEN ${huntEdgesTable.action} = 'SUBMIT' THEN ${huntEdgesTable.createdAt} END)`.as(
            'first_submit_date',
          ),
        lastUpvoteDate:
          sql<Date>`MAX(CASE WHEN ${huntEdgesTable.action} = 'UPVOTE' THEN ${huntEdgesTable.createdAt} END)`.as(
            'last_upvote_date',
          ),
        // Use weight for pinned domains, 0 for non-pinned domains (higher weight = higher priority)
        pinWeight:
          sql<number>`COALESCE(${huntPinnedDomainsTable.weight}, 0)`.as(
            'pin_weight',
          ),
        isPinned:
          sql<boolean>`CASE WHEN ${huntPinnedDomainsTable.domainName} IS NOT NULL THEN true ELSE false END`.as(
            'is_pinned',
          ),
      })
      .from(huntEdgesTable)
      .leftJoin(
        huntPinnedDomainsTable,
        eq(huntEdgesTable.targetId, huntPinnedDomainsTable.domainName),
      )
      .where(eq(huntEdgesTable.targetType, 'DOMAIN'))
      .groupBy(
        huntEdgesTable.targetId,
        huntPinnedDomainsTable.weight,
        huntPinnedDomainsTable.domainName,
      ),
  );
