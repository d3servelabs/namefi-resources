import { ServiceError, ServiceName } from '#services/serviceError';

export class OrderNotFoundError extends ServiceError {
  constructor(params: { orderId: string }) {
    super(`Order not found with id ${params.orderId}`, ServiceName.ORDERS);
  }
}

export class OrderItemProcessingError extends ServiceError {
  constructor(params: { orderId: string; itemId: string; reason?: string }) {
    super(
      `Failed to process order item ${params.itemId} for order ${params.orderId}${params.reason ? `: ${params.reason}` : ''}`,
      ServiceName.ORDERS,
    );
  }
}

export class OrderUpdateError extends ServiceError {
  constructor(params: { orderId: string; reason?: string }) {
    super(
      `Failed to update order ${params.orderId}${params.reason ? `: ${params.reason}` : ''}`,
      ServiceName.ORDERS,
    );
  }
}
