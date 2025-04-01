import { cartsTable, db, orderItemsTable, ordersTable } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
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

      return await db.transaction(async (tx) => {
        const payment = await createPayment({
          amountInUsdCents: totalAmountInUSDCents,
          paymentProvider: input.paymentMethodDetails.paymentProvider as
            | 'NFSC_BASE'
            | 'NFSC_ETHEREUM'
            | 'NFSC_ETHEREUM_SEPOLIA'
            | 'STRIPE',
          chainId: input.paymentMethodDetails.paymentProviderOptions?.chainId,
          walletAddress:
            input.paymentMethodDetails.paymentProviderOptions?.walletAddress,
        });

        // Create the order first
        const [order] = await tx
          .insert(ordersTable)
          .values({
            amountInUSDCents: totalAmountInUSDCents,
            totalAmountInUSDCents,
            userId: ctx.user.id,
            paymentId: payment.id,
          })
          .returning();

        // Create order items
        const orderItems = await tx
          .insert(orderItemsTable)
          .values(
            cart.items.map((item) => ({
              orderId: order.id,
              normalizedDomainName: item.normalizedDomainName,
              amountInUSDCents: item.amountInUSDCents,
              metadata: item.metadata,
            })),
          )
          .returning();

        return {
          ...order,
          items: orderItems,
        };
      });
    }),
  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const { orderId } = input;
      const order = await db.query.ordersTable.findFirst({
        where: eq(ordersTable.id, orderId),
        with: {
          items: true,
          payment: true,
        },
      });
      return order;
    }),
});
