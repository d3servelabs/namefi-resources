/**
 * Central registry for all Temporal schedules
 *
 * This file exports all schedules in a consistent format for easy management
 * through admin dashboards and automated tools.
 */

import type { NamefiSchedule } from './types';

// Import all schedule instances
import { updateDomainIndexSchedule } from './update-domain-index';
import { createLogger } from '#lib/logger';

// TODO: Import other schedules following the same pattern
// import { emailSubscriptionSyncSchedule } from './email-subscription-sync';
// import { nftManagementDailyReportSchedule } from './nft-management-daily-report';
// import { updateNamefiNftIndexSchedule } from './update-namefi-nft-index';
// import { generateAndUpdateDataForDomainsSchedule } from './generate-and-update-data-for-domains';
// import { campaignAwardSchedule } from './hunt/campaign-award';
// import { campaignStatusSchedule } from './hunt/campaign-status';
// import { periodAwardSchedule } from './hunt/period-award';

const logger = createLogger({ name: 'schedules' });

/**
 * Registry of all schedules in the system
 * Key is the schedule ID, value is the schedule instance
 */
export const SCHEDULE_REGISTRY: Record<string, NamefiSchedule<any>> = {
  [updateDomainIndexSchedule.config.scheduleId]: updateDomainIndexSchedule,
  // TODO: Add other schedules as they are updated to follow the new pattern
};

/**
 * Get all schedule instances
 */
export function getAllSchedules(): NamefiSchedule<any>[] {
  return Object.values(SCHEDULE_REGISTRY);
}

/**
 * Get schedule by ID
 */
export function getScheduleById(
  scheduleId: string,
): NamefiSchedule<any> | undefined {
  return SCHEDULE_REGISTRY[scheduleId];
}

/**
 * Get schedules by category
 */
export function getSchedulesByCategory(
  category: string,
): NamefiSchedule<any>[] {
  return getAllSchedules().filter(
    (schedule) => schedule.config.category === category,
  );
}

/**
 * Get schedules by owner
 */
export function getSchedulesByOwner(owner: string): NamefiSchedule<any>[] {
  return getAllSchedules().filter(
    (schedule) => schedule.config.owner === owner,
  );
}

/**
 * Submit all schedules (useful for initial setup)
 */
export async function submitAllSchedules(): Promise<void> {
  const schedules = getAllSchedules();
  const results = await Promise.allSettled(
    schedules.map((schedule) => schedule.submit()),
  );

  const failures = results
    .map((result, index) => ({ result, schedule: schedules[index] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failures.length > 0) {
    logger.error(`Failed to submit ${failures.length} schedules:`);
    failures.forEach(({ result, schedule }) => {
      logger.error(
        `- ${schedule.config.scheduleId}: ${
          (result as PromiseRejectedResult).reason
        }`,
      );
    });
    throw new Error(
      `Failed to submit ${failures.length} out of ${schedules.length} schedules`,
    );
  }

  logger.info(`Successfully submitted ${schedules.length} schedules`);
}

/**
 * Get status of all schedules
 */
export async function getAllScheduleStatuses() {
  const schedules = getAllSchedules();
  const results = await Promise.allSettled(
    schedules.map(async (schedule) => ({
      scheduleId: schedule.config.scheduleId,
      status: await schedule.getStatus(),
    })),
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      scheduleId: schedules[index].config.scheduleId,
      error: result.reason.message || 'Unknown error',
    };
  });
}

// Export individual schedules for backward compatibility and direct access
export { updateDomainIndexSchedule };

// Export legacy functions (these should be updated over time to use the new pattern)
export {
  submitScheduleForUpdateDomainIndex,
  triggerUpdateDomainIndex,
  deleteScheduleForUpdateDomainIndex,
} from './update-domain-index';

// TODO: Export other legacy functions as schedules are updated
// export {
//   submitScheduleForEmailSubscriptionSync,
//   triggerEmailSubscriptionSync,
//   deleteScheduleForEmailSubscriptionSync,
// } from './email-subscription-sync';

// Export types for use in admin interfaces
export type { NamefiSchedule, ScheduleConfig, ScheduleStatus } from './types';
