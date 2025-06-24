import * as workflow from '@temporalio/workflow';
import { map, splitEvery } from 'ramda';
import {
  longRunningOpts,
  shortRunningOpts,
} from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

/**
 * Temporal workflow for migrating users from MongoDB to PostgreSQL with Privy integration
 *
 * This workflow provides:
 * - Safe execution with retry logic
 * - Prerequisites validation
 * - Progress monitoring
 * - Error handling and reporting
 * - Batch processing capabilities using child workflows
 */
export async function migrateUsersBatchWorkflow(options?: {
  validatePrerequisites?: boolean;
  batchSize?: number;
}): Promise<{
  success: boolean;
  totalUsers: number;
  successfulMigrations: number;
  failedMigrations: number;
  errors: string[];
  report: {
    timestamp: string;
    successRate: number;
    estimatedCompletionTime?: string;
  };
}> {
  // Get reference to activities
  const {
    validateMigrationPrerequisitesActivity: validatePrerequisitesShort,
    generateMigrationReportActivity: generateMigrationReport,
    getMongoUsersActivity: getMongoUsers,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...longRunningOpts,
    },
  });

  try {
    // Step 1: Validate prerequisites (optional)
    if (options?.validatePrerequisites !== false) {
      workflow.log.info('Validating migration prerequisites...');

      const prerequisites = await validatePrerequisitesShort();

      if (!prerequisites.success) {
        const errorMsg = `Migration prerequisites validation failed: ${prerequisites.errors.join(', ')}`;
        workflow.log.error(errorMsg);

        return {
          success: false,
          totalUsers: 0,
          successfulMigrations: 0,
          failedMigrations: 0,
          errors: [errorMsg],
          report: {
            timestamp: new Date().toISOString(),
            successRate: 0,
          },
        };
      }

      workflow.log.info('Migration prerequisites validated successfully');
    }

    // Step 2: Get all users from MongoDB
    const mongoUsers = await getMongoUsers();
    workflow.log.info(`Found ${mongoUsers.length} users to migrate`);

    // Step 3: Execute migrations using child workflows
    const batchSize = options?.batchSize || 10;

    const results: Array<{
      walletAddress: string;
      success: boolean;
      userId?: string;
      privyUserId?: string;
      error?: string;
    }> = [];

    let successfulMigrations = 0;
    let failedMigrations = 0;
    const errors: string[] = [];

    // Process users in batches using child workflows with Ramda
    const batches = splitEvery(batchSize, mongoUsers as string[]);

    const processBatch = async (batch: string[], batchIndex: number) => {
      workflow.log.info(
        `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} users`,
      );

      const batchPromises = map(async (walletAddress: string) => {
        try {
          const result = await workflow.startChild(migrateSingleUserWorkflow, {
            args: [walletAddress],
            workflowId: `migrate-user-${walletAddress}`,
            taskQueue: 'default',
          });
          return result;
        } catch (error) {
          return {
            walletAddress,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }, batch);

      return await Promise.all(batchPromises);
    };

    // Process all batches sequentially with delays
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await processBatch(batches[i], i);

      // Process results using Ramda
      const processResult = (result: any) => {
        results.push(result);
        if (result.success) {
          successfulMigrations++;
          workflow.log.info(
            `Successfully migrated user ${result.walletAddress} via child workflow`,
          );
        } else {
          failedMigrations++;
          workflow.log.warn(
            `Failed to migrate user ${result.walletAddress} via child workflow: ${result.error}`,
          );
          errors.push(`User ${result.walletAddress}: ${result.error}`);
        }
      };

      map(processResult, batchResults);

      // Add delay between batches to avoid overwhelming the system
      if (i < batches.length - 1) {
        workflow.log.info('Waiting 30 seconds before next batch...');
        await workflow.sleep('30 seconds');
      }
    }

    // Step 4: Generate final report
    workflow.log.info('Generating migration report...');

    const report = await generateMigrationReport();

    workflow.log.info('User migration completed', {
      totalUsers: mongoUsers.length,
      successfulMigrations,
      failedMigrations,
      successRate:
        mongoUsers.length > 0
          ? (successfulMigrations / mongoUsers.length) * 100
          : 0,
    });

    return {
      success: failedMigrations === 0,
      totalUsers: mongoUsers.length,
      successfulMigrations,
      failedMigrations,
      errors,
      report,
    };
  } catch (error: any) {
    const errorMsg = `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    workflow.log.error(errorMsg, error);

    return {
      success: false,
      totalUsers: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      errors: [errorMsg],
      report: {
        timestamp: new Date().toISOString(),
        successRate: 0,
      },
    };
  }
}

/**
 * Temporal workflow for migrating a single user
 * This is the child workflow that handles individual user migrations using individual activities
 */
export async function migrateSingleUserWorkflow(
  walletAddress: string,
): Promise<{
  walletAddress: string;
  success: boolean;
  userId?: string;
  privyUserId?: string;
  error?: string;
  details?: {
    contactsMigrated: number;
    preferencesMigrated: number;
  };
}> {
  // Get reference to activities with custom retry configuration for Privy
  const {
    getUserDataActivity,
    createPostgresUserActivity,
    migrateContactDetailsActivity,
    migrateAutoRenewPreferencesActivity,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  // Custom retry configuration for Privy API calls
  const { createPrivyUserActivity } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '5 minutes',
      retry: {
        initialInterval: '1 minute', // Start with 1 minute for rate limiting
        maximumInterval: '10 minutes',
        backoffCoefficient: 2, // Exponential backoff
        maximumAttempts: 5, // Allow more attempts for rate limiting
        nonRetryableErrorTypes: ['UserNotFoundError'], // Don't retry if user doesn't exist
      },
    },
  });

  try {
    workflow.log.info(
      `Starting single user migration workflow for: ${walletAddress}`,
    );

    // Step 1: Get user data from MongoDB
    workflow.log.info(`Step 1: Getting user data for ${walletAddress}`);
    const userData = await getUserDataActivity(walletAddress);

    if (!userData) {
      const errorMsg = 'User not found in MongoDB';
      workflow.log.warn(
        `Failed to get user data for ${walletAddress}: ${errorMsg}`,
      );
      return {
        walletAddress,
        success: false,
        error: errorMsg,
      };
    }

    workflow.log.info(
      `Retrieved user data for ${walletAddress}: ${
        userData.autoRenewPreferences?.length || 0
      } auto-renew preferences`,
    );

    // Step 2: Create or find Privy user (with custom retry config)
    workflow.log.info(
      `Step 2: Creating/finding Privy user for ${walletAddress}`,
    );
    const privyUserId = await createPrivyUserActivity(
      walletAddress,
      userData.contactDetails?.email,
      userData.contactDetails?.emailVerified,
    );
    workflow.log.info(`Privy user created/found: ${privyUserId}`);

    // Step 3: Create user in PostgreSQL
    workflow.log.info(`Step 3: Creating PostgreSQL user for ${walletAddress}`);
    const postgresUserId = await createPostgresUserActivity(
      privyUserId,
      userData,
    );
    workflow.log.info(`PostgreSQL user created: ${postgresUserId}`);

    // Step 4: Migrate contact details
    workflow.log.info(`Step 4: Migrating contact details for ${walletAddress}`);
    const contactsMigrated = await migrateContactDetailsActivity(
      postgresUserId,
      userData.contactDetails,
    );
    workflow.log.info(`Contact details migrated: ${contactsMigrated} records`);

    // Step 5: Migrate auto-renew preferences
    workflow.log.info(
      `Step 5: Migrating auto-renew preferences for ${walletAddress}`,
    );
    const preferencesMigrated = await migrateAutoRenewPreferencesActivity(
      postgresUserId,
      userData.autoRenewPreferences,
    );
    workflow.log.info(
      `Auto-renew preferences migrated: ${preferencesMigrated} records`,
    );

    workflow.log.info(
      `Successfully migrated user ${walletAddress} via workflow`,
      {
        privyUserId,
        postgresUserId,
        contactsMigrated,
        preferencesMigrated,
      },
    );

    return {
      walletAddress,
      success: true,
      userId: postgresUserId,
      privyUserId,
      details: {
        contactsMigrated,
        preferencesMigrated,
      },
    };
  } catch (error: any) {
    const errorMsg = `Single user migration workflow failed for ${walletAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    workflow.log.error(errorMsg, error);

    return {
      walletAddress,
      success: false,
      error: errorMsg,
    };
  }
}
