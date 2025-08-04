import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../../client';
import { TEMPORAL_QUEUES } from '../../shared';
import { campaignAwardWorkflow } from '../../workflows/hunt/campaign-award.workflow';

const WORKFLOW_ID = 'campaign-award';
const SCHEDULE_ID = 'campaign-award-schedule';
const workflowType = campaignAwardWorkflow;

/**
 * Submit the schedule for the campaign award workflow
 * Runs every hour to check for campaigns that need to be awarded
 */
export const submitScheduleForCampaignAward = async () => {
  const schedule = await temporalClient.schedule.create({
    scheduleId: SCHEDULE_ID,
    spec: {
      cronExpressions: ['5 * * * *'], // every hour at minute 5
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.HUNT,
      workflowId: WORKFLOW_ID,
      args: [{}], // No specific campaign, process all ended campaigns
    },
  });
  console.log('Campaign award schedule created', schedule);
};
