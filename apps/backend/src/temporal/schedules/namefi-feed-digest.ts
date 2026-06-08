import { ScheduleOverlapPolicy } from '@temporalio/client';
import { TEMPORAL_QUEUES } from '../shared';
import { namefiFeedSalesDigestWorkflow } from '../workflows/namefi-feed-digest.workflow';
import { BaseSchedule } from './base-schedule';
import type { ScheduleConfig } from './types';

const NamefiFeedDigestSchedule = BaseSchedule.forWorkflowType(
  namefiFeedSalesDigestWorkflow,
);

const config: ScheduleConfig<typeof namefiFeedSalesDigestWorkflow> = {
  scheduleId: 'namefi-feed-digest-schedule',
  workflowId: 'namefi-feed-digest',
  name: 'Namefi Feed Digest',
  description:
    'Generates and publishes the daily Namefi Feed sales digest with media.',
  groupId: 'namefi-feed',
  cronExpressions: ['30 12 * * *'],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'reporting',
  args: [
    {
      trigger: 'scheduled',
      includeImage: true,
      includeAnimation: true,
      enabledOnly: true,
    },
  ],
};

export const namefiFeedDigestSchedule = new NamefiFeedDigestSchedule(config);

export async function submitScheduleForNamefiFeedDigest() {
  return await namefiFeedDigestSchedule.submit();
}

export async function triggerNamefiFeedDigestSchedule() {
  return await namefiFeedDigestSchedule.trigger();
}

export async function deleteScheduleForNamefiFeedDigest() {
  return await namefiFeedDigestSchedule.delete();
}
