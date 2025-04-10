import {
  cartItemsTable,
  db,
  orderItemsTable,
  ordersTable,
} from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { orderService } from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createOrderInputSchema } from '../types';
import { isNormalizedDomainNameAllowedForOriginHostname } from '../utils';

export const ordersRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(createOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { cartItemIds } = input;
      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          inArray(cartItemsTable.id, cartItemIds),
          eq(cartItemsTable.userId, ctx.user.id),
        ),
      });

      if (cartItems.length !== cartItemIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
        });
      }

      const totalAmountInUSDCents = cartItems.reduce(
        (acc, item) => acc + item.amountInUSDCents,
        0,
      );

      const payment = await createPayment({
        amountInUsdCents: totalAmountInUSDCents,
        paymentProviderDetails: input.paymentProviderDetails,
      });

      // Create order using DB transaction
      const order = await db.transaction(async (tx) => {
        // Create the order first
        const [order] = await tx
          .insert(ordersTable)
          .values({
            amountInUSDCents: totalAmountInUSDCents,
            totalAmountInUSDCents,
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
            cartItems.map((item) => ({
              orderId: order.id,
              normalizedDomainName: item.normalizedDomainName,
              amountInUSDCents: item.amountInUSDCents,
              metadata: item.metadata,
            })),
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
    .query(async ({ input }) => {
      const { orderId } = input;
      return await orderService.getOrderDetailsOrThrow(orderId);
    }),
  getOrderItems: protectedProcedure.query(async ({ ctx }) => {
    // TODO: (sid) Consider addding pagination to this query if we start to have a lot of orders
    const allOrders = await db.query.ordersTable.findMany({
      where: eq(ordersTable.userId, ctx.user.id),
      with: {
        items: true,
      },
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
});
