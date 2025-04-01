import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import type { OrderActivities } from '../activities/order.activities';
import type { PaymentActivities } from '../activities/payment.activities';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { chargeUserWorkflow } from './chargeUser.workflow';
import { processOrderItemWorkflow } from './processOrderItem.workflow';

export type MoneyAmount = {
  amount: number;
  currency: string;
};

export enum PaymentStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export type Address = string;

// MARK: - Workflow Execution Helpers
const executeNotifyUser = async (input: NotifyUserInput): Promise<void> => {
  return workflow.executeChild('sendNotificationWorkflow', {
    taskQueue: TEMPORAL_QUEUES.NOTIFY,
    args: [input],
  });
};

export interface ProcessOrderItemInput {
  itemId: string;
  orderId: string;
  normalizedDomainName: string;
  userAddress: Address;
}

export interface NotifyUserInput {
  userId: string;
  subject: string;
  content: string;
}

export interface ProcessOrderWorkflowInput {
  orderId: string;
}

/**
 * The processOrder workflow processes an order by:
 * 1. Getting the order details
 * 2. Charging the user for the order
 * 3. Processing each order item
 * 4. Handling failures and partial completions
 * 5. Notifying the user of the result
 */
export async function processOrderWorkflow(
  input: ProcessOrderWorkflowInput,
): Promise<void> {
  // MARK: - Activity Setup
  const { getOrderDetailsOrThrow, updateOrderStatus } =
    workflow.proxyActivities<OrderActivities>({
      ...shortRunningOpts,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
    });

  const { getPaymentDetails } = workflow.proxyActivities<PaymentActivities>({
    ...shortRunningOpts,
    taskQueue: TEMPORAL_QUEUES.DEFAULT,
  });

  try {
    // Update order status to PROCESSING
    await updateOrderStatus({
      orderId: input.orderId,
      status: 'PROCESSING',
    });

    // MARK: - Get Order Details
    const orderDetails = await getOrderDetailsOrThrow(input.orderId);
    if (!orderDetails.items || orderDetails.items.length === 0) {
      await updateOrderStatus({
        orderId: input.orderId,
        status: 'FAILED',
      });
      throw new Error('Order is empty or malformed');
    }

    // MARK: - Get Payment Details and Charge User
    const paymentDetails = await getPaymentDetails({
      paymentId: orderDetails.paymentId,
    });

    // Charge the user for the order
    const chargeResult = await workflow.executeChild(chargeUserWorkflow, {
      args: [
        {
          userId: orderDetails.userId,
          totalAmountInUsdCents: paymentDetails.amountInUSDCents,
          paymentProvider: paymentDetails.paymentProvider,
          chainId: paymentDetails.chainId || undefined,
          walletAddress: paymentDetails.walletAddress || undefined,
        },
      ],
      workflowId: `charge-user-${orderDetails.paymentId}`,
      taskQueue: TEMPORAL_ENUMS.DEFAULT,
      retry: {
        maximumAttempts: 1,
      },
    });

    // If payment failed, update order status and exit
    if (chargeResult.paymentStatus !== PaymentStatus.SUCCEEDED) {
      await updateOrderStatus({
        orderId: input.orderId,
        status: 'FAILED',
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
              normalizedDomainName: item.normalizedDomainName,
              userAddress: orderDetails.userId as Address,
            },
          ],
          workflowId: `process-order-item-${item.id}`,
          taskQueue: TEMPORAL_ENUMS.DEFAULT,
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
      await updateOrderStatus({
        orderId: input.orderId,
        status: 'SUCCEEDED',
      });
    } else if (succeededItems.length === 0) {
      // All items failed
      await updateOrderStatus({
        orderId: input.orderId,
        status: 'FAILED',
      });
    } else {
      // Some items succeeded, some failed
      await updateOrderStatus({
        orderId: input.orderId,
        status: 'SUCCEEDED', // We don't have a PARTIALLY_COMPLETED status, so use SUCCEEDED
      });
    }

    // MARK: - Notify User if we have their email
    if (orderDetails.user.primaryEmail) {
      const subject =
        failedItems.length === 0
          ? 'Namefi Order Processing Succeeded'
          : failedItems.length === orderDetails.items.length
            ? 'Namefi Order Processing Failed'
            : 'Namefi Order Processing Partially Completed';

      const content =
        failedItems.length === 0
          ? `All items in order ${input.orderId} processed successfully`
          : failedItems.length === orderDetails.items.length
            ? `Failed to process all items in order ${input.orderId}`
            : `Some items in order ${input.orderId} failed to process.\nFailed items: ${failedItems
                .map((item) => item.normalizedDomainName)
                .join(
                  ', ',
                )}.\nFollowing items were processed successfully: ${succeededItems
                .map((item) => item.normalizedDomainName)
                .join(', ')}`;

      try {
        await executeNotifyUser({
          userId: orderDetails.userId,
          subject,
          content,
        });
      } catch (e) {
        workflow.log.error(
          `Failed to notify user for order ${input.orderId}. Error: ${e}`,
        );
      }
    }
  } catch (e) {
    // Update order status to FAILED if an exception occurs
    try {
      await updateOrderStatus({
        orderId: input.orderId,
        status: 'FAILED',
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
