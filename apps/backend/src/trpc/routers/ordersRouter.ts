import {
  type OrderItemInsert,
  type PaymentSelect,
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
import { isNil, isNotNil } from 'ramda';
import Stripe from 'stripe';
import { zeroAddress } from 'viem';
import { z } from 'zod';
import { NegativeAmountInUsdCentsError } from '#services/payments/errors';
import { orderService } from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createOrderInputSchema } from '../types';
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

      const totalAmountInUsdCents = cartItems.reduce(
        (acc, item) => acc + item.amountInUSDCents,
        0,
      );
      let payment: PaymentSelect | undefined;
      if (totalAmountInUsdCents > 0) {
        // Validate payment walletAddress (if present) belongs to user
        if (isNfscPayment(input.paymentProviderDetails)) {
          const [error, privyUser] = await resolve(
            privyClient.getUserById(user.privyUserId),
          );

          if (error || isNil(privyUser)) {
            console.error('Privy fetch failed', {
              privyUserId: user.privyUserId,
              error,
            });
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: 'Could not find user details',
            });
          }

          const paymentWalletChecksumAddress =
            checksumWalletAddressSchema.safeParse(
              input.paymentProviderDetails.nfscPaymentDetails.walletAddress,
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
            console.error('Payment walletAddress validation failed');
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid payment walletAddress',
            });
          }
        }

        try {
          payment = await createPayment({
            amountInUsdCents: totalAmountInUsdCents,
            paymentProviderDetails: input.paymentProviderDetails,
          });
        } catch (error) {
          console.error((error as Error).message);
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
      } else {
        // for zero or negative, we cfreate a NFSC with 0 address
        try {
          payment = await createPayment({
            amountInUsdCents: totalAmountInUsdCents,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                chainId: 8453,
                walletAddress: zeroAddress,
              },
            },
          });
        } catch (error) {
          console.error((error as Error).message);
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

      // Create order using DB transaction
      const order = await db.transaction(async (tx) => {
        // Create the order first
        const [order] = await tx
          .insert(ordersTable)
          .values({
            amountInUSDCents: totalAmountInUsdCents,
            userId: ctx.user.id,
            paymentId: payment.id,
            nftWalletAddress: input.nftMetadata.nftWalletAddress,
            nftChainId: input.nftMetadata.nftChainId,
          })
          .returning();

        // Create order items
        const orderItems = await tx
          .insert(orderItemsTable)
          .values(
            cartItems.map(
              (item) =>
                ({
                  orderId: order.id,
                  normalizedDomainName: item.normalizedDomainName,
                  amountInUSDCents: item.amountInUSDCents,
                  durationInYears: item.durationInYears,
                  type: item.type,
                  registrar: item.registrar,
                  metadata: item.metadata as Json,
                  encryptionKeyId: item.encryptionKeyId,
                  encryptedEppAuthorizationCode:
                    item.encryptedEppAuthorizationCode,
                }) satisfies OrderItemInsert,
            ),
          )
          .returning();

        // Delete cart items that were used to create the order
        await tx
          .delete(cartItemsTable)
          .where(
            and(
              inArray(cartItemsTable.id, cartItemIds),
              eq(cartItemsTable.userId, ctx.user.id),
            ),
          );

        return {
          ...order,
          items: orderItems,
        };
      });

      try {
        temporalClient.workflow.start(processOrderWorkflow, {
          args: [
            {
              orderId: order.id,
              paymentMetadata: input.paymentMetadata,
            },
          ],
          taskQueue: TEMPORAL_QUEUES.DOMAINS,
          workflowId: `process-order-${order.id}`,
        });
      } catch (error) {
        console.error(error);
      }

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

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      if (payment.order?.userId !== user.id) {
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
