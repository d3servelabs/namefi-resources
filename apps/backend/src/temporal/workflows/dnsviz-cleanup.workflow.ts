/**
 * DNSViz cleanup workflow.
 *
 * Triggered daily a few hours after the digest by
 * `apps/backend/src/temporal/schedules/dnsviz-cleanup.ts`. Iteratively deletes
 * `dnsviz_analyses` rows whose `expires_at < now`, in batches, until none
 * remain or it hits `MAX_ITERATIONS`. Bounded growth for a DB-only storage
 * model (each row carries the full probe/grok jsonb).
 */
import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

const { deleteExpiredDnsvizAnalyses } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '5m',
  },
});

export interface DnsvizCleanupWorkflowInput {
  /** Rows per delete batch. Default 1000. */
  batchSize?: number;
}

export interface DnsvizCleanupWorkflowOutput {
  totalDeleted: number;
  iterations: number;
  remainingAtFinish: number;
}

const MAX_ITERATIONS = 50;

export async function dnsvizCleanupWorkflow({
  batchSize = 1000,
}: DnsvizCleanupWorkflowInput = {}): Promise<DnsvizCleanupWorkflowOutput> {
  const cutoff = new Date(workflow.workflowInfo().startTime).toISOString();
  let totalDeleted = 0;
  let remaining = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const result = await deleteExpiredDnsvizAnalyses({
      before: cutoff,
      batchSize,
    });
    totalDeleted += result.deletedCount;
    remaining = result.remaining;

    workflow.log.debug('dnsviz cleanup iteration', {
      iteration: i + 1,
      deletedThisIteration: result.deletedCount,
      remaining,
    });

    if (result.deletedCount === 0 || remaining === 0) {
      return {
        totalDeleted,
        iterations: i + 1,
        remainingAtFinish: remaining,
      };
    }
  }

  workflow.log.warn(
    'dnsviz cleanup hit MAX_ITERATIONS, leaving leftover rows for the next run',
    { totalDeleted, remaining },
  );
  return {
    totalDeleted,
    iterations: MAX_ITERATIONS,
    remainingAtFinish: remaining,
  };
}
