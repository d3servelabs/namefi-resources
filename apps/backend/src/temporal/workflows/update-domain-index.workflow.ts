/**
 * This file contains the workflow for the domain index update.
 * It is used to update the domain index by fetching all domains from registrars
 * It's not triggered manually, but rather by the schedule in `src/temporal/schedules/update-domain-index.ts`
 */
import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

// Main indexing activities with longer timeouts
const {
  updateDomainIndex,
  cleanupStaleIndexedDomains,
  backfillMissingNameserversAndDnssecInIndex,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '10m', // Allow more time for full domain indexing
  },
});

export type UpdateDomainIndexWorkflowInput = {
  /**
   * Whether to clean up stale entries older than specified hours
   * @default 4 hours
   */
  cleanupStaleEntriesOlderThanHours?: number;

  /**
   * Whether to skip cleanup entirely
   * @default true
   */
  skipCleanup?: boolean;
};

export type UpdateDomainIndexWorkflowOutput = {
  indexingResult: {
    totalDomains: number;
    updatedDomains: number;
    registrarsProcessed: string[];
    executionTimeMs: number;
  };
  cleanupResult?: {
    deletedCount: number;
  };
  metadataBackfillResult?: {
    iterations: number;
    nameserversUpdated: number;
    dnssecUpdated: number;
    nameserversRemaining: number;
    dnssecRemaining: number;
  };
  workflowExecutionTimeMs: number;
};
const MAX_BACKFILL_ITERATIONS = 100;

/**
 * Workflow to update the domain index by fetching all domains from registrars
 * and storing them in the indexed_domains table for fast querying
 */
export async function updateDomainIndexWorkflow({
  cleanupStaleEntriesOlderThanHours = 4,
  skipCleanup = false,
}: UpdateDomainIndexWorkflowInput = {}): Promise<UpdateDomainIndexWorkflowOutput> {
  const startTime = Date.now();

  workflow.log.info('Starting domain index update workflow');

  // Step 1: Update the domain index with fresh data
  const indexingResult = await updateDomainIndex();

  workflow.log.info('Domain index update completed', {
    result: indexingResult,
  });

  // Step 2: Optionally clean up stale entries
  let cleanupResult: { deletedCount: number } | undefined;

  if (!skipCleanup) {
    const cleanupOlderThanHours = cleanupStaleEntriesOlderThanHours;

    workflow.log.info('Starting cleanup of stale indexed domains', {
      olderThanHours: cleanupOlderThanHours,
    });

    cleanupResult = await cleanupStaleIndexedDomains(cleanupOlderThanHours);

    workflow.log.info('Stale domain cleanup completed', {
      result: cleanupResult,
    });
  }

  workflow.log.info('Starting metadata backfill for indexed domains');
  let stillRemaining = true;
  let backfillIterations = 0;
  let totalNameserversUpdated = 0;
  let totalDnssecUpdated = 0;
  let finalNameserversRemaining = 0;
  let finalDnssecRemaining = 0;
  let last3IterationsTotalUpdates: Array<number> = [];
  let loop = true;

  while (loop) {
    const result = await backfillMissingNameserversAndDnssecInIndex();
    backfillIterations++;
    totalNameserversUpdated += result.nameserversUpdated;
    totalDnssecUpdated += result.dnssecUpdated;
    finalNameserversRemaining = result.nameserversRemaining;
    finalDnssecRemaining = result.dnssecRemaining;
    stillRemaining = result.stillRemaining;

    last3IterationsTotalUpdates.push(
      result.nameserversUpdated + result.dnssecUpdated,
    );
    last3IterationsTotalUpdates = last3IterationsTotalUpdates.slice(-3);
    const noChangesInLast3Iterations = last3IterationsTotalUpdates.every(
      (update) => update === 0,
    );

    // you have to start noChangesInLast3Iterations only when you atleast surpass 3 iterations
    const effectiveNoChangesInLast3Iterations =
      noChangesInLast3Iterations && backfillIterations > 3;

    loop =
      stillRemaining &&
      backfillIterations < MAX_BACKFILL_ITERATIONS &&
      !effectiveNoChangesInLast3Iterations;

    workflow.log.info('Metadata backfill iteration completed', {
      iteration: backfillIterations,
      result,
    });
  }

  const workflowExecutionTimeMs = Date.now() - startTime;

  const output: UpdateDomainIndexWorkflowOutput = {
    indexingResult,
    cleanupResult,
    metadataBackfillResult: {
      iterations: backfillIterations,
      nameserversUpdated: totalNameserversUpdated,
      dnssecUpdated: totalDnssecUpdated,
      nameserversRemaining: finalNameserversRemaining,
      dnssecRemaining: finalDnssecRemaining,
    },
    workflowExecutionTimeMs,
  };

  workflow.log.info('Domain index workflow completed successfully', {
    output,
  });

  return output;
}
