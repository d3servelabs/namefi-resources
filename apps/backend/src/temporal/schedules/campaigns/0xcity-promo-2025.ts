/**
 * Schedules for Period Award workflow
 * Awards top domains for different time periods (daily, weekly, monthly, yearly)
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from '../base-schedule';
import type { ScheduleConfig } from '../types';
import { TEMPORAL_QUEUES } from '../../shared';
import { autoGrantClaimsWorkflow } from '#temporal/workflows/auto-grant-claims.workflow';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const AutoGrantClaimsSchedule = BaseSchedule.forWorkflowType(
  autoGrantClaimsWorkflow,
);

// Daily Award Schedule
const zeroXCityPromo2025ScheduleConfig: ScheduleConfig<
  typeof autoGrantClaimsWorkflow
> = {
  scheduleId: '0xcity-promo-2025-schedule',
  workflowId: '0xcity-promo-2025',
  name: '0xCity Promo 2025',
  description: '0xCity Promo 2025',
  groupId: 'campaigns',
  cronExpressions: ['0 13 * * *'], // every day at 13:00 UTC
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [
    {
      campaignKey: '0xcity-promo-2025',
      parentDomain: '0xcity.com' as NamefiNormalizedDomain,
      sources: ['UPVOTE', 'SHARE'],
      sharingTargetDomain: '0xcity.com' as NamefiNormalizedDomain,
      notifyUsers: true,
      expirationDate: new Date('2025-09-01T14:00:00.000Z'),
    },
  ],
  owner: 'hunt-team',
  category: 'hunt',
};

export const zeroXCityPromo2025Schedule = new AutoGrantClaimsSchedule(
  zeroXCityPromo2025ScheduleConfig,
);
