/**
 * Central registry for all Temporal schedules
 *
 * This file exports all schedules in a consistent format for easy management
 * through admin dashboards and automated tools.
 */

import type { NamefiSchedule, ScheduleGroup } from './types';

// Import all schedule instances
import { updateDomainIndexSchedule } from './update-domain-index';

import { createLogger } from '#lib/logger';

import { emailSubscriptionSyncSchedule } from './email-subscription-sync';
import { nftManagementDailyReportSchedule } from './nft-management-daily-report';
import { updateNamefiNftIndexSchedule } from './update-namefi-nft-index';
import { generateAndUpdateDataForDomainsSchedule } from './generate-and-update-data-for-domains';
import { campaignAwardSchedule } from './hunt/campaign-award';
import { campaignStatusSchedule } from './hunt/campaign-status';
import {
  dailyAwardSchedule,
  weeklyAwardSchedule,
  monthlyAwardSchedule,
  yearlyAwardSchedule,
} from './hunt/period-award';
import { zeroXCityPromo2025Schedule } from './campaigns/0xcity-promo-2025';

const logger = createLogger({ name: 'schedules' });

/**
 * Registry of schedule groups for organizing related schedules
 * Key is the group ID, value is the group configuration
 */
export const SCHEDULE_GROUP_REGISTRY: Record<string, ScheduleGroup> = {
  'domain-indexing': {
    groupId: 'domain-indexing',
    name: 'Domain Indexing',
    description:
      'Schedules that index and update domain data from various sources',
    category: 'indexer',
    priority: 1,
  },
  'nft-indexing': {
    groupId: 'nft-indexing',
    name: 'NFT Indexing',
    description: 'Schedules that track and index NFT-related domain data',
    category: 'indexer',
    priority: 2,
  },
  'data-processing': {
    groupId: 'data-processing',
    name: 'Data Processing',
    description:
      'Schedules that enhance domains with AI analysis and categorization',
    category: 'indexer',
    priority: 3,
  },
  'hunt-campaigns': {
    groupId: 'hunt-campaigns',
    name: 'Hunt Campaigns',
    description: 'Schedules that manage campaign status and awards',
    category: 'hunt',
    priority: 1,
  },
  'period-awards': {
    groupId: 'period-awards',
    name: 'Period Awards',
    description: 'Schedules that award top domains for different time periods',
    category: 'hunt',
    priority: 2,
  },
  'user-notifications': {
    groupId: 'user-notifications',
    name: 'User Notifications',
    description: 'Schedules that sync user preferences and send notifications',
    category: 'notification',
    priority: 1,
  },
  'system-reports': {
    groupId: 'system-reports',
    name: 'System Reports',
    description: 'Schedules that generate system health and monitoring reports',
    category: 'reporting',
    priority: 1,
  },
};

/**
 * Registry of all schedules in the system
 * Key is the schedule ID, value is the schedule instance
 */
export const SCHEDULE_REGISTRY: Record<string, NamefiSchedule<any>> = {
  [updateDomainIndexSchedule.config.scheduleId]: updateDomainIndexSchedule,
  [emailSubscriptionSyncSchedule.config.scheduleId]:
    emailSubscriptionSyncSchedule,
  [nftManagementDailyReportSchedule.config.scheduleId]:
    nftManagementDailyReportSchedule,
  [updateNamefiNftIndexSchedule.config.scheduleId]:
    updateNamefiNftIndexSchedule,
  [generateAndUpdateDataForDomainsSchedule.config.scheduleId]:
    generateAndUpdateDataForDomainsSchedule,
  [campaignAwardSchedule.config.scheduleId]: campaignAwardSchedule,
  [campaignStatusSchedule.config.scheduleId]: campaignStatusSchedule,
  [dailyAwardSchedule.config.scheduleId]: dailyAwardSchedule,
  [weeklyAwardSchedule.config.scheduleId]: weeklyAwardSchedule,
  [monthlyAwardSchedule.config.scheduleId]: monthlyAwardSchedule,
  [yearlyAwardSchedule.config.scheduleId]: yearlyAwardSchedule,
  [zeroXCityPromo2025Schedule.config.scheduleId]: zeroXCityPromo2025Schedule,
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
 * Get schedule group by ID, with fallback to a default group
 */
export function getScheduleGroup(groupId: string | undefined): ScheduleGroup {
  if (!groupId || !SCHEDULE_GROUP_REGISTRY[groupId]) {
    return {
      groupId: 'ungrouped',
      name: 'Other Schedules',
      description: 'Individual schedules not part of a specific group',
      category: 'maintenance',
      priority: 999,
    };
  }

  return SCHEDULE_GROUP_REGISTRY[groupId];
}

/**
 * Get all schedule groups, sorted by priority
 */
export function getAllRegisteredScheduleGroups(): ScheduleGroup[] {
  const groups = Object.values(SCHEDULE_GROUP_REGISTRY);
  return groups.sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Get schedules by group ID
 */
export function getSchedulesByGroup(groupId?: string): NamefiSchedule<any>[] {
  return getAllSchedules().filter(
    (schedule) => schedule.config.groupId === groupId,
  );
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
export { emailSubscriptionSyncSchedule };
export { nftManagementDailyReportSchedule };
export { updateNamefiNftIndexSchedule };
export { generateAndUpdateDataForDomainsSchedule };
export { campaignAwardSchedule };
export { campaignStatusSchedule };
export {
  dailyAwardSchedule,
  weeklyAwardSchedule,
  monthlyAwardSchedule,
  yearlyAwardSchedule,
};

// Export legacy functions for backward compatibility
export {
  submitScheduleForUpdateDomainIndex,
  triggerUpdateDomainIndex,
  deleteScheduleForUpdateDomainIndex,
} from './update-domain-index';

export {
  submitScheduleForEmailSubscriptionSync,
  triggerEmailSubscriptionSync,
  deleteScheduleForEmailSubscriptionSync,
} from './email-subscription-sync';

export {
  submitScheduleForNftManagementDailyReport,
  triggerNftManagementDailyReport,
  updateNftManagementDailyReportSchedule,
  pauseNftManagementDailyReportSchedule,
  unpauseNftManagementDailyReportSchedule,
  getNftManagementDailyReportScheduleStatus,
  deleteNftManagementDailyReportSchedule,
} from './nft-management-daily-report';

export {
  submitScheduleForUpdateNamefiNftIndex,
  triggerUpdateNamefiNftIndex,
  deleteScheduleForUpdateNamefiNftIndex,
} from './update-namefi-nft-index';

export {
  submitScheduleForGenerateAndUpdateDataForDomains,
  triggerGenerateAndUpdateDataForDomains,
  deleteScheduleForGenerateAndUpdateDataForDomains,
  pauseScheduleForGenerateAndUpdateDataForDomains,
  resumeScheduleForGenerateAndUpdateDataForDomains,
} from './generate-and-update-data-for-domains';

export { submitScheduleForCampaignAward } from './hunt/campaign-award';

export { submitScheduleForCampaignStatus } from './hunt/campaign-status';

export {
  submitScheduleForDailyAward,
  submitScheduleForWeeklyAward,
  submitScheduleForMonthlyAward,
  submitScheduleForYearlyAward,
  submitAllPeriodAwardSchedules,
} from './hunt/period-award';

// Export types for use in admin interfaces
export type {
  NamefiSchedule,
  ScheduleConfig,
  ScheduleStatus,
  ScheduleGroup,
} from './types';
