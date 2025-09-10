#!/usr/bin/env tsx

/**
 * Script to disable auto-renewal for all domains across Dynadot and Route53 registrars
 *
 * Usage:
 *   # Dry run (preview changes without executing)
 *   tsx apps/backend/src/scripts/disable-auto-renewal.ts --dry-run
 *
 *   # Execute changes
 *   tsx apps/backend/src/scripts/disable-auto-renewal.ts
 *
 *   # Target specific registrar only
 *   tsx apps/backend/src/scripts/disable-auto-renewal.ts --registrar=dynadot
 *   tsx apps/backend/src/scripts/disable-auto-renewal.ts --registrar=r53
 */

import { sldRegistrar } from '#lib/namefi-registry';
import { logger } from '#lib/logger';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/data/renew-option';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import pMap from 'p-map';

interface ScriptOptions {
  dryRun: boolean;
  registrar?: Registrars;
  concurrency: number;
}

interface DomainProcessResult {
  domain: string;
  registrar: string;
  success: boolean;
  previousState: RenewOption;
  error?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: false,
    concurrency: 5, // Process 5 domains at a time to avoid rate limits
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--registrar=')) {
      const registrar = arg.split('=')[1] as Registrars;
      if (registrar !== 'dynadot' && registrar !== 'r53') {
        throw new Error(
          `Invalid registrar: ${registrar}. Must be 'dynadot' or 'r53'`,
        );
      }
      options.registrar = registrar;
    } else if (arg.startsWith('--concurrency=')) {
      const concurrency = Number.parseInt(arg.split('=')[1], 10);
      if (Number.isNaN(concurrency) || concurrency < 1) {
        throw new Error(
          `Invalid concurrency: ${arg.split('=')[1]}. Must be a positive integer`,
        );
      }
      options.concurrency = concurrency;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx apps/backend/src/scripts/disable-auto-renewal.ts [options]

Options:
  --dry-run                Preview changes without executing them
  --registrar=<name>       Target specific registrar only (dynadot|r53)
  --concurrency=<number>   Number of domains to process concurrently (default: 5)
  --help, -h               Show this help message

Examples:
  tsx apps/backend/src/scripts/disable-auto-renewal.ts --dry-run
  tsx apps/backend/src/scripts/disable-auto-renewal.ts --registrar=dynadot
  tsx apps/backend/src/scripts/disable-auto-renewal.ts --concurrency=10
      `);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

/**
 * Process a single domain to disable auto-renewal
 */
async function processDomain(
  domain: string,
  registrar: string,
  dryRun: boolean,
): Promise<DomainProcessResult> {
  const result: DomainProcessResult = {
    domain,
    registrar,
    success: false,
    previousState: RenewOption.MANUAL,
  };

  try {
    // Get current renewal option
    const currentRenewOption = await sldRegistrar.getRenewOption(domain as any);
    result.previousState = currentRenewOption;

    // Skip if already set to manual
    if (currentRenewOption === RenewOption.MANUAL) {
      result.success = true;
      logger.info(
        `Domain ${domain} (${registrar}) already has auto-renewal disabled`,
      );
      return result;
    }

    if (dryRun) {
      logger.info(
        `[DRY RUN] Would disable auto-renewal for ${domain} (${registrar})`,
      );
      result.success = true;
      return result;
    }

    // Disable auto-renewal
    const operationResult = await sldRegistrar.setRenewOption(
      domain as any,
      RenewOption.MANUAL,
    );

    if (operationResult.status === 'SUCCESSFUL') {
      result.success = true;
      logger.info(
        `Successfully disabled auto-renewal for ${domain} (${registrar})`,
      );
    } else {
      result.error = `Operation failed with status: ${operationResult.status}`;
      logger.error(
        `Failed to disable auto-renewal for ${domain} (${registrar}): ${result.error}`,
      );
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    logger.error(`Error processing ${domain} (${registrar}): ${result.error}`);
  }

  return result;
}

/**
 * Generate a summary report of the operation
 */
function generateReport(results: DomainProcessResult[], dryRun: boolean): void {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const alreadyDisabled = results.filter(
    (r) => r.success && r.previousState === RenewOption.MANUAL,
  ).length;
  const actuallyChanged = results.filter(
    (r) => r.success && r.previousState === RenewOption.AUTOMATIC,
  ).length;

  console.log('\n' + '='.repeat(60));
  console.log(`${dryRun ? 'DRY RUN ' : ''}SUMMARY REPORT`);
  console.log('='.repeat(60));
  console.log(`Total domains processed: ${total}`);
  console.log(`Successful operations: ${successful}`);
  console.log(`Failed operations: ${failed}`);
  console.log(`Already had auto-renewal disabled: ${alreadyDisabled}`);
  console.log(
    `${dryRun ? 'Would have changed' : 'Actually changed'}: ${actuallyChanged}`,
  );

  if (failed > 0) {
    console.log('\nFailed domains:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.domain} (${r.registrar}): ${r.error}`);
      });
  }

  // Group by registrar
  const byRegistrar = results.reduce(
    (acc, result) => {
      if (!acc[result.registrar]) {
        acc[result.registrar] = { total: 0, successful: 0, failed: 0 };
      }
      acc[result.registrar].total++;
      if (result.success) {
        acc[result.registrar].successful++;
      } else {
        acc[result.registrar].failed++;
      }
      return acc;
    },
    {} as Record<string, { total: number; successful: number; failed: number }>,
  );

  console.log('\nBy Registrar:');
  for (const [registrar, stats] of Object.entries(byRegistrar)) {
    console.log(
      `  ${registrar}: ${stats.successful}/${stats.total} successful (${stats.failed} failed)`,
    );
  }

  console.log('='.repeat(60));
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();

    logger.info('Starting auto-renewal disable script', {
      dryRun: options.dryRun,
      targetRegistrar: options.registrar || 'all',
      concurrency: options.concurrency,
    });

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Get all domains from the specified registrar(s)
    logger.info('Fetching domain list...');
    const allDomains = await sldRegistrar.listAllDomains(
      options.registrar ? { registrar: options.registrar } : undefined,
    );

    logger.info(`Found ${allDomains.length} domains total`);

    // Filter domains that have auto-renewal enabled
    const domainsToProcess: Array<{ domain: string; registrar: string }> = [];

    logger.info('Checking current auto-renewal status...');
    let checkedCount = 0;

    for (const domainInfo of allDomains) {
      checkedCount++;
      if (checkedCount % 50 === 0) {
        logger.info(`Checked ${checkedCount}/${allDomains.length} domains...`);
      }

      if (domainInfo.autoRenewOption === RenewOption.AUTOMATIC) {
        domainsToProcess.push({
          domain: domainInfo.domainName,
          registrar: domainInfo.registrarKey,
        });
      }
    }

    logger.info(
      `Found ${domainsToProcess.length} domains with auto-renewal enabled`,
    );

    if (domainsToProcess.length === 0) {
      console.log(
        '✅ No domains found with auto-renewal enabled. Nothing to do!',
      );
      return;
    }

    console.log(
      `\n${options.dryRun ? 'Would process' : 'Processing'} ${domainsToProcess.length} domains...`,
    );

    // Process domains with concurrency control
    const results = await pMap(
      domainsToProcess,
      async ({ domain, registrar }) => {
        return processDomain(domain, registrar, options.dryRun);
      },
      {
        concurrency: options.concurrency,
      },
    );

    // Generate and display report
    generateReport(results, options.dryRun);

    const failedCount = results.filter((r) => !r.success).length;

    if (failedCount === 0) {
      logger.info(
        `${options.dryRun ? 'Dry run completed' : 'All operations completed'} successfully!`,
      );
      process.exit(0);
    } else {
      logger.warn(
        `Completed with ${failedCount} failures out of ${results.length} domains`,
      );
      process.exit(1);
    }
  } catch (error) {
    logger.error('Script execution failed:', error);
    logger.error(
      'Script failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Execute the script if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error in main:', error);
    process.exit(1);
  });
}

export { main, parseArgs, processDomain };
