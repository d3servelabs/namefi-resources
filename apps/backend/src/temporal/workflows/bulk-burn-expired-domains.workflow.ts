/**
 * Bulk Burn Expired Domains Workflow
 *
 * This workflow handles the bulk burning of expired domain NFTs with admin approval.
 * It verifies domains are truly expired and not in registrars, waits for admin approval
 * via Temporal signal, then processes burns in batch.
 *
 * Workflow States:
 * 1. VERIFYING - Re-checking domain eligibility against registrars
 * 2. WAITING_APPROVAL - Awaiting admin approval/cancellation signal
 * 3. PROCESSING - Executing approved burns
 * 4. COMPLETED/CANCELLED - Final states
 */

import * as workflow from '@temporalio/workflow';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { shortRunningOpts, TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { ensureNftIsLockedAndBurnByNftName } from './mint.workflow';
import type { DomainToBurn } from '../activities/domain/bulk-burn.activities';

// Define signals for admin approval/cancellation
export const bulkBurnApprovalSignal = workflow.defineSignal<
  [NamefiNormalizedDomain[]]
>('bulkBurnApprovalSignal');
export const bulkBurnCancelSignal = workflow.defineSignal(
  'bulkBurnCancelSignal',
);

// Define queries for workflow state
export const getBulkBurnWorkflowStateQuery =
  workflow.defineQuery<BulkBurnWorkflowState>('getBulkBurnWorkflowState');

export interface BulkBurnExpiredDomainsWorkflowInput {
  /**
   * List of domains that were identified as ready to burn
   */
  domains: DomainToBurn[];

  /**
   * Optional timeout for waiting for admin approval (default: 7 days)
   */
  approvalTimeoutDays?: number;
}

export interface BulkBurnWorkflowState {
  currentStatus:
    | 'VERIFYING'
    | 'WAITING_APPROVAL'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'TIMED_OUT';
  verifiedDomains: DomainToBurn[];
  skippedDomains: Array<{ domain: NamefiNormalizedDomain; reason: string }>;
  approvedDomains?: NamefiNormalizedDomain[];
  successfulBurns: Array<{ domain: NamefiNormalizedDomain; txHash: string }>;
  failedBurns: Array<{ domain: NamefiNormalizedDomain; error: string }>;
  totalRequested: number;
  verificationTime?: Date;
  approvalTime?: Date;
  completionTime?: Date;
}

export interface BulkBurnExpiredDomainsWorkflowOutput {
  status: 'COMPLETED' | 'CANCELLED' | 'TIMED_OUT';
  totalRequested: number;
  verifiedCount: number;
  approvedCount: number;
  successCount: number;
  failureCount: number;
  successfulBurns: Array<{ domain: NamefiNormalizedDomain; txHash: string }>;
  failedBurns: Array<{ domain: NamefiNormalizedDomain; error: string }>;
  skippedDomains: Array<{ domain: NamefiNormalizedDomain; reason: string }>;
  executionTimeMs: number;
}

/**
 * Bulk burn expired domains workflow
 */
export async function bulkBurnExpiredDomainsWorkflow({
  domains,
  approvalTimeoutDays = 7,
}: BulkBurnExpiredDomainsWorkflowInput): Promise<BulkBurnExpiredDomainsWorkflowOutput> {
  const startTime = Date.now();

  // Initialize workflow state
  const state: BulkBurnWorkflowState = {
    currentStatus: 'VERIFYING',
    verifiedDomains: [],
    skippedDomains: [],
    successfulBurns: [],
    failedBurns: [],
    totalRequested: domains.length,
  };

  // Signal handlers
  let approvedDomains: NamefiNormalizedDomain[] | undefined;
  let approvalStatus: 'approved' | 'cancelled' | undefined;

  workflow.setHandler(
    bulkBurnApprovalSignal,
    (domains: NamefiNormalizedDomain[]) => {
      approvalStatus = 'approved';
      approvedDomains = domains;
      state.approvedDomains = domains;
      state.approvalTime = new Date();
      workflow.log.info('Received approval signal', {
        approvedCount: domains.length,
      });
    },
  );

  workflow.setHandler(bulkBurnCancelSignal, () => {
    approvalStatus = 'cancelled';
    workflow.log.info('Received cancellation signal');
  });

  // Query handler
  workflow.setHandler(getBulkBurnWorkflowStateQuery, () => state);

  workflow.log.info('Starting bulk burn workflow', {
    totalDomains: domains.length,
    approvalTimeoutDays,
  });

  // Activity proxies
  const {
    verifyDomainsForBulkBurn,
    sendPendingBurnNotification,
    sendBulkBurnCompletionNotification,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '10m', // Allow time for registrar verification
    },
  });

  try {
    // Step 1: Verify domains against registrars
    workflow.log.info('Verifying domains against registrars');
    state.currentStatus = 'VERIFYING';

    const verificationResult = await verifyDomainsForBulkBurn(domains);

    state.verifiedDomains = verificationResult.verifiedDomains;
    state.skippedDomains = verificationResult.skippedDomains;
    state.verificationTime = verificationResult.verificationTime;

    workflow.log.info('Domain verification completed', {
      verified: verificationResult.verifiedDomains.length,
      skipped: verificationResult.skippedDomains.length,
      totalRegistrarDomains: verificationResult.totalRegistrarDomains,
    });

    // If no domains verified, complete immediately
    if (verificationResult.verifiedDomains.length === 0) {
      workflow.log.warn('No domains verified for burning, completing workflow');
      state.currentStatus = 'COMPLETED';
      state.completionTime = new Date();

      return {
        status: 'COMPLETED',
        totalRequested: domains.length,
        verifiedCount: 0,
        approvedCount: 0,
        successCount: 0,
        failureCount: 0,
        successfulBurns: [],
        failedBurns: [],
        skippedDomains: state.skippedDomains,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Step 2: Send notification and wait for approval
    workflow.log.info(
      'Sending pending burn notification and waiting for approval',
    );
    state.currentStatus = 'WAITING_APPROVAL';

    await catchAndAlertLocally(
      async () => {
        await sendPendingBurnNotification(
          workflow.workflowInfo().workflowId,
          verificationResult.verifiedDomains.length,
        );
      },
      {
        message: 'Failed to send pending burn notification',
        details: { workflowId: workflow.workflowInfo().workflowId },
      },
    );

    // Wait for approval or cancellation signal (or timeout)
    const timeoutMs = approvalTimeoutDays * 24 * 60 * 60 * 1000;
    const approvedOrCancelled = await workflow.condition(
      () => approvedDomains !== undefined || approvalStatus !== undefined,
      timeoutMs,
    );

    // Handle timeout
    if (!approvedOrCancelled) {
      workflow.log.warn('Approval timeout reached, cancelling workflow');
      state.currentStatus = 'TIMED_OUT';
      state.completionTime = new Date();

      return {
        status: 'TIMED_OUT',
        totalRequested: domains.length,
        verifiedCount: verificationResult.verifiedDomains.length,
        approvedCount: 0,
        successCount: 0,
        failureCount: 0,
        successfulBurns: [],
        failedBurns: [],
        skippedDomains: state.skippedDomains,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Handle cancellation
    if (approvalStatus === 'cancelled') {
      workflow.log.info('Workflow cancelled by admin');
      state.currentStatus = 'CANCELLED';
      state.completionTime = new Date();

      await catchAndAlertLocally(
        async () => {
          await sendBulkBurnCompletionNotification(
            workflow.workflowInfo().workflowId,
            {
              totalRequested: domains.length,
              successCount: 0,
              failureCount: 0,
              successfulBurns: [],
              failedBurns: [],
              cancelled: true,
            },
          );
        },
        {
          message: 'Failed to send cancellation notification',
          details: { workflowId: workflow.workflowInfo().workflowId },
        },
      );

      return {
        status: 'CANCELLED',
        totalRequested: domains.length,
        verifiedCount: verificationResult.verifiedDomains.length,
        approvedCount: 0,
        successCount: 0,
        failureCount: 0,
        successfulBurns: [],
        failedBurns: [],
        skippedDomains: state.skippedDomains,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Step 3: Process approved burns
    if (!approvedDomains || approvedDomains.length === 0) {
      workflow.log.warn('No domains approved for burning');
      state.currentStatus = 'COMPLETED';
      state.completionTime = new Date();

      return {
        status: 'COMPLETED',
        totalRequested: domains.length,
        verifiedCount: verificationResult.verifiedDomains.length,
        approvedCount: 0,
        successCount: 0,
        failureCount: 0,
        successfulBurns: [],
        failedBurns: [],
        skippedDomains: state.skippedDomains,
        executionTimeMs: Date.now() - startTime,
      };
    }

    workflow.log.info('Processing approved burns', {
      approvedCount: approvedDomains.length,
    });
    state.currentStatus = 'PROCESSING';

    // Create a map of verified domains for easy lookup
    const verifiedDomainsMap = new Map(
      verificationResult.verifiedDomains.map((d: DomainToBurn) => [
        d.domain,
        d,
      ]),
    );

    // Process each approved domain
    for (const domainName of approvedDomains) {
      const domainInfo = verifiedDomainsMap.get(domainName);

      if (!domainInfo) {
        workflow.log.warn('Approved domain not found in verified list', {
          domain: domainName,
        });
        state.failedBurns.push({
          domain: domainName,
          error: 'Domain not found in verified list',
        });
        continue;
      }

      workflow.log.info('Burning domain', { domain: domainName });

      try {
        // Execute burn workflow for this domain
        const txHash = await workflow.executeChild(
          ensureNftIsLockedAndBurnByNftName,
          {
            workflowId: ensureNftIsLockedAndBurnByNftName.generateId({
              domainName: domainName,
              chainId: domainInfo.chainId,
            }),
            args: [
              {
                chainId: domainInfo.chainId,
                domainName: domainName,
              },
            ],
            taskQueue: TEMPORAL_QUEUES.MINT,
          },
        );

        state.successfulBurns.push({ domain: domainName, txHash });
        workflow.log.info('Domain burned successfully', {
          domain: domainName,
          txHash,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        state.failedBurns.push({
          domain: domainName,
          error: errorMessage,
        });
        workflow.log.error('Failed to burn domain', {
          domain: domainName,
          error: errorMessage,
        });
      }
    }

    // Step 4: Send completion notification
    state.currentStatus = 'COMPLETED';
    state.completionTime = new Date();

    workflow.log.info('Bulk burn processing completed', {
      successCount: state.successfulBurns.length,
      failureCount: state.failedBurns.length,
    });

    await catchAndAlertLocally(
      async () => {
        await sendBulkBurnCompletionNotification(
          workflow.workflowInfo().workflowId,
          {
            totalRequested: approvedDomains?.length || 0,
            successCount: state.successfulBurns.length,
            failureCount: state.failedBurns.length,
            successfulBurns: state.successfulBurns,
            failedBurns: state.failedBurns,
            cancelled: false,
          },
        );
      },
      {
        message: 'Failed to send completion notification',
        details: { workflowId: workflow.workflowInfo().workflowId },
      },
    );

    const output: BulkBurnExpiredDomainsWorkflowOutput = {
      status: 'COMPLETED',
      totalRequested: domains.length,
      verifiedCount: verificationResult.verifiedDomains.length,
      approvedCount: approvedDomains.length,
      successCount: state.successfulBurns.length,
      failureCount: state.failedBurns.length,
      successfulBurns: state.successfulBurns,
      failedBurns: state.failedBurns,
      skippedDomains: state.skippedDomains,
      executionTimeMs: Date.now() - startTime,
    };

    workflow.log.info('Bulk burn workflow completed', { output });

    return output;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    workflow.log.error('Bulk burn workflow failed', {
      error,
      executionTimeMs,
    });

    // Return partial results on failure
    return {
      status: 'COMPLETED',
      totalRequested: domains.length,
      verifiedCount: state.verifiedDomains.length,
      approvedCount: state.approvedDomains?.length || 0,
      successCount: state.successfulBurns.length,
      failureCount: state.failedBurns.length,
      successfulBurns: state.successfulBurns,
      failedBurns: state.failedBurns,
      skippedDomains: state.skippedDomains,
      executionTimeMs,
    };
  }
}

/**
 * Helper function to generate a unique workflow ID for bulk burn
 */
export function generateBulkBurnWorkflowId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `bulk-burn-expired-domains-${timestamp}`;
}
