import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import {
  campaignAwardWorkflow,
  campaignStatusWorkflow,
  periodAwardWorkflow,
} from '../../temporal/workflows';
import type { HuntPeriodAwardType } from './schema';

/**
 * Health check endpoint that returns the status of award schedules.
 * Returns schedule statuses for monitoring purposes.
 */
export const getAwardSchedulesHealth = async () => {
  const scheduleIds = [
    'weekly-award-schedule',
    'monthly-award-schedule',
    'campaign-award-schedule',
    'campaign-status-schedule',
  ];

  const schedules = await Promise.all(
    scheduleIds.map(async (scheduleId) => {
      try {
        const handle = temporalClient.schedule.getHandle(scheduleId);
        const description = await handle.describe();
        return {
          id: scheduleId,
          state: description.state,
          info: description.info,
        };
      } catch (error) {
        return {
          id: scheduleId,
          state: 'NOT_FOUND',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  const unhealthySchedules = schedules.filter((s) => s.error);
  const message =
    unhealthySchedules.length === 0
      ? 'all award schedules active'
      : `${schedules.length - unhealthySchedules.length}/${schedules.length} schedules active`;

  return {
    message,
    schedules,
    status: unhealthySchedules.length === 0 ? 'healthy' : 'unhealthy',
  };
};

/**
 * Trigger period award workflow.
 * Starts a workflow to process awards for a specific time period.
 */
export const triggerPeriodAward = async ({
  type,
  date,
}: {
  type: HuntPeriodAwardType;
  date?: string;
}) => {
  const handle = await temporalClient.workflow.start(periodAwardWorkflow, {
    taskQueue: TEMPORAL_QUEUES.HUNT,
    workflowId: `period-award-${type}-${date || 'latest'}-${Date.now()}`,
    args: [{ type, date }],
  });

  return {
    message: `Period award triggered for ${type}${date ? ` period ${date}` : ''}`,
    workflowId: handle.workflowId,
  };
};

/**
 * Trigger campaign award workflow.
 * Starts a workflow to process awards for a specific campaign.
 */
export const triggerCampaignAward = async (campaignKey: string) => {
  const handle = await temporalClient.workflow.start(campaignAwardWorkflow, {
    taskQueue: TEMPORAL_QUEUES.HUNT,
    workflowId: `campaign-award-${campaignKey}-${Date.now()}`,
    args: [{ campaignKey }],
  });

  return {
    message: `Campaign award triggered for ${campaignKey}`,
    workflowId: handle.workflowId,
  };
};

/**
 * Trigger campaign status workflow.
 * Starts a workflow to update expired ACTIVE campaigns to ENDED status.
 */
export const triggerCampaignStatus = async () => {
  const handle = await temporalClient.workflow.start(campaignStatusWorkflow, {
    taskQueue: TEMPORAL_QUEUES.HUNT,
    workflowId: `campaign-status-${Date.now()}`,
    args: [],
  });

  return {
    message: 'Campaign status workflow triggered',
    workflowId: handle.workflowId,
  };
};
