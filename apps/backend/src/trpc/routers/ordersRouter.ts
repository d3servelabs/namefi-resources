import {
  type NfscPaymentProviderDetails,
  type OrderItemInsert,
  type PaymentProviderDetails,
  type PaymentSelect,
  type UserSelect,
  cartItemsTable,
  db,
  isNfscPayment,
  orderItemsTable,
  ordersTable,
  paymentsTable,
} from '@namefi-astra/db';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
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
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createOrderInputSchema, createOrderV2InputSchema } from '../types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import type { Json } from 'drizzle-zod';
import {
  reflectChangesInCartItemsIfAnyAndReturnSummary,
  validateCartItems,
} from '#lib/carts/cart-validation';
import { secrets } from '../../lib/env';
import pMap from 'p-map';
import { logger } from '#lib/logger';

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

export const ordersRouter = createTRPCRouter({
  createOrder: protectedProcedure
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

      return await db.transaction(async (tx) => {
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
                  metadata: item.metadata as Json,
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

  // Stage 5: Multi-payment createOrderV2
  createOrderV2: protectedProcedure
    .input(createOrderV2InputSchema)
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

      return await db.transaction(async (tx) => {
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
                    metadata: item.metadata as Json,
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

  reflectChangesInCartItemsIfAnyAndReturnSummary: protectedProcedure
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
