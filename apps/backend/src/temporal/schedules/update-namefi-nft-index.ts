/**
 * Schedule for Update Namefi NFT Index workflow
 * Updates the NFT index every 5 minutes to keep track of minted domains
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { updateNamefiNftIndexWorkflow } from '../workflows/update-nft-index.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const UpdateNamefiNftIndexSchedule = BaseSchedule.forWorkflowType(
  updateNamefiNftIndexWorkflow,
);

const config: ScheduleConfig<typeof updateNamefiNftIndexWorkflow> = {
  scheduleId: 'update-namefi-nft-index-schedule',
  workflowId: 'update-namefi-nft-index',
  name: 'Update Namefi NFT Index',
  description:
    'Updates the NFT index every 5 minutes to keep track of minted domains',
  cronExpressions: ['*/5 * * * *'], // every 5 minutes
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Critical for debouncing
  owner: 'nft-team',
  category: 'indexer',
};

export const updateNamefiNftIndexSchedule = new UpdateNamefiNftIndexSchedule(
  config,
);

// Legacy functions for backward compatibility
export async function submitScheduleForUpdateNamefiNftIndex() {
  return await updateNamefiNftIndexSchedule.submit();
}

export async function triggerUpdateNamefiNftIndex() {
  return await updateNamefiNftIndexSchedule.trigger();
}

export async function deleteScheduleForUpdateNamefiNftIndex() {
  return await updateNamefiNftIndexSchedule.delete();
}
