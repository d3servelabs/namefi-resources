import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { stripePaymentService, usersService } from '#services/index';
import { createTRPCRouter, protectedProcedure } from '../base';

export const checkoutsRouter = createTRPCRouter({
  checkoutWithCart: protectedProcedure
    .input(
      z.object({
        totalAmountInUsdCents: z.number(),
        paymentProvider: z.string(),
        paymentProviderOptions: z
          .object({
            confirmationTokenId: z.string().optional(),
            paymentMethodId: z.string().optional(),
            walletAddress: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // create Payment entry in DB

      // Process Payment
      if (input.paymentProvider === 'STRIPE') {
        let { stripeCustomerId } = await usersService.getUserStripeCustomerId({
          userId: ctx.user.id,
        });

        if (!stripeCustomerId) {
          const customer = await stripePaymentService.createCustomer({
            name: ctx.user.id,
          });

          const [userWithStripeCustomerId] = await db
            .update(usersTable)
            .set({
              stripeCustomerId: customer.id,
              updatedAt: new Date(),
            })
            .where(eq(usersTable.id, ctx.user.id))
            .returning({ stripeCustomerId: usersTable.stripeCustomerId });

          stripeCustomerId =
            userWithStripeCustomerId.stripeCustomerId as string;
        }

        const { stripePaymentIntent } =
          await stripePaymentService.createPaymentIntent({
            totalAmountInUsdCents: input.totalAmountInUsdCents,
            paymentMethodId: input.paymentProviderOptions?.paymentMethodId,
            stripeCustomerId,
            confirmationTokenId:
              input.paymentProviderOptions?.confirmationTokenId,
          });

        // process order and get amountToCatpure
        const amountToCaptureInUsdCents = input.totalAmountInUsdCents;

        // capture funds
        const { capturedStripePaymentIntent } =
          await stripePaymentService.capturePaymentIntent({
            amountToCaptureInUsdCents,
            stripePaymentIntentId: stripePaymentIntent.id,
          });

        return capturedStripePaymentIntent.status;
      }

      return 'succeeded';
    }),
});
