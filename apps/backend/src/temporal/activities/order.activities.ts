import type { OrderStatus } from '@namefi-astra/db/types';
import { orderService } from '#services/orders/orders.service';

export function getOrderDetailsOrThrow(orderId: string) {
  return orderService.getOrderDetailsOrThrow(orderId);
}

export function updateOrderStatusOrThrow({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  return orderService.updateOrderStatusOrThrow({ orderId, status });
}

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderStatusOrThrow: typeof updateOrderStatusOrThrow;
};
