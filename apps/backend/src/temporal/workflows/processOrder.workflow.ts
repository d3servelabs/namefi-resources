import { orderStatusSchema, type OrderStatus } from '@namefi-astra/db/types';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { ApplicationFailure, defineQuery } from '@temporalio/workflow';
import { resolve } from '../../utils/resolve';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { generateLogosForAliveNftsWorkflow } from './logo-generation.workflow';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { ChargeUserWorkflowInput } from './chargeUser.workflow';
import { processOrderItemWorkflow } from './processOrderItem.workflow';
import { multiChargeWorkflow } from './multi-charge.workflow';
import { multiRefundWorkflow } from './multi-refund.workflow';
import { postProcessOrderItemWorkflow } from './post-process-order-item.workflow';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';

export type ProcessOrderWorkflowStepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type ProcessOrderWorkflowStepId =
  | 'order-details'
  | 'payments'
  | 'items'
  | 'post-processing'
  | 'final-status'
  | 'refund'
  | 'notification';

export interface ProcessOrderWorkflowStep {
  id: ProcessOrderWorkflowStepId;
  label: string;
  status: ProcessOrderWorkflowStepStatus;
  message?: string;
  startedAt?: number;
  completedAt?: number;
}

export type ProcessOrderWorkflowItemStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

// TODO: [HIGH-IMPACT BUG] Missing 'RENEW' type in ProcessOrderWorkflowItemProgress.
// The itemTypeEnum in schema.ts defines three types: 'REGISTER', 'IMPORT', 'RENEW',
// but this interface only includes 'REGISTER' | 'IMPORT'. This causes:
// 1. Type assertion errors when processing RENEW orders (line ~353: item.type as 'REGISTER' | 'IMPORT')
// 2. Incorrect workflow state tracking for renewal orders
// 3. Potential runtime errors or silent failures when renewals are processed
// Impact: High - Renewal orders may not be tracked correctly in the workflow state,
// leading to incorrect order progress reporting and potential customer confusion.
// Fix: Add 'RENEW' to the type union: type: 'REGISTER' | 'IMPORT' | 'RENEW'
export interface ProcessOrderWorkflowItemProgress {
  itemId: string;
  domain: NamefiNormalizedDomain;
  type: 'REGISTER' | 'IMPORT';
  durationInYears: number;
  registrarKey: string;
  status: ProcessOrderWorkflowItemStatus;
  lastUpdatedAt: number;
  message?: string;
}

export type ProcessOrderWorkflowPhase =
  | 'INITIALIZING'
  | 'FETCHING_ORDER'
  | 'CHARGING'
  | 'PROCESSING_ITEMS'
  | 'POST_PROCESSING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED';

export interface ProcessOrderWorkflowPublicState {
  orderId: string;
  phase: ProcessOrderWorkflowPhase;
  status: OrderStatus;
  steps: ProcessOrderWorkflowStep[];
  items: ProcessOrderWorkflowItemProgress[];
  payment: {
    status: 'PENDING' | 'CHARGING' | 'CHARGED' | 'FAILED';
    message?: string;
  };
  refund: {
    status: 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    amountInUsdCents: number;
  };
  notification: {
    status: 'PENDING' | 'SENT' | 'SKIPPED' | 'FAILED';
    message?: string;
  };
  summary: {
    totalItems: number;
    succeededItems: number;
    failedItems: number;
  };
  timestamps: {
    startedAt: number;
    lastUpdatedAt: number;
    completedAt?: number;
  };
  error?: string;
}

export const getOrderProgressQuery =
  defineQuery<ProcessOrderWorkflowPublicState>('getOrderProgress');

type NotificationResultStatus = Exclude<
  ProcessOrderWorkflowPublicState['notification']['status'],
  'PENDING'
>;

interface NotificationResult {
  status: NotificationResultStatus;
  message?: string;
}

const createStep = (
  id: ProcessOrderWorkflowStepId,
  label: string,
): ProcessOrderWorkflowStep => ({
  id,
  label,
  status: 'PENDING',
});

const BASE_STEPS: ProcessOrderWorkflowStep[] = [
  createStep('order-details', 'Preparing your order'),
  createStep('payments', 'Collecting payment'),
  createStep('items', 'Registering domains'),
  createStep('post-processing', 'Finishing background tasks'),
  createStep('final-status', 'Finalizing order status'),
  createStep('refund', 'Processing refunds'),
  createStep('notification', 'Sending confirmation'),
];

const { triggerUpdateDomainIndex } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
  },
});

const {
  getOrderDetailsOrThrow,
  updateOrderItemStatusOrThrow,
  updateOrderStatusOrThrow,
  trackPaymentProcessed,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});

export interface ProcessOrderWorkflowInput {
  orderId: string;
  paymentsMetadata: {
    [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
  };
}

/**
 * The processOrder workflow processes an order by:
 * 1. Getting the order details
 * 2. Charging the user for the order
 * 3. Processing each order item
 * 4. Handling failures and partial completions
 * 5. Notifying the user of the result
 */
// TODO: (sid) Refactor this workflow to be more readable and maintainable.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: it's meant to be complex, unfortunately.
export async function processOrderWorkflow(
  input: ProcessOrderWorkflowInput,
): Promise<void> {
  const temporalNow = (): number => {
    const info = workflow.workflowInfo();
    return info.unsafe?.now ? info.unsafe.now() : Date.now();
  };

  const startedAt = temporalNow();
  const state: ProcessOrderWorkflowPublicState = {
    orderId: input.orderId,
    phase: 'INITIALIZING',
    status: orderStatusSchema.enum.CREATED,
    steps: BASE_STEPS.map((step) => ({ ...step })),
    items: [],
    payment: {
      status: 'PENDING',
    },
    refund: {
      status: 'NOT_REQUIRED',
      amountInUsdCents: 0,
    },
    notification: {
      status: 'PENDING',
    },
    summary: {
      totalItems: 0,
      succeededItems: 0,
      failedItems: 0,
    },
    timestamps: {
      startedAt,
      lastUpdatedAt: startedAt,
    },
  };

  const touch = () => {
    state.timestamps.lastUpdatedAt = temporalNow();
  };

  const setPhase = (phase: ProcessOrderWorkflowPhase) => {
    state.phase = phase;
    touch();
  };

  const updateOrderStatus = (status: OrderStatus) => {
    state.status = status;
    touch();
  };

  const findStep = (id: ProcessOrderWorkflowStepId) =>
    state.steps.find((step) => step.id === id);

  const setStepStatus = (
    id: ProcessOrderWorkflowStepId,
    status: ProcessOrderWorkflowStepStatus,
    message?: string,
  ) => {
    const step = findStep(id);
    if (!step) return;
    if (step.status !== status) {
      step.status = status;
      if (status === 'IN_PROGRESS') {
        step.startedAt = step.startedAt ?? temporalNow();
      }
      if (
        status === 'COMPLETED' ||
        status === 'FAILED' ||
        status === 'SKIPPED'
      ) {
        step.completedAt = temporalNow();
      }
    }
    if (message !== undefined) {
      step.message = message;
    }
    touch();
  };

  const updatePayment = (
    status: ProcessOrderWorkflowPublicState['payment']['status'],
    message?: string,
  ) => {
    state.payment.status = status;
    if (message !== undefined) {
      state.payment.message = message;
    }
    touch();
  };

  const updateRefund = (
    patch: Partial<ProcessOrderWorkflowPublicState['refund']>,
  ) => {
    state.refund = {
      ...state.refund,
      ...patch,
    };
    touch();
  };

  const updateNotification = (
    patch: Partial<ProcessOrderWorkflowPublicState['notification']>,
  ) => {
    state.notification = {
      ...state.notification,
      ...patch,
    };
    touch();
  };

  const recomputeSummary = () => {
    let succeededItems = 0;
    let failedItems = 0;
    for (const item of state.items) {
      if (item.status === 'SUCCEEDED') {
        succeededItems += 1;
      } else if (item.status === 'FAILED') {
        failedItems += 1;
      }
    }
    state.summary = {
      totalItems: state.items.length,
      succeededItems,
      failedItems,
    };
    touch();
  };

  const ensureItem = (
    item: ProcessOrderWorkflowItemProgress,
  ): ProcessOrderWorkflowItemProgress => {
    const existing = state.items.find((entry) => entry.itemId === item.itemId);
    if (existing) {
      return existing;
    }
    item.lastUpdatedAt = temporalNow();
    state.items.push(item);
    recomputeSummary();
    return item;
  };

  const updateItem = (
    itemId: string,
    patch: Partial<ProcessOrderWorkflowItemProgress>,
  ) => {
    const entry = state.items.find((item) => item.itemId === itemId);
    if (!entry) return;
    Object.assign(entry, patch, { lastUpdatedAt: temporalNow() });
    recomputeSummary();
  };

  workflow.setHandler(getOrderProgressQuery, () => state);

  workflow.log.info('Processing order', {
    orderId: input.orderId,
  });

  try {
    setPhase('FETCHING_ORDER');
    setStepStatus('order-details', 'IN_PROGRESS');

    const orderDetails = await getOrderDetailsOrThrow(input.orderId);
    const nftWalletAddress = orderDetails.order.nftWalletAddress;
    const nftChainId = orderDetails.order.nftChainId;

    workflow.upsertSearchAttributes({
      orderId: [input.orderId],
      userId: [orderDetails.order.userId],
    });

    workflow.upsertMemo({
      order: {
        orderId: input.orderId,
        userId: orderDetails.order.userId,
        description: `Processing order ${input.orderId}`,
      },
    });

    if (orderDetails.items) {
      for (const item of orderDetails.items) {
        ensureItem({
          itemId: item.id,
          domain: item.normalizedDomainName as NamefiNormalizedDomain,
          type: (item.type as 'REGISTER' | 'IMPORT') ?? 'REGISTER',
          durationInYears: item.durationInYears,
          registrarKey: item.registrar,
          status: 'PENDING',
          lastUpdatedAt: temporalNow(),
        });
      }
    }

    if (!orderDetails.items || orderDetails.items.length === 0) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.FAILED,
      });
      setStepStatus(
        'order-details',
        'FAILED',
        'Order is missing items to process',
      );
      updateOrderStatus(orderStatusSchema.enum.FAILED);
      setPhase('FAILED');
      throw new Error('Order is empty or malformed');
    }

    if (!(nftWalletAddress && nftChainId)) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.FAILED,
      });
      setStepStatus(
        'order-details',
        'FAILED',
        'Wallet metadata is incomplete for this order',
      );
      updateOrderStatus(orderStatusSchema.enum.FAILED);
      setPhase('FAILED');
      throw new workflow.ApplicationFailure(
        'Order is missing NFT wallet address or chain ID, this should not happen, please investigate',
      );
    }

    await updateOrderStatusOrThrow({
      orderId: input.orderId,
      status: orderStatusSchema.enum.PROCESSING,
    });
    updateOrderStatus(orderStatusSchema.enum.PROCESSING);
    setStepStatus('order-details', 'COMPLETED');

    if (orderDetails.payments.length === 0) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.FAILED,
      });
      updateOrderStatus(orderStatusSchema.enum.FAILED);
      setStepStatus(
        'payments',
        'FAILED',
        'No payment information available for this order',
      );
      setPhase('FAILED');
      throw new workflow.ApplicationFailure('No payment found');
    }

    try {
      setPhase('CHARGING');
      setStepStatus('payments', 'IN_PROGRESS');
      updatePayment('CHARGING');
      await workflow.executeChild(multiChargeWorkflow, {
        args: [
          {
            orderId: input.orderId,
            userId: orderDetails.order.userId,
            paymentsData: orderDetails.payments.map((p) => ({
              paymentId: p.id,
              amountInUSDCents: p.amountInUSDCents,
              metadata: input.paymentsMetadata[p.id],
            })),
          },
        ],
        workflowId: `multi-charge-order-[${input.orderId}]`,
        taskQueue: TEMPORAL_QUEUES.DEFAULT,
        retry: { maximumAttempts: 1 },
      });
      updatePayment('CHARGED');
      setStepStatus('payments', 'COMPLETED');
      try {
        await trackPaymentProcessed({
          userId: orderDetails.order.userId,
          orderId: input.orderId,
          amountInUsdCents: orderDetails.order.amountInUSDCents,
          paymentCount: orderDetails.payments.length,
          paymentProviders: orderDetails.payments.map(
            (payment) => payment.paymentProvider,
          ),
        });
      } catch (error) {
        workflow.log.warn(
          `Failed to track payment_processed event for order ${input.orderId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    } catch (error) {
      for (const item of orderDetails.items) {
        const [updateStatusError] = await resolve(
          updateOrderItemStatusOrThrow({
            orderItemId: item.id,
            status: orderStatusSchema.enum.CANCELLED,
          }),
        );
        if (updateStatusError) {
          workflow.log.error(
            `Failed to update orderItem ${item.id} status to ${orderStatusSchema.enum.CANCELLED}: ${
              updateStatusError instanceof Error
                ? updateStatusError.message
                : String(updateStatusError)
            }`,
          );
        }
        updateItem(item.id, {
          status: 'CANCELLED',
          message: 'Cancelled after payment failure',
        });
      }
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.FAILED,
      });
      updateOrderStatus(orderStatusSchema.enum.FAILED);
      updatePayment(
        'FAILED',
        error instanceof Error ? error.message : String(error),
      );
      setStepStatus('payments', 'FAILED', 'Payment attempt failed');
      setPhase('FAILED');
      throw error instanceof Error ? error : new Error(String(error));
    }

    setPhase('PROCESSING_ITEMS');
    setStepStatus('items', 'IN_PROGRESS');

    // Send early notification for orders containing import items
    // Import orders can take 5-7 days to complete, so we notify users immediately
    // Wrapped in workflow.patched() to handle in-flight workflows during deployment
    if (workflow.patched('early-import-notification')) {
      const hasImportItems = orderDetails.items.some(
        (item) => item.type === 'IMPORT',
      );
      if (hasImportItems) {
        try {
          // Re-fetch order details to ensure payment fields are populated after charge
          const refreshedOrderDetails = await getOrderDetailsOrThrow(
            input.orderId,
          );
          const notificationResult = await _notifyUserImportOrderSubmitted(
            refreshedOrderDetails,
          );
          if (notificationResult.status === 'SENT') {
            workflow.log.info(
              `Sent early notification for import order ${input.orderId}`,
            );
          } else if (notificationResult.status === 'FAILED') {
            workflow.log.warn(
              `Early notification for import order ${input.orderId} failed${notificationResult.message ? `: ${notificationResult.message}` : ''}`,
            );
          } else {
            workflow.log.info(
              `Early notification for import order ${input.orderId} was ${notificationResult.status.toLowerCase()}${notificationResult.message ? `: ${notificationResult.message}` : ''}`,
            );
          }
        } catch (error) {
          // Don't fail the workflow if early notification fails
          workflow.log.warn(
            `Failed to send early notification for import order ${input.orderId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    const orderItemPromises = orderDetails.items.map((item) => {
      updateItem(item.id, {
        status: 'PROCESSING',
        message: undefined,
      });

      return workflow
        .executeChild(processOrderItemWorkflow, {
          args: [
            {
              itemId: item.id,
              orderId: input.orderId,
              normalizedDomainName:
                item.normalizedDomainName as NamefiNormalizedDomain,
              durationInYears: item.durationInYears,
              recipientWalletAddress: nftWalletAddress as ChecksumWalletAddress,
              chainId: nftChainId,
              userId: orderDetails.order.userId,
              operationType: item.type as 'REGISTER' | 'IMPORT',
              registrarKey: item.registrar,
              encryptedEppAuthorizationCode: item.encryptedEppAuthorizationCode,
              encryptionKeyId: item.encryptionKeyId,
            },
          ],
          workflowId: `process-order-item-[${item.id}]`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: {
            maximumAttempts: 1,
          },
          workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
          parentClosePolicy: 'REQUEST_CANCEL',
        })
        .then(() => {
          updateItem(item.id, {
            status: 'SUCCEEDED',
            message: undefined,
          });
        })
        .catch((error) => {
          updateItem(item.id, {
            status: 'FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        });
    });

    const orderItemResults = await Promise.allSettled(orderItemPromises);
    recomputeSummary();

    const failedItems = orderDetails.items.filter(
      (_, index) => orderItemResults[index].status === 'rejected',
    );
    const succeededItems = orderDetails.items.filter(
      (_, index) => orderItemResults[index].status === 'fulfilled',
    );

    if (failedItems.length === 0) {
      setStepStatus('items', 'COMPLETED', 'All domains secured successfully');
    } else if (succeededItems.length === 0) {
      setStepStatus('items', 'FAILED', 'All domains failed during processing');
    } else {
      setStepStatus(
        'items',
        'COMPLETED',
        'Some domains were secured, some need attention',
      );
    }

    setPhase('POST_PROCESSING');
    setStepStatus('post-processing', 'IN_PROGRESS');

    try {
      await triggerUpdateDomainIndex();
    } catch (error) {
      workflow.log.error(
        `Failed to trigger update domain index for order ${input.orderId}. Error: ${error}`,
      );
      setStepStatus(
        'post-processing',
        'FAILED',
        'Unable to refresh domain index',
      );
    }

    try {
      if (succeededItems.length > 0) {
        await postProcessOrder();
        const purchasedDomains = succeededItems.map(
          (item) => item.normalizedDomainName,
        );
        if (purchasedDomains.length > 0) {
          await workflow.startChild(generateLogosForAliveNftsWorkflow, {
            args: [
              {
                model: 'gpt-image-1.5',
                domains: purchasedDomains,
              },
            ],
            workflowId: `logo-gen-after-order-[${input.orderId}]`,
            taskQueue: TEMPORAL_QUEUES.DEFAULT,
            retry: { maximumAttempts: 1 },
            parentClosePolicy: 'ABANDON',
          });
        }
      }

      const postProcessItems = succeededItems.filter(
        (item) => item.metadata?.postProcessOrderItem,
      );
      await Promise.all(
        postProcessItems.map((item) =>
          catchAndAlertLocally(
            async () => {
              const postProcessOrderItem = item.metadata?.postProcessOrderItem;
              if (!postProcessOrderItem) {
                return;
              }
              await workflow.startChild(postProcessOrderItemWorkflow, {
                args: [
                  {
                    orderId: input.orderId,
                    orderItemId: item.id,
                    userId: orderDetails.order.userId,
                    normalizedDomainName:
                      item.normalizedDomainName as NamefiNormalizedDomain,
                    postProcessOrderItem,
                  },
                ],
                workflowId: `post-process-order-item-[${item.id}]`,
                taskQueue: TEMPORAL_QUEUES.DOMAINS,
                retry: { maximumAttempts: 1 },
                parentClosePolicy: 'ABANDON',
              });
            },
            {
              message: `Post-process order item failed for ${item.id}`,
              details: {
                orderId: input.orderId,
                orderItemId: item.id,
              },
            },
          ),
        ),
      );

      if (findStep('post-processing')?.status === 'IN_PROGRESS') {
        setStepStatus('post-processing', 'COMPLETED');
      }
    } catch (error) {
      workflow.log.error(
        `Failed to post-process order ${input.orderId}. Error: ${error}`,
      );
      setStepStatus(
        'post-processing',
        'FAILED',
        'Post-processing tasks encountered an issue',
      );
    }

    setPhase('FINALIZING');
    setStepStatus('final-status', 'IN_PROGRESS');

    if (failedItems.length === 0) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.SUCCEEDED,
      });
      updateOrderStatus(orderStatusSchema.enum.SUCCEEDED);
      setStepStatus('final-status', 'COMPLETED', 'Order completed');
    } else if (succeededItems.length === 0) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.FAILED,
      });
      updateOrderStatus(orderStatusSchema.enum.FAILED);
      setStepStatus(
        'final-status',
        'FAILED',
        'Order failed, no domains were secured',
      );
    } else {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.PARTIALLY_COMPLETED,
      });
      updateOrderStatus(orderStatusSchema.enum.PARTIALLY_COMPLETED);
      setStepStatus(
        'final-status',
        'COMPLETED',
        'Order completed with partial success',
      );
    }

    const amountToRefund = failedItems.reduce((acc, item) => {
      return acc + item.amountInUSDCents;
    }, 0);

    if (amountToRefund > 0) {
      updateRefund({
        status: 'PROCESSING',
        amountInUsdCents: amountToRefund,
      });
      setStepStatus('refund', 'IN_PROGRESS');
      try {
        await workflow.executeChild(multiRefundWorkflow, {
          args: [
            {
              orderId: input.orderId,
              paymentIds: orderDetails.payments.map((p) => p.id),
              amountToRefundInUsdCents: amountToRefund,
            },
          ],
          workflowId: `multi-refund-order-[${input.orderId}]`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: { maximumAttempts: 1 },
          workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
          parentClosePolicy: 'REQUEST_CANCEL',
        });
        updateRefund({
          status: 'COMPLETED',
        });
        setStepStatus('refund', 'COMPLETED');
      } catch (error) {
        updateRefund({
          status: 'FAILED',
        });
        setStepStatus(
          'refund',
          'FAILED',
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }
    } else {
      updateRefund({
        status: 'NOT_REQUIRED',
        amountInUsdCents: 0,
      });
      setStepStatus('refund', 'SKIPPED', 'No refund required');
    }

    setStepStatus('notification', 'IN_PROGRESS');
    if (workflow.patched('update-order-details-before-notification')) {
      const updatedOrder = await getOrderDetailsOrThrow(input.orderId);
      const notificationSummary = await _notifyUserOrderProcessed(
        updatedOrder,
        orderItemResults,
        amountToRefund,
      );
      updateNotification({
        status: notificationSummary.status,
        message: notificationSummary.message,
      });

      if (notificationSummary.status === 'FAILED') {
        setStepStatus(
          'notification',
          'FAILED',
          notificationSummary.message ??
            'Unable to send confirmation at this time',
        );
      } else if (notificationSummary.status === 'SKIPPED') {
        setStepStatus(
          'notification',
          'SKIPPED',
          notificationSummary.message ?? 'Notification skipped',
        );
      } else {
        setStepStatus('notification', 'COMPLETED');
      }
    } else {
      const notificationSummary = await _notifyUserOrderProcessed(
        orderDetails,
        orderItemResults,
        amountToRefund,
      );
      updateNotification({
        status: notificationSummary.status,
        message: notificationSummary.message,
      });

      if (notificationSummary.status === 'FAILED') {
        setStepStatus(
          'notification',
          'FAILED',
          notificationSummary.message ??
            'Unable to send confirmation at this time',
        );
      } else if (notificationSummary.status === 'SKIPPED') {
        setStepStatus(
          'notification',
          'SKIPPED',
          notificationSummary.message ?? 'Notification skipped',
        );
      } else {
        setStepStatus('notification', 'COMPLETED');
      }
    }

    // Send Slack notification for order completion (non-blocking)
    await catchAndAlertLocally(
      async () => {
        await _sendOrderCompletionSlackAlert(orderDetails, orderItemResults);
      },
      {
        message: `Failed to send Slack order completion alert for order ${input.orderId}`,
        details: { orderId: input.orderId },
      },
    );

    setPhase('COMPLETED');
    state.timestamps.completedAt = temporalNow();
  } catch (e) {
    try {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.enum.FAILED,
      });
    } catch (updateError) {
      workflow.log.error(
        `Failed to update order status to FAILED for order ${input.orderId}. Error: ${updateError}`,
      );
    }

    updateOrderStatus(orderStatusSchema.enum.FAILED);
    setPhase('FAILED');
    state.error = e instanceof Error ? e.message : String(e);
    if (!state.timestamps.completedAt) {
      state.timestamps.completedAt = temporalNow();
    }

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Process Order Failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : new Error(String(e)),
    });
  }
}

/**
 * Payment provider priority for selecting which payment to show in notifications.
 * Stripe is preferred as it's more user-relevant than crypto payments.
 */
const PAYMENT_PROVIDER_PRIORITY = [
  'STRIPE',
  'NFSC_ETHEREUM_SEPOLIA',
  'NFSC_BASE',
  'NFSC_ETHEREUM',
] as const;

/**
 * Get the priority rank for a payment provider.
 * Returns the index in PAYMENT_PROVIDER_PRIORITY, or Infinity for unknown providers
 * to ensure they sort after all known providers.
 */
function _getProviderRank(provider: string): number {
  const index = PAYMENT_PROVIDER_PRIORITY.indexOf(
    provider as (typeof PAYMENT_PROVIDER_PRIORITY)[number],
  );
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

/**
 * Select the best payment for notification purposes and extract the payment method identifier.
 * Returns the chosen payment provider and its identifier (Stripe payment method ID or wallet address).
 * Returns undefined for both fields if no known payment provider is found.
 */
function _selectPaymentForNotification(
  payments: Awaited<ReturnType<typeof getOrderDetailsOrThrow>>['payments'],
): {
  paymentMethodCharged: (typeof PAYMENT_PROVIDER_PRIORITY)[number] | undefined;
  paymentMethodIdentifier: string | undefined;
} {
  const chosenPayment = [...payments].sort(
    (a, b) =>
      _getProviderRank(a.paymentProvider) - _getProviderRank(b.paymentProvider),
  )[0];

  // If no payment or the chosen payment has an unknown provider, return undefined
  if (
    !chosenPayment ||
    _getProviderRank(chosenPayment.paymentProvider) === Number.POSITIVE_INFINITY
  ) {
    return {
      paymentMethodCharged: undefined,
      paymentMethodIdentifier: undefined,
    };
  }

  const paymentMethodCharged =
    chosenPayment.paymentProvider as (typeof PAYMENT_PROVIDER_PRIORITY)[number];
  const paymentMethodIdentifier =
    paymentMethodCharged === 'STRIPE'
      ? chosenPayment.stripePaymentDetails?.paymentMethodId
      : chosenPayment.nfscPaymentDetails?.walletAddress;

  return { paymentMethodCharged, paymentMethodIdentifier };
}

async function postProcessOrder() {
  const { triggerGenerateAndUpdateDataForDomains } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
    },
  });

  const results = await Promise.allSettled([
    triggerGenerateAndUpdateDataForDomains(),
    triggerUpdateDomainIndex(),
  ]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      workflow.log.error(
        `Failed to post-process order, ${index === 0 ? 'GPT' : 'NFT Index'}. Error: ${result.reason}`,
      );
    }
  });
}

async function _notifyUserOrderProcessed(
  orderDetails: Awaited<ReturnType<typeof getOrderDetailsOrThrow>>,
  orderItemsResults: PromiseSettledResult<void>[],
  amountToRefund: number,
): Promise<NotificationResult> {
  const { notifyUserOrderProcessed, maybeGetUserEmail } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: {
      ...shortRunningOpts,
    },
  });
  const userEmail = await maybeGetUserEmail(orderDetails.order.userId);
  if (!userEmail) {
    const message = `Failed to notify user for order ${orderDetails.order.id}. User has no primary email`;
    workflow.upsertMemo({
      notifyUserOrderProcessed: {
        message,
      },
    });
    workflow.log.warn(message);
    return { status: 'SKIPPED', message };
  }
  const { paymentMethodCharged, paymentMethodIdentifier } =
    _selectPaymentForNotification(orderDetails.payments);

  if (!paymentMethodCharged || !paymentMethodIdentifier) {
    const message = `Failed to notify user for order ${orderDetails.order.id}. Payment method identifier is missing`;
    workflow.upsertMemo({
      notifyUserOrderProcessed: {
        message,
      },
    });
    workflow.log.warn(message);
    return { status: 'SKIPPED', message };
  }

  try {
    await notifyUserOrderProcessed({
      orderId: orderDetails.order.id,
      recipientName: userEmail,
      recipientEmail: userEmail,
      items: orderDetails.items.map((item, index) => ({
        normalizedDomainName: item.normalizedDomainName,
        duration: item.durationInYears,
        priceInUsdCents: item.amountInUSDCents,
        status:
          orderItemsResults[index].status === 'fulfilled'
            ? 'SUCCEEDED'
            : 'FAILED',
        type: item.type,
      })),
      chargedAmountInUsdCents: orderDetails.order.amountInUSDCents,
      paymentMethodCharged,
      paymentMethodIdentifier,
      refund:
        amountToRefund > 0
          ? {
              amountInUsd: workflow.patched('refund-cents-fix')
                ? amountToRefund / 100
                : amountToRefund,
              status: 'PROCESSING',
            }
          : undefined,
    });
    return { status: 'SENT' };
  } catch (e) {
    workflow.log.error(
      `Failed to notify user for order ${orderDetails.order.id}. Error: ${e}`,
    );
    const message = e instanceof Error ? e.message : String(e);
    return {
      status: 'FAILED',
      message,
    };
  }
}

/**
 * Send an early notification for import orders immediately after payment is charged.
 * This notifies users that their import order has been submitted and is being processed,
 * since domain transfers can take 5-7 days to complete.
 */
async function _notifyUserImportOrderSubmitted(
  orderDetails: Awaited<ReturnType<typeof getOrderDetailsOrThrow>>,
): Promise<NotificationResult> {
  const { notifyUserOrderProcessed, maybeGetUserEmail } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: {
      ...shortRunningOpts,
    },
  });

  const userEmail = await maybeGetUserEmail(orderDetails.order.userId);
  if (!userEmail) {
    const message = 'User has no primary email';
    workflow.log.warn(
      `Skipping early import notification for order ${orderDetails.order.id}. ${message}`,
    );
    return { status: 'SKIPPED', message };
  }

  const { paymentMethodCharged, paymentMethodIdentifier } =
    _selectPaymentForNotification(orderDetails.payments);

  if (!paymentMethodCharged || !paymentMethodIdentifier) {
    const message = 'Payment method identifier is missing';
    workflow.log.warn(
      `Skipping early import notification for order ${orderDetails.order.id}. ${message}`,
    );
    return { status: 'SKIPPED', message };
  }

  try {
    // For import items, set status to 'PROCESSING' to trigger the import info section in the email
    // For non-import items (if any), also set to 'PROCESSING' since they haven't been processed yet
    await notifyUserOrderProcessed({
      orderId: orderDetails.order.id,
      recipientName: userEmail,
      recipientEmail: userEmail,
      items: orderDetails.items.map((item) => ({
        normalizedDomainName: item.normalizedDomainName,
        duration: item.durationInYears,
        priceInUsdCents: item.amountInUSDCents,
        status: 'PROCESSING',
        type: item.type,
      })),
      chargedAmountInUsdCents: orderDetails.order.amountInUSDCents,
      paymentMethodCharged,
      paymentMethodIdentifier,
    });
    return { status: 'SENT' };
  } catch (e) {
    workflow.log.error(
      `Failed to send early import notification for order ${orderDetails.order.id}. Error: ${e}`,
    );
    const message = e instanceof Error ? e.message : String(e);
    return { status: 'FAILED', message };
  }
}

async function _sendOrderCompletionSlackAlert(
  orderDetails: Awaited<ReturnType<typeof getOrderDetailsOrThrow>>,
  orderItemsResults: PromiseSettledResult<void>[],
): Promise<void> {
  const { sendOrderCompletionSlackAlert } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const { maybeGetUserEmail } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: {
      ...shortRunningOpts,
    },
  });

  const userEmail = await maybeGetUserEmail(orderDetails.order.userId);
  const walletAddress = orderDetails.order.nftWalletAddress;

  const info = workflow.workflowInfo();
  const workflowId = info.workflowId;
  const runId = info.runId;

  const domains = orderDetails.items.map((item, index) => ({
    normalizedDomainName: item.normalizedDomainName,
    type: (item.type as 'REGISTER' | 'IMPORT') ?? 'REGISTER',
    status:
      orderItemsResults[index].status === 'fulfilled'
        ? ('SUCCEEDED' as const)
        : ('FAILED' as const),
  }));

  await sendOrderCompletionSlackAlert({
    orderId: orderDetails.order.id,
    userId: orderDetails.order.userId,
    userEmail: userEmail ?? undefined,
    walletAddress: walletAddress ?? undefined,
    domains,
    workflowId,
    runId,
  });
}
