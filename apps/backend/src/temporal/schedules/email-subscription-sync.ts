/**
 * Schedule for Email Subscription Sync workflow
 * Regularly syncs users to the email service based on their opt-in preferences
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { syncUsersToEmailSubscriptionWorkflow } from '../workflows/email-subscription-sync.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const EmailSubscriptionSyncSchedule = BaseSchedule.forWorkflowType(
  syncUsersToEmailSubscriptionWorkflow,
);

const config: ScheduleConfig<typeof syncUsersToEmailSubscriptionWorkflow> = {
  scheduleId: 'email-subscription-sync-schedule',
  workflowId: 'email-subscription-sync',
  name: 'Email Subscription Sync',
  description:
    'Regularly syncs users to the email service based on their opt-in preferences',
  cronExpressions: ['0 8,20 * * *'], // every day at 8 AM and 8 PM
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Critical for debouncing
  owner: 'platform',
  category: 'notification',
};

export const emailSubscriptionSyncSchedule = new EmailSubscriptionSyncSchedule(
  config,
);

// Legacy functions for backward compatibility
export async function submitScheduleForEmailSubscriptionSync() {
  return await emailSubscriptionSyncSchedule.submit();
}

export async function triggerEmailSubscriptionSync() {
  return await emailSubscriptionSyncSchedule.trigger();
}

export async function deleteScheduleForEmailSubscriptionSync() {
  return await emailSubscriptionSyncSchedule.delete();
}
