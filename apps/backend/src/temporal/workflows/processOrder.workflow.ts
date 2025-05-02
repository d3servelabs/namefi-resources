import { orderStatusSchema, paymentStatusSchema } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import type { NotifyActivities } from '../activities/notify.activities';
import type { OrderActivities } from '../activities/order.activities';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  type ChargeUserWorkflowInput,
  chargeUserWorkflow,
} from './chargeUser.workflow';
import { finalizePaymentWorkflow } from './finalize-payment-workflow';
import {
  NotificationChannel,
  notifyUserWorkflow,
} from './notify-user-workflow';
import { processOrderItemWorkflow } from './processOrderItem.workflow';

export interface ProcessOrderWorkflowInput {
  orderId: string;
  paymentMetadata: ChargeUserWorkflowInput['metadata'];
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
  workflow.log.info('Processing order', {
    orderId: input.orderId,
  });

  // MARK: - Activity Setup
  const { getOrderDetailsOrThrow, updateOrderStatusOrThrow } =
    workflow.proxyActivities<OrderActivities>({
      ...shortRunningOpts,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
    });

  const { getOrderProcessedEmailContent } =
    workflow.proxyActivities<NotifyActivities>({
      ...shortRunningOpts,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
    });

  try {
    // MARK: - Get Order Details
    const orderDetails = await getOrderDetailsOrThrow(input.orderId);
    if (!orderDetails.items || orderDetails.items.length === 0) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.Values.FAILED,
      });
      throw new Error('Order is empty or malformed');
    }

    // Update order status to PROCESSING
    await updateOrderStatusOrThrow({
      orderId: input.orderId,
      status: orderStatusSchema.Values.PROCESSING,
    });

    // Charge the user for the order
    const chargeResult = await workflow.executeChild(chargeUserWorkflow, {
      args: [
        {
          userId: orderDetails.userId,
          paymentId: orderDetails.paymentId,
          metadata: input.paymentMetadata,
        },
      ],
      workflowId: `charge-user-${orderDetails.paymentId}`,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      retry: {
        maximumAttempts: 1,
      },
    });

    // If payment failed, update order status and exit
    if (
      chargeResult.paymentStatus !== paymentStatusSchema.Values.SUCCEEDED &&
      chargeResult.paymentStatus !== paymentStatusSchema.Values.REQUIRES_CAPTURE
    ) {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.Values.FAILED,
      });
      throw new Error('Payment failed');
    }

    // MARK: - Process Order Items
    const orderItemResults = await Promise.allSettled(
      orderDetails.items.map((item) =>
        workflow.executeChild(processOrderItemWorkflow, {
          args: [
            {
              itemId: item.id,
              orderId: input.orderId,
              normalizedDomainName:
                item.normalizedDomainName as NamefiNormalizedDomain,
              nftWalletAddress: orderDetails.nftWalletAddress as `0x${string}`,
              nftChainId: orderDetails.nftChainId,
            },
          ],
          workflowId: `process-order-item-${item.id}`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: {
            maximumAttempts: 1,
          },
        }),
      ),
    );

    // MARK: - Handle Results
    const failedItems = orderDetails.items.filter(
      (_, index) => orderItemResults[index].status === 'rejected',
    );
    const succeededItems = orderDetails.items.filter(
      (_, index) => orderItemResults[index].status === 'fulfilled',
    );

    // MARK: - Update Order Status
    if (failedItems.length === 0) {
      // All items succeeded
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.Values.SUCCEEDED,
      });
    } else if (succeededItems.length === 0) {
      // All items failed
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.Values.FAILED,
      });
    } else {
      // Some items succeeded, some failed
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.Values.PARTIALLY_COMPLETED,
      });
    }

    const amountToRefund = failedItems.reduce((acc, item) => {
      return acc + item.amountInUSDCents;
    }, 0);

    const amountToCapture = succeededItems.reduce((acc, item) => {
      return acc + item.amountInUSDCents;
    }, 0);

    await workflow.executeChild(finalizePaymentWorkflow, {
      args: [
        {
          paymentId: orderDetails.paymentId,
          amountToCaptureInUsdCents: amountToCapture,
          amountToRefundInUsdCents: amountToRefund,
        },
      ],
      workflowId: `finalize-payment-${orderDetails.paymentId}`,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      retry: {
        maximumAttempts: 1,
      },
    });

    // MARK: - Notify User if we have their email
    if (orderDetails.user.primaryEmail) {
      const subject =
        failedItems.length === 0
          ? 'Namefi Order Processing Succeeded'
          : failedItems.length === orderDetails.items.length
            ? 'Namefi Order Processing Failed'
            : 'Namefi Order Processing Partially Completed';

      try {
        const { content } = await getOrderProcessedEmailContent({
          orderId: input.orderId,
          succeededItems,
          failedItems,
        });

        await workflow.executeChild(notifyUserWorkflow, {
          args: [
            {
              userId: orderDetails.userId,
              channel: NotificationChannel.EMAIL,
              payload: {
                subject,
                content: {
                  plain: content,
                  html: content,
                },
              },
            },
          ],
          workflowId: `notify-user-${orderDetails.userId}`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: {
            maximumAttempts: 1,
          },
        });
      } catch (e) {
        workflow.log.error(
          `Failed to notify user for order ${input.orderId}. Error: ${e}`,
        );
      }
    }

    try {
      await postProcessOrder();
    } catch (e) {
      workflow.log.error(
        `Failed to post-process order ${input.orderId}. Error: ${e}`,
      );
    }
  } catch (e) {
    // Update order status to FAILED if an exception occurs
    try {
      await updateOrderStatusOrThrow({
        orderId: input.orderId,
        status: orderStatusSchema.Values.FAILED,
      });
    } catch (updateError) {
      workflow.log.error(
        `Failed to update order status to FAILED for order ${input.orderId}. Error: ${updateError}`,
      );
    }

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Process Order Failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : new Error(String(e)),
    });
  }
}

async function postProcessOrder() {
  const { triggerNamefiGptCronJob, triggerUpdateNamefiNftIndex } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        ...shortRunningOpts,
      },
    });

  const results = await Promise.allSettled([
    triggerNamefiGptCronJob(),
    triggerUpdateNamefiNftIndex(),
  ]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      workflow.log.error(
        `Failed to post-process order, ${index === 0 ? 'GPT' : 'NFT Index'}. Error: ${result.reason}`,
      );
    }
  });
}
