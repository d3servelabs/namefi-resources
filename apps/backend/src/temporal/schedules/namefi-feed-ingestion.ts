import { ScheduleOverlapPolicy } from '@temporalio/client';
import { TEMPORAL_QUEUES } from '../shared';
import { namefiFeedIngestionWorkflow } from '../workflows/namefi-feed-ingestion.workflow';
import { BaseSchedule } from './base-schedule';
import type { ScheduleConfig } from './types';

const NamefiFeedIngestionSchedule = BaseSchedule.forWorkflowType(
  namefiFeedIngestionWorkflow,
);

const config: ScheduleConfig<typeof namefiFeedIngestionWorkflow> = {
  scheduleId: 'namefi-feed-ingestion-schedule',
  workflowId: 'namefi-feed-ingestion',
  name: 'Namefi Feed Ingestion',
  description:
    'Scans X for public domain sale posts and processes feed listings.',
  groupId: 'namefi-feed',
  cronExpressions: ['0 0,12 * * *'],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'indexer',
  args: [{ trigger: 'scheduled' }],
};

export const namefiFeedIngestionSchedule = new NamefiFeedIngestionSchedule(
  config,
);

export async function submitScheduleForNamefiFeedIngestion() {
  return await namefiFeedIngestionSchedule.submit();
}

export async function triggerNamefiFeedIngestionSchedule() {
  return await namefiFeedIngestionSchedule.trigger();
}

export async function deleteScheduleForNamefiFeedIngestion() {
  return await namefiFeedIngestionSchedule.delete();
}
