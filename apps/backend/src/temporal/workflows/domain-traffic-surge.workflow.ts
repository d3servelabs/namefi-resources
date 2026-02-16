import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import pMap from 'p-map';
import { getWeeklyPeriodStartUtc } from './email-campaign-period';

export type WeeklyDomainTrafficSurgeWorkflowInput = {
  dryRun?: boolean;
  userIdFilter?: string[];
  periodStartOverride?: string;
};

export type WeeklyDomainTrafficSurgeWorkflowResult = {
  periodStart: string;
  totalEligible: number;
  sent: number;
  skipped: number;
  failed: number;
  dryRunCount: number;
  dryRun: boolean;
};

const { getDomainTrafficSurgeCandidates, sendDomainTrafficSurgeEmail } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '10 minutes',
    },
  });

export async function weeklyDomainTrafficSurgeWorkflow(
  input: WeeklyDomainTrafficSurgeWorkflowInput = {},
): Promise<WeeklyDomainTrafficSurgeWorkflowResult> {
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

  workflow.log.info('Starting weekly domain traffic surge workflow', {
    periodStart: periodStart.toISOString(),
    dryRun,
  });

  const candidates = await getDomainTrafficSurgeCandidates({
    periodStart,
    userIdFilter,
    asOf: now.toISOString(),
  });

  const results = await pMap(
    candidates,
    async (candidate) => {
      try {
        const result = await sendDomainTrafficSurgeEmail({
          userId: candidate.userId,
          periodStart,
          dryRun,
          domains: candidate.domains,
        });
        return { userId: candidate.userId, result };
      } catch (error) {
        return {
          userId: candidate.userId,
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
    totalEligible: candidates.length,
    dryRun,
    ...summary,
  };
}
