/**
 * Schedule for the in-flight NFT tx TTL-sweep workflow.
 *
 * Runs daily at 03:00 UTC. Purges optimistic overlay rows past `expires_at`
 * that were never reconciled or removed by the per-op timer, bounding growth of
 * `managed_indexer_data.in_flight_nft_tx`.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { inFlightNftTxCleanupWorkflow } from '../workflows/in-flight-nft-tx-cleanup.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const InFlightNftTxCleanupSchedule = BaseSchedule.forWorkflowType(
  inFlightNftTxCleanupWorkflow,
);

const config: ScheduleConfig<typeof inFlightNftTxCleanupWorkflow> = {
  scheduleId: 'in-flight-nft-tx-cleanup-schedule',
  workflowId: 'in-flight-nft-tx-cleanup',
  name: 'In-Flight NFT Tx Cleanup',
  description:
    'Daily purge of expired in_flight_nft_tx rows (anything past `expires_at`).',
  groupId: 'domain-maintenance',
  cronExpressions: ['0 3 * * *'], // 03:00 UTC daily
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{ batchSize: 500 }],
  workflowExecutionTimeout: '30m',
  workflowRunTimeout: '30m',
  catchupWindow: '1h',
  pauseOnFailure: false,
  owner: 'system',
  category: 'maintenance',
};

export const inFlightNftTxCleanupSchedule = new InFlightNftTxCleanupSchedule(
  config,
);

export async function submitScheduleForInFlightNftTxCleanup() {
  return await inFlightNftTxCleanupSchedule.submit();
}

export async function triggerInFlightNftTxCleanup() {
  return await inFlightNftTxCleanupSchedule.trigger();
}

export async function pauseInFlightNftTxCleanupSchedule(reason?: string) {
  return await inFlightNftTxCleanupSchedule.pause(reason);
}

export async function unpauseInFlightNftTxCleanupSchedule(reason?: string) {
  return await inFlightNftTxCleanupSchedule.unpause(reason);
}

export async function getInFlightNftTxCleanupScheduleStatus() {
  return await inFlightNftTxCleanupSchedule.getStatus();
}

export async function deleteInFlightNftTxCleanupSchedule() {
  return await inFlightNftTxCleanupSchedule.delete();
}
