#!/usr/bin/env tsx

/**
 * Script to trigger the MongoDB to PostgreSQL AI data migration workflow
 *
 * Usage:
 *   bun run command:migrate-mongo-ai-data [options]
 *   bun tsx src/scripts/migrate-mongo-ai-data.ts [options]
 *
 * Options:
 *   --dry-run           Run in dry-run mode (validate prerequisites only)
 *   --batch-size=100    Set batch size for migration (default: 100)
 */

import { temporalClient } from '../temporal/client';
import { createLogger } from '../lib/logger';
import type {
  MongoAiMigrationWorkflowInput,
  MongoAiMigrationWorkflowResult,
} from '../temporal/workflows/migration/mongo-ai-migration.workflow';
import { fileURLToPath } from 'node:url';

const logger = createLogger({ name: 'migrate-mongo-ai-data-script' });

interface ScriptOptions {
  dryRun: boolean;
  batchSize: number;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);

  let dryRun = false;
  let batchSize = 100;

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--batch-size=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (!isNaN(value) && value > 0) {
        batchSize = value;
      } else {
        logger.error(
          { batchSize: value },
          'Invalid batch size. Must be a positive integer.',
        );
        process.exit(1);
      }
    } else if (arg === '--help') {
      console.log(`
Usage: bun run command:migrate-mongo-ai-data [options]

Options:
  --dry-run           Run in dry-run mode (validate prerequisites only)
  --batch-size=100    Set batch size for migration (default: 100)
  --help              Show this help message

Examples:
  bun run command:migrate-mongo-ai-data --dry-run
  bun run command:migrate-mongo-ai-data --batch-size=50
  bun run command:migrate-mongo-ai-data
      `);
      process.exit(0);
    }
  }

  return { dryRun, batchSize };
}

async function main(): Promise<void> {
  const options = parseArgs();

  logger.info(
    {
      dryRun: options.dryRun,
      batchSize: options.batchSize,
    },
    'Starting MongoDB to PostgreSQL AI migration',
  );

  if (options.dryRun) {
    logger.info(
      {
        dryRun: options.dryRun,
        batchSize: options.batchSize,
      },
      'Running in dry-run mode - no data will be migrated',
    );
  }

  const client = temporalClient;

  // Generate unique workflow ID with timestamp
  const workflowId = `mongo-ai-migration-${Date.now()}`;

  const workflowInput: MongoAiMigrationWorkflowInput = {
    batchSize: options.batchSize,
    dryRun: options.dryRun,
  };

  try {
    logger.info(`Starting workflow with ID: ${workflowId}`);

    const handle = await client.workflow.start('mongoAiMigrationWorkflow', {
      workflowId,
      taskQueue: 'DEFAULT',
      args: [workflowInput],
    });

    logger.info(
      `Workflow started successfully. Workflow ID: ${handle.workflowId}`,
    );
    logger.info('Waiting for workflow to complete...');

    // Wait for workflow result
    const result: MongoAiMigrationWorkflowResult = await handle.result();

    // Display results
    logger.info(
      {
        success: result.success,
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        duration: result.duration,
      },
      'Migration workflow completed',
    );

    if (result.report) {
      console.log('\n=== Migration Report ===');
      console.log(`Timestamp: ${result.report.timestamp}`);
      console.log(`Total Processed: ${result.report.totalProcessed}`);
      console.log(`Successful: ${result.report.successful}`);
      console.log(`Failed: ${result.report.failed}`);
      console.log(`Success Rate: ${result.report.successRate}%`);
      console.log(`Duration: ${result.report.duration}`);
      console.log(
        `Speed: ${result.report.documentsPerSecond} documents/second`,
      );
    }

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      if (!options.dryRun && result.totalProcessed > 0) {
        logger.info(
          'Consider running verification checks on the migrated data',
        );
      }
    } else {
      console.log('\n❌ Migration completed with errors');
      process.exit(1);
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to start or complete migration workflow',
    );
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  main().catch((err) => {
    const error = err as Error;
    logger.error(
      { error: error.message },
      'Unhandled error in migration script',
    );
    process.exit(1);
  });
}
