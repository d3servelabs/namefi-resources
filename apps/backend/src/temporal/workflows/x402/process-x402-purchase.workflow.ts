/**
 * x402 Purchase Processing Workflow
 *
 * Handles the complete flow for x402 domain purchases:
 * 1. Wait for payment settlement (poll or signal)
 * 2. Create or find user from wallet address
 * 3. Create order and payment records with presettled=true
 * 4. Process order via processOrderWorkflow (verifies pre-settlement, handles registration)
 * 5. Update purchase status
 *
 * The payment is pre-settled at the API layer before the workflow processes the order.
 * This simplifies the flow by having settlement happen upfront.
 */

import * as workflow from '@temporalio/workflow';
import {
  ApplicationFailure,
  defineQuery,
  defineSignal,
  condition,
} from '@temporalio/workflow';
import type {
  NamefiNormalizedDomain,
  ChecksumWalletAddress,
} from '@namefi-astra/utils';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import {
  createWorkflowProgress,
  type WorkflowProgressState,
} from '../../shared/workflow-helpers/workflow-progress';
import { processOrderWorkflow } from '../processOrder.workflow';
import type {
  X402PurchaseSelect,
  X402PurchaseStatus,
} from '@namefi-astra/db/types';

// Step IDs for progress tracking
export type X402PurchaseStepId =
  | 'waiting-settlement'
  | 'creating-user'
  | 'creating-order'
  | 'processing-order'
  | 'completing';

// Signal to notify workflow that payment has been settled
export interface SettlementSignalInput {
  settlementTxHash: string;
  settledAt: string;
}

export const settlementSignal =
  defineSignal<[SettlementSignalInput]>('settlementSignal');

export interface X402PurchaseWorkflowInput {
  purchaseId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  buyerWalletAddress: ChecksumWalletAddress;
  /**
   * The wallet address that received the x402 payment (USDC)
   * This is tracked to support multiple/different signers for refunds
   */
  receiverWalletAddress: string;
  amountInUsdCents: number;
  durationInYears: number;
  network: string;
  paymentPayload: X402PurchaseSelect['paymentPayload'];
}

// Query to get workflow progress state
export const getX402PurchaseProgressQuery = defineQuery<
  WorkflowProgressState<X402PurchaseStepId>
>('getX402PurchaseProgress');

// Activity proxies
const {
  updateX402PurchaseStatus,
  findOrCreateUserFromWallet,
  createX402Order,
  getX402PurchaseSettlement,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '2 minutes',
  },
});

/** Maximum time to wait for settlement (10 minutes) */
const SETTLEMENT_TIMEOUT_MS = 10 * 60 * 1000;
/** Polling interval for checking settlement status (5 seconds) */
const SETTLEMENT_POLL_INTERVAL_MS = 5 * 1000;

/**
 * Main x402 purchase processing workflow
 *
 * This workflow waits for the payment to be pre-settled before processing.
 * Settlement can be signaled via `settlementSignal` or polled from the database.
 */
export async function processX402PurchaseWorkflow(
  input: X402PurchaseWorkflowInput,
): Promise<WorkflowProgressState<X402PurchaseStepId>> {
  // Initialize progress tracking
  const progress = createWorkflowProgress<X402PurchaseStepId>(
    [
      'waiting-settlement',
      'creating-user',
      'creating-order',
      'processing-order',
      'completing',
    ],
    { workflowType: 'x402Purchase' },
  );

  // Expose progress state via query
  workflow.setHandler(getX402PurchaseProgressQuery, () => progress.state);

  // Local state for settlement and order info (separate from progress tracking)
  let settlementTxHash: string | undefined;
  let settledAt: string | undefined;
  let orderId: string | undefined;
  let userId: string | undefined;

  // Helper to update DB status
  const updateDbStatus = async (
    status: X402PurchaseStatus,
    errorMessage?: string,
  ) => {
    try {
      await updateX402PurchaseStatus({
        purchaseId: input.purchaseId,
        status,
        errorMessage: errorMessage ?? '',
        settlementTxHash,
        orderId,
        userId,
        workflowId: workflow.workflowInfo().workflowId,
      });
    } catch (e) {
      workflow.log.error('Failed to update x402 purchase status in DB', {
        error: e,
      });
    }
  };

  // Set up signal handler for settlement notification
  workflow.setHandler(
    settlementSignal,
    (signalInput: SettlementSignalInput) => {
      workflow.log.info('Received settlement signal', {
        settlementTxHash: signalInput.settlementTxHash,
        settledAt: signalInput.settledAt,
      });
      settlementTxHash = signalInput.settlementTxHash;
      settledAt = signalInput.settledAt;
    },
  );

  workflow.log.info('Starting x402 purchase workflow', {
    purchaseId: input.purchaseId,
    domain: input.normalizedDomainName,
    buyer: input.buyerWalletAddress,
  });

  try {
    // Step 1: Wait for payment settlement (signal or poll)
    progress.startStep('waiting-settlement');
    await updateDbStatus('PENDING_SETTLEMENT');
    workflow.log.info('Waiting for payment settlement');

    if (!input.amountInUsdCents || !input.paymentPayload) {
      throw new ApplicationFailure('Amount in USD cents is required');
    }

    // Wait for settlement via signal or poll
    const settlementReceived = await condition(
      () => !!settlementTxHash && !!settledAt,
      SETTLEMENT_TIMEOUT_MS,
    );

    // If not received via signal, poll the database
    if (!settlementReceived) {
      workflow.log.info('Settlement not received via signal, polling database');

      // Poll for settlement status
      let pollAttempts = 0;
      const maxPollAttempts = Math.ceil(
        SETTLEMENT_TIMEOUT_MS / SETTLEMENT_POLL_INTERVAL_MS,
      );

      while (!settlementTxHash && pollAttempts < maxPollAttempts) {
        const settlement = await getX402PurchaseSettlement({
          purchaseId: input.purchaseId,
        });

        if (
          settlement.settled &&
          settlement.settlementTxHash &&
          settlement.settledAt
        ) {
          settlementTxHash = settlement.settlementTxHash;
          settledAt = settlement.settledAt;
          workflow.log.info('Settlement found via polling', {
            settlementTxHash: settlement.settlementTxHash,
          });
          break;
        }

        pollAttempts++;
        await workflow.sleep(SETTLEMENT_POLL_INTERVAL_MS);
      }
    }

    // Check if we have settlement info
    if (!settlementTxHash || !settledAt) {
      progress.failStep(
        'waiting-settlement',
        'Settlement timeout - payment not settled in time',
      );
      progress.fail('Settlement timeout - payment not settled in time');
      await updateDbStatus(
        'FAILED',
        'Settlement timeout - payment not settled in time',
      );
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: 'Settlement timeout - payment not settled in time',
      });
    }

    progress.completeStep('waiting-settlement');
    await updateDbStatus('SETTLED');
    workflow.log.info('Payment settlement confirmed', {
      settlementTxHash,
    });

    // Step 2: Find or create user from wallet
    progress.startStep('creating-user');
    workflow.log.info('Finding or creating user from wallet');

    const userResult = await findOrCreateUserFromWallet({
      walletAddress: input.buyerWalletAddress,
    });

    userId = userResult.userId;
    progress.completeStep('creating-user');
    workflow.log.info('User resolved', {
      userId: userResult.userId,
      isNew: userResult.isNewUser,
    });

    // Step 3: Create order with presettled payment
    progress.startStep('creating-order');
    workflow.log.info('Creating order for x402 purchase (presettled)');

    const orderResult = await createX402Order({
      purchaseId: input.purchaseId,
      userId: userResult.userId,
      normalizedDomainName: input.normalizedDomainName,
      amountInUsdCents: input.amountInUsdCents,
      durationInYears: input.durationInYears,
      buyerWalletAddress: input.buyerWalletAddress,
      receiverWalletAddress: input.receiverWalletAddress,
      network: input.network,
      paymentPayload: input.paymentPayload,
      // Pre-settlement info
      presettled: true,
      settlementTxHash,
      settledAt,
    });

    orderId = orderResult.orderId;
    progress.completeStep('creating-order');
    workflow.log.info('Order created', { orderId: orderResult.orderId });

    // Step 4: Process order via processOrderWorkflow
    // This handles: verifying pre-settlement, domain registration, and refunds if needed
    progress.startStep('processing-order');
    await updateDbStatus('PROCESSING');
    workflow.log.info('Processing order via processOrderWorkflow');

    // Set up nested workflow info for substep tracking
    const childWorkflowId = `process-order-[${orderResult.orderId}]`;
    progress.setStepNestedWorkflow('processing-order', {
      workflowId: childWorkflowId,
      runId: '',
      progressQueryName: 'getOrderProgress',
    });

    await workflow.executeChild(processOrderWorkflow, {
      args: [
        {
          orderId: orderResult.orderId,
          paymentsMetadata: {}, // No additional metadata needed for x402
        },
      ],
      workflowId: childWorkflowId,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      retry: { maximumAttempts: 1 },
    });

    progress.completeStep('processing-order');
    workflow.log.info('Order processing completed');

    // Step 5: Mark as completed
    progress.startStep('completing');
    await updateDbStatus('COMPLETED');
    progress.completeStep('completing');
    progress.complete();

    workflow.log.info('x402 purchase workflow completed successfully', {
      purchaseId: input.purchaseId,
      orderId,
    });

    return progress.state;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Mark workflow as failed if not already
    if (progress.state.phase !== 'FAILED') {
      progress.fail(errorMessage);
      await updateDbStatus('FAILED', errorMessage);
    }

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `x402 purchase failed: ${errorMessage}`,
      cause: error instanceof Error ? error : new Error(errorMessage),
    });
  }
}

// Static helper to generate consistent workflow IDs
processX402PurchaseWorkflow.generateId = (input: { purchaseId: string }) =>
  `x402-purchase-[${input.purchaseId}]`;
