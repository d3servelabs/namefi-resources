import {
  type OrderStatus,
  cartsTable,
  db,
  orderItemsTable,
  ordersTable,
} from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { OrderNotFoundError } from './errors';

export async function getOrderDetailsOrThrow(orderId: string) {
  const order = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    with: {
      items: true,
      payment: true,
      user: true,
    },
  });

  if (!order) {
    throw new OrderNotFoundError({ orderId });
  }

  return order;
}

// TODO: move to trpc, used only by apps/backend/src/trpc/routers/ordersRouter.ts
export async function createOrderFromCart({
  cartId,
  userId,
  paymentId,
}: {
  cartId: string;
  userId: string;
  paymentId: string;
}) {
  const cart = await db.query.cartsTable.findFirst({
    where: eq(cartsTable.id, cartId),
    with: {
      items: true,
    },
  });

  if (!cart) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cart not found',
    });
  }

  const totalAmountInUSDCents = cart.items.reduce(
    (acc, item) => acc + item.amountInUSDCents,
    0,
  );

  return await db.transaction(async (tx) => {
    // Create the order first
    const [order] = await tx
      .insert(ordersTable)
      .values({
        amountInUSDCents: totalAmountInUSDCents,
        totalAmountInUSDCents,
        userId,
        paymentId,
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
}

// TODO: move to temporal, used only by apps/backend/src/temporal/workflows/processOrder.workflow.ts, apps/backend/src/temporal/activities/order.activities.ts
export async function updateOrderStatusOrThrow({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [updatedOrder] = await db
    .update(ordersTable)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!updatedOrder) {
    throw new OrderNotFoundError({ orderId });
  }

  return updatedOrder;
}

export const orderService = {
  getOrderDetailsOrThrow,
  createOrderFromCart,
  updateOrderStatusOrThrow,
};
