import {
  type NfscPaymentProviderDetails,
  type OrderStatus,
  type PaymentProviderDetails,
  type PaymentSelect,
  type UserSelect,
  cartItemsTable,
  db,
  isNfscPayment,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
} from '@namefi-astra/db';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import { and, desc, eq, getTableColumns, ilike, inArray } from 'drizzle-orm';
import { isNil, isNotNil, pluck, sum } from 'ramda';
import Stripe from 'stripe';
import { zeroAddress } from 'viem';
import { z } from 'zod';
import { NegativeAmountInUsdCentsError } from '#services/payments/errors';
import {
  orderService,
  type CreateOrderItemInput,
} from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import {
  processOrderWorkflow,
  getOrderProgressQuery,
  type ProcessOrderWorkflowPublicState,
} from '../../temporal/workflows/processOrder.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure, withAudit } from '../base';
import {
  createOrderInputSchema,
  createOrderV2InputSchema,
  instantBuyInputSchema,
} from '../types';
import { validateDomainForInstantPurchaseOrThrow } from '../../lib/instant-buy';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import {
  reflectChangesInCartItemsIfAnyAndReturnSummary,
  validateCartItems,
} from '#lib/carts/cart-validation';
import { secrets } from '../../lib/env';
import pMap from 'p-map';
import { logger } from '#lib/logger';
import { config } from '#lib/env';
import { sendGA4Event } from '#lib/ga4-measurement';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);
type PaymentMethodDetailsOnChain = {
  paymentId: string;
  isOnChainPayment: true;
  txHash?: string | null;
  chainId: number;
  walletAddress: string;
};
type PaymentMethodDetailsOffChain = {
  paymentId: string;
  isOnChainPayment: false;
  brand?: string;
  last4?: string;
};

type PaymentMethodDetails =
  | PaymentMethodDetailsOnChain
  | PaymentMethodDetailsOffChain;

type OrderProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: ProcessOrderWorkflowPublicState | null;
};

type OrderProgressPayload = OrderProgressSnapshot & {
  orderStatus: OrderStatus;
  fetchedAt: string;
};

const workflowIdForOrder = (orderId: string) => `process-order-${orderId}`;

export const trackOrderPlaced = async ({
  userId,
  orderId,
  amountUsdCents,
  itemCount,
  paymentCount,
  orderSource,
}: {
  userId: string;
  orderId: string;
  amountUsdCents: number;
  itemCount: number;
  paymentCount: number;
  orderSource?: 'checkout' | 'instant_buy';
}) => {
  try {
    await sendGA4Event({
      userId,
      event: {
        name: 'order_placed',
        params: {
          order_id: orderId,
          amount_usd_cents: amountUsdCents,
          item_count: itemCount,
          payment_count: paymentCount,
          order_source: orderSource,
        },
      },
    });
  } catch (error) {
    logger.warn({ error, orderId }, 'Failed to send GA order_placed event');
  }
};

const ensureOrderOwnership = async (orderId: string, userId: string) => {
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
};

const fetchOrderWorkflowSnapshot = async (
  orderId: string,
): Promise<OrderProgressSnapshot> => {
  const workflowId = workflowIdForOrder(orderId);
  const handle = temporalClient.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: ProcessOrderWorkflowPublicState | null = null;
    const isQueryable =
      workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED';
    if (isQueryable) {
      try {
        state = await handle.query(getOrderProgressQuery);
      } catch (error) {
        logger.debug(
          { error, workflowId, orderId },
          'Order workflow state query failed',
        );
        state = null;
      }
    }

    return {
      workflowStatus,
      runId: description.runId,
      state,
    };
  } catch (error) {
    logger.debug(
      { error, workflowId, orderId },
      'Failed to fetch order workflow snapshot',
    );

    return {
      workflowStatus: 'NOT_FOUND',
      runId: null,
      state: null,
    };
  }
};

export const ordersRouter = createTRPCRouter({
  createOrder: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: (ctx as any).user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'create',
      extraInput: input,
    }),
  )
    .input(createOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { cartItemIds } = input;
      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          inArray(cartItemsTable.id, cartItemIds),
          eq(cartItemsTable.userId, ctx.user.id),
        ),
      });

      await validateCartItems(ctx.user.id, cartItemIds);

      if (cartItems.length !== cartItemIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
        });
      }

      const totalAmountInUsdCents = sum(pluck('amountInUSDCents', cartItems));

      const order = await db.transaction(async (tx) => {
        const payment: PaymentSelect = await _createPaymentForOrder(
          {
            totalAmountInUsdCents,
            paymentProviderDetails: input.paymentProviderDetails,
            user,
          },
          { tx },
        );

        // Create order with existing payment
        const order = await orderService.createOrderWithExistingSinglePayment(
          {
            amountInUSDCents: totalAmountInUsdCents,
            userId: ctx.user.id,
            paymentId: payment.id,
            nftWalletAddress: input.nftMetadata.nftWalletAddress,
            nftChainId: input.nftMetadata.nftChainId,
            items: cartItems.map(
              (item) =>
                ({
                  normalizedDomainName: item.normalizedDomainName,
                  amountInUSDCents: item.amountInUSDCents,
                  durationInYears: item.durationInYears,
                  type: item.type,
                  registrar: item.registrar,
                  metadata: item.metadata ?? undefined,
                  encryptionKeyId: item.encryptionKeyId ?? undefined,
                  encryptedEppAuthorizationCode:
                    item.encryptedEppAuthorizationCode ?? undefined,
                }) satisfies CreateOrderItemInput,
            ),
          },
          { tx },
        );

        // Delete cart items that were used to create the order
        await _removeCartItems(ctx.user.id, cartItemIds, { tx });

        const paymentsMetadata = {
          [payment.id]: input.paymentMetadata,
        };
        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
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
      void trackOrderPlaced({
        userId: ctx.user.id,
        orderId: order.id,
        amountUsdCents: order.amountInUSDCents,
        itemCount: order.items.length,
        paymentCount: 1,
        orderSource: 'checkout',
      });
      return order;
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { orderId } = input;
      const data = await orderService.getOrderDetailsOrThrow(orderId);
      if (data.order.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      return data;
    }),

  getOrderItems: protectedProcedure.query(
    async ({ ctx: { user, poweredByNamefiDomain } }) => {
      // TODO: (sid) Consider addding pagination to this query if we start to have a lot of order
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
            eq(ordersTable.userId, user.id),
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
    },
  ),

  getOrderProgress: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { orderId } = input;

      const orderRecord = await ensureOrderOwnership(orderId, user.id);
      const snapshot = await fetchOrderWorkflowSnapshot(orderId);
      const orderStatus: OrderStatus =
        snapshot.state?.status ?? orderRecord.status;

      const payload: OrderProgressPayload = {
        ...snapshot,
        orderStatus,
        fetchedAt: new Date().toISOString(),
      };

      return payload;
    }),

  createOrderV2: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'create',
      extraInput: input,
    }),
  )
    .input(
      createOrderV2InputSchema.superRefine((input, ctx) => {
        if (!input.nftMetadata.nftChainId) {
          ctx.addIssue({
            code: 'custom',
            message: 'NFT chain ID is required',
          });
        }
        if (!config.ALLOWED_CHAINS.includes(input.nftMetadata.nftChainId)) {
          ctx.addIssue({
            code: 'custom',
            message: `NFT chain ID ${input.nftMetadata.nftChainId} is not allowed`,
          });
        }
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { cartItemIds, payments, nftMetadata } = input;

      const [error, privyUser] = await resolve(
        privyClient.getUserById(ctx.user.privyUserId),
      );
      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not find user details',
        });
      }

      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          inArray(cartItemsTable.id, cartItemIds),
          eq(cartItemsTable.userId, ctx.user.id),
        ),
      });

      await validateCartItems(ctx.user.id, cartItemIds);

      if (cartItems.length !== cartItemIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const totalAmountInUsdCents = sum(pluck('amountInUSDCents', cartItems));
      const inputPaymentsTotal = sum(pluck('amountInUsdCents', payments));
      if (inputPaymentsTotal !== totalAmountInUsdCents) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Payments total (${inputPaymentsTotal}) does not match cart total (${totalAmountInUsdCents})`,
        });
      }

      const userWallets = new Set(
        getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        }),
      );
      const nfscPayments = payments
        .map((p) => p.paymentProviderDetails)
        .filter((p) => isNfscPayment(p)) as NfscPaymentProviderDetails[];

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

      const order = await db.transaction(async (tx) => {
        // 1) Create payments first, capturing each paymentId
        const createdPayments: PaymentSelect[] = [];
        for (const p of payments) {
          const created = await createPayment(
            {
              amountInUsdCents: p.amountInUsdCents,
              paymentProviderDetails: p.paymentProviderDetails,
            },
            { tx },
          );
          createdPayments.push(created);
        }

        // 2) Create order linked to multiple payments (guarded linking inside service)
        const order =
          await orderService.createOrderWithExistingMultiplePayments(
            {
              amountInUSDCents: totalAmountInUsdCents,
              userId: ctx.user.id,
              paymentIds: createdPayments.map((p) => p.id),
              nftWalletAddress: nftMetadata.nftWalletAddress,
              nftChainId: nftMetadata.nftChainId,
              items: cartItems.map(
                (item) =>
                  ({
                    normalizedDomainName: item.normalizedDomainName,
                    amountInUSDCents: item.amountInUSDCents,
                    durationInYears: item.durationInYears,
                    type: item.type,
                    registrar: item.registrar,
                    metadata: item.metadata ?? undefined,
                    encryptionKeyId: item.encryptionKeyId ?? undefined,
                    encryptedEppAuthorizationCode:
                      item.encryptedEppAuthorizationCode ?? undefined,
                  }) satisfies CreateOrderItemInput,
              ),
            },
            { tx },
          );

        // 3) Delete used cart items
        await _removeCartItems(ctx.user.id, cartItemIds, { tx });

        // 4) Build per-payment metadata map and start workflow
        const paymentsMetadata = createdPayments.reduce<{
          [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
        }>((acc, p, i) => {
          acc[p.id] = payments[i]?.paymentMetadata as
            | ChargeUserWorkflowInput['metadata']
            | undefined;
          return acc;
        }, {});

        // TODO: [HIGH-IMPACT RACE CONDITION] Temporal workflow started inside database transaction.
        // If the workflow.start() call succeeds but the transaction later fails to commit
        // (e.g., due to serialization conflict), the workflow will be running for an order
        // that doesn't exist in the database. Conversely, if the transaction commits but
        // workflow.start() fails, we have an order without a processing workflow.
        // Current mitigation: The catch block throws, rolling back the transaction.
        // However, Temporal workflow start is not transactional with the database.
        // Impact: High - Could lead to orphaned workflows or orders stuck in PENDING state.
        // Fix: Consider starting the workflow AFTER the transaction commits, with a separate
        // cleanup mechanism for orders that fail to start their workflow.
        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
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
      void trackOrderPlaced({
        userId: ctx.user.id,
        orderId: order.id,
        amountUsdCents: order.amountInUSDCents,
        itemCount: order.items.length,
        paymentCount: payments.length,
        orderSource: 'checkout',
      });
      return order;
    }),

  // Instant buy - single domain purchase without cart
  instantBuy: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'instant_buy',
      extraInput: input,
    }),
  )
    .input(
      instantBuyInputSchema.superRefine((input, ctx) => {
        if (!input.nftMetadata.nftChainId) {
          ctx.addIssue({
            code: 'custom',
            message: 'NFT chain ID is required',
          });
        }
        if (!config.ALLOWED_CHAINS.includes(input.nftMetadata.nftChainId)) {
          ctx.addIssue({
            code: 'custom',
            message: `NFT chain ID ${input.nftMetadata.nftChainId} is not allowed`,
          });
        }
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { normalizedDomainName, durationInYears, payments, nftMetadata } =
        input;

      // 1. Get user details from Privy
      const [error, privyUser] = await resolve(
        privyClient.getUserById(ctx.user.privyUserId),
      );
      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not find user details',
        });
      }

      // 2. Validate domain availability and get pricing
      const validation = await validateDomainForInstantPurchaseOrThrow({
        normalizedDomainName,
        durationInYears,
        user: { id: ctx.user.id, privyUserId: ctx.user.privyUserId },
      });

      // 3. Validate payments total matches price
      const inputPaymentsTotal = sum(pluck('amountInUsdCents', payments));
      if (inputPaymentsTotal !== validation.priceInUsdCents) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Payments total (${inputPaymentsTotal}) does not match domain price (${validation.priceInUsdCents})`,
        });
      }

      // 4. Validate NFSC wallet addresses are linked to user
      const userWallets = new Set(
        getPrivyUserLinkedEthereumChecksumWalletAddresses({ privyUser }),
      );
      const nfscPayments = payments
        .map((p) => p.paymentProviderDetails)
        .filter((p) => isNfscPayment(p)) as NfscPaymentProviderDetails[];

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

      // 5. Create order in transaction
      const order = await db.transaction(async (tx) => {
        // Create payments
        const createdPayments: PaymentSelect[] = [];
        for (const p of payments) {
          const created = await createPayment(
            {
              amountInUsdCents: p.amountInUsdCents,
              paymentProviderDetails: p.paymentProviderDetails,
            },
            { tx },
          );
          createdPayments.push(created);
        }

        // Create order with single item
        const order =
          await orderService.createOrderWithExistingMultiplePayments(
            {
              amountInUSDCents: validation.priceInUsdCents,
              userId: ctx.user.id,
              paymentIds: createdPayments.map((p) => p.id),
              nftWalletAddress: nftMetadata.nftWalletAddress,
              nftChainId: nftMetadata.nftChainId,
              items: [
                {
                  normalizedDomainName,
                  amountInUSDCents: validation.priceInUsdCents,
                  durationInYears,
                  type: itemTypeSchema.enum.REGISTER,
                  registrar: validation.registrar,
                } satisfies CreateOrderItemInput,
              ],
            },
            { tx },
          );

        // Remove from cart if exists (cleanup)
        await tx
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, ctx.user.id),
              eq(cartItemsTable.normalizedDomainName, normalizedDomainName),
            ),
          );

        // Build per-payment metadata map and start workflow
        const paymentsMetadata = createdPayments.reduce<{
          [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
        }>((acc, p, i) => {
          acc[p.id] = payments[i]?.paymentMetadata as
            | ChargeUserWorkflowInput['metadata']
            | undefined;
          return acc;
        }, {});

        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
              },
            ],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            workflowId: `process-order-${order.id}`,
          });
        } catch (workflowError) {
          logger.error(
            { error: workflowError },
            'Could not start process order workflow for instant buy',
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'Could not initiate the order, please contact support if the issue persists',
          });
        }

        logger.info(
          {
            orderId: order.id,
            domain: normalizedDomainName,
            userId: ctx.user.id,
            priceInUsdCents: validation.priceInUsdCents,
          },
          'Instant buy order created successfully',
        );

        return order;
      });
      void trackOrderPlaced({
        userId: ctx.user.id,
        orderId: order.id,
        amountUsdCents: order.amountInUSDCents,
        itemCount: order.items.length,
        paymentCount: payments.length,
        orderSource: 'instant_buy',
      });
      return order;
    }),

  getOrderPaymentMethodsDetails: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }): Promise<PaymentMethodDetails[]> => {
      const { user } = ctx;
      const { orderId } = input;

      const { order, payments } =
        await orderService.getOrderDetailsOrThrow(orderId);

      if (order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      if (!payments.length) {
        return [];
      }
      const res = await pMap(
        payments,
        async (payment): Promise<PaymentMethodDetails> => {
          if (isNfscPayment(payment)) {
            return {
              paymentId: payment.id,
              isOnChainPayment: true,
              txHash: payment.paymentProviderReferenceId,
              chainId: payment.nfscPaymentDetails.chainId,
              walletAddress: payment.nfscPaymentDetails.walletAddress,
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
        },
      );

      return res;
    }),

  getPaymentMethodDetails: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }): Promise<PaymentMethodDetails> => {
      const { user } = ctx;
      const { paymentId } = input;

      const payment = await db.query.paymentsTable.findFirst({
        where: eq(paymentsTable.id, paymentId),
        with: {
          order: true,
        },
      });

      if (!payment || !payment.order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }
      // TODO userId should be present in the payment table
      if (payment.order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this payment',
        });
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
    }),

  // Get refunds for a given payment (amounts and provider reference ids)
  getPaymentRefunds: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { paymentId } = input;

      const payment = await db.query.paymentsTable.findFirst({
        where: eq(paymentsTable.id, paymentId),
        with: { order: true },
      });

      if (!payment || !payment.order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }
      if (payment.order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this payment',
        });
      }

      const refunds = await db.query.refundsTable.findMany({
        columns: {
          id: true,
          amountInUSDCents: true,
          status: true,
          paymentProviderReferenceId: true,
          chainId: true,
          walletAddress: true,
          createdAt: true,
        },
        where: eq(refundsTable.paymentId, paymentId),
        orderBy: [desc(refundsTable.createdAt)],
      });

      return refunds.map((r) => ({
        refundId: r.id,
        amountInUSDCents: r.amountInUSDCents,
        status: r.status,
        txHash: r.paymentProviderReferenceId,
        chainId: r.chainId,
        walletAddress: r.walletAddress,
        createdAt: r.createdAt,
      }));
    }),

  reflectChangesInCartItemsIfAnyAndReturnSummary: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }: any) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: ctx.user?.id || 'unknown',
      action: 'refresh_cart_items',
      extraInput: input,
    }),
  )
    .input(z.object({ cartItemIds: z.array(z.string()).optional() }))
    .mutation(({ ctx, input }) => {
      const { cartItemIds } = input;
      return reflectChangesInCartItemsIfAnyAndReturnSummary(
        ctx.user.id,
        cartItemIds,
      );
    }),
});

async function _createPaymentForOrder(
  {
    totalAmountInUsdCents,
    paymentProviderDetails,
    user,
  }: {
    totalAmountInUsdCents: number;
    paymentProviderDetails: PaymentProviderDetails;
    user: UserSelect;
  },
  { tx }: { tx?: typeof db } = {},
) {
  if (totalAmountInUsdCents < 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid cart items total',
    });
  }

  if (totalAmountInUsdCents === 0) {
    // for zero, we create a NFSC with 0 address
    try {
      return await createPayment(
        {
          amountInUsdCents: totalAmountInUsdCents,
          paymentProviderDetails: {
            paymentProvider: 'NFSC_BASE',
            nfscPaymentDetails: {
              chainId: 8453,
              walletAddress: zeroAddress,
            },
          },
        },
        { tx },
      );
    } catch (error) {
      logger.error({ error }, 'Could not create payment');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not create payment',
      });
    }
  }

  // Validate payment walletAddress (if present) belongs to user
  if (isNfscPayment(paymentProviderDetails)) {
    const [error, privyUser] = await resolve(
      privyClient.getUserById(user.privyUserId),
    );

    if (error || isNil(privyUser)) {
      logger.error(
        {
          privyUserId: user.privyUserId,
          error,
        },
        'Privy fetch failed',
      );
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Could not find user details',
      });
    }

    const paymentWalletChecksumAddress = checksumWalletAddressSchema.safeParse(
      paymentProviderDetails.nfscPaymentDetails.walletAddress,
    );
    if (!paymentWalletChecksumAddress.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Payment walletAddress format is incorrect',
      });
    }

    const privyUserLinkedEthereumChecksumWalletAddresses =
      getPrivyUserLinkedEthereumChecksumWalletAddresses({
        privyUser,
      });

    if (
      !privyUserLinkedEthereumChecksumWalletAddresses.includes(
        paymentWalletChecksumAddress.data,
      )
    ) {
      logger.error('Payment walletAddress validation failed');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid payment walletAddress',
      });
    }
  }

  try {
    return await createPayment(
      {
        amountInUsdCents: totalAmountInUsdCents,
        paymentProviderDetails: paymentProviderDetails,
      },
      { tx },
    );
  } catch (error) {
    logger.error(
      {
        error: (error as Error).message,
      },
      'Could not create payment',
    );
    if (error instanceof NegativeAmountInUsdCentsError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid cart items total',
      });
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not create payment',
    });
  }
}
async function _removeCartItems(
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
  logger.info({ res }, 'Cart items removed');
  return res;
}
