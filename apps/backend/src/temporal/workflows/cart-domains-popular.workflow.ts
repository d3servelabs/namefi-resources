import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import pMap from 'p-map';
import { getWeeklyPeriodStartUtc } from './email-campaign-period';

export type WeeklyCartDomainsPopularWorkflowInput = {
  dryRun?: boolean;
  userIdFilter?: string[];
  periodStartOverride?: string;
};

export type WeeklyCartDomainsPopularWorkflowResult = {
  periodStart: string;
  totalEligible: number;
  sent: number;
  skipped: number;
  failed: number;
  dryRunCount: number;
  dryRun: boolean;
};

const { getCartDomainsPopularEligibleUserIds, sendCartDomainsPopularEmail } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '10 minutes',
    },
  });

export async function weeklyCartDomainsPopularWorkflow(
  input: WeeklyCartDomainsPopularWorkflowInput = {},
): Promise<WeeklyCartDomainsPopularWorkflowResult> {
  const { dryRun = false, userIdFilter, periodStartOverride } = input;
  const now = new Date();
  const periodStart = periodStartOverride
    ? new Date(periodStartOverride)
    : getWeeklyPeriodStartUtc(now);
  if (Number.isNaN(periodStart.getTime())) {
    throw new Error(
      `Invalid periodStartOverride: ${periodStartOverride ?? 'undefined'}`,
    );
  }

  workflow.log.info('Starting weekly cart domains popular workflow', {
    periodStart: periodStart.toISOString(),
    dryRun,
  });

  const eligibleUserIds = await getCartDomainsPopularEligibleUserIds({
    periodStart,
    userIdFilter,
  });

  const results = await pMap(
    eligibleUserIds,
    async (userId) => {
      try {
        const result = await sendCartDomainsPopularEmail({
          userId,
          periodStart,
          dryRun,
        });
        return { userId, result };
      } catch (error) {
        return {
          userId,
          result: {
            status: 'FAILED',
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
        } as const;
      }
    },
    { concurrency: 10 },
  );

  const summary = results.reduce(
    (acc, { result }) => {
      if (result.status === 'SENT') acc.sent += 1;
      if (result.status === 'SKIPPED') acc.skipped += 1;
      if (result.status === 'FAILED') acc.failed += 1;
      if (result.status === 'DRY_RUN') acc.dryRunCount += 1;
      return acc;
    },
    { sent: 0, skipped: 0, failed: 0, dryRunCount: 0 },
  );

  return {
    periodStart: periodStart.toISOString(),
    totalEligible: eligibleUserIds.length,
    dryRun,
    ...summary,
  };
}
