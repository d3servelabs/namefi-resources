/**
 * Schedule for Privy Cache Update workflow
 * Updates the Privy users cache every 6 hours
 */

import {
  ScheduleNotFoundError,
  ScheduleOverlapPolicy,
} from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { updatePrivyCacheWorkflow } from '../workflows/update-privy-cache.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';
import { resolve } from '@namefi-astra/utils';

const UpdatePrivyCacheSchedule = BaseSchedule.forWorkflowType(
  updatePrivyCacheWorkflow,
);

const config: ScheduleConfig<typeof updatePrivyCacheWorkflow> = {
  scheduleId: 'update-privy-cache-schedule',
  workflowId: 'update-privy-cache',
  name: 'Privy Cache Update',
  description:
    'Updates the Privy users cache by fetching all users from Privy and storing them in an unlogged table for fast lookups',
  groupId: 'user-indexing',
  cronExpressions: ['0 */6 * * *'], // every 6 hours at minute 0
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  workflowExecutionTimeout: '10m',
  workflowRunTimeout: '10m',
  catchupWindow: '1h',
  pauseOnFailure: false,
  owner: 'system',
  category: 'indexer',
};

// Create the schedule instance
export const updatePrivyCacheSchedule = new UpdatePrivyCacheSchedule(config);

// Export convenience functions
export const submitScheduleForUpdatePrivyCache = () =>
  updatePrivyCacheSchedule.submit();

export const triggerUpdatePrivyCache = async (forceRefresh = false) => {
  const [error, scheduleStatus] = await resolve(
    updatePrivyCacheSchedule.getStatus(),
  );
  // If we need to pass custom arguments, start the workflow directly instead of triggering the schedule

  if (error instanceof ScheduleNotFoundError || scheduleStatus?.paused) {
    if (forceRefresh) {
      const { temporalClient } = await import('../client');
      const input: Parameters<typeof updatePrivyCacheWorkflow>[0] = {
        forceRefresh: true,
      };
      await temporalClient.workflow.start(updatePrivyCacheWorkflow, {
        workflowId: updatePrivyCacheWorkflow.generateId(input),
        taskQueue: config.taskQueue,
        args: [input],
      });
    }

    return;
  }
  // For regular triggers without custom args, use the schedule
  await updatePrivyCacheSchedule.trigger();
};

export const deleteScheduleForUpdatePrivyCache = () =>
  updatePrivyCacheSchedule.delete();
