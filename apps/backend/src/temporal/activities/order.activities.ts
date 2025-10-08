import type { OrderStatus } from '@namefi-astra/db/types';
import {
  orderService,
  type CreateOrderItemInput,
} from '#services/orders/orders.service';
import {
  db,
  ordersTable,
  orderItemsTable,
  paymentsTable,
  orderStatusSchema,
} from '@namefi-astra/db';
import { eq, and } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { logger } from '#lib/logger';

export function getOrderDetailsOrThrow(orderId: string) {
  return orderService.getOrderDetailsOrThrow(orderId);
}

export async function updateOrderItemStatusOrThrow({
  orderItemId,
  status,
}: {
  orderItemId: string;
  status: OrderStatus;
}) {
  const [updatedOrderItem] = await db
    .update(orderItemsTable)
    .set({
      status,
    })
    .where(eq(orderItemsTable.id, orderItemId))
    .returning();

  if (!updatedOrderItem) {
    throw new Error(`OrderItem not found with id ${orderItemId}`);
  }

  return updatedOrderItem;
}

export async function updateOrderStatusOrThrow({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [updatedOrder] = await db
    .update(ordersTable)
    .set({
      status,
    })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!updatedOrder) {
    throw new Error(`Order not found with id ${orderId}`);
  }

  return updatedOrder;
}

/**
 * Updates both order and order item status atomically
 * Used for single item special orders like free claims where both statuses should be synchronized
 */
export async function updateOrderAndItemStatusOrThrow({
  orderId,
  orderItemId,
  status,
}: {
  orderId: string;
  orderItemId: string;
  status: OrderStatus;
}) {
  // Use a transaction to ensure both updates happen atomically
  const result = await db.transaction(async (tx) => {
    // Update order status
    const [updatedOrder] = await tx
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error(`Order not found with id ${orderId}`);
    }

    // Update order item status
    const [updatedOrderItem] = await tx
      .update(orderItemsTable)
      .set({ status })
      .where(
        and(
          eq(orderItemsTable.id, orderItemId),
          eq(orderItemsTable.orderId, orderId),
        ),
      )
      .returning();

    if (!updatedOrderItem) {
      throw new Error(`OrderItem not found with id ${orderItemId}`);
    }
    return {
      order: updatedOrder,
      orderItem: updatedOrderItem,
    };
  });

  logger.info(
    { orderId, orderItemId, status },
    'Updated both order %s and order item %s to status %s',
    orderId,
    orderItemId,
    status,
  );

  return result;
}

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderItemStatusOrThrow: typeof updateOrderItemStatusOrThrow;
  updateOrderStatusOrThrow: typeof updateOrderStatusOrThrow;
  updateOrderAndItemStatusOrThrow: typeof updateOrderAndItemStatusOrThrow;
};

export type DomainRenewalResult = {
  normalizedDomainName: NamefiNormalizedDomain;
  status: 'SUCCESS' | 'FAILURE';
  chargeAmountInUsd: number;
  registrarKey: string;
  eppOperationStatus?: string;
  txHash?: string;
  txStatus?: string;
  error?: Error;
};

export type CreateAutoRenewOrderInput = {
  userId: string;
  paymentId: string;
  domainRenewResults: DomainRenewalResult[];
  totalAmountInUsd: number;
};

export async function createAutoRenewOrder({
  userId,
  paymentId,
  domainRenewResults,
  totalAmountInUsd,
}: CreateAutoRenewOrderInput): Promise<{ orderId: string }> {
  logger.info(
    { userId, paymentId, domainCount: domainRenewResults.length },
    'Creating auto-renew order for user %s with %d domains',
    userId,
    domainRenewResults.length,
  );

  const existingPayment = await db.query.paymentsTable.findFirst({
    where: eq(paymentsTable.id, paymentId),
  });
  if (!existingPayment) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  // Calculate success/failure counts for metadata
  const successCount = domainRenewResults.filter(
    (r) => r.status === 'SUCCESS',
  ).length;
  const failureCount = domainRenewResults.filter(
    (r) => r.status === 'FAILURE',
  ).length;

  const orderStatus =
    successCount === 0
      ? orderStatusSchema.enum.FAILED
      : failureCount > 0
        ? orderStatusSchema.enum.PARTIALLY_COMPLETED
        : orderStatusSchema.enum.SUCCEEDED;
  // Create order items for each domain renewal result
  const orderItems = domainRenewResults.map(
    (result) =>
      ({
        normalizedDomainName: result.normalizedDomainName,
        amountInUSDCents: result.chargeAmountInUsd * 100,
        durationInYears: 1,
        type: 'RENEW' as const,
        registrar: result.registrarKey,
        status:
          result.status === 'SUCCESS'
            ? orderStatusSchema.enum.SUCCEEDED
            : orderStatusSchema.enum.FAILED,
        metadata: {
          autoRenew: true,
          renewalSummary: {
            eppOperationStatus: result.eppOperationStatus,
            txHash: result.txHash,
            txStatus: result.txStatus,
            error: result.error
              ? {
                  message: result.error.message,
                  name: result.error.name,
                  stack: result.error.stack,
                }
              : undefined,
          },
        },
      }) satisfies CreateOrderItemInput,
  );

  // Create the order using storage-agnostic service
  const created = await orderService.createOrderWithExistingSinglePayment({
    userId,
    paymentId,
    status: orderStatus,
    amountInUSDCents: Math.round(totalAmountInUsd * 100),
    metadata: {
      autoRenew: true,
      renewalSummary: {
        successCount,
        failureCount,
        totalAttempted: domainRenewResults.length,
      },
    },
    items: orderItems.map((item) => ({
      ...item,
      amountInUSDCents: Math.round(item.amountInUSDCents),
    })),
  });

  const order = { id: created.id } as const;

  logger.info(
    { orderId: order.id, successCount, failureCount },
    'Created auto-renew order %s with %d successes and %d failures',
    order.id,
    successCount,
    failureCount,
  );

  return { orderId: order.id };
}
