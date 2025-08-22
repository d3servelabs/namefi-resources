/**
 * Schedule for Campaign Status workflow
 * Runs every 15 minutes to check for campaigns that need status updates
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from '../base-schedule';
import { campaignStatusWorkflow } from '../../workflows/hunt/campaign-status.workflow';
import type { ScheduleConfig } from '../types';
import { TEMPORAL_QUEUES } from '../../shared';

const CampaignStatusSchedule = BaseSchedule.forWorkflowType(
  campaignStatusWorkflow,
);

const config: ScheduleConfig<typeof campaignStatusWorkflow> = {
  scheduleId: 'campaign-status-schedule',
  workflowId: 'campaign-status',
  name: 'Campaign Status',
  description: 'Checks for campaigns that need status updates every 15 minutes',
  groupId: 'hunt-campaigns',
  cronExpressions: ['*/15 * * * *'], // every 15 minutes
  taskQueue: TEMPORAL_QUEUES.HUNT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
  args: [], // No specific input, process all expired campaigns
  owner: 'hunt-team',
  category: 'hunt',
};

export const campaignStatusSchedule = new CampaignStatusSchedule(config);

// Legacy functions for backward compatibility
export const submitScheduleForCampaignStatus = async () => {
  return await campaignStatusSchedule.submit();
};
