/**
 * This file contains the schedule for the generate and update data for domains workflow.
 * It runs a combined workflow that:
 * 1. Adds categories to domains with no categories
 * 2. Processes domains with AI analysis
 * 3. Updates marketplace data for dirty domains
 */
import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../client';
import { TEMPORAL_QUEUES } from '../shared';
import { generateAndUpdateDataForDomainsWorkflow } from '../workflows/generate-and-update-data-for-domains.workflow';

const WORKFLOW_ID = 'generate-and-update-data-for-domains';
const workflowType = generateAndUpdateDataForDomainsWorkflow;

/**
 * Submit the schedule for the generate and update data for domains workflow
 */
export async function submitScheduleForGenerateAndUpdateDataForDomains() {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'generate-and-update-data-for-domains-schedule',
    spec: {
      cronExpressions: ['0 * * * *'], // every hour at minute 0
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Critical for debouncing - prevents overlapping runs
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.INDEXERS,
      workflowId: WORKFLOW_ID, // Unique identifier
      args: [{}],
    },
  });
  console.log(
    'Generate and update data for domains schedule created',
    schedule,
  );
}

/**
 * Trigger the schedule manually
 */
export async function triggerGenerateAndUpdateDataForDomains() {
  const handle = temporalClient.schedule.getHandle(
    'generate-and-update-data-for-domains-schedule',
  );
  await handle.trigger(ScheduleOverlapPolicy.BUFFER_ONE);
}

/**
 * Delete the schedule
 */
export async function deleteScheduleForGenerateAndUpdateDataForDomains() {
  const schedule = await temporalClient.schedule.getHandle(
    'generate-and-update-data-for-domains-schedule',
  );
  await schedule.delete();
}

/**
 * Pause the schedule
 */
export async function pauseScheduleForGenerateAndUpdateDataForDomains() {
  const handle = temporalClient.schedule.getHandle(
    'generate-and-update-data-for-domains-schedule',
  );
  await handle.pause();
}

/**
 * Resume the schedule
 */
export async function resumeScheduleForGenerateAndUpdateDataForDomains() {
  const handle = temporalClient.schedule.getHandle(
    'generate-and-update-data-for-domains-schedule',
  );
  return handle.unpause();
}
