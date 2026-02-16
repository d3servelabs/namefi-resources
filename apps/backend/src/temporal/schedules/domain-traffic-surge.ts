/**
 * Weekly schedule for domain traffic surge emails
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';
import { weeklyDomainTrafficSurgeWorkflow } from '../workflows/domain-traffic-surge.workflow';

const DomainTrafficSurgeSchedule = BaseSchedule.forWorkflowType(
  weeklyDomainTrafficSurgeWorkflow,
);

const config: ScheduleConfig<typeof weeklyDomainTrafficSurgeWorkflow> = {
  scheduleId: 'domain-traffic-surge-schedule',
  workflowId: 'domain-traffic-surge',
  name: 'Traffic Surge',
  description:
    'Weekly email for users whose Namefi-managed domains exceeded traffic threshold',
  groupId: 'user-notifications',
  cronExpressions: [
    // Every Tuesday at 16:00 UTC
    '0 16 * * 2',
  ],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'notification',
};

export const domainTrafficSurgeSchedule = new DomainTrafficSurgeSchedule(
  config,
);

export async function submitScheduleForDomainTrafficSurge() {
  return await domainTrafficSurgeSchedule.submit();
}

export async function triggerDomainTrafficSurgeSchedule() {
  return await domainTrafficSurgeSchedule.trigger();
}

export async function deleteDomainTrafficSurgeSchedule() {
  return await domainTrafficSurgeSchedule.delete();
}
