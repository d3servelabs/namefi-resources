import { ServiceError, ServiceName } from '#services/serviceError';

export class OrderNotFoundError extends ServiceError {
  constructor(params: { orderId: string }) {
    super(`Order not found with id ${params.orderId}`, ServiceName.ORDERS);
  }
}
