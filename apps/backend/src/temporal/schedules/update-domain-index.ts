/**
 * Schedule for Domain Index Update workflow
 * Updates the domain index by fetching all domains from registrars hourly
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { updateDomainIndexWorkflow } from '../workflows/update-domain-index.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const UpdateDomainIndexSchedule = BaseSchedule.forWorkflowType(
  updateDomainIndexWorkflow,
);

const config: ScheduleConfig<typeof updateDomainIndexWorkflow> = {
  scheduleId: 'update-domain-index-schedule',
  workflowId: 'update-domain-index',
  name: 'Domain Index Update',
  description:
    'Updates the domain index by fetching all domains from registrars and inserting them into the database',
  groupId: 'domain-indexing',
  cronExpressions: ['0 * * * *'], // every hour at minute 0
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  workflowExecutionTimeout: '30m',
  workflowRunTimeout: '30m',
  catchupWindow: '1h',
  pauseOnFailure: false,
  owner: 'system',
  category: 'indexer',
};

// Create the schedule instance
export const updateDomainIndexSchedule = new UpdateDomainIndexSchedule(config);

// Export legacy functions for backward compatibility
export const submitScheduleForUpdateDomainIndex = () =>
  updateDomainIndexSchedule.submit();
export const triggerUpdateDomainIndex = () =>
  updateDomainIndexSchedule.trigger();
export const deleteScheduleForUpdateDomainIndex = () =>
  updateDomainIndexSchedule.delete();
