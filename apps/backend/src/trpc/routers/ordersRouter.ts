import { cartsTable, db } from '@namefi-astra/db';
import type { PaymentProvider } from '@namefi-astra/db/types';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { orderService } from '#services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { createTRPCRouter, protectedProcedure } from '../base';

export const ordersRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(
      z.object({
        cartId: z.string(),
        paymentMethodDetails: z.object({
          paymentProvider: z.string(),
          paymentProviderOptions: z
            .object({
              chainId: z.number().optional(),
              confirmationTokenId: z.string().optional(),
              paymentMethodId: z.string().optional(),
              walletAddress: z.string().optional(),
            })
            .optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { cartId } = input;
      const cart = await db.query.cartsTable.findFirst({
        where: eq(cartsTable.id, cartId),
        with: {
          items: true,
        },
      });

      if (!cart) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
        });
      }

      const totalAmountInUSDCents = cart.items.reduce(
        (acc, item) => acc + item.amountInUSDCents,
        0,
      );

      if (
        !(
          input.paymentMethodDetails.paymentProvider === 'NFSC_BASE' ||
          input.paymentMethodDetails.paymentProvider === 'NFSC_ETHEREUM' ||
          input.paymentMethodDetails.paymentProvider ===
            'NFSC_ETHEREUM_SEPOLIA' ||
          input.paymentMethodDetails.paymentProvider === 'STRIPE'
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid payment provider',
        });
      }

      // Create payment first
      const paymentProvider = input.paymentMethodDetails
        .paymentProvider as PaymentProvider;

      const nfscPaymentDetails =
        input.paymentMethodDetails.paymentProviderOptions?.chainId !==
          undefined &&
        input.paymentMethodDetails.paymentProviderOptions?.walletAddress !==
          undefined
          ? {
              nfscPaymentDetails: {
                chainId:
                  input.paymentMethodDetails.paymentProviderOptions.chainId,
                walletAddress:
                  input.paymentMethodDetails.paymentProviderOptions
                    .walletAddress,
              },
            }
          : undefined;

      const stripePaymentDetails =
        input.paymentMethodDetails.paymentProviderOptions?.paymentMethodId !==
        undefined
          ? {
              stripePaymentDetails: {
                paymentMethodId:
                  input.paymentMethodDetails.paymentProviderOptions
                    .paymentMethodId,
              },
            }
          : undefined;

      const paymentProviderDetails =
        paymentProvider === 'STRIPE'
          ? Object.assign({ paymentProvider }, stripePaymentDetails)
          : Object.assign({ paymentProvider }, nfscPaymentDetails);

      const payment = await createPayment({
        amountInUsdCents: totalAmountInUSDCents,
        paymentProviderDetails,
      });

      // Create order using the service
      return orderService.createOrderFromCart({
        cartId: input.cartId,
        userId: ctx.user.id,
        paymentId: payment.id,
      });
    }),
  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const { orderId } = input;
      return await orderService.getOrderDetailsOrThrow(orderId);
    }),
});
