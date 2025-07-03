import {
  type OrderItemInsert,
  type PaymentSelect,
  cartItemsTable,
  db,
  isNfscPayment,
  orderItemsTable,
  ordersTable,
} from '@namefi-astra/db';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { isNil } from 'ramda';
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
  isNormalizedDomainNameAllowedForOriginHostname,
  privyClient,
} from '../utils';
import type { Json } from 'drizzle-zod';
import {
  reflectChangesInCartItemsIfAnyAndReturnSummary,
  validateCartItems,
} from '#lib/carts/cart-validation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
            totalAmountInUSDCents: totalAmountInUsdCents,
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
      const order = await orderService.getOrderDetailsOrThrow(orderId);
      if (order.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      return order;
    }),

  getOrderItems: protectedProcedure.query(async ({ ctx }) => {
    // TODO: (sid) Consider addding pagination to this query if we start to have a lot of orders
    const allOrders = await db.query.ordersTable.findMany({
      where: eq(ordersTable.userId, ctx.user.id),
      with: {
        items: true,
      },
      orderBy: [desc(ordersTable.createdAt)],
    });

    return allOrders.flatMap((order) =>
      order.items.flatMap((item) =>
        isNormalizedDomainNameAllowedForOriginHostname(
          item.normalizedDomainName,
          ctx.thirdPartyOriginHostname,
        )
          ? [{ ...item, orderId: order.id }]
          : [],
      ),
    );
  }),

  getOrderPaymentMethodDetails: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { orderId } = input;

      const { userId, payment } =
        await orderService.getOrderDetailsOrThrow(orderId);

      if (userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }

      if (isNfscPayment(payment)) {
        return {
          isOnChainPayment: true,
          txHash: payment.paymentProviderReferenceId,
          chainId: payment.nfscPaymentDetails.chainId,
          walletAddress: payment.nfscPaymentDetails.walletAddress,
        };
      }

      if (isNil(payment.paymentProviderReferenceId)) {
        return {
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
          message: 'payment information missing',
        });
      }

      const paymentMethod =
        stripePaymentIntent.payment_method as Stripe.PaymentMethod;

      return {
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
