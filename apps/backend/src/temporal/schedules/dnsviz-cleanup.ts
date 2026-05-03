/**
 * Schedule for the DNSViz Cleanup workflow.
 *
 * Runs daily at 06:00 UTC — well after the digest workflow has had time to
 * land (and well clear of its 12h max). Purges expired `dnsviz_analyses`
 * rows so DB growth is bounded by `retentionDays`.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { dnsvizCleanupWorkflow } from '../workflows/dnsviz-cleanup.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const DnsvizCleanupSchedule = BaseSchedule.forWorkflowType(
  dnsvizCleanupWorkflow,
);

const config: ScheduleConfig<typeof dnsvizCleanupWorkflow> = {
  scheduleId: 'dnsviz-cleanup-schedule',
  workflowId: 'dnsviz-cleanup',
  name: 'DNSViz Cleanup',
  description:
    'Daily purge of expired dnsviz_analyses rows (anything past `expires_at`).',
  groupId: 'domain-maintenance',
  cronExpressions: ['0 6 * * *'], // 06:00 UTC daily
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{ batchSize: 1000 }],
  workflowExecutionTimeout: '30m',
  workflowRunTimeout: '30m',
  catchupWindow: '1h',
  pauseOnFailure: false,
  owner: 'system',
  category: 'maintenance',
};

export const dnsvizCleanupSchedule = new DnsvizCleanupSchedule(config);

export async function submitScheduleForDnsvizCleanup() {
  return await dnsvizCleanupSchedule.submit();
}

export async function triggerDnsvizCleanup() {
  return await dnsvizCleanupSchedule.trigger();
}

export async function pauseDnsvizCleanupSchedule(reason?: string) {
  return await dnsvizCleanupSchedule.pause(reason);
}

export async function unpauseDnsvizCleanupSchedule(reason?: string) {
  return await dnsvizCleanupSchedule.unpause(reason);
}

export async function getDnsvizCleanupScheduleStatus() {
  return await dnsvizCleanupSchedule.getStatus();
}

export async function deleteDnsvizCleanupSchedule() {
  return await dnsvizCleanupSchedule.delete();
}
