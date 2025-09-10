import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type {
  AutoRenewalDisablingSummary,
  DomainAutoRenewalProcessResult,
} from '../activities/domain/disable-auto-renewal.activities';

/**
 * Configuration options for the weekly auto-renewal disabling workflow
 */
export interface WeeklyDisableAutoRenewalWorkflowInput {
  /** If true, only simulate the operations without making changes */
  dryRun?: boolean;
  /** Target specific registrar only (dynadot or r53) */
  registrar?: Registrars;
  /** Number of domains to process simultaneously */
  concurrency?: number;
}

/**
 * Output from the weekly auto-renewal disabling workflow
 */
export interface WeeklyDisableAutoRenewalWorkflowOutput {
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Targeted registrar (if any) */
  registrar?: Registrars;
  /** Number of domains found with auto-renewal enabled */
  domainsFoundWithAutoRenewal: number;
  /** Processing results for each domain */
  domainResults: DomainAutoRenewalProcessResult[];
  /** Summary report of the operation */
  summary: AutoRenewalDisablingSummary;
  /** Whether any failures occurred */
  hasFailures: boolean;
  /** Execution duration in seconds */
  executionDurationSeconds: number;
}

// Configure domain activities with appropriate timeouts
const {
  getDomainsWithAutoRenewalEnabled,
  disableAutoRenewalForDomains,
  generateAutoRenewalDisablingSummary,
  logAutoRenewalDisablingSummary,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    scheduleToStartTimeout: '2 minutes',
    startToCloseTimeout: '30 minutes', // Allow plenty of time for large domain lists
    retry: {
      initialInterval: '30 seconds',
      maximumInterval: '5 minutes',
      backoffCoefficient: 2,
      maximumAttempts: 3,
    },
  },
});

// Configure notification activities
const { generalAlertNamefi, criticalAlertNamefi } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

/**
 * Weekly workflow to disable auto-renewal for all SLD domains at the registrar level
 *
 * This workflow ensures that no domains have auto-renewal enabled at the registrar level,
 * as we want to control renewal through our own system only.
 *
 * @param input Configuration options for the workflow
 * @returns Summary of the auto-renewal disabling operation
 */
export async function weeklyDisableAutoRenewalWorkflow({
  dryRun = false,
  registrar,
  concurrency = 5,
}: WeeklyDisableAutoRenewalWorkflowInput = {}): Promise<WeeklyDisableAutoRenewalWorkflowOutput> {
  const startTime = Date.now();

  workflow.log.info('Starting weekly auto-renewal disabling workflow', {
    dryRun,
    registrar: registrar || 'all',
    concurrency,
  });

  if (dryRun) {
    workflow.log.info('🔍 DRY RUN MODE - No changes will be made');
  }

  let domainsWithAutoRenewal: Array<{ domain: string; registrar: string }> = [];
  let domainResults: DomainAutoRenewalProcessResult[] = [];
  let summary: AutoRenewalDisablingSummary;

  try {
    // Step 1: Get all domains that currently have auto-renewal enabled
    workflow.log.info('Step 1: Fetching domains with auto-renewal enabled...');
    domainsWithAutoRenewal = await getDomainsWithAutoRenewalEnabled(registrar);

    workflow.log.info(
      `Found ${domainsWithAutoRenewal.length} domains with auto-renewal enabled`,
    );

    if (domainsWithAutoRenewal.length === 0) {
      workflow.log.info(
        '✅ No domains found with auto-renewal enabled. Nothing to do!',
      );

      summary = await generateAutoRenewalDisablingSummary([], dryRun);

      const executionDurationSeconds = Math.round(
        (Date.now() - startTime) / 1000,
      );

      return {
        dryRun,
        registrar,
        domainsFoundWithAutoRenewal: 0,
        domainResults: [],
        summary,
        hasFailures: false,
        executionDurationSeconds,
      };
    }

    // Step 2: Process domains to disable auto-renewal
    workflow.log.info(
      `Step 2: ${dryRun ? 'Simulating' : 'Processing'} ${domainsWithAutoRenewal.length} domains with concurrency ${concurrency}...`,
    );

    domainResults = await disableAutoRenewalForDomains(
      domainsWithAutoRenewal,
      concurrency,
      dryRun,
    );

    // Step 3: Generate summary report
    workflow.log.info('Step 3: Generating summary report...');
    summary = await generateAutoRenewalDisablingSummary(domainResults, dryRun);

    // Step 4: Log detailed summary
    await logAutoRenewalDisablingSummary(summary, dryRun);

    const hasFailures = summary.failed > 0;

    // Step 5: Send alerts if there are failures (and not in dry run mode)
    if (hasFailures && !dryRun) {
      workflow.log.warn(`Found ${summary.failed} failures, sending alert...`);

      await criticalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: `Weekly auto-renewal disabling failed for ${summary.failed} out of ${summary.totalDomains} domains`,
        level: 'error',
        details: {
          summary,
          failedDomains: summary.failedDomains.slice(0, 10), // Limit to first 10 for brevity
        },
      });
    } else if (hasFailures && dryRun) {
      workflow.log.info(
        `Dry run detected ${summary.failed} domains that would fail`,
      );
    }

    // Step 6: Send success notification for significant operations
    if (summary.actuallyChanged > 0 && !dryRun) {
      await generalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: `Weekly auto-renewal disabling completed successfully: ${summary.actuallyChanged} domains changed, ${summary.alreadyDisabled} already disabled`,
        level: 'info',
        details: { summary },
      });
    }

    const executionDurationSeconds = Math.round(
      (Date.now() - startTime) / 1000,
    );

    workflow.log.info(
      `Weekly auto-renewal disabling workflow completed in ${executionDurationSeconds}s`,
      {
        totalDomains: summary.totalDomains,
        successful: summary.successful,
        failed: summary.failed,
        actuallyChanged: summary.actuallyChanged,
        dryRun,
      },
    );

    return {
      dryRun,
      registrar,
      domainsFoundWithAutoRenewal: domainsWithAutoRenewal.length,
      domainResults,
      summary,
      hasFailures,
      executionDurationSeconds,
    };
  } catch (error: any) {
    workflow.log.error('Weekly auto-renewal disabling workflow failed:', {
      error,
    });

    // Send critical alert for workflow failures
    await criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Weekly auto-renewal disabling workflow failed with error: ${error instanceof Error ? error.message : String(error)}`,
      level: 'error',
      details: {
        error: error instanceof Error ? error.message : String(error),
        domainsFoundCount: domainsWithAutoRenewal.length,
        processedCount: domainResults.length,
      },
    });

    throw error;
  }
}

/**
 * Generate a unique workflow ID for the weekly auto-renewal disabling workflow
 * @param input Workflow input parameters
 * @returns Unique workflow ID
 */
weeklyDisableAutoRenewalWorkflow.generateId = (
  input: WeeklyDisableAutoRenewalWorkflowInput = {},
): string => {
  const { registrar, dryRun } = input;
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const registrarSuffix = registrar ? `-[${registrar}]` : '';
  const dryRunSuffix = dryRun ? '-[dry-run]' : '';

  return `weekly-disable-auto-renewal-[${dateStr}]${registrarSuffix}${dryRunSuffix}`;
};
