/**
 * Schedule for Campaign Award workflow
 * Runs every hour to check for campaigns that need to be awarded
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from '../base-schedule';
import { campaignAwardWorkflow } from '../../workflows/hunt/campaign-award.workflow';
import type { ScheduleConfig } from '../types';
import { TEMPORAL_QUEUES } from '../../shared';

const CampaignAwardSchedule = BaseSchedule.forWorkflowType(
  campaignAwardWorkflow,
);

const config: ScheduleConfig<typeof campaignAwardWorkflow> = {
  scheduleId: 'campaign-award-schedule',
  workflowId: 'campaign-award',
  name: 'Campaign Award',
  description: 'Checks for campaigns that need to be awarded every hour',
  cronExpressions: ['5 * * * *'], // every hour at minute 5
  taskQueue: TEMPORAL_QUEUES.HUNT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
  args: [{}], // No specific campaign, process all ended campaigns
  owner: 'hunt-team',
  category: 'hunt',
};

export const campaignAwardSchedule = new CampaignAwardSchedule(config);

// Legacy functions for backward compatibility
export const submitScheduleForCampaignAward = async () => {
  return await campaignAwardSchedule.submit();
};
