import { getTags } from '@namefi/cat';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  parseISO,
  isValid,
} from 'date-fns';
import { gte, type SQL, sql } from 'drizzle-orm';
import type { TrendingDomainTimeRange } from './schema';

/**
 * Create time range filter SQL condition based on time range
 */
export const createTimeRangeFilter = (
  timeRange: TrendingDomainTimeRange,
  dateColumn: SQL.Aliased<Date>,
): SQL => {
  // Precompute timestamps to allow index usage
  const now = new Date();

  switch (timeRange) {
    case 'TODAY': {
      return gte(dateColumn, startOfDay(now));
    }
    case 'THIS_WEEK': {
      return gte(dateColumn, startOfWeek(now, { weekStartsOn: 1 }));
    }
    case 'THIS_MONTH': {
      return gte(dateColumn, startOfMonth(now));
    }
    case 'THIS_YEAR': {
      return gte(dateColumn, startOfYear(now));
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
export const addTagsToItems = <
  T extends { domainName: NamefiNormalizedDomain },
>(
  items: T[],
): (T & { tags: Array<{ id: string }> })[] => {
  return items.map((item) => ({
    ...item,
    tags: getTags(item.domainName),
  }));
};

/**
 * Create a Map from domain stats for efficient lookup
 */
export const createStatsMap = (
  domainStats: { domainName: string; upvoteCount: number }[],
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

export const parseAndValidateCampaignDates = ({
  startDate,
  endDate,
  campaign,
}: {
  startDate?: string;
  endDate?: string;
  campaign: { startDate: Date; endDate: Date };
}) => {
  // Validate dates if provided
  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate !== undefined) {
    const parsed = parseISO(startDate);
    if (!isValid(parsed)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid date format for startDate',
      });
    }
    start = parsed;
  }
  if (endDate !== undefined) {
    const parsed = parseISO(endDate);
    if (!isValid(parsed)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid date format for endDate',
      });
    }
    end = parsed;
  }

  // If both dates are provided, validate that start is before end
  if (start && end && start >= end) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Start date must be before end date',
    });
  }

  // If only one date is provided, validate against existing date
  if (start && !end && start >= campaign.endDate) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Start date must be before existing end date',
    });
  }
  if (end && !start && campaign.startDate >= end) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'End date must be after existing start date',
    });
  }

  return { start, end };
};

/**
 * Create an object with only defined values, excluding undefined properties
 * Useful for building update payloads where fields are optional
 */
export const removeUndefinedProperties = <T extends Record<string, unknown>>(
  obj: T,
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  ) as Partial<T>;
};
