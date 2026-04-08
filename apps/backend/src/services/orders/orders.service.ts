import {
  type PaymentProviderDetails,
  db,
  ordersTable,
  paymentsTable,
  orderItemsTable,
  cartItemsTable,
  $withTransaction,
  usersTable,
  isMppPayment,
  isNfscPayment,
  isX402Payment,
} from '@namefi-astra/db';
import {
  checksumWalletAddressSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type { NfscPaymentProviderDetails } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
} from 'drizzle-orm';
import { isNil, isNotNil, filter, pluck, indexBy, omit, prop } from 'ramda';
import Stripe from 'stripe';
import pMap from 'p-map';
import z from 'zod';
import { OrderNotFoundError } from './errors';
import type {
  OrderItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/db';
import type { OrderItemInsert, OrderInsert } from '@namefi-astra/db';
import { defaultKeyv } from '#lib/keyv';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { logger } from '#lib/logger';
import { secrets } from '#lib/env';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { gaEventOrderPlaced } from '#lib/tracking/checkout/events';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

type OrderRow = typeof ordersTable.$inferSelect;

export type OrderWithPayments = {
  order: OrderRow;
  items: OrderItemSelect[];
  payments: PaymentSelect[];
  user: UserSelect;
};

export async function getOrderDetailsOrThrow(
  orderId: string,
): Promise<OrderWithPayments> {
  const orderWithDetails = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    with: {
      items: true,
      user: true,
      payments: true,
    },
  });

  if (!orderWithDetails) {
    throw new OrderNotFoundError({ orderId });
  }

  const { items, user, payments, ...order } = orderWithDetails;
  return {
    order,
    payments: payments as PaymentSelect[],
    items: items as OrderItemSelect[],
    user: user as UserSelect,
  };
}

export const GA_EVENT_TRACKING_REASON_LITERALS = [
  'DEFAULT',
  'BACKFILL',
  'TEST',
  'PRIVACY',
  'EXPERIMENT',
  'INCIDENT_MITIGATION',
  'INTERNAL', // requests coming from our team
  'OTHER',
] as const;

export const gaEventTrackingReasonLiteralSchema = z.enum(
  GA_EVENT_TRACKING_REASON_LITERALS,
);

export type GaEventTrackingReasonLiteral =
  (typeof GA_EVENT_TRACKING_REASON_LITERALS)[number];

export const gaEventTrackingReasonSchema = z
  .string()
  .trim()
  .min(1, 'GA event tracking reason is required')
  .max(200, 'GA event tracking reason must be at most 200 characters');

export const gaEventTrackingSchema = z.object({
  trackGaEvents: z.boolean(),
  reason: gaEventTrackingReasonSchema.optional(),
});

let teamMembersPromise: Promise<string[] | null> | null = null;

async function getTeamMembersIds(): Promise<string[] | null> {
  try {
    const cached = await defaultKeyv.get<string[]>('namefi-team-members');
    if (cached) return cached;

    // Reuse in-flight promise if exists
    if (teamMembersPromise) return teamMembersPromise;

    teamMembersPromise = (async () => {
      const users = await db
        .select({ userId: usersTable.id })
        .from(privyUsersTableSchema)
        .leftJoin(
          usersTable,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .where(ilike(privyUsersTableSchema.email, '%@d3serve.xyz'));
      const usersIds = filter(isNotNil, pluck('userId', users)) as string[];
      await defaultKeyv.set<string[]>('namefi-team-members', usersIds);
      teamMembersPromise = null;
      return usersIds;
    })();

    return teamMembersPromise;
  } catch (error) {
    teamMembersPromise = null;
    logger.warn({ error }, 'getTeamMemebersIds failed');
  }
  return null;
}

export async function shouldTrackOrderCheckoutFlowForUser(
  userId: string,
): Promise<z.infer<typeof gaEventTrackingSchema>> {
  const namefiTeamMembersIds = await getTeamMembersIds();

  if (namefiTeamMembersIds?.includes(userId)) {
    return {
      trackGaEvents: false,
      reason: 'INTERNAL',
    };
  }

  return {
    trackGaEvents: true,
  };
}

export const orderService = {
  getOrderDetailsOrThrow,
  createOrderWithExistingMultiplePayments,
  createOrderWithExistingSinglePayment,
  shouldTrackOrderCheckoutFlowForUser,
  ensureOrderOwnership,
  getOrderItemsForUser,
  buildPaymentMethodDetails,
  buildOrderPaymentMethodsDetails,
  validateNfscWalletAddresses,
  removeCartItems,
  createOrderWithWorkflow,
};

// -------- Stage 2: Storage-agnostic write utilities --------

export type CreateOrderItemInput = Omit<
  OrderItemInsert,
  'orderId' | 'id' | 'createdAt' | 'updatedAt' //we could allow id if needed
>;

export type CreateOrderWithExistingMultiplePaymentsInput = Omit<
  OrderInsert,
  'id' | 'createdAt' | 'updatedAt'
> & {
  paymentIds: string[];
  items: CreateOrderItemInput[];
};

export async function createOrderWithExistingMultiplePayments(
  {
    paymentIds,
    items,
    ...orderInsert
  }: CreateOrderWithExistingMultiplePaymentsInput,
  { tx }: { tx?: typeof db } = {},
): Promise<{
  id: string;
  userId: string;
  amountInUSDCents: number;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  items: OrderItemSelect[];
}> {
  if (!paymentIds.length) {
    throw new Error('At least one paymentId is required');
  }

  return $withTransaction(
    async (tx) => {
      // Load and validate payments (within tx)
      const payments = await tx.query.paymentsTable.findMany({
        where: inArray(paymentsTable.id, paymentIds),
      });

      if (paymentIds.length !== payments.length) {
        throw new Error('Some payments not found');
      }
      if (payments.some((p) => p.orderId)) {
        throw new Error('Some payments are already linked to an order');
      }

      const totalAmountFromItems = items.reduce(
        (acc, it) => acc + (it.amountInUSDCents ?? 0),
        0,
      );
      const paymentsTotal = payments.reduce(
        (acc, p) => acc + p.amountInUSDCents,
        0,
      );

      if (
        paymentsTotal !== totalAmountFromItems ||
        orderInsert.amountInUSDCents !== totalAmountFromItems
      ) {
        throw new Error(
          `Payments total (${paymentsTotal}) does not match order total (${totalAmountFromItems})`,
        );
      }

      const [order] = await tx
        .insert(ordersTable)
        .values({
          ...orderInsert,
        })
        .returning();

      const insertedItems = await tx
        .insert(orderItemsTable)
        .values(
          items.map((it) => ({
            ...it,
            orderId: order.id,
          })),
        )
        .returning();

      // Link provided payments to this order (one-to-many via payments.orderId)
      // Guard against reusing a payment: only link payments that are not already linked
      const updated = await tx
        .update(paymentsTable)
        .set({ orderId: order.id })
        .where(
          and(
            inArray(paymentsTable.id, paymentIds),
            isNull(paymentsTable.orderId),
          ),
        )
        .returning({ id: paymentsTable.id });

      if (updated.length !== paymentIds.length) {
        throw new Error('One or more payments are already linked to an order');
      }

      return { ...order, items: insertedItems as OrderItemSelect[] };
    },
    { deferrable: true, isolationLevel: 'serializable' },
    tx,
  );
}

export async function createOrderWithExistingSinglePayment(
  input: Omit<CreateOrderWithExistingMultiplePaymentsInput, 'paymentIds'> & {
    paymentId: string;
  },
  { tx }: { tx?: typeof db } = {},
) {
  const { paymentId, ...rest } = input;
  return createOrderWithExistingMultiplePayments(
    { ...rest, paymentIds: [paymentId] },
    { tx },
  );
}

// -------- Extracted shared functions --------

export async function ensureOrderOwnership(orderId: string, userId: string) {
  const orderRecord = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    columns: {
      userId: true,
      status: true,
    },
  });

  if (!orderRecord) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  if (orderRecord.userId !== userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to view this order',
    });
  }

  return orderRecord;
}

export async function getOrderItemsForUser(
  userId: string,
  poweredByNamefiDomain?: string | null,
) {
  const items = await db
    .select({
      ...getTableColumns(orderItemsTable),
      nftWalletAddress: ordersTable.nftWalletAddress,
      nftChainId: ordersTable.nftChainId,
      orderMetadata: ordersTable.metadata,
    })
    .from(orderItemsTable)
    .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.userId, userId),
        isNotNil(poweredByNamefiDomain)
          ? ilike(
              orderItemsTable.normalizedDomainName,
              `%.${poweredByNamefiDomain}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(ordersTable.createdAt));

  return items;
}

// -------- Payment method details --------

export type PaymentMethodDetailsOnChain = {
  paymentId: string;
  isOnChainPayment: true;
  txHash?: string | null;
  chainId: number;
  walletAddress: string;
};

export type PaymentMethodDetailsOffChain = {
  paymentId: string;
  isOnChainPayment: false;
  brand?: string;
  last4?: string;
};

export type PaymentMethodDetailsX402 = {
  paymentId: string;
  isOnChainPayment: true;
  isX402Payment: true;
  network: string;
  buyerWalletAddress: string;
  receiverWalletAddress?: string;
  settlementTxHash?: string | null;
};

export type PaymentMethodDetailsMpp = {
  paymentId: string;
  isMppPayment: true;
  method: 'stripe' | 'tempo';
  isOnChainPayment: boolean;
  payerWalletAddress?: string;
  reference?: string | null;
  brand?: string;
  last4?: string;
};

export type PaymentMethodDetails =
  | PaymentMethodDetailsOnChain
  | PaymentMethodDetailsOffChain
  | PaymentMethodDetailsX402
  | PaymentMethodDetailsMpp;

export async function buildPaymentMethodDetails(
  payment: PaymentSelect,
): Promise<PaymentMethodDetails> {
  if (isX402Payment(payment)) {
    return {
      paymentId: payment.id,
      isOnChainPayment: true,
      isX402Payment: true,
      network: payment.x402PaymentDetails.network,
      buyerWalletAddress: payment.x402PaymentDetails.buyerWalletAddress,
      receiverWalletAddress: payment.x402PaymentDetails.receiverWalletAddress,
      settlementTxHash: payment.x402PaymentDetails.settlementTxHash,
    };
  }

  if (isNfscPayment(payment)) {
    return {
      paymentId: payment.id,
      isOnChainPayment: true,
      txHash: payment.paymentProviderReferenceId,
      chainId: payment.nfscPaymentDetails.chainId,
      walletAddress: payment.nfscPaymentDetails.walletAddress,
    };
  }

  if (isMppPayment(payment)) {
    if (payment.metadata.mppPaymentDetails.method === 'tempo') {
      return {
        isMppPayment: true,
        method: 'tempo',
        payerWalletAddress:
          payment.metadata.mppPaymentDetails.payerWalletAddress,
        paymentId: payment.id,
        isOnChainPayment: true,
        reference: payment.paymentProviderReferenceId,
      };
    }

    if (isNil(payment.paymentProviderReferenceId)) {
      return {
        paymentId: payment.id,
        isOnChainPayment: false,
        brand: undefined,
        last4: undefined,
      };
    }

    const stripePaymentIntent = await stripe.paymentIntents.retrieve(
      payment.paymentProviderReferenceId,
      { expand: ['payment_method'] },
    );

    const paymentMethod =
      stripePaymentIntent.payment_method as Stripe.PaymentMethod | null;

    return {
      isMppPayment: true,
      method: 'stripe',
      paymentId: payment.id,
      isOnChainPayment: false,
      brand: paymentMethod?.card?.brand,
      last4: paymentMethod?.card?.last4,
      reference: payment.paymentProviderReferenceId,
    };
  }

  if (isNil(payment.paymentProviderReferenceId)) {
    return {
      paymentId: payment.id,
      isOnChainPayment: false,
      brand: undefined,
      last4: undefined,
    };
  }

  const stripePaymentIntent = await stripe.paymentIntents.retrieve(
    payment.paymentProviderReferenceId,
    { expand: ['payment_method'] },
  );

  if (isNil(stripePaymentIntent.payment_method)) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message:
        'payment information missing, Namefi Payment ID: ' +
        payment.id +
        ' Stripe Payment Intent ID: ' +
        payment.paymentProviderReferenceId,
    });
  }

  const paymentMethod =
    stripePaymentIntent.payment_method as Stripe.PaymentMethod;

  return {
    paymentId: payment.id,
    isOnChainPayment: false,
    brand: paymentMethod.card?.brand,
    last4: paymentMethod.card?.last4,
  };
}

export async function buildOrderPaymentMethodsDetails(
  payments: PaymentSelect[],
): Promise<PaymentMethodDetails[]> {
  return pMap(payments, buildPaymentMethodDetails);
}

// -------- Wallet validation --------

export function validateNfscWalletAddresses(
  nfscPayments: NfscPaymentProviderDetails[],
  userWallets: Set<string>,
) {
  for (const p of nfscPayments) {
    const validWalletAddress = checksumWalletAddressSchema.safeParse(
      p.nfscPaymentDetails.walletAddress,
    );
    if (!validWalletAddress.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'NFSC payment walletAddress is not a valid Ethereum wallet address',
      });
    }
    if (!userWallets.has(validWalletAddress.data)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'NFSC payment walletAddress is not linked to the user',
      });
    }
  }
}

// -------- Cart cleanup --------

export async function removeCartItems(
  userId: string,
  cartItemIds: string[],
  { tx }: { tx?: typeof db } = {},
) {
  const res = await (tx ?? db)
    .delete(cartItemsTable)
    .where(
      and(
        inArray(cartItemsTable.id, cartItemIds),
        eq(cartItemsTable.userId, userId),
      ),
    );
  if (res.rowCount !== cartItemIds.length) {
    logger.error({ res }, 'Cart items removal failed');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Cart items removal failed',
    });
  }
  logger.debug({ res }, 'Cart items removed');
  return res;
}

// -------- Order creation with workflow --------

export type CreateOrderWithWorkflowInput = {
  userId: string;
  amountInUSDCents: number;
  nftWalletAddress: string;
  nftChainId: number;
  payments: Array<{
    amountInUsdCents: number;
    paymentProviderDetails: PaymentProviderDetails;
  }>;
  items: CreateOrderItemInput[];
  paymentsMetadataFromInput?: Array<
    ChargeUserWorkflowInput['metadata'] | undefined
  >;
  cartCleanup?:
    | { type: 'ids'; userId: string; cartItemIds: string[] }
    | {
        type: 'domain';
        userId: string;
        normalizedDomainName: NamefiNormalizedDomain;
      };
  gaEventTracking: z.infer<typeof gaEventTrackingSchema>;
  orderSource?: 'checkout' | 'instant_buy';
};

export async function createOrderWithWorkflow(
  input: CreateOrderWithWorkflowInput,
) {
  const order = await db.transaction(async (tx) => {
    // 1. Create payments
    const createdPayments: PaymentSelect[] = [];
    for (const p of input.payments) {
      const created = await createPayment(
        {
          amountInUsdCents: p.amountInUsdCents,
          paymentProviderDetails: p.paymentProviderDetails,
        },
        { tx },
      );
      createdPayments.push(created);
    }

    // 2. Create order linked to payments
    const order = await createOrderWithExistingMultiplePayments(
      {
        amountInUSDCents: input.amountInUSDCents,
        userId: input.userId,
        paymentIds: createdPayments.map((p) => p.id),
        nftWalletAddress: input.nftWalletAddress,
        nftChainId: input.nftChainId,
        items: input.items,
      },
      { tx },
    );

    // 3. Clean up cart items
    if (input.cartCleanup) {
      if (input.cartCleanup.type === 'ids') {
        await removeCartItems(
          input.cartCleanup.userId,
          input.cartCleanup.cartItemIds,
          { tx },
        );
      } else if (input.cartCleanup.type === 'domain') {
        await tx
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, input.cartCleanup.userId),
              eq(
                cartItemsTable.normalizedDomainName,
                input.cartCleanup.normalizedDomainName,
              ),
            ),
          );
      }
    }

    // 4. Build per-payment metadata map
    const paymentsMetadata: Record<
      string,
      ChargeUserWorkflowInput['metadata'] | undefined
    > = {};
    for (let i = 0; i < createdPayments.length; i++) {
      paymentsMetadata[createdPayments[i].id] =
        input.paymentsMetadataFromInput?.[i];
    }

    // 5. Start temporal workflow
    try {
      await temporalClient.workflow.start(processOrderWorkflow, {
        args: [
          {
            orderId: order.id,
            paymentsMetadata,
            gaEventTracking: input.gaEventTracking,
          },
        ],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: `process-order-${order.id}`,
      });
    } catch (error) {
      logger.error({ error }, 'Could not start process order workflow');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Could not initiate the order, please contact support if the issue persists',
      });
    }

    return order;
  });

  // 6. GA event tracking (after transaction)
  if (input.gaEventTracking.trackGaEvents) {
    void gaEventOrderPlaced({
      userId: input.userId,
      orderId: order.id,
      amountUsdCents: order.amountInUSDCents,
      itemCount: order.items.length,
      paymentCount: input.payments.length,
      orderSource: input.orderSource,
    });
  } else {
    logger.info(
      {
        orderId: order.id,
        userId: input.userId,
        gaEventTracking: input.gaEventTracking,
      },
      'Skipping GA order_placed event because tracking is disabled',
    );
  }

  return order;
}
