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
  name: 'Namefi Feed X Ingestion',
  description: 'Scans X for public domain sale posts and processes listings.',
  groupId: 'namefi-feed',
  cronExpressions: ['0 0,12 * * *'],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'indexer',
  args: [{ trigger: 'scheduled', sources: ['x'] }],
};

export const namefiFeedIngestionSchedule = new NamefiFeedIngestionSchedule(
  config,
);

const nameprosConfig: ScheduleConfig<typeof namefiFeedIngestionWorkflow> = {
  scheduleId: 'namefi-feed-namepros-ingestion-schedule',
  workflowId: 'namefi-feed-namepros-ingestion',
  name: 'Namefi Feed NamePros Ingestion',
  description:
    'Scans NamePros marketplace RSS feeds for public domain sale posts and processes listings.',
  groupId: 'namefi-feed',
  cronExpressions: ['*/10 * * * *'],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'indexer',
  args: [{ trigger: 'scheduled', sources: ['namepros'] }],
};

export const namefiFeedNameprosIngestionSchedule =
  new NamefiFeedIngestionSchedule(nameprosConfig);

const dnforumConfig: ScheduleConfig<typeof namefiFeedIngestionWorkflow> = {
  scheduleId: 'namefi-feed-dnforum-ingestion-schedule',
  workflowId: 'namefi-feed-dnforum-ingestion',
  name: 'Namefi Feed DNForum Ingestion',
  description:
    'Scans DNForum marketplace RSS feeds for public domain sale posts and processes listings.',
  groupId: 'namefi-feed',
  cronExpressions: ['*/15 * * * *'],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'indexer',
  args: [{ trigger: 'scheduled', sources: ['dnforum'] }],
};

export const namefiFeedDnforumIngestionSchedule =
  new NamefiFeedIngestionSchedule(dnforumConfig);

export async function submitScheduleForNamefiFeedIngestion() {
  return await namefiFeedIngestionSchedule.submit();
}

export async function triggerNamefiFeedIngestionSchedule() {
  return await namefiFeedIngestionSchedule.trigger();
}

export async function deleteScheduleForNamefiFeedIngestion() {
  return await namefiFeedIngestionSchedule.delete();
}

export async function submitScheduleForNamefiFeedNameprosIngestion() {
  return await namefiFeedNameprosIngestionSchedule.submit();
}

export async function triggerNamefiFeedNameprosIngestionSchedule() {
  return await namefiFeedNameprosIngestionSchedule.trigger();
}

export async function deleteScheduleForNamefiFeedNameprosIngestion() {
  return await namefiFeedNameprosIngestionSchedule.delete();
}

export async function submitScheduleForNamefiFeedDnforumIngestion() {
  return await namefiFeedDnforumIngestionSchedule.submit();
}

export async function triggerNamefiFeedDnforumIngestionSchedule() {
  return await namefiFeedDnforumIngestionSchedule.trigger();
}

export async function deleteScheduleForNamefiFeedDnforumIngestion() {
  return await namefiFeedDnforumIngestionSchedule.delete();
}
