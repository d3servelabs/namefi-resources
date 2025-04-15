import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../client';
import { TEMPORAL_QUEUES } from '../shared';
import { updateNamefiNftIndexWorkflow } from '../workflows/update-nft-index.workflow';

const WORKFLOW_ID = 'update-namefi-nft-index';
const workflowType = updateNamefiNftIndexWorkflow;

/**
 * Submit the schedule for the NFT index update workflow
 */
export async function submitScheduleForUpdateNamefiNftIndex() {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'update-namefi-nft-index-schedule',
    spec: {
      cronExpressions: ['*/5 * * * *'], // every 5 minutes
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Critical for debouncing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      workflowId: WORKFLOW_ID, // Unique identifier
    },
  });
  console.log('Schedule created', schedule);
}
