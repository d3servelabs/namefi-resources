/**
 * Temporal workflow to orchestrate MongoDB to PostgreSQL AI data migration
 * This follows the repo's patterns for migration workflows
 */

import * as workflow from '@temporalio/workflow';
import type * as MongoAiMigrationActivities from '../../activities/migration/mongo-ai-migration.activities';

// Create activity proxies for migration activities
const mongoAiMigrationActivities = workflow.proxyActivities<
  typeof MongoAiMigrationActivities
>({
  taskQueue: 'DEFAULT',
  scheduleToCloseTimeout: '10 minutes',
  scheduleToStartTimeout: '1 minute',
  startToCloseTimeout: '5 minutes',
  heartbeatTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    maximumInterval: '100 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export interface MongoAiMigrationWorkflowInput {
  batchSize?: number;
  dryRun?: boolean;
}

export interface MongoAiMigrationWorkflowResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
  duration: string;
  report: {
    timestamp: string;
    totalProcessed: number;
    successful: number;
    failed: number;
    successRate: number;
    duration: string;
    documentsPerSecond: number;
  };
}

/**
 * Main workflow to migrate AI data from MongoDB to PostgreSQL
 */
export async function mongoAiMigrationWorkflow(
  input: MongoAiMigrationWorkflowInput = {},
): Promise<MongoAiMigrationWorkflowResult> {
  const logger = workflow.log;
  const startTime = new Date();

  const { batchSize = 100, dryRun = false } = input;

  logger.info('Starting MongoDB to PostgreSQL AI migration workflow', {
    batchSize,
    dryRun,
  });

  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  try {
    // Step 1: Validate prerequisites
    logger.info('Validating migration prerequisites...');
    const prerequisites =
      await mongoAiMigrationActivities.validateAiMigrationPrerequisitesActivity();

    if (!prerequisites.success) {
      const errorMsg = `Migration prerequisites failed: ${prerequisites.errors.join(', ')}`;
      logger.error(errorMsg);
      throw new workflow.ApplicationFailure(errorMsg);
    }

    logger.info('Prerequisites validation successful', {
      mongodbAvailable: prerequisites.mongodbAvailable,
      postgresqlAvailable: prerequisites.postgresqlAvailable,
    });

    if (dryRun) {
      logger.info('Dry run mode - skipping actual migration');
      const endTime = new Date();

      const report =
        await mongoAiMigrationActivities.generateAiMigrationReportActivity(
          0,
          0,
          0,
          startTime,
          endTime,
        );

      return {
        success: true,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        duration: report.duration,
        report,
      };
    }

    // Step 2: Get total document count for progress tracking
    logger.info('Counting MongoDB documents...');
    const totalDocuments =
      await mongoAiMigrationActivities.countMongoAiDocumentsActivity();
    logger.info(`Total documents to migrate: ${totalDocuments}`);

    if (totalDocuments === 0) {
      logger.info('No documents to migrate');
      const endTime = new Date();

      const report =
        await mongoAiMigrationActivities.generateAiMigrationReportActivity(
          0,
          0,
          0,
          startTime,
          endTime,
        );

      return {
        success: true,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        duration: report.duration,
        report,
      };
    }

    // Step 3: Process documents in batches
    let skip = 0;
    const domainTokenMapCache = new Map<string, string>();

    while (skip < totalDocuments) {
      const batchNumber = Math.floor(skip / batchSize) + 1;
      const totalBatches = Math.ceil(totalDocuments / batchSize);

      logger.info(
        `Processing batch ${batchNumber}/${totalBatches} (skip: ${skip}, size: ${batchSize})`,
      );

      try {
        // Get batch of documents
        const batch =
          await mongoAiMigrationActivities.getMongoAiDocumentBatchActivity(
            skip,
            batchSize,
          );

        if (batch.length === 0) {
          logger.info('Empty batch retrieved, stopping migration');
          break;
        }

        // Collect unique domain names for token ID resolution
        const uniqueDomainNames = Array.from(
          new Set(
            batch
              .filter((doc: any) => doc.ldh && !doc.tokenId) // Only domains without tokenId
              .map((doc: any) => doc.ldh),
          ),
        );

        // Resolve token IDs for domains not in cache
        const newDomainNames = uniqueDomainNames.filter(
          (domain) => !domainTokenMapCache.has(domain),
        );

        if (newDomainNames.length > 0) {
          logger.info(
            `Resolving token IDs for ${newDomainNames.length} new domains`,
          );
          const newDomainTokenMap =
            await mongoAiMigrationActivities.resolveDomainsToTokenIdsActivity(
              newDomainNames,
            );

          // Add to cache
          for (const [domain, tokenId] of newDomainTokenMap.entries()) {
            domainTokenMapCache.set(domain, tokenId.toString());
          }
        }

        // Migrate the batch
        const result =
          await mongoAiMigrationActivities.migrateAiDocumentBatchActivity(
            batch,
            domainTokenMapCache,
          );

        totalProcessed += result.processed;
        totalSuccessful += result.successful;
        totalFailed += result.failed;
        allErrors.push(...result.errors);

        const progressPercent = (
          ((skip + batch.length) / totalDocuments) *
          100
        ).toFixed(1);
        logger.info(
          `Batch ${batchNumber} completed: ${result.successful}/${result.processed} successful (${progressPercent}% total progress)`,
        );

        if (result.errors.length > 0) {
          logger.warn(
            `Batch ${batchNumber} had ${result.errors.length} errors`,
            {
              errors: result.errors.slice(0, 3), // Log first 3 errors
            },
          );
        }

        skip += batchSize;
      } catch (error) {
        const errorMsg = `Batch ${batchNumber} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        allErrors.push(errorMsg);
        totalFailed += batchSize;
        skip += batchSize; // Continue with next batch
      }
    }

    // Step 4: Verify migration
    logger.info('Verifying migration...');
    const verification =
      await mongoAiMigrationActivities.verifyAiMigrationActivity();

    if (!verification.success) {
      logger.warn('Migration verification failed', {
        mongoCount: verification.mongoCount,
        postgresCount: verification.postgresCount,
        message: verification.message,
      });
      allErrors.push(verification.message);
    } else {
      logger.info('Migration verification successful', {
        mongoCount: verification.mongoCount,
        postgresCount: verification.postgresCount,
      });
    }

    // Step 5: Generate final report
    const endTime = new Date();
    const report =
      await mongoAiMigrationActivities.generateAiMigrationReportActivity(
        totalProcessed,
        totalSuccessful,
        totalFailed,
        startTime,
        endTime,
      );

    logger.info('Migration workflow completed', {
      totalProcessed,
      totalSuccessful,
      totalFailed,
      successRate: report.successRate,
      duration: report.duration,
      documentsPerSecond: report.documentsPerSecond,
    });

    const success = totalFailed === 0 && verification.success;

    return {
      success,
      totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      errors: allErrors,
      duration: report.duration,
      report,
    };
  } catch (error) {
    const errorMsg = `Migration workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);

    const endTime = new Date();
    const report =
      await mongoAiMigrationActivities.generateAiMigrationReportActivity(
        totalProcessed,
        totalSuccessful,
        totalFailed,
        startTime,
        endTime,
      );

    return {
      success: false,
      totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      errors: [...allErrors, errorMsg],
      duration: report.duration,
      report,
    };
  }
}
