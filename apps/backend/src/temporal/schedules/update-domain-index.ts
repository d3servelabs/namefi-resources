/**
 * This file contains the schedule for the domain index update workflow.
 * It is used to update the domain index by fetching all domains from registrars
 * and inserting them into the database.
 */
import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../client';
import { TEMPORAL_QUEUES } from '../shared';
import { updateDomainIndexWorkflow } from '../workflows/update-domain-index.workflow';

const WORKFLOW_ID = 'update-domain-index';
const workflowType = updateDomainIndexWorkflow;

/**
 * Submit the schedule for the domain index update workflow
 */
export async function submitScheduleForUpdateDomainIndex() {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'update-domain-index-schedule',
    spec: {
      cronExpressions: ['0 * * * *'], // every hour at minute 0
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
  console.log('Schedule created', schedule);
}

/**
 * Trigger the schedule manually
 */
export async function triggerUpdateDomainIndex() {
  const handle = temporalClient.schedule.getHandle(
    'update-domain-index-schedule',
  );
  await handle.trigger(ScheduleOverlapPolicy.BUFFER_ONE);
}

/**
 * Delete the schedule
 */
export async function deleteScheduleForUpdateDomainIndex() {
  const schedule = await temporalClient.schedule.getHandle(
    'update-domain-index-schedule',
  );
  await schedule.delete();
}
