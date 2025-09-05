import { z } from 'zod';

// System user ID for automated operations
export const NAMEFI_TEAM_USER_ID = 'NameFi_Team'; // NameFi_Team system user

// Trending domain time range enum
export const trendingDomainTimeRangeEnum = z.enum([
  'TODAY',
  'THIS_WEEK',
  'THIS_MONTH',
  'THIS_YEAR',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'ANYTIME',
]);
export type TrendingDomainTimeRange =
  (typeof trendingDomainTimeRangeEnum.options)[number];

// Hunt period award type enum
export const huntPeriodAwardTypeEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
]);
export type HuntPeriodAwardType =
  (typeof huntPeriodAwardTypeEnum.options)[number];

// User upvote status
export interface UserUpvoteStatus {
  hasUpvoted: boolean;
  upvotedAt: Date | null;
}
