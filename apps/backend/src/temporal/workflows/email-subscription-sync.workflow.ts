import * as workflow from '@temporalio/workflow';
import { longRunningOpts } from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

/**
 * Temporal workflow for syncing users to email subscription service
 *
 * This workflow provides:
 * - Connection validation
 * - Bulk user sync with progress monitoring
 * - Error handling and reporting
 * - Support for opt-in/opt-out preferences
 */
export async function syncUsersToEmailSubscriptionWorkflow(): Promise<{
  success: boolean;
  totalUsers: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  report: {
    timestamp: string;
    successRate: number;
  };
}> {
  // Get reference to activities
  const {
    testListmonkConnectionActivity,
    fetchAndEnrichPrivyUsersActivity,
    syncUsersToListmonkActivity,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...longRunningOpts,
    },
  });

  try {
    workflow.log.info('Starting Listmonk user sync workflow...');

    // Step 1: Test connection to Listmonk
    workflow.log.info('Testing connection to Listmonk...');
    const connected = await testListmonkConnectionActivity();

    if (!connected) {
      const errorMsg =
        'Failed to connect to Listmonk. Check your configuration.';
      workflow.log.error(errorMsg);

      return {
        success: false,
        totalUsers: 0,
        successCount: 0,
        errorCount: 0,
        errors: [errorMsg],
        report: {
          timestamp: new Date().toISOString(),
          successRate: 0,
        },
      };
    }

    workflow.log.info('Successfully connected to Listmonk');

    // Step 2: Fetch and enrich users
    workflow.log.info('Fetching and enriching users...');
    const enrichedUsers = await fetchAndEnrichPrivyUsersActivity();

    workflow.log.info(`Fetched ${enrichedUsers.length} users from Privy`);

    if (enrichedUsers.length === 0) {
      workflow.log.info('No users found to sync');
      return {
        success: true,
        totalUsers: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
        report: {
          timestamp: new Date().toISOString(),
          successRate: 100,
        },
      };
    }

    // Step 3: Sync users to Listmonk
    workflow.log.info('Syncing users to Listmonk...');
    const syncResult = await syncUsersToListmonkActivity(enrichedUsers);

    const successRate =
      enrichedUsers.length > 0
        ? (syncResult.successCount / enrichedUsers.length) * 100
        : 100;

    workflow.log.info('Listmonk user sync workflow completed', {
      totalUsers: enrichedUsers.length,
      successCount: syncResult.successCount,
      errorCount: syncResult.errorCount,
      successRate,
    });

    return {
      success: syncResult.errorCount === 0,
      totalUsers: enrichedUsers.length,
      successCount: syncResult.successCount,
      errorCount: syncResult.errorCount,
      errors: [], // Individual errors are already logged in the activity
      report: {
        timestamp: new Date().toISOString(),
        successRate,
      },
    };
  } catch (error: any) {
    const errorMsg = `Listmonk sync workflow execution failed: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`;
    workflow.log.error(errorMsg, error);

    return {
      success: false,
      totalUsers: 0,
      successCount: 0,
      errorCount: 0,
      errors: [errorMsg],
      report: {
        timestamp: new Date().toISOString(),
        successRate: 0,
      },
    };
  }
}
