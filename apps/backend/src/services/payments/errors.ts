import { ServiceError, ServiceName } from '#services/serviceError';

export class CreateNewPaymentFailure extends ServiceError {
  constructor() {
    super(
      'Failed to create a new Payment entry in the database',
      ServiceName.PAYMENTS,
    );
  }
}

export class NegativeAmountInUsdCentsError extends ServiceError {
  constructor({ amountInUsdCents }: { amountInUsdCents: number }) {
    super(
      `Received a negative value (${amountInUsdCents.toString()}) for amountInUsdCents`,
      ServiceName.PAYMENTS,
    );
  }
}

export class PaymentNotFoundError extends ServiceError {
  constructor({ paymentId }: { paymentId: string }) {
    super(`Could not find Payment with ID: ${paymentId}`, ServiceName.PAYMENTS);
  }
}

export class UpdatePaymentFailure extends ServiceError {
  constructor({ paymentId }: { paymentId: string }) {
    super(
      `Failed to update Payment with ID: ${paymentId}`,
      ServiceName.PAYMENTS,
    );
  }
}
