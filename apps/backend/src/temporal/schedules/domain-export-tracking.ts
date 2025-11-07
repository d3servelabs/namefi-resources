import { ScheduleOverlapPolicy } from '@temporalio/client';
import { TEMPORAL_QUEUES } from '../shared/enums';
import { domainExportTrackingWorkflow } from '../workflows/domain-export-tracking.workflow';
import { BaseSchedule } from './base-schedule';
import type { ScheduleConfig } from './types';

/**
 * Schedule for tracking domain export status
 * Runs every 6 hours to monitor locked NFTs and track transfer progress
 */
const DomainExportTrackingSchedule = BaseSchedule.forWorkflowType(
  domainExportTrackingWorkflow,
);

const config: ScheduleConfig<typeof domainExportTrackingWorkflow> = {
  scheduleId: 'domain-export-tracking-schedule',
  workflowId: 'domain-export-tracking',
  name: 'Domain Export Tracking',
  description:
    'Tracks domain export status every 6 hours to monitor locked NFTs and track transfer progress',
  groupId: 'domain-export-tracking',
  cronExpressions: ['0 */6 * * *'],
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'system',
  category: 'indexer',
};

export const domainExportTrackingSchedule = new DomainExportTrackingSchedule(
  config,
);
