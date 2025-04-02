import { orderService } from '#services/orders/orders.service';

export function getOrderDetailsOrThrow(orderId: string) {
  return orderService.getOrderDetailsOrThrow(orderId);
}

export function updateOrderStatus({
  orderId,
  status,
}: {
  orderId: string;
  status:
    | 'PROCESSING'
    | 'FAILED'
    | 'CREATED'
    | 'SUCCEEDED'
    | 'PARTIALLY_COMPLETED';
}) {
  return orderService.updateOrderStatus({ orderId, status });
}

// Export activities as a namespace for easier import in workflow
export type OrderActivities = {
  getOrderDetailsOrThrow: typeof getOrderDetailsOrThrow;
  updateOrderStatus: typeof updateOrderStatus;
};
