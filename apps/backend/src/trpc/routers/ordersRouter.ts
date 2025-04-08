import { cartsTable, db } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { orderService } from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createOrderInputSchema } from '../types';

export const ordersRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(createOrderInputSchema)
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

      const payment = await createPayment({
        amountInUsdCents: totalAmountInUSDCents,
        paymentProviderDetails: input.paymentProviderDetails,
      });

      // Create order using the service
      const order = await orderService.createOrderFromCart({
        cartId: input.cartId,
        userId: ctx.user.id,
        paymentId: payment.id,
        nftWalletAddress: input.nftMetadata.nftWalletAddress,
        nftChainId: input.nftMetadata.nftChainId,
      });

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

      return order;
    }),
  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const { orderId } = input;
      return await orderService.getOrderDetailsOrThrow(orderId);
    }),
});
