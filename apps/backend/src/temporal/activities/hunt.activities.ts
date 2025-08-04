import {
  db,
  huntCampaignsTable,
  huntCampaignDomainsTable,
  huntAwardsTable,
  huntDomainStatsView,
} from '@namefi-astra/db';
import { and, desc, eq, sql, lte, gte, lt } from 'drizzle-orm';
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
} from 'date-fns';
import { assert } from '@namefi-astra/utils/assert';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { logger } from '#lib/logger';

const _logger = logger.child({
  module: 'hunt-activities',
});

const DAILY_PERIOD_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const WEEKLY_PERIOD_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTHLY_PERIOD_KEY_REGEX = /^\d{4}-\d{2}$/;
const YEARLY_PERIOD_KEY_REGEX = /^\d{4}$/;

/**
 * Activity to get campaigns that have ended but not been awarded yet
 */
export const getEndedCampaignsForAwarding = async () => {
  _logger.info('Fetching ended campaigns for awarding');

  const now = new Date();

  const endedCampaigns = await db
    .select({
      campaignKey: huntCampaignsTable.campaignKey,
      title: huntCampaignsTable.title,
      description: huntCampaignsTable.description,
      startDate: huntCampaignsTable.startDate,
      endDate: huntCampaignsTable.endDate,
      status: huntCampaignsTable.status,
    })
    .from(huntCampaignsTable)
    .where(
      and(
        eq(huntCampaignsTable.status, 'ENDED'),
        lte(huntCampaignsTable.endDate, now),
      ),
    );

  _logger.info(
    { campaignCount: endedCampaigns.length },
    'Found ended campaigns',
  );

  return endedCampaigns;
};

/**
 * Activity to get campaign rankings for awarding
 */
export const getCampaignRankingsForAwarding = async (campaignKey: string) => {
  _logger.info({ campaignKey }, 'Fetching campaign rankings for awarding');
  // Get all domains in the campaign with their current upvote counts
  const rankings = await db
    .select({
      domainName: huntCampaignDomainsTable.domainName,
      upvoteCount: sql<number>`CAST(COALESCE(${huntDomainStatsView.upvoteCount}, 0) AS INTEGER)`,
      firstSubmitDate: huntDomainStatsView.firstSubmitDate,
      lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
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
    );

  _logger.info(
    { campaignKey, rankingCount: rankings.length },
    'Retrieved campaign rankings',
  );
  return rankings;
};

/**
 * Activity to get period rankings for awarding (daily, weekly, monthly, yearly)
 */
export const getPeriodRankingsForAwarding = async (
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  periodKey: string,
  limit: number,
) => {
  _logger.info(
    { type, periodKey, limit },
    'Fetching period rankings for awarding',
  );
  // Parse period key to get date range
  let startDate: Date;
  let endDate: Date;

  switch (type) {
    case 'DAILY': {
      assert(
        DAILY_PERIOD_KEY_REGEX.test(periodKey),
        'Invalid DAILY periodKey format. Expected: YYYY-MM-DD',
      );
      const date = new Date(periodKey); // periodKey format: 'YYYY-MM-DD'
      startDate = date;
      endDate = addDays(date, 1);
      break;
    }
    case 'WEEKLY': {
      assert(
        WEEKLY_PERIOD_KEY_REGEX.test(periodKey),
        'Invalid WEEKLY periodKey format. Expected: YYYY-MM-DD',
      );
      const date = new Date(periodKey); // periodKey format: 'YYYY-MM-DD'
      startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
      endDate = addWeeks(startDate, 1);
      break;
    }
    case 'MONTHLY': {
      assert(
        MONTHLY_PERIOD_KEY_REGEX.test(periodKey),
        'Invalid MONTHLY periodKey format. Expected: YYYY-MM',
      );
      const date = new Date(periodKey); // periodKey format: 'YYYY-MM'
      startDate = startOfMonth(date);
      endDate = addMonths(startDate, 1);
      break;
    }
    case 'YEARLY': {
      assert(
        YEARLY_PERIOD_KEY_REGEX.test(periodKey),
        'Invalid YEARLY periodKey format. Expected: YYYY',
      );
      const date = new Date(periodKey); // periodKey format: 'YYYY'
      startDate = startOfYear(date);
      endDate = addYears(startDate, 1);
      break;
    }
    default:
      throw new Error(`Invalid period type: ${type}`);
  }

  // Get top domains for the period
  const rankings = await db
    .select({
      domainName: huntDomainStatsView.domainName,
      upvoteCount: sql<number>`CAST(${huntDomainStatsView.upvoteCount} AS INTEGER)`,
      firstSubmitDate: huntDomainStatsView.firstSubmitDate,
      lastUpvoteDate: huntDomainStatsView.lastUpvoteDate,
    })
    .from(huntDomainStatsView)
    .where(
      and(
        gte(huntDomainStatsView.firstSubmitDate, startDate),
        lt(huntDomainStatsView.firstSubmitDate, endDate),
      ),
    )
    .orderBy(
      desc(huntDomainStatsView.upvoteCount),
      desc(huntDomainStatsView.lastUpvoteDate),
      desc(huntDomainStatsView.firstSubmitDate),
    )
    .limit(limit);

  _logger.info(
    { type, periodKey, rankingCount: rankings.length },
    'Retrieved period rankings',
  );

  return rankings;
};

/**
 * Activity to check if period awards already exist
 */
export const checkPeriodAwardsExist = async (
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  periodKey: string,
) => {
  _logger.info({ type, periodKey }, 'Checking if period awards exist');
  const existingAwards = await db
    .select({ id: huntAwardsTable.id })
    .from(huntAwardsTable)
    .where(
      and(
        eq(huntAwardsTable.type, type),
        eq(huntAwardsTable.periodKey, periodKey),
      ),
    )
    .limit(1);
  const exists = existingAwards.length > 0;
  _logger.info(
    { type, periodKey, exists },
    'Period awards existence check complete',
  );
  return {
    exists,
  };
};

/**
 * Activity to check if campaign awards already exist
 */
export const checkCampaignAwardsExist = async (campaignKey: string) => {
  _logger.info({ campaignKey }, 'Checking if campaign awards exist');
  const existingAwards = await db
    .select({ id: huntAwardsTable.id })
    .from(huntAwardsTable)
    .where(
      and(
        eq(huntAwardsTable.type, 'CAMPAIGN'),
        eq(huntAwardsTable.campaignKey, campaignKey),
      ),
    )
    .limit(1);

  _logger.info(
    { campaignKey, existingAwardsCount: existingAwards.length },
    'Campaign awards existence check complete',
  );

  return {
    exists: existingAwards.length > 0,
    count: existingAwards.length,
  };
};

/**
 * Activity to create awards for a campaign
 */
export const createCampaignAwards = async (
  campaignKey: string,
  campaignTitle: string,
  rankings: Array<{
    domainName: string;
    upvoteCount: number;
    firstSubmitDate: Date | null;
    lastUpvoteDate: Date | null;
  }>,
): Promise<{
  createdAwards: number;
  message: string;
}> => {
  _logger.info(
    { campaignKey, campaignTitle, rankingCount: rankings.length },
    'Creating campaign awards',
  );
  if (rankings.length === 0) {
    _logger.info({ campaignKey }, 'No domains to award for campaign');
    return {
      createdAwards: 0,
      message: 'No domains to award',
    };
  }

  // Check if awards already exist
  const { exists } = await checkCampaignAwardsExist(campaignKey);
  assert(!exists, 'Awards already exist for this campaign');

  // Create award reason based on campaign end date
  const campaign = await db
    .select({ endDate: huntCampaignsTable.endDate })
    .from(huntCampaignsTable)
    .where(eq(huntCampaignsTable.campaignKey, campaignKey))
    .limit(1);
  assert(
    typeof campaign[0] !== 'undefined',
    `Campaign ${campaignKey} not found`,
  );
  const createAwardReason = (domainName: string, rank: number) =>
    `${domainName} was ranked #${rank} of ${campaignTitle} for ${format(campaign[0].endDate, 'MMMM do, yyyy')}`;

  // Create awards for all domains in the campaign
  const awardsToInsert = rankings.map((ranking, index) => ({
    domainName: ranking.domainName as NamefiNormalizedDomain,
    type: 'CAMPAIGN' as const,
    campaignKey,
    periodKey: null,
    rank: index + 1,
    reason: createAwardReason(ranking.domainName, index + 1),
    upvoteCount: ranking.upvoteCount,
  }));

  const insertedAwards = await db
    .insert(huntAwardsTable)
    .values(awardsToInsert)
    .returning();

  return {
    createdAwards: insertedAwards.length,
    message: `Created ${insertedAwards.length} awards for campaign ${campaignTitle}`,
  };
};

/**
 * Activity to create awards for a time period
 */
export const createPeriodAwards = async (
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  periodKey: string,
  rankings: Array<{
    domainName: string;
    upvoteCount: number;
    firstSubmitDate: Date | null;
    lastUpvoteDate: Date | null;
  }>,
): Promise<{
  createdAwards: number;
  message: string;
}> => {
  _logger.info(
    { type, periodKey, rankingCount: rankings.length },
    'Creating period awards',
  );
  if (rankings.length === 0) {
    _logger.info({ type, periodKey }, 'No domains to award for period');
    return {
      createdAwards: 0,
      message: 'No domains to award',
    };
  }

  // Check if awards already exist
  const { exists } = await checkPeriodAwardsExist(type, periodKey);
  assert(!exists, `Awards already exist for ${type} period ${periodKey}`);

  // Create award reason based on period type and key
  let awardDate: string;
  switch (type) {
    case 'DAILY':
      awardDate = format(new Date(periodKey), 'MMMM do, yyyy');
      break;
    case 'WEEKLY':
      awardDate = `week for ${format(new Date(periodKey), 'MMMM do, yyyy')}`;
      break;
    case 'MONTHLY':
      awardDate = format(new Date(periodKey), 'MMMM yyyy');
      break;
    case 'YEARLY':
      awardDate = periodKey; // Just the year
      break;
    default:
      awardDate = `${type} ${periodKey}`;
  }

  // Create awards for top domains
  const awardsToInsert = rankings.map((ranking, index) => ({
    domainName: ranking.domainName as NamefiNormalizedDomain,
    type,
    campaignKey: null,
    periodKey,
    rank: index + 1,
    reason: `${ranking.domainName} was ranked #${index + 1} of ${awardDate}`,
    upvoteCount: ranking.upvoteCount,
  }));

  const insertedAwards = await db
    .insert(huntAwardsTable)
    .values(awardsToInsert)
    .returning();

  return {
    createdAwards: insertedAwards.length,
    message: `Created ${insertedAwards.length} awards for ${type} period ${periodKey}`,
  };
};

/**
 * Activity to update campaign status to AWARDED
 */
export const updateCampaignStatusToAwarded = async (
  campaignKey: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  _logger.info({ campaignKey }, 'Updating campaign status to AWARDED');
  const result = await db
    .update(huntCampaignsTable)
    .set({ status: 'AWARDED' })
    .where(eq(huntCampaignsTable.campaignKey, campaignKey))
    .returning();

  if (result.length === 0) {
    throw new Error(
      `Failed to update campaign ${campaignKey} status to AWARDED`,
    );
  }

  _logger.info({ campaignKey }, 'Campaign status updated to AWARDED');

  return {
    success: true,
    message: `Campaign ${campaignKey} status updated to AWARDED`,
  };
};

/**
 * Activity to update expired ACTIVE campaigns to ENDED status
 */
export const updateExpiredActiveCampaignsToEnded = async () => {
  _logger.info('Updating expired active campaigns to ended status');
  const now = new Date();

  const result = await db
    .update(huntCampaignsTable)
    .set({ status: 'ENDED' })
    .where(
      and(
        eq(huntCampaignsTable.status, 'ACTIVE'),
        lte(huntCampaignsTable.endDate, now),
      ),
    )
    .returning({
      campaignKey: huntCampaignsTable.campaignKey,
      title: huntCampaignsTable.title,
      endDate: huntCampaignsTable.endDate,
    });

  _logger.info(
    { updatedCount: result.length, campaigns: result },
    'Updated expired campaigns',
  );
  return {
    success: true,
    updatedCampaigns: result,
    count: result.length,
    message: `Updated ${result.length} expired campaigns from ACTIVE to ENDED`,
  };
};

/**
 * Activity to check if a campaign has already been awarded
 */
export const checkCampaignAwardedStatus = async (campaignKey: string) => {
  _logger.info({ campaignKey }, 'Checking campaign awarded status');
  const campaign = await db
    .select({ status: huntCampaignsTable.status })
    .from(huntCampaignsTable)
    .where(eq(huntCampaignsTable.campaignKey, campaignKey))
    .limit(1);

  if (!campaign[0]) {
    throw new Error(`Campaign ${campaignKey} not found`);
  }

  _logger.info(
    { campaignKey, status: campaign[0].status },
    'Campaign awarded status retrieved',
  );

  return {
    isAwarded: campaign[0].status === 'AWARDED',
    status: campaign[0].status,
  };
};

/**
 * Activity to get campaign details
 */
export const getCampaignDetails = async (campaignKey: string) => {
  _logger.info({ campaignKey }, 'Fetching campaign details');
  const campaign = await db
    .select({
      campaignKey: huntCampaignsTable.campaignKey,
      title: huntCampaignsTable.title,
      description: huntCampaignsTable.description,
      startDate: huntCampaignsTable.startDate,
      endDate: huntCampaignsTable.endDate,
      status: huntCampaignsTable.status,
    })
    .from(huntCampaignsTable)
    .where(eq(huntCampaignsTable.campaignKey, campaignKey))
    .limit(1);

  if (!campaign[0]) {
    throw new Error(`Campaign ${campaignKey} not found`);
  }

  _logger.info({ campaignKey }, 'Campaign details retrieved');

  return campaign[0];
};

/**
 * Activity to generate period key for a given date
 */
export const generatePeriodKey = async (
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  date: Date,
) => {
  _logger.info({ type, date }, 'Generating period key');
  switch (type) {
    case 'DAILY': {
      return format(date, 'yyyy-MM-dd');
    }
    case 'WEEKLY': {
      // previous Monday to Sunday
      const lastMonday = startOfWeek(date, { weekStartsOn: 1 });
      return format(lastMonday, 'yyyy-MM-dd');
    }
    case 'MONTHLY': {
      return format(date, 'yyyy-MM');
    }
    case 'YEARLY': {
      return format(date, 'yyyy');
    }
    default:
      throw new Error(`Invalid period type: ${type}`);
  }
};

/**
 * Activity to generate period key for the previous period
 */
export const generateLatestPeriodKey = async (
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
) => {
  _logger.info({ type }, 'Generating latest period key');
  const now = new Date();

  switch (type) {
    case 'DAILY': {
      const yesterday = addDays(now, -1);
      return await generatePeriodKey(type, yesterday);
    }
    case 'WEEKLY': {
      const lastWeek = addWeeks(now, -1);
      return await generatePeriodKey(type, lastWeek);
    }
    case 'MONTHLY': {
      const lastMonth = addMonths(now, -1);
      return await generatePeriodKey(type, lastMonth);
    }
    case 'YEARLY': {
      const lastYear = addYears(now, -1);
      return await generatePeriodKey(type, lastYear);
    }
    default:
      throw new Error(`Invalid period type: ${type}`);
  }
};
