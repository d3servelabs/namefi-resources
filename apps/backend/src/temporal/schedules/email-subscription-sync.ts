/**
 * This file contains the schedule for the email subscription sync workflow.
 * It is used to regularly sync users to the email service based on their opt-in preferences.
 */
import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../client';
import { TEMPORAL_QUEUES } from '../shared';
import { syncUsersToEmailSubscriptionWorkflow } from '../workflows/email-subscription-sync.workflow';

const WORKFLOW_ID = 'email-subscription-sync';
const workflowType = syncUsersToEmailSubscriptionWorkflow;

/**
 * Submit the schedule for the email subscription sync workflow
 */
export async function submitScheduleForEmailSubscriptionSync() {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'email-subscription-sync-schedule',
    spec: {
      cronExpressions: ['0 8,20 * * *'], // every day at 8 AM and 8 PM
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Critical for debouncing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.INDEXERS,
      workflowId: WORKFLOW_ID, // Unique identifier
    },
  });
  console.log('Email subscription sync schedule created', schedule);
}

/**
 * Trigger the schedule manually
 */
export async function triggerEmailSubscriptionSync() {
  const handle = temporalClient.schedule.getHandle(
    'email-subscription-sync-schedule',
  );
  await handle.trigger(ScheduleOverlapPolicy.BUFFER_ONE);
}

/**
 * Delete the schedule
 */
export async function deleteScheduleForEmailSubscriptionSync() {
  const schedule = await temporalClient.schedule.getHandle(
    'email-subscription-sync-schedule',
  );
  await schedule.delete();
}
