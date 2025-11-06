/**
 * Schedule for Export & Expiration Daily Report workflow
 * Runs daily at 15:00 UTC providing insights into domains being exported
 * and domains that have expired and are ready to burn
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { exportExpirationDailyReportWorkflow } from '../workflows/export-expiration-daily-report.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const ExportExpirationDailyReportSchedule = BaseSchedule.forWorkflowType(
  exportExpirationDailyReportWorkflow,
);

const config: ScheduleConfig<typeof exportExpirationDailyReportWorkflow> = {
  scheduleId: 'export-expiration-daily-report-schedule',
  workflowId: 'export-expiration-daily-report',
  name: 'Export & Expiration Daily Report',
  description:
    'Daily report on domains being exported/transferred out and expired domains ready to burn',
  groupId: 'system-reports',
  cronExpressions: ['0 15 * * *'], // Run daily at 15:00 UTC (3:00 PM UTC)
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Skip if previous execution is still running
  args: [{ forceSend: false }], // Only send if there are domains to report
  workflowExecutionTimeout: '30m',
  workflowRunTimeout: '30m',
  catchupWindow: '1h', // Catch up if missed (useful for system downtime)
  pauseOnFailure: false,
  owner: 'system',
  category: 'reporting',
};

export const exportExpirationDailyReportSchedule =
  new ExportExpirationDailyReportSchedule(config);

// Legacy functions for backward compatibility
export async function submitScheduleForExportExpirationDailyReport() {
  return await exportExpirationDailyReportSchedule.submit();
}

export async function triggerExportExpirationDailyReport() {
  return await exportExpirationDailyReportSchedule.trigger();
}

export async function updateExportExpirationDailyReportSchedule(
  newCronExpression?: string,
) {
  const updates: Partial<
    ScheduleConfig<typeof exportExpirationDailyReportWorkflow>
  > = {};
  if (newCronExpression) {
    updates.cronExpressions = [newCronExpression];
  }
  return await exportExpirationDailyReportSchedule.update(updates);
}

export async function pauseExportExpirationDailyReportSchedule(
  reason?: string,
) {
  return await exportExpirationDailyReportSchedule.pause(reason);
}

export async function unpauseExportExpirationDailyReportSchedule(
  reason?: string,
) {
  return await exportExpirationDailyReportSchedule.unpause(reason);
}

export async function getExportExpirationDailyReportScheduleStatus() {
  return await exportExpirationDailyReportSchedule.getStatus();
}

export async function deleteExportExpirationDailyReportSchedule() {
  return await exportExpirationDailyReportSchedule.delete();
}
