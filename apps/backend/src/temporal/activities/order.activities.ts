import { db, ordersTable } from '@namefi-astra/db';
import type { OrderStatus } from '@namefi-astra/db/types';
import { eq } from 'drizzle-orm';
import { orderService } from '#services/orders/orders.service';

export function getOrderDetailsOrThrow(orderId: string) {
  return orderService.getOrderDetailsOrThrow(orderId);
}

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
    throw new Error(`Order not found with id ${orderId}`);
  }

  return updatedOrder;
}

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderStatusOrThrow: typeof updateOrderStatusOrThrow;
};
