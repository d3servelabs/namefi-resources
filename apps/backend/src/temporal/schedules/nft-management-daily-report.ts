/**
 * Schedule for NFT Management Daily Report workflow
 * Runs daily at 14:00 UTC providing comprehensive insights into NFT health,
 * critical issues, and system status
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { nftManagementDailyReportWorkflow } from '../workflows/nft-management-daily-report.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const NftManagementDailyReportSchedule = BaseSchedule.forWorkflowType(
  nftManagementDailyReportWorkflow,
);

const config: ScheduleConfig<typeof nftManagementDailyReportWorkflow> = {
  scheduleId: 'nft-management-daily-report-schedule',
  workflowId: 'nft-management-daily-report',
  name: 'NFT Management Daily Report',
  description:
    'Daily NFT management report providing insights into NFT health and critical issues',
  cronExpressions: ['0 14 * * *'], // Run daily at 14:00 UTC (2:00 PM UTC)
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Skip if previous execution is still running
  args: [{ forceSend: false }], // Only send if there are issues
  workflowExecutionTimeout: '30m',
  workflowRunTimeout: '30m',
  catchupWindow: '1h', // Catch up if missed (useful for system downtime)
  pauseOnFailure: false,
  owner: 'system',
  category: 'reporting',
};

export const nftManagementDailyReportSchedule =
  new NftManagementDailyReportSchedule(config);
// Legacy functions for backward compatibility
export async function submitScheduleForNftManagementDailyReport() {
  return await nftManagementDailyReportSchedule.submit();
}

export async function triggerNftManagementDailyReport() {
  return await nftManagementDailyReportSchedule.trigger();
}

export async function updateNftManagementDailyReportSchedule(
  newCronExpression?: string,
) {
  const updates: Partial<
    ScheduleConfig<typeof nftManagementDailyReportWorkflow>
  > = {};
  if (newCronExpression) {
    updates.cronExpressions = [newCronExpression];
  }
  return await nftManagementDailyReportSchedule.update(updates);
}

export async function pauseNftManagementDailyReportSchedule(reason?: string) {
  return await nftManagementDailyReportSchedule.pause(reason);
}

export async function unpauseNftManagementDailyReportSchedule(reason?: string) {
  return await nftManagementDailyReportSchedule.unpause(reason);
}

export async function getNftManagementDailyReportScheduleStatus() {
  return await nftManagementDailyReportSchedule.getStatus();
}

export async function deleteNftManagementDailyReportSchedule() {
  return await nftManagementDailyReportSchedule.delete();
}
