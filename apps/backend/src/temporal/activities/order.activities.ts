import type { OrderStatus } from '@namefi-astra/db/types';
import { orderService } from '#services/orders/orders.service';
import {
  db,
  ordersTable,
  orderItemsTable,
  paymentsTable,
  orderStatusSchema,
  type OrderItemInsert,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
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

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderItemStatusOrThrow: typeof updateOrderItemStatusOrThrow;
  updateOrderStatusOrThrow: typeof updateOrderStatusOrThrow;
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
      ? orderStatusSchema.Values.FAILED
      : failureCount > 0
        ? orderStatusSchema.Values.PARTIALLY_COMPLETED
        : orderStatusSchema.Values.SUCCEEDED;
  // Create the order
  const [order] = await db
    .insert(ordersTable)
    .values({
      userId,
      paymentId,
      status: orderStatus,
      amountInUSDCents: totalAmountInUsd * 100,
      totalAmountInUSDCents: totalAmountInUsd * 100,
      metadata: {
        autoRenew: true,
        renewalSummary: {
          successCount,
          failureCount,
          totalAttempted: domainRenewResults.length,
        },
      },
    })
    .returning({ id: ordersTable.id });

  logger.info(
    { orderId: order.id, successCount, failureCount },
    'Created auto-renew order %s with %d successes and %d failures',
    order.id,
    successCount,
    failureCount,
  );

  // Create order items for each domain renewal result
  const orderItems = domainRenewResults.map(
    (result) =>
      ({
        orderId: order.id,
        normalizedDomainName: result.normalizedDomainName,
        amountInUSDCents: result.chargeAmountInUsd * 100,
        durationInYears: 1,
        type: 'RENEW' as const,
        registrar: result.registrarKey,
        status:
          result.status === 'SUCCESS'
            ? orderStatusSchema.Values.SUCCEEDED
            : orderStatusSchema.Values.FAILED,
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
      }) satisfies OrderItemInsert,
  );

  if (orderItems.length > 0) {
    await db.insert(orderItemsTable).values(orderItems);

    logger.info(
      { orderId: order.id, itemCount: orderItems.length },
      'Created %d order items for auto-renew order %s',
      orderItems.length,
      order.id,
    );
  }

  return { orderId: order.id };
}
