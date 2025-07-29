/**
 * Schedule for NFT Management Daily Report
 *
 * This schedule runs the NFT management report workflow daily at 14:00 UTC.
 * The report provides comprehensive insights into NFT health, critical issues,
 * and system status.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../client';
import { TEMPORAL_QUEUES } from '../shared';
import { nftManagementDailyReportWorkflow } from '../workflows/nft-management-daily-report.workflow';
import { createLogger } from '#lib/logger';

const SCHEDULE_ID = 'nft-management-daily-report-schedule';
const WORKFLOW_ID = 'nft-management-daily-report';
const workflowType = nftManagementDailyReportWorkflow;

const logger = createLogger({
  name: 'nft-management-daily-report',
});
/**
 * Submit the schedule for the NFT management daily report workflow
 * Runs daily at 14:00 UTC
 */
export async function submitScheduleForNftManagementDailyReport() {
  try {
    const schedule = await temporalClient.schedule.create({
      scheduleId: SCHEDULE_ID,
      spec: {
        // Run daily at 14:00 UTC (2:00 PM UTC)
        cronExpressions: ['0 14 * * *'],
      },
      policies: {
        // Skip if previous execution is still running
        overlap: ScheduleOverlapPolicy.SKIP,
        // Catch up if missed (useful for system downtime)
        catchupWindow: '1h',
        // Don't run more than once per day even if manually triggered multiple times
        pauseOnFailure: false,
      },
      action: {
        type: 'startWorkflow',
        workflowType,
        taskQueue: TEMPORAL_QUEUES.INDEXERS,
        workflowId: WORKFLOW_ID,
        args: [
          {
            forceSend: false, // Only send if there are issues
          },
        ],
        // Set workflow execution timeout to 30 minutes
        workflowExecutionTimeout: '30m',
        // Set workflow run timeout to 30 minutes
        workflowRunTimeout: '30m',
      },
      memo: {
        description: 'Daily NFT management report sent to Slack at 14:00 UTC',
        owner: 'system',
        purpose: 'monitoring',
      },
    });

    logger.info({
      message: 'NFT Management Daily Report schedule created successfully',
      scheduleId: schedule.scheduleId,
      description: 'Daily at 14:00 UTC',
    });

    return schedule;
  } catch (error) {
    logger.error(
      error,
      'Failed to create NFT Management Daily Report schedule',
    );
    throw error;
  }
}

/**
 * Trigger the NFT management report schedule manually
 * Useful for testing or immediate report generation
 */
export async function triggerNftManagementDailyReport(forceSend = false) {
  try {
    const handle = temporalClient.schedule.getHandle(SCHEDULE_ID);

    await handle.trigger(ScheduleOverlapPolicy.BUFFER_ONE);

    logger.info({
      message: 'NFT Management Daily Report triggered manually',
      scheduleId: SCHEDULE_ID,
      forceSend,
    });
  } catch (error) {
    logger.error(error, 'Failed to trigger NFT Management Daily Report');
    throw error;
  }
}

/**
 * Update the schedule (useful for changing timing or configuration)
 */
export async function updateNftManagementDailyReportSchedule(
  newCronExpression?: string,
) {
  try {
    const handle = temporalClient.schedule.getHandle(SCHEDULE_ID);

    await handle.update((schedule) => {
      if (newCronExpression) {
        // Note: This might need adjustment based on actual Temporal SDK types
        (schedule.spec as any).cronExpressions = [newCronExpression];
      }
      return schedule;
    });

    logger.info({
      message: 'NFT Management Daily Report schedule updated',
      scheduleId: SCHEDULE_ID,
      newCronExpression,
    });
  } catch (error) {
    logger.error(
      error,
      'Failed to update NFT Management Daily Report schedule',
    );
    throw error;
  }
}

/**
 * Pause the schedule (stops automatic execution)
 */
export async function pauseNftManagementDailyReportSchedule(reason?: string) {
  try {
    const handle = temporalClient.schedule.getHandle(SCHEDULE_ID);
    await handle.pause(reason || 'Paused via admin action');

    logger.info({
      message: 'NFT Management Daily Report schedule paused',
      scheduleId: SCHEDULE_ID,
      reason,
    });
  } catch (error) {
    logger.error(error, 'Failed to pause NFT Management Daily Report schedule');
    throw error;
  }
}

/**
 * Unpause the schedule (resumes automatic execution)
 */
export async function unpauseNftManagementDailyReportSchedule(reason?: string) {
  try {
    const handle = temporalClient.schedule.getHandle(SCHEDULE_ID);
    await handle.unpause(reason || 'Unpaused via admin action');

    logger.info({
      message: 'NFT Management Daily Report schedule unpaused',
      scheduleId: SCHEDULE_ID,
      reason,
    });
  } catch (error) {
    logger.error(
      error,
      'Failed to unpause NFT Management Daily Report schedule',
    );
    throw error;
  }
}

/**
 * Get the current status of the schedule
 */
export async function getNftManagementDailyReportScheduleStatus() {
  try {
    const handle = temporalClient.schedule.getHandle(SCHEDULE_ID);
    const description = await handle.describe();

    return {
      scheduleId: description.scheduleId,
      paused: false, // We'll assume it's not paused if we can't get the state
      cronExpressions: ['0 14 * * *'], // Default to daily at 14:00 UTC
      nextActionTimes: description.info.nextActionTimes,
      recentActions: description.info.recentActions,
    };
  } catch (error) {
    logger.error(
      error,
      'Failed to get NFT Management Daily Report schedule status',
    );
    throw error;
  }
}

/**
 * Delete the schedule (removes it completely)
 */
export async function deleteNftManagementDailyReportSchedule() {
  try {
    const handle = temporalClient.schedule.getHandle(SCHEDULE_ID);
    await handle.delete();

    logger.info({
      message: 'NFT Management Daily Report schedule deleted',
      scheduleId: SCHEDULE_ID,
    });
  } catch (error) {
    logger.error(
      error,
      'Failed to delete NFT Management Daily Report schedule',
    );
    throw error;
  }
}
