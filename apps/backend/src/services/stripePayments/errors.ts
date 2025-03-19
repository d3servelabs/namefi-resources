import { ServiceError, ServiceName } from '#services/serviceError';

export class PaymentMethodNotFoundError extends ServiceError {
  constructor({
    stripeCustomerId,
    paymentMethodId,
  }: { stripeCustomerId: string; paymentMethodId: string }) {
    super(
      `The provided paymentMethodId (${paymentMethodId}) is not associated with stripeCustomerId: ${stripeCustomerId}`,
      ServiceName.STRIPE,
    );
  }
}
