/**
 * Monthly schedule for dream domain win-back emails
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';
import { monthlyDreamDomainAwaitsWorkflow } from '../workflows/dream-domain-awaits.workflow';

const DreamDomainAwaitsSchedule = BaseSchedule.forWorkflowType(
  monthlyDreamDomainAwaitsWorkflow,
);

const config: ScheduleConfig<typeof monthlyDreamDomainAwaitsWorkflow> = {
  scheduleId: 'dream-domain-awaits-schedule',
  workflowId: 'dream-domain-awaits',
  name: 'Dream Domain Awaits',
  description:
    'Monthly win-back email for users without cart items or recent purchases',
  groupId: 'user-notifications',
  cronExpressions: [
    // First day of the month at 16:00 UTC
    '0 16 1 * *',
  ],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'notification',
};

export const dreamDomainAwaitsSchedule = new DreamDomainAwaitsSchedule(config);

export async function submitScheduleForDreamDomainAwaits() {
  return await dreamDomainAwaitsSchedule.submit();
}

export async function triggerDreamDomainAwaitsSchedule() {
  return await dreamDomainAwaitsSchedule.trigger();
}

export async function deleteScheduleForDreamDomainAwaits() {
  return await dreamDomainAwaitsSchedule.delete();
}
