import {
  buildOrderStatusLifecycleTransition,
  type OrderStatus,
  type PaymentProvider,
} from '@namefi-astra/db/types';
import {
  orderService,
  type CreateOrderItemInput,
} from '#services/orders/orders.service';
import {
  db,
  ordersTable,
  orderItemsTable,
  orderNfscItemsTable,
  paymentsTable,
  refundsTable,
  orderStatusSchema,
  paymentStatusSchema,
  refundStatusSchema,
  type OrderItemMetadata,
  type OrderMintTransactionMetadata,
  type NfscMintReconciliation,
} from '@namefi-astra/db';
import { eq, and, sql, inArray, ne, gte, lte, isNotNull } from 'drizzle-orm';
import {
  deriveNfscMintReconciliation,
  NFSC_RECONCILIATION_WINDOW_SLACK_MS,
} from './order-helpers/nfsc-reconciliation';
import { CHAINS, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import { logger } from '#lib/logger';
import { NamefiEmailLinks } from '../../mail/email-links';
import { sendStyledEmailNotificationForUser } from './notify.activities';
import { config, secrets } from '#lib/env';
import { ApplicationFailure } from '@temporalio/activity';
import {
  gaEventDomainAcquisitionFinished,
  gaEventDomainAcquisitionStarted,
  gaEventOrderItemProcessingFinished,
  gaEventOrderItemProcessingStarted,
  gaEventOrderFinishedEmailOpened,
  gaEventOrderFinishedEmailSent,
  gaEventOrderItemsProcessingFinished,
  gaEventOrderItemsProcessingStarted,
  gaEventOrderProcessingFinished,
  gaEventOrderProcessingStarted,
  gaEventPaymentFailed,
  gaEventPaymentRefunded,
  gaEventPaymentSuccess,
  gaEventPurchase,
} from '#lib/tracking/checkout/events';
import type { CheckoutTrackingIdentity } from '#lib/tracking/checkout/context';
import { getPreferredEvmWalletAddressToBeCharged } from './payment.activities';
import { sendAlertToSlack } from './domain/renew.activities';

function pickCheckoutTrackingIdentity(
  input: CheckoutTrackingIdentity,
): CheckoutTrackingIdentity | undefined {
  const identity = {
    clientId: input.clientId,
    sessionId: input.sessionId,
    eventSource: input.eventSource,
  };

  return identity.clientId || identity.sessionId || identity.eventSource
    ? identity
    : undefined;
}

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
      ...buildOrderStatusLifecycleTransition(status),
    })
    .where(eq(orderItemsTable.id, orderItemId))
    .returning();

  if (!updatedOrderItem) {
    throw new Error(`OrderItem not found with id ${orderItemId}`);
  }

  return updatedOrderItem;
}

export async function updateOrderNfscItemStatusOrThrow({
  nfscItemId,
  status,
}: {
  nfscItemId: string;
  status: OrderStatus;
}) {
  const [updatedNfscItem] = await db
    .update(orderNfscItemsTable)
    .set({
      status,
      ...buildOrderStatusLifecycleTransition(status),
    })
    .where(eq(orderNfscItemsTable.id, nfscItemId))
    .returning();

  if (!updatedNfscItem) {
    throw new Error(`OrderNfscItem not found with id ${nfscItemId}`);
  }

  return updatedNfscItem;
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
      ...buildOrderStatusLifecycleTransition(status),
    })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!updatedOrder) {
    throw new Error(`Order not found with id ${orderId}`);
  }

  return updatedOrder;
}

export async function logGaEventPaymentProcessed(
  input: {
    userId: string;
    orderId: string;
    amountInUsdCents: number;
    paymentCount: number;
    paymentProviders: PaymentProvider[];
    status: 'SUCCESS' | 'FAILURE';
  } & CheckoutTrackingIdentity,
) {
  const {
    userId,
    orderId,
    amountInUsdCents,
    paymentCount,
    paymentProviders,
    status,
  } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  const uniqueProviders = Array.from(new Set(paymentProviders));
  const paymentProvider =
    uniqueProviders.length === 1 ? uniqueProviders[0] : undefined;
  const paymentProvidersParam =
    uniqueProviders.length > 1 ? uniqueProviders.join(',') : undefined;

  try {
    if (status === 'SUCCESS') {
      await gaEventPaymentSuccess({
        userId,
        identity,
        orderId,
        amountUsdCents: amountInUsdCents,
        paymentCount,
        paymentProvider,
        paymentProviders: paymentProvidersParam,
      });
    } else if (status === 'FAILURE') {
      await gaEventPaymentFailed({
        userId,
        identity,
        orderId,
        amountUsdCents: amountInUsdCents,
        paymentCount,
        paymentProvider,
        paymentProviders: paymentProvidersParam,
      });
    } else {
      throw new ApplicationFailure(
        `Payment for order(${orderId}) is not Processed`,
      );
    }
  } catch (error) {
    logger.warn(
      { error, orderId, userId },
      'Failed to send GA payment_processed event',
    );
  }
}

export async function logGaEventPaymentRefunded(
  input: {
    userId: string;
    orderId: string;
    amountInUsdCents: number;
    refundAmountInUsdCents: number;
    refundType: 'PARTIAL' | 'FULL';
    paymentCount: number;
    paymentProviders: PaymentProvider[];
  } & CheckoutTrackingIdentity,
) {
  const {
    userId,
    orderId,
    amountInUsdCents,
    refundAmountInUsdCents,
    refundType,
    paymentCount,
    paymentProviders,
  } = input;
  if (refundAmountInUsdCents <= 0) {
    logger.info(
      { orderId, userId, refundAmountInUsdCents, refundType, paymentCount },
      'Skipping GA payment_refunded event because refund amount is non-positive',
    );
    return;
  }

  const identity = pickCheckoutTrackingIdentity(input);
  const uniqueProviders = Array.from(new Set(paymentProviders));
  const paymentProvider =
    uniqueProviders.length === 1 ? uniqueProviders[0] : undefined;
  const paymentProvidersParam =
    uniqueProviders.length > 1 ? uniqueProviders.join(',') : undefined;

  try {
    await gaEventPaymentRefunded({
      userId,
      identity,
      orderId,
      amountUsdCents: amountInUsdCents,
      paymentCount,
      paymentProvider,
      paymentProviders: paymentProvidersParam,
      refundAmountUsdCents: refundAmountInUsdCents,
      refundType,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId, refundAmountInUsdCents, refundType },
      'Failed to send GA payment_refunded event',
    );
  }
}

export async function logGaEventOrderProcessingStarted(
  input: {
    userId: string;
    orderId: string;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderProcessingStarted({
      userId,
      identity,
      orderId,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId },
      'Failed to send GA order_processing_started event',
    );
  }
}

export async function logGaEventOrderItemsProcessingStarted(
  input: {
    userId: string;
    orderId: string;
    itemsCount: number;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, itemsCount } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderItemsProcessingStarted({
      userId,
      identity,
      orderId,
      itemsCount,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId, itemsCount },
      'Failed to send GA order_items_processing_started event',
    );
  }
}

export async function logGaEventOrderItemsProcessingFinished(
  input: {
    userId: string;
    orderId: string;
    itemsCount: number;
    successItemsCount: number;
    failedItemsCount: number;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, itemsCount, successItemsCount, failedItemsCount } =
    input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderItemsProcessingFinished({
      userId,
      identity,
      orderId,
      itemsCount,
      successItemsCount,
      failedItemsCount,
    });
  } catch (error) {
    logger.warn(
      {
        error,
        orderId,
        userId,
        itemsCount,
        successItemsCount,
        failedItemsCount,
      },
      'Failed to send GA order_items_processing_finished event',
    );
  }
}

export async function logGaEventOrderProcessingFinished(
  input: {
    userId: string;
    orderId: string;
    orderStatus: OrderStatus;
    refundNeeded: boolean;
    refundType: 'NONE' | 'FULL' | 'PARTIAL';
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, orderStatus, refundNeeded, refundType } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderProcessingFinished({
      userId,
      identity,
      orderId,
      orderStatus,
      refundNeeded,
      refundType,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId, orderStatus, refundNeeded, refundType },
      'Failed to send GA order_processing_finished event',
    );
  }
}

export async function logGaEventPurchase(
  input: {
    userId: string;
    orderId: string;
    items: Array<{
      itemId: string;
      itemName: string;
      amountInUSDCents: number;
    }>;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, items } = input;
  const identity = pickCheckoutTrackingIdentity(input);

  try {
    await gaEventPurchase({
      userId,
      identity,
      orderId,
      items,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId, itemCount: items.length },
      'Failed to send GA purchase event',
    );
  }
}

export async function logGaEventOrderItemProcessingStarted(
  input: {
    userId: string;
    orderId: string;
    orderItemId: string;
    itemType: 'REGISTER' | 'IMPORT' | 'RENEW';
    domainName: NamefiNormalizedDomain;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, orderItemId, itemType, domainName } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderItemProcessingStarted({
      userId,
      identity,
      orderId,
      orderItemId,
      itemType,
      domainName,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, orderItemId, userId, itemType, domainName },
      'Failed to send GA order_item_processing_started event',
    );
  }
}

export async function logGaEventOrderItemProcessingFinished(
  input: {
    userId: string;
    orderId: string;
    orderItemId: string;
    itemType: 'REGISTER' | 'IMPORT' | 'RENEW';
    domainName: NamefiNormalizedDomain;
    itemStatus: 'SUCCEEDED' | 'FAILED';
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, orderItemId, itemType, domainName, itemStatus } =
    input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderItemProcessingFinished({
      userId,
      identity,
      orderId,
      orderItemId,
      itemType,
      domainName,
      itemStatus,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, orderItemId, userId, itemType, domainName, itemStatus },
      'Failed to send GA order_item_processing_finished event',
    );
  }
}

export async function logGaEventDomainAcquisitionStarted(
  input: {
    userId: string;
    orderId: string;
    orderItemId: string;
    normalizedDomainName: NamefiNormalizedDomain;
    operationType: 'REGISTER' | 'IMPORT';
    registrarKey?: string;
    durationInYears?: number;
    chainId?: number;
  } & CheckoutTrackingIdentity,
) {
  const {
    userId,
    orderId,
    orderItemId,
    normalizedDomainName,
    operationType,
    registrarKey,
    durationInYears,
    chainId,
  } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventDomainAcquisitionStarted({
      userId,
      identity,
      orderId,
      orderItemId,
      normalizedDomainName,
      operationType,
      registrarKey,
      durationInYears,
      chainId,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, orderItemId, userId, normalizedDomainName },
      'Failed to send GA domain_acquisition_started event',
    );
  }
}

export async function logGaEventDomainAcquisitionFinished(
  input: {
    userId: string;
    orderId: string;
    orderItemId: string;
    normalizedDomainName: NamefiNormalizedDomain;
    operationType: 'REGISTER' | 'IMPORT';
    registrarKey?: string;
    durationInYears?: number;
    chainId?: number;
    status: 'SUCCESS' | 'FAILURE';
    failureReason?: string;
  } & CheckoutTrackingIdentity,
) {
  const {
    userId,
    orderId,
    orderItemId,
    normalizedDomainName,
    operationType,
    registrarKey,
    durationInYears,
    chainId,
    status,
    failureReason,
  } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventDomainAcquisitionFinished(status, {
      userId,
      identity,
      orderId,
      orderItemId,
      normalizedDomainName,
      operationType,
      registrarKey,
      durationInYears,
      chainId,
      failureReason,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, orderItemId, userId, normalizedDomainName },
      'Failed to send GA domain_acquisition_finished event',
    );
  }
}

export async function logGaEventOrderFinishedEmailSent(
  input: {
    userId: string;
    orderId?: string;
    orderStatus: OrderStatus;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, orderStatus } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderFinishedEmailSent({
      userId,
      identity,
      orderId,
      orderStatus,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId, orderStatus },
      'Failed to send GA order_finished_email_sent event',
    );
  }
}

export async function logGaEventOrderFinishedEmailOpened(
  input: {
    userId: string;
    orderId?: string;
    orderItemId?: string;
    normalizedDomainName?: NamefiNormalizedDomain;
  } & CheckoutTrackingIdentity,
) {
  const { userId, orderId, orderItemId, normalizedDomainName } = input;
  const identity = pickCheckoutTrackingIdentity(input);
  try {
    await gaEventOrderFinishedEmailOpened({
      userId,
      identity,
      orderId,
      orderItemId,
    });
  } catch (error) {
    logger.warn(
      { error, orderId, orderItemId, userId, normalizedDomainName },
      'Failed to send GA order_finished_email_opened event',
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
  const lifecycleTimestamps = buildOrderStatusLifecycleTransition(status);

  // Use a transaction to ensure both updates happen atomically
  const result = await db.transaction(async (tx) => {
    // Update order status
    const [updatedOrder] = await tx
      .update(ordersTable)
      .set({
        status,
        ...lifecycleTimestamps,
      })
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error(`Order not found with id ${orderId}`);
    }

    // Update order item status
    const [updatedOrderItem] = await tx
      .update(orderItemsTable)
      .set({
        status,
        ...lifecycleTimestamps,
      })
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

  logger.debug(
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

  logger.debug(
    { orderId, orderItemId, txHash },
    'Recorded mint transaction metadata for order %s item %s',
    orderId,
    orderItemId,
    txHash,
  );
}

/**
 * Record the NFSC mint transaction hash on an `order_nfsc_items` row: both the
 * dedicated `mint_tx_hash` column and `metadata.mintTransaction`, plus an
 * aggregate entry on the order's `metadata.mintTransactions` map. Mirrors
 * `recordOrderMintTransaction` for the NFSC top-up flow.
 */
export async function recordNfscMintTransaction({
  orderId,
  nfscItemId,
  txHash,
}: {
  orderId: string;
  nfscItemId: string;
  txHash: string;
}) {
  const recordedAt = new Date().toISOString();
  const details: OrderMintTransactionMetadata = { txHash, recordedAt };

  await db.transaction(async (tx) => {
    const [updatedNfscItem] = await tx
      .update(orderNfscItemsTable)
      .set({
        mintTxHash: txHash,
        metadata: sql`jsonb_set(
          coalesce(${orderNfscItemsTable.metadata}, '{}'::jsonb),
          '{mintTransaction}',
          ${JSON.stringify(details)}::jsonb,
          true
        )`,
      })
      .where(
        and(
          eq(orderNfscItemsTable.id, nfscItemId),
          eq(orderNfscItemsTable.orderId, orderId),
        ),
      )
      .returning({ id: orderNfscItemsTable.id });

    if (!updatedNfscItem) {
      throw new Error(
        `Order NFSC item not found when recording mint metadata (orderId=${orderId}, nfscItemId=${nfscItemId})`,
      );
    }

    const mintedEntry = { [nfscItemId]: details };

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
        `Order not found when recording NFSC mint metadata (orderId=${orderId})`,
      );
    }
  });

  logger.debug(
    { orderId, nfscItemId, txHash },
    'Recorded NFSC mint transaction metadata for order %s item %s',
    orderId,
    nfscItemId,
  );
}

/** Map a chain id to its NFSC payment provider, or null if NFSC is not on that chain. */
function nfscPaymentProviderForChain(chainId: number): PaymentProvider | null {
  if (chainId === CHAINS.mainnet.id) return 'NFSC_ETHEREUM';
  if (chainId === CHAINS.sepolia.id) return 'NFSC_ETHEREUM_SEPOLIA';
  if (chainId === CHAINS.base.id) return 'NFSC_BASE';
  return null;
}

/**
 * Reconcile a candidate NFSC mint balance anomaly.
 *
 * Called by `processNfscOrderItemWorkflow` only when the observed before/after
 * on-chain balance delta did not match the minted amount. Nets out other
 * recent NFSC activity on the same wallet+chain — concurrent top-up mints (+),
 * concurrent NFSC charges/spends (-), and concurrent NFSC refunds (+) — within
 * a time window anchored to this item's processing start. If the discrepancy
 * is fully explained the outcome is `JUSTIFIED_ANOMALY`; otherwise
 * `UNJUSTIFIED_ANOMALY` and the caller raises a critical alert.
 *
 * All deltas/sums are in NFSC token units. Payment/refund amounts are USD
 * cents and converted at the fixed 1 USD = 1 NFSC rate (`/ 100`). The result
 * is stamped onto the item's `metadata.reconciliation` for auditability.
 */
export async function reconcileNfscMint(input: {
  orderId: string;
  nfscItemId: string;
  chainId: number;
  recipientWalletAddress: string;
  /** NFSC units this mint was expected to add. */
  expectedDelta: number;
  /** NFSC units actually observed (balanceAfter - balanceBefore). */
  actualDelta: number;
  balanceBefore: number;
  balanceAfter: number;
}): Promise<NfscMintReconciliation> {
  const checkedAt = new Date().toISOString();

  const thisItem = await db.query.orderNfscItemsTable.findFirst({
    where: eq(orderNfscItemsTable.id, input.nfscItemId),
    columns: { startedAt: true, createdAt: true },
  });
  const windowStart = new Date(
    (thisItem?.startedAt ?? thisItem?.createdAt ?? new Date()).getTime() -
      NFSC_RECONCILIATION_WINDOW_SLACK_MS,
  );
  const windowEnd = new Date();

  // (+) other NFSC top-up mints crediting the same wallet+chain in the window.
  const concurrentMints = await db
    .select({
      id: orderNfscItemsTable.id,
      nfscAmount: orderNfscItemsTable.nfscAmount,
    })
    .from(orderNfscItemsTable)
    .where(
      and(
        eq(
          orderNfscItemsTable.recipientWalletAddress,
          input.recipientWalletAddress,
        ),
        eq(orderNfscItemsTable.chainId, input.chainId),
        ne(orderNfscItemsTable.id, input.nfscItemId),
        isNotNull(orderNfscItemsTable.mintTxHash),
        gte(orderNfscItemsTable.startedAt, windowStart),
        lte(orderNfscItemsTable.startedAt, windowEnd),
      ),
    );

  // (-) concurrent NFSC charges/spends from the same wallet+chain in the window.
  // The NFSC payment provider already encodes the chain.
  const nfscProvider = nfscPaymentProviderForChain(input.chainId);
  const concurrentCharges = nfscProvider
    ? await db
        .select({
          id: paymentsTable.id,
          amountInUSDCents: paymentsTable.amountInUSDCents,
        })
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.paymentProvider, nfscProvider),
            eq(paymentsTable.status, paymentStatusSchema.enum.SUCCEEDED),
            sql`${paymentsTable.nfscPaymentDetails}->>'walletAddress' = ${input.recipientWalletAddress}`,
            gte(paymentsTable.updatedAt, windowStart),
            lte(paymentsTable.updatedAt, windowEnd),
          ),
        )
    : [];

  // (+) concurrent NFSC refunds crediting the same wallet+chain in the window.
  const concurrentRefunds = await db
    .select({
      id: refundsTable.id,
      amountInUSDCents: refundsTable.amountInUSDCents,
    })
    .from(refundsTable)
    .where(
      and(
        eq(refundsTable.walletAddress, input.recipientWalletAddress),
        eq(refundsTable.chainId, input.chainId),
        eq(refundsTable.status, refundStatusSchema.enum.SUCCEEDED),
        gte(refundsTable.updatedAt, windowStart),
        lte(refundsTable.updatedAt, windowEnd),
      ),
    );

  const reconciliation = deriveNfscMintReconciliation({
    expectedDelta: input.expectedDelta,
    actualDelta: input.actualDelta,
    balanceBefore: input.balanceBefore,
    balanceAfter: input.balanceAfter,
    concurrentMints,
    concurrentCharges,
    concurrentRefunds,
    windowStart: windowStart.toISOString(),
    checkedAt,
  });

  await db
    .update(orderNfscItemsTable)
    .set({
      metadata: sql`jsonb_set(
        coalesce(${orderNfscItemsTable.metadata}, '{}'::jsonb),
        '{reconciliation}',
        ${JSON.stringify(reconciliation)}::jsonb,
        true
      )`,
    })
    .where(eq(orderNfscItemsTable.id, input.nfscItemId));

  logger.debug(
    {
      ...reconciliation,
      orderId: input.orderId,
      nfscItemId: input.nfscItemId,
    },
    'NFSC mint reconciliation for item %s: %s',
    input.nfscItemId,
    reconciliation.outcome,
  );

  return reconciliation;
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

  logger.debug(
    { orderId, orderItemId, requiredAction },
    'Updated order item %s requiredAction to %s for order %s',
    orderItemId,
    requiredAction ?? 'none',
    orderId,
  );

  return updatedOrderItem;
}

export async function convertRequiredActionToFailureReason({
  orderItemId,
  orderId,
  requiredAction,
  resolution,
  actor,
  actorId,
  timeoutMs,
}: {
  orderItemId: string;
  orderId: string;
  requiredAction: NonNullable<OrderItemMetadata['requiredAction']>;
  resolution: NonNullable<OrderItemMetadata['failureDetails']>['resolution'];
  actor?: NonNullable<OrderItemMetadata['failureDetails']>['actor'];
  actorId?: string;
  timeoutMs?: number;
}) {
  const recordedAt = new Date().toISOString();
  const failureDetails = {
    requiredAction,
    resolution,
    actor,
    actorId,
    timeoutMs,
    recordedAt,
  };

  const [updatedOrderItem] = await db
    .update(orderItemsTable)
    .set({
      metadata: sql`jsonb_set(
        coalesce(${orderItemsTable.metadata}, '{}'::jsonb) - 'requiredAction',
        '{failureDetails}',
        ${JSON.stringify(failureDetails)}::jsonb,
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
      `Order item not found when recording failure details (orderId=${orderId}, orderItemId=${orderItemId})`,
    );
  }

  logger.debug(
    { orderId, orderItemId, failureDetails },
    'Recorded failure details for order item %s on order %s',
    orderItemId,
    orderId,
  );

  return updatedOrderItem;
}

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderItemStatusOrThrow: typeof updateOrderItemStatusOrThrow;
  updateOrderNfscItemStatusOrThrow: typeof updateOrderNfscItemStatusOrThrow;
  updateOrderStatusOrThrow: typeof updateOrderStatusOrThrow;
  logGaEventOrderProcessingStarted: typeof logGaEventOrderProcessingStarted;
  logGaEventOrderItemsProcessingStarted: typeof logGaEventOrderItemsProcessingStarted;
  logGaEventOrderItemsProcessingFinished: typeof logGaEventOrderItemsProcessingFinished;
  logGaEventOrderProcessingFinished: typeof logGaEventOrderProcessingFinished;
  logGaEventPurchase: typeof logGaEventPurchase;
  logGaEventOrderItemProcessingStarted: typeof logGaEventOrderItemProcessingStarted;
  logGaEventOrderItemProcessingFinished: typeof logGaEventOrderItemProcessingFinished;
  logGaEventPaymentProcessed: typeof logGaEventPaymentProcessed;
  logGaEventPaymentRefunded: typeof logGaEventPaymentRefunded;
  logGaEventDomainAcquisitionStarted: typeof logGaEventDomainAcquisitionStarted;
  logGaEventDomainAcquisitionFinished: typeof logGaEventDomainAcquisitionFinished;
  logGaEventOrderFinishedEmailSent: typeof logGaEventOrderFinishedEmailSent;
  logGaEventOrderFinishedEmailOpened: typeof logGaEventOrderFinishedEmailOpened;
  updateOrderAndItemStatusOrThrow: typeof updateOrderAndItemStatusOrThrow;
  recordOrderMintTransaction: typeof recordOrderMintTransaction;
  recordNfscMintTransaction: typeof recordNfscMintTransaction;
  reconcileNfscMint: typeof reconcileNfscMint;
  setOrderItemRequiredAction: typeof setOrderItemRequiredAction;
  convertRequiredActionToFailureReason: typeof convertRequiredActionToFailureReason;
  createFreeAutoRenewOrder: typeof createFreeAutoRenewOrder;
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

const FREE_POWERED_BY_NAMEFI_PARENT_DOMAINS = [
  'withtrump.club',
  'withharris.club',
] as const;

type FreePoweredByNamefiParentDomain =
  (typeof FREE_POWERED_BY_NAMEFI_PARENT_DOMAINS)[number];

const getPoweredByNamefiParentDomain = (
  normalizedDomainName: NamefiNormalizedDomain,
): FreePoweredByNamefiParentDomain | null =>
  FREE_POWERED_BY_NAMEFI_PARENT_DOMAINS.find((parent) =>
    normalizedDomainName.endsWith(`.${parent}`),
  ) ?? null;

export async function createAutoRenewOrder({
  userId,
  paymentIds,
  domainRenewResults,
  totalAmountInUsd,
}: CreateAutoRenewOrderInput): Promise<{ orderId: string }> {
  logger.debug(
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
  const completedAt = new Date();

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
        startedAt: completedAt,
        finishedAt: completedAt,
      }) satisfies CreateOrderItemInput,
  );

  // Create the order using storage-agnostic service with multiple payments
  const created = await orderService.createOrderWithExistingMultiplePayments({
    userId,
    paymentIds,
    status: orderStatus,
    amountInUSDCents: Math.round(totalAmountInUsd * 100),
    startedAt: completedAt,
    finishedAt: completedAt,
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

  logger.debug(
    { orderId: order.id, successCount, failureCount },
    'Created auto-renew order %s with %d successes and %d failures',
    order.id,
    successCount,
    failureCount,
  );

  return { orderId: order.id };
}

export type CreateFreeAutoRenewOrderInput = {
  userId: string;
  domainRenewResults: DomainRenewalResult[];
};

export async function createFreeAutoRenewOrder({
  userId,
  domainRenewResults,
}: CreateFreeAutoRenewOrderInput): Promise<{ orderId: string }> {
  logger.info(
    { userId, domainCount: domainRenewResults.length },
    'Creating free auto-renew order for user %s with %d domains',
    userId,
    domainRenewResults.length,
  );

  if (domainRenewResults.length === 0) {
    throw new Error('No domain renew results provided for free auto-renew');
  }

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
  const completedAt = new Date();

  const poweredByNamefiParentDomains = Array.from(
    new Set(
      domainRenewResults
        .map((result) =>
          getPoweredByNamefiParentDomain(result.normalizedDomainName),
        )
        .filter((parent): parent is FreePoweredByNamefiParentDomain =>
          Boolean(parent),
        ),
    ),
  );

  const orderItems = domainRenewResults.map((result) => {
    const poweredByNamefiParentDomain = getPoweredByNamefiParentDomain(
      result.normalizedDomainName,
    );
    return {
      normalizedDomainName: result.normalizedDomainName,
      amountInUSDCents: 0,
      durationInYears: 1,
      type: 'RENEW' as const,
      registrar: result.registrarKey,
      status:
        result.status === 'SUCCESS'
          ? orderStatusSchema.enum.SUCCEEDED
          : orderStatusSchema.enum.FAILED,
      metadata: {
        autoRenew: true,
        freeRenewal: true,
        poweredByNamefi: true,
        poweredByNamefiParentDomain: poweredByNamefiParentDomain ?? undefined,
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
      startedAt: completedAt,
      finishedAt: completedAt,
    } satisfies CreateOrderItemInput;
  });

  const walletAddress = await getPreferredEvmWalletAddressToBeCharged(userId);

  const order = await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(paymentsTable)
      .values({
        amountInUSDCents: 0,
        status: paymentStatusSchema.enum.SUCCEEDED,
        startedAt: completedAt,
        finishedAt: completedAt,
        paymentProvider: 'NFSC_BASE',
        nfscPaymentDetails: {
          chainId: CHAINS.base.id,
          walletAddress,
        },
      })
      .returning();

    if (!payment) {
      throw new Error('Failed to create dummy payment for free auto-renew');
    }

    const created = await orderService.createOrderWithExistingMultiplePayments(
      {
        userId,
        paymentIds: [payment.id],
        status: orderStatus,
        amountInUSDCents: 0,
        startedAt: completedAt,
        finishedAt: completedAt,
        metadata: {
          autoRenew: true,
          freeRenewal: true,
          poweredByNamefi: true,
          poweredByNamefiParentDomains,
          renewalSummary: {
            successCount,
            failureCount,
            totalAttempted: domainRenewResults.length,
          },
        },
        items: orderItems,
      },
      { tx },
    );

    return { id: created.id } as const;
  });

  logger.info(
    { orderId: order.id, successCount, failureCount },
    'Created free auto-renew order %s with %d successes and %d failures',
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
    type: 'REGISTER' | 'IMPORT' | 'RENEW';
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
    logger.debug('No succeeded domains, skipping Slack notification');
    return;
  }

  const temporalUrl = `https://cloud.temporal.io/namespaces/${encodeURIComponent(config.TEMPORAL_NAMESPACE)}/workflows/${encodeURIComponent(input.workflowId)}/${encodeURIComponent(input.runId)}/history`;

  const userIdentifier = input.userEmail
    ? input.userEmail
    : input.walletAddress
      ? `${input.walletAddress.slice(0, 6)}...${input.walletAddress.slice(-4)}`
      : 'someone';

  const buildDomainListMessage = (
    operationType: (typeof succeededDomains)[number]['type'],
  ) => {
    const list = succeededDomains.filter((d) => d.type === operationType);
    if (list.length < 1) {
      return;
    }

    const first5Text = list
      .map((d) => d.normalizedDomainName)
      .slice(0, 5)
      .join(', ');

    const additionalCount = list.length - 5;
    const domainDisplay =
      additionalCount > 0
        ? `${first5Text} (+${additionalCount} more)`
        : first5Text;

    return `- "${operationType.toLowerCase()}": ${domainDisplay}`;
  };

  const message = [
    `:tada: ${userIdentifier} has just made an order to:`,
    buildDomainListMessage('REGISTER'),
    buildDomainListMessage('IMPORT'),
    buildDomainListMessage('RENEW'),
  ]
    .filter(Boolean)
    .join('\n');

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

    logger.debug('Successfully sent order completion alert to Slack');
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
  if (requiredAction === 'UNDETERMINED') {
    return sendAlertToSlack({
      message: `Item(${orderItemId}) in Order(${orderId}) requires admin interference`,
      title: 'Admin Action Required',
      extraData: {
        normalizedDomainName,
        userId,
        orderId,
        orderItemId,
        requiredAction,
        extraMessage,
      },
    });
  }
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
    inAppNotification: {
      // Action-required notifications gate further order progress — high
      // priority so the user is prompted audibly.
      priority: 'high',
      subtitle: requiredAction,
      relatedResources: [
        { type: 'order', identifier: orderId },
        { type: 'order_item', identifier: orderItemId },
        { type: 'domain', identifier: normalizedDomainName },
      ],
      source: 'activity:sendOrderRequiresFurtherActionEmail',
    },
  });
}
