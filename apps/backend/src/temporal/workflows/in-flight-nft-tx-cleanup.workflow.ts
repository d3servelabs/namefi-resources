/**
 * In-flight NFT tx TTL-sweep workflow.
 *
 * Backstop cleanup for the optimistic NFT overlay
 * (`managed_indexer_data.in_flight_nft_tx`). Most rows are removed promptly by
 * event-driven reconciliation in the Ponder sync or by the per-op timer in the
 * optimistic wrapper workflows; this scheduled sweep purges any rows whose
 * operation never confirmed or was never reconciled (stuck tx, indexer down),
 * bounding table growth. Rows past `expires_at` are already excluded from the
 * overlay, so this only reclaims space.
 */
import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

const { sweepExpiredInFlightNftTxRows } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '5m',
  },
});

export interface InFlightNftTxCleanupWorkflowInput {
  /** Rows per delete batch. Default 500. */
  batchSize?: number;
}

export interface InFlightNftTxCleanupWorkflowOutput {
  totalDeleted: number;
  iterations: number;
}

const MAX_ITERATIONS = 50;

export async function inFlightNftTxCleanupWorkflow({
  batchSize = 500,
}: InFlightNftTxCleanupWorkflowInput = {}): Promise<InFlightNftTxCleanupWorkflowOutput> {
  let totalDeleted = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const { deleted } = await sweepExpiredInFlightNftTxRows({ batchSize });
    totalDeleted += deleted;

    workflow.log.debug('in-flight NFT tx cleanup iteration', {
      iteration: i + 1,
      deletedThisIteration: deleted,
      totalDeleted,
    });

    // A non-full batch means we drained the expired rows.
    if (deleted < batchSize) {
      return { totalDeleted, iterations: i + 1 };
    }
  }

  workflow.log.warn(
    'in-flight NFT tx cleanup hit MAX_ITERATIONS, leaving leftover rows for the next run',
    { totalDeleted },
  );
  return { totalDeleted, iterations: MAX_ITERATIONS };
}
