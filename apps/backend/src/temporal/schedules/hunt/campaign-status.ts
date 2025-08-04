import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../../client';
import { TEMPORAL_QUEUES } from '../../shared';
import { campaignStatusWorkflow } from '../../workflows/hunt/campaign-status.workflow';

const WORKFLOW_ID = 'campaign-status';
const SCHEDULE_ID = 'campaign-status-schedule';
const workflowType = campaignStatusWorkflow;

/**
 * Submit the schedule for the campaign status workflow
 * Runs every 15 minutes to check for campaigns that need status updates
 */
export const submitScheduleForCampaignStatus = async () => {
  const schedule = await temporalClient.schedule.create({
    scheduleId: SCHEDULE_ID,
    spec: {
      cronExpressions: ['*/15 * * * *'], // every 15 minutes
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.HUNT,
      workflowId: WORKFLOW_ID,
      args: [], // No specific input, process all expired campaigns
    },
  });
  console.log('Campaign status schedule created', schedule);
};
