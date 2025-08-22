/**
 * Schedule for Generate and Update Data for Domains workflow
 * Runs a combined workflow that:
 * 1. Adds categories to domains with no categories
 * 2. Processes domains with AI analysis
 * 3. Updates marketplace data for dirty domains
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { generateAndUpdateDataForDomainsWorkflow } from '../workflows/generate-and-update-data-for-domains.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const GenerateAndUpdateDataForDomainsSchedule = BaseSchedule.forWorkflowType(
  generateAndUpdateDataForDomainsWorkflow,
);

const config: ScheduleConfig<typeof generateAndUpdateDataForDomainsWorkflow> = {
  scheduleId: 'generate-and-update-data-for-domains-schedule',
  workflowId: 'generate-and-update-data-for-domains',
  name: 'Generate and Update Data for Domains',
  description:
    'Combines category assignment, AI analysis, and marketplace data updates for domains',
  cronExpressions: ['0 * * * *'], // every hour at minute 0
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Critical for debouncing - prevents overlapping runs
  args: [{}],
  owner: 'data-team',
  category: 'indexer',
};

export const generateAndUpdateDataForDomainsSchedule =
  new GenerateAndUpdateDataForDomainsSchedule(config);

// Legacy functions for backward compatibility
export async function submitScheduleForGenerateAndUpdateDataForDomains() {
  return await generateAndUpdateDataForDomainsSchedule.submit();
}

export async function triggerGenerateAndUpdateDataForDomains() {
  return await generateAndUpdateDataForDomainsSchedule.trigger();
}

export async function deleteScheduleForGenerateAndUpdateDataForDomains() {
  return await generateAndUpdateDataForDomainsSchedule.delete();
}

export async function pauseScheduleForGenerateAndUpdateDataForDomains() {
  return await generateAndUpdateDataForDomainsSchedule.pause();
}

export async function resumeScheduleForGenerateAndUpdateDataForDomains() {
  return await generateAndUpdateDataForDomainsSchedule.unpause();
}
