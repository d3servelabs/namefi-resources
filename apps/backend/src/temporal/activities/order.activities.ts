import type { OrderStatus, PaymentProvider } from '@namefi-astra/db/types';
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
  type OrderItemMetadata,
  type OrderMintTransactionMetadata,
} from '@namefi-astra/db';
import { eq, and, sql, inArray } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { logger } from '#lib/logger';
import { sendGA4Event } from '#lib/ga4-measurement';
import { NamefiEmailLinks } from '../../mail/email-links';
import { sendStyledEmailNotificationForUser } from './notify.activities';
import { config, secrets } from '#lib/env';

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

export async function trackPaymentProcessed({
  userId,
  orderId,
  amountInUsdCents,
  paymentCount,
  paymentProviders,
}: {
  userId: string;
  orderId: string;
  amountInUsdCents: number;
  paymentCount: number;
  paymentProviders: PaymentProvider[];
}) {
  const uniqueProviders = Array.from(new Set(paymentProviders));
  const paymentProvider =
    uniqueProviders.length === 1 ? uniqueProviders[0] : undefined;
  const paymentProvidersParam =
    uniqueProviders.length > 1 ? uniqueProviders.join(',') : undefined;

  try {
    await sendGA4Event({
      userId,
      event: {
        name: 'payment_processed',
        params: {
          order_id: orderId,
          amount_usd_cents: amountInUsdCents,
          payment_count: paymentCount,
          payment_provider: paymentProvider,
          payment_providers: paymentProvidersParam,
        },
      },
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId },
      'Failed to send GA payment_processed event',
    );
  }
}

export async function trackDomainAcquisition({
  userId,
  orderId,
  orderItemId,
  normalizedDomainName,
  operationType,
  registrarKey,
  durationInYears,
  chainId,
}: {
  userId: string;
  orderId: string;
  orderItemId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  operationType: 'REGISTER' | 'IMPORT';
  registrarKey?: string;
  durationInYears?: number;
  chainId?: number;
}) {
  try {
    await sendGA4Event({
      userId,
      event: {
        name: 'domain_acquisition',
        params: {
          order_id: orderId,
          order_item_id: orderItemId,
          normalized_domain_name: normalizedDomainName,
          operation_type: operationType,
          registrar_key: registrarKey,
          duration_years: durationInYears,
          chain_id: chainId,
        },
      },
    });
  } catch (error) {
    logger.warn(
      { error, orderId, orderItemId, userId, normalizedDomainName },
      'Failed to send GA domain_acquisition event',
    );
  }
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

export async function recordOrderMintTransaction({
  orderId,
  orderItemId,
  txHash,
}: {
  orderId: string;
  orderItemId: string;
  txHash: string;
}) {
  const recordedAt = new Date().toISOString();

  await db.transaction(async (tx) => {
    const details: OrderMintTransactionMetadata = {
      txHash,
      recordedAt,
    };

    const [updatedOrderItem] = await tx
      .update(orderItemsTable)
      .set({
        metadata: sql`jsonb_set(
          coalesce(${orderItemsTable.metadata}, '{}'::jsonb),
          '{mintTransaction}',
          ${JSON.stringify(details)}::jsonb,
          true
        )`,
      })
      .where(
        and(
          eq(orderItemsTable.id, orderItemId),
          eq(orderItemsTable.orderId, orderId),
        ),
      )
      .returning({ id: orderItemsTable.id });

    if (!updatedOrderItem) {
      throw new Error(
        `Order item not found when recording mint metadata (orderId=${orderId}, orderItemId=${orderItemId})`,
      );
    }

    const mintedEntry = {
      [orderItemId]: details,
    };

    const [updatedOrder] = await tx
      .update(ordersTable)
      .set({
        metadata: sql`jsonb_set(
          coalesce(${ordersTable.metadata}, '{}'::jsonb),
          '{mintTransactions}',
          coalesce(${ordersTable.metadata} -> 'mintTransactions', '{}'::jsonb) || ${JSON.stringify(mintedEntry)}::jsonb,
          true
        )`,
      })
      .where(eq(ordersTable.id, orderId))
      .returning({ id: ordersTable.id });

    if (!updatedOrder) {
      throw new Error(
        `Order not found when recording mint metadata (orderId=${orderId})`,
      );
    }
  });

  logger.info(
    { orderId, orderItemId, txHash },
    'Recorded mint transaction metadata for order %s item %s',
    orderId,
    orderItemId,
    txHash,
  );
}

export async function setOrderItemRequiredAction({
  orderItemId,
  orderId,
  requiredAction,
}: {
  orderItemId: string;
  orderId: string;
  requiredAction: OrderItemMetadata['requiredAction'] | null;
}) {
  const [updatedOrderItem] = await db
    .update(orderItemsTable)
    .set({
      metadata: requiredAction
        ? sql`jsonb_set(
            coalesce(${orderItemsTable.metadata}, '{}'::jsonb),
            '{requiredAction}',
            ${JSON.stringify(requiredAction)}::jsonb,
            true
          )`
        : sql`(${orderItemsTable.metadata} - 'requiredAction')`,
    })
    .where(
      and(
        eq(orderItemsTable.id, orderItemId),
        eq(orderItemsTable.orderId, orderId),
      ),
    )
    .returning({ id: orderItemsTable.id });

  if (!updatedOrderItem) {
    throw new Error(
      `Order item not found when setting required action (orderId=${orderId}, orderItemId=${orderItemId})`,
    );
  }

  logger.info(
    { orderId, orderItemId, requiredAction },
    'Updated order item %s requiredAction to %s for order %s',
    orderItemId,
    requiredAction ?? 'none',
    orderId,
  );

  return updatedOrderItem;
}

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderItemStatusOrThrow: typeof updateOrderItemStatusOrThrow;
  updateOrderStatusOrThrow: typeof updateOrderStatusOrThrow;
  trackPaymentProcessed: typeof trackPaymentProcessed;
  trackDomainAcquisition: typeof trackDomainAcquisition;
  updateOrderAndItemStatusOrThrow: typeof updateOrderAndItemStatusOrThrow;
  recordOrderMintTransaction: typeof recordOrderMintTransaction;
  setOrderItemRequiredAction: typeof setOrderItemRequiredAction;
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
  paymentIds: string[];
  domainRenewResults: DomainRenewalResult[];
  totalAmountInUsd: number;
};

export async function createAutoRenewOrder({
  userId,
  paymentIds,
  domainRenewResults,
  totalAmountInUsd,
}: CreateAutoRenewOrderInput): Promise<{ orderId: string }> {
  logger.info(
    { userId, paymentIds, domainCount: domainRenewResults.length },
    'Creating auto-renew order for user %s with %d payments and %d domains',
    userId,
    paymentIds.length,
    domainRenewResults.length,
  );

  // Validate all payments exist
  const existingPayments = await db.query.paymentsTable.findMany({
    where: inArray(paymentsTable.id, paymentIds),
  });
  if (existingPayments.length !== paymentIds.length) {
    throw new Error(
      `Some payments not found. Expected ${paymentIds.length}, found ${existingPayments.length}`,
    );
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

  // Create the order using storage-agnostic service with multiple payments
  const created = await orderService.createOrderWithExistingMultiplePayments({
    userId,
    paymentIds,
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

export interface SendOrderCompletionSlackAlertInput {
  orderId: string;
  userId: string;
  userEmail?: string;
  walletAddress?: string;
  domains: Array<{
    normalizedDomainName: NamefiNormalizedDomain;
    type: 'REGISTER' | 'IMPORT';
    status: 'SUCCEEDED' | 'FAILED';
  }>;
  workflowId: string;
  runId: string;
}

export async function sendOrderCompletionSlackAlert(
  input: SendOrderCompletionSlackAlertInput,
): Promise<void> {
  const webhookUrl = secrets.NAMEFI_COWBELL_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn(
      'No order alert Slack webhook URL configured, skipping Slack notification',
    );
    return;
  }

  const succeededDomains = input.domains.filter(
    (d) => d.status === 'SUCCEEDED',
  );
  if (succeededDomains.length === 0) {
    logger.info('No succeeded domains, skipping Slack notification');
    return;
  }

  const temporalUrl = `https://cloud.temporal.io/namespaces/${encodeURIComponent(config.TEMPORAL_NAMESPACE)}/workflows/${encodeURIComponent(input.workflowId)}/${encodeURIComponent(input.runId)}/history`;

  const userIdentifier = input.userEmail
    ? input.userEmail
    : input.walletAddress
      ? `${input.walletAddress.slice(0, 6)}...${input.walletAddress.slice(-4)}`
      : 'someone';

  const registerDomains = succeededDomains.filter((d) => d.type === 'REGISTER');
  const importDomains = succeededDomains.filter((d) => d.type === 'IMPORT');

  let operationType: string;
  if (registerDomains.length > 0 && importDomains.length > 0) {
    operationType = 'register and transfer';
  } else if (importDomains.length > 0) {
    operationType = 'transfer';
  } else {
    operationType = 'register';
  }

  const domainList = succeededDomains
    .map((d) => d.normalizedDomainName)
    .slice(0, 5)
    .join(', ');
  const additionalCount = succeededDomains.length - 5;
  const domainDisplay =
    additionalCount > 0
      ? `${domainList} (+${additionalCount} more)`
      : domainList;

  const message = `:tada: ${userIdentifier} has just made an order to "${operationType}" ${succeededDomains.length} domain${succeededDomains.length > 1 ? 's' : ''}: ${domainDisplay}`;

  try {
    const slackMessage = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `<${temporalUrl}|View workflow details>`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info('Successfully sent order completion alert to Slack');
  } catch (error) {
    logger.error('Failed to send order completion alert to Slack', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
type OrderRequiredAction = NonNullable<OrderItemMetadata['requiredAction']>;

export async function sendOrderRequiresFurtherActionEmail({
  normalizedDomainName,
  userId,
  orderId,
  orderItemId,
  requiredAction,
  extraMessage,
}: {
  normalizedDomainName: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  requiredAction: OrderRequiredAction;
  extraMessage?: string;
}) {
  const message =
    requiredAction === 'EPP_AUTH_CODE_UPDATE_REQUIRED'
      ? `We need a new authorization code for **${normalizedDomainName}** to continue your import.\n\nPlease provide a new auth code in your order details so we can proceed.`
      : `Your domain **${normalizedDomainName}** is locked and needs to be unlocked before we can continue.\n\nPlease unlock the domain at your current registrar, then confirm in your order details.`;

  const orderDetailsLink = NamefiEmailLinks.orderDetails({
    orderId: orderId,
    poweredByNamefiDomain: null,
    extraSearchParams: {
      action: requiredAction,
      domain: normalizedDomainName,
    },
  });

  await sendStyledEmailNotificationForUser({
    userId: userId,
    title: '[Namefi] Action required to continue your order',
    subject: '[Namefi] Action required to continue your order',
    showGoToDashboard: false,
    messageMarkdown: `${message}\n\n[Open order details](${orderDetailsLink})`,
  });
}
