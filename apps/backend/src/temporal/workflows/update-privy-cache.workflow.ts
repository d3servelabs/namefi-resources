/**
 * Temporal workflow for updating the Privy users cache
 * This workflow refreshes the unlogged Privy users table used for fast user lookups
 */

import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { differenceInMilliseconds } from 'date-fns/differenceInMilliseconds';

// Privy cache activities with appropriate timeouts
const { refreshPrivyUsersCache, getPrivyCacheStatus } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '5m', // Allow time for fetching all Privy users
  },
});

export type UpdatePrivyCacheWorkflowInput = {
  /**
   * Whether to force refresh even if cache is still fresh
   * @default false
   */
  forceRefresh?: boolean;

  /**
   * Minimum time in milliseconds that must pass since last refresh
   * @default 900000 (15 minutes)
   */
  minTimeSinceLastRefreshMs?: number;
};

export type UpdatePrivyCacheWorkflowOutput = {
  refreshed: boolean;
  lastRefresh: Date | null;
  expiresAt: Date | null;
  recordCount: number;
  skippedReason?: string;
  error?: string;
  executionTimeMs: number;
};

/**
 * Workflow to update the Privy users cache
 * This will check if the cache needs refresh and update it if necessary
 */
export async function updatePrivyCacheWorkflow({
  forceRefresh = false,
  minTimeSinceLastRefreshMs = 15 * 60 * 1000, // 15 minutes default
}: UpdatePrivyCacheWorkflowInput = {}): Promise<UpdatePrivyCacheWorkflowOutput> {
  const startTime = Date.now();

  workflow.log.info('Starting Privy cache update workflow', {
    forceRefresh,
    minTimeSinceLastRefreshMs,
  });

  try {
    // Step 1: Check current cache status
    const status = await getPrivyCacheStatus();

    workflow.log.info('Current Privy cache status', {
      exists: status.exists,
      lastRefresh: status.lastRefresh,
      expiresAt: status.expiresAt,
      recordCount: status.recordCount,
    });

    // Step 2: Determine if refresh is needed
    const now = new Date();
    const timeSinceLastRefresh = status.lastRefresh
      ? differenceInMilliseconds(now, status.lastRefresh)
      : Number.POSITIVE_INFINITY;

    const needsRefresh =
      forceRefresh ||
      !status.exists ||
      !status.lastRefresh ||
      timeSinceLastRefresh > minTimeSinceLastRefreshMs;

    if (!needsRefresh) {
      workflow.log.info('Privy cache is still fresh, skipping refresh', {
        timeSinceLastRefresh,
        minTimeSinceLastRefreshMs,
      });

      return {
        refreshed: false,
        lastRefresh: status.lastRefresh,
        expiresAt: status.expiresAt,
        recordCount: status.recordCount,
        skippedReason: `Cache is still fresh (last refresh: ${Math.floor(timeSinceLastRefresh / 1000 / 60)} minutes ago)`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Step 3: Perform the refresh
    workflow.log.info('Refreshing Privy cache', {
      reason: forceRefresh
        ? 'Force refresh requested'
        : 'Cache expired or missing',
    });

    const refreshResult = await refreshPrivyUsersCache();

    if (!refreshResult.success) {
      workflow.log.warn('Privy cache refresh failed', {
        error: refreshResult.error,
      });

      // If another process is refreshing, that's OK - get the current status
      if (refreshResult.error === 'Another refresh in progress') {
        const currentStatus = await getPrivyCacheStatus();
        return {
          refreshed: false,
          lastRefresh: currentStatus.lastRefresh || new Date(0),
          expiresAt: currentStatus.expiresAt || new Date(0),
          recordCount: currentStatus.recordCount,
          skippedReason: 'Another refresh was already in progress',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Actual error
      return {
        refreshed: false,
        lastRefresh: status.lastRefresh || new Date(0),
        expiresAt: status.expiresAt || new Date(0),
        recordCount: status.recordCount,
        error: refreshResult.error,
        executionTimeMs: Date.now() - startTime,
      };
    }

    workflow.log.info('Privy cache refresh completed successfully', {
      recordsUpdated: refreshResult.recordsUpdated,
      expiresAt: refreshResult.expiresAt,
    });

    return {
      refreshed: true,
      lastRefresh: refreshResult.lastRefresh,
      expiresAt: refreshResult.expiresAt,
      recordCount: refreshResult.recordsUpdated,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    workflow.log.error('Unexpected error in Privy cache update workflow', {
      error,
    });

    // Try to get current status as fallback
    try {
      const fallbackStatus = await getPrivyCacheStatus();
      return {
        refreshed: false,
        lastRefresh: fallbackStatus.lastRefresh || new Date(0),
        expiresAt: fallbackStatus.expiresAt || new Date(0),
        recordCount: fallbackStatus.recordCount,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      };
    } catch {
      // Complete failure
      return {
        refreshed: false,
        lastRefresh: new Date(0),
        expiresAt: new Date(0),
        recordCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}

/**
 * Generate a unique workflow ID for the update Privy cache workflow
 */
updatePrivyCacheWorkflow.generateId = (
  input?: UpdatePrivyCacheWorkflowInput,
) => {
  const suffix = input?.forceRefresh ? 'force' : 'scheduled';
  return `update-privy-cache-${suffix}-${Date.now()}`;
};
