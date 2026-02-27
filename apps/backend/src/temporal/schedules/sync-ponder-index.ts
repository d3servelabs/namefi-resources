/**
 * Schedule for Ponder Index Sync workflow
 * Syncs on-chain data from a remote Ponder indexer every 5 minutes.
 * Only active when PONDER_INDEXER_URL is configured.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { syncPonderIndexWorkflow } from '../workflows/sync-ponder-index.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const SyncPonderIndexSchedule = BaseSchedule.forWorkflowType(
  syncPonderIndexWorkflow,
);

const config: ScheduleConfig<typeof syncPonderIndexWorkflow> = {
  scheduleId: 'sync-ponder-index-schedule',
  workflowId: 'sync-ponder-index',
  name: 'Ponder Index Sync',
  description:
    'Syncs on-chain NFT data from a remote Ponder indexer to local tables for dev/local environments',
  groupId: 'ponder-sync',
  cronExpressions: ['*/5 * * * *'], // every 5 minutes
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  workflowExecutionTimeout: '15m',
  workflowRunTimeout: '15m',
  catchupWindow: '10m',
  pauseOnFailure: false,
  owner: 'system',
  category: 'indexer',
};

// Create the schedule instance
export const syncPonderIndexSchedule = new SyncPonderIndexSchedule(config);

// Export functions for manual control
export const submitScheduleForSyncPonderIndex = () =>
  syncPonderIndexSchedule.submit();
export const triggerSyncPonderIndex = () => syncPonderIndexSchedule.trigger();
export const deleteScheduleForSyncPonderIndex = () =>
  syncPonderIndexSchedule.delete();
