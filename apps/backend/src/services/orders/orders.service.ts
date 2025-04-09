import { db, ordersTable } from '@namefi-astra/db';
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

export const orderService = {
  getOrderDetailsOrThrow,
};
