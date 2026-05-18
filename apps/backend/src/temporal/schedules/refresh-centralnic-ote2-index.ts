import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { refreshCentralnicOte2IndexWorkflow } from '../workflows/refresh-centralnic-ote2-index.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const RefreshCentralnicOte2IndexSchedule = BaseSchedule.forWorkflowType(
  refreshCentralnicOte2IndexWorkflow,
);

const config: ScheduleConfig<typeof refreshCentralnicOte2IndexWorkflow> = {
  scheduleId: 'refresh-centralnic-ote2-index-schedule',
  workflowId: 'refresh-centralnic-ote2-index',
  name: 'CentralNic OTE2 Index Refresh',
  description:
    'Verifies that every domain in the CentralNic OTE2 keyv index still exists in the registrar account, and removes those that no longer do. Non-production only.',
  groupId: 'domain-indexing',
  cronExpressions: ['0 * * * *'],
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  workflowExecutionTimeout: '15m',
  workflowRunTimeout: '15m',
  catchupWindow: '10m',
  pauseOnFailure: false,
  owner: 'system',
  category: 'indexer',
  nonProductionOnly: true,
};

export const refreshCentralnicOte2IndexSchedule =
  new RefreshCentralnicOte2IndexSchedule(config);

export const submitScheduleForRefreshCentralnicOte2Index = () =>
  refreshCentralnicOte2IndexSchedule.submit();
export const triggerRefreshCentralnicOte2Index = () =>
  refreshCentralnicOte2IndexSchedule.trigger();
export const deleteScheduleForRefreshCentralnicOte2Index = () =>
  refreshCentralnicOte2IndexSchedule.delete();
