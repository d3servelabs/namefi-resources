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
import { processOrderWorkflow } from '../processOrder.workflow';
import type {
  X402PurchaseSelect,
  X402PurchaseStatus,
} from '@namefi-astra/db/types';

// Workflow status enum
export type X402PurchaseWorkflowStatus =
  | 'PENDING_SETTLEMENT'
  | 'WAITING_FOR_SETTLEMENT'
  | 'SETTLED'
  | 'CREATING_USER'
  | 'CREATING_ORDER'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDING'
  | 'REFUNDED';

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

export interface X402PurchaseWorkflowState {
  purchaseId: string;
  status: X402PurchaseWorkflowStatus;
  domain: NamefiNormalizedDomain;
  buyerWallet: ChecksumWalletAddress;
  amountInUsdCents: number;
  userId?: string;
  orderId?: string;
  orderItemId?: string;
  /** Transaction hash from the pre-settlement */
  settlementTxHash?: string;
  /** ISO timestamp when settlement was completed */
  settledAt?: string;
  error?: string;
  timestamps: {
    startedAt: number;
    lastUpdatedAt: number;
    completedAt?: number;
  };
}

// Query to get workflow state
export const getX402PurchaseStateQuery = defineQuery<X402PurchaseWorkflowState>(
  'getX402PurchaseState',
);

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
): Promise<X402PurchaseWorkflowState> {
  const temporalNow = (): number => {
    const info = workflow.workflowInfo();
    return info.unsafe?.now ? info.unsafe.now() : Date.now();
  };

  const startedAt = temporalNow();
  const state: X402PurchaseWorkflowState = {
    purchaseId: input.purchaseId,
    status: 'PENDING_SETTLEMENT',
    domain: input.normalizedDomainName,
    buyerWallet: input.buyerWalletAddress,
    amountInUsdCents: input.amountInUsdCents,
    timestamps: {
      startedAt,
      lastUpdatedAt: startedAt,
    },
  };

  const touch = () => {
    state.timestamps.lastUpdatedAt = temporalNow();
  };

  const setStatus = async (
    status: X402PurchaseWorkflowStatus,
    purchaseStatus: X402PurchaseStatus | null,
    error?: string,
  ) => {
    state.status = status;
    if (error) {
      state.error = error;
    }
    touch();

    if (purchaseStatus) {
      // Update database
      try {
        await updateX402PurchaseStatus({
          purchaseId: input.purchaseId,
          status: purchaseStatus,
          errorMessage: error ?? '',
          settlementTxHash: state.settlementTxHash,
          orderId: state.orderId,
          userId: state.userId,
          workflowId: workflow.workflowInfo().workflowId,
        });
      } catch (e) {
        workflow.log.error('Failed to update x402 purchase status in DB', {
          error: e,
        });
      }
    }
  };

  // Set up query handler
  workflow.setHandler(getX402PurchaseStateQuery, () => state);

  // Set up signal handler for settlement notification
  workflow.setHandler(
    settlementSignal,
    (signalInput: SettlementSignalInput) => {
      workflow.log.info('Received settlement signal', {
        settlementTxHash: signalInput.settlementTxHash,
        settledAt: signalInput.settledAt,
      });
      state.settlementTxHash = signalInput.settlementTxHash;
      state.settledAt = signalInput.settledAt;
      touch();
    },
  );

  workflow.log.info('Starting x402 purchase workflow', {
    purchaseId: input.purchaseId,
    domain: input.normalizedDomainName,
    buyer: input.buyerWalletAddress,
  });

  try {
    // Step 1: Wait for payment settlement (signal or poll)
    await setStatus('WAITING_FOR_SETTLEMENT', 'PENDING_SETTLEMENT');
    workflow.log.info('Waiting for payment settlement');

    if (!input.amountInUsdCents || !input.paymentPayload) {
      throw new ApplicationFailure('Amount in USD cents is required');
    }

    // Wait for settlement via signal or poll
    const settlementReceived = await condition(
      () => !!state.settlementTxHash && !!state.settledAt,
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

      while (!state.settlementTxHash && pollAttempts < maxPollAttempts) {
        const settlement = await getX402PurchaseSettlement({
          purchaseId: input.purchaseId,
        });

        if (
          settlement.settled &&
          settlement.settlementTxHash &&
          settlement.settledAt
        ) {
          state.settlementTxHash = settlement.settlementTxHash;
          state.settledAt = settlement.settledAt;
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
    if (!state.settlementTxHash || !state.settledAt) {
      await setStatus(
        'FAILED',
        'FAILED',
        'Settlement timeout - payment not settled in time',
      );
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: 'Settlement timeout - payment not settled in time',
      });
    }

    await setStatus('SETTLED', 'SETTLED');
    workflow.log.info('Payment settlement confirmed', {
      settlementTxHash: state.settlementTxHash,
    });

    // Step 2: Find or create user from wallet
    await setStatus('CREATING_USER', null);
    workflow.log.info('Finding or creating user from wallet');

    const userResult = await findOrCreateUserFromWallet({
      walletAddress: input.buyerWalletAddress,
    });

    state.userId = userResult.userId;
    workflow.log.info('User resolved', {
      userId: userResult.userId,
      isNew: userResult.isNewUser,
    });

    // Step 3: Create order with presettled payment
    await setStatus('CREATING_ORDER', null);
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
      settlementTxHash: state.settlementTxHash,
      settledAt: state.settledAt,
    });

    state.orderId = orderResult.orderId;
    state.orderItemId = orderResult.orderItemId;
    workflow.log.info('Order created', { orderId: orderResult.orderId });

    // Step 4: Process order via processOrderWorkflow
    // This handles: verifying pre-settlement, domain registration, and refunds if needed
    await setStatus('PROCESSING', 'PROCESSING');
    workflow.log.info('Processing order via processOrderWorkflow');

    await workflow.executeChild(processOrderWorkflow, {
      args: [
        {
          orderId: orderResult.orderId,
          paymentsMetadata: {}, // No additional metadata needed for x402
        },
      ],
      workflowId: `process-order-[${orderResult.orderId}]`,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      retry: { maximumAttempts: 1 },
    });

    workflow.log.info('Order processing completed');

    // Mark as completed
    await setStatus('COMPLETED', 'COMPLETED');
    state.timestamps.completedAt = temporalNow();

    workflow.log.info('x402 purchase workflow completed successfully', {
      purchaseId: input.purchaseId,
      orderId: state.orderId,
    });

    return state;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (state.status !== 'FAILED') {
      await setStatus('FAILED', 'FAILED', errorMessage);
    }

    state.timestamps.completedAt = temporalNow();

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `x402 purchase failed: ${errorMessage}`,
      cause: error instanceof Error ? error : new Error(errorMessage),
    });
  }
}
