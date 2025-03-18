import { ServiceError, ServiceName } from '#services/serviceError';

export class NegativeAmountInUsdCentsError extends ServiceError {
  constructor({ amountInUsdCents }: { amountInUsdCents: number }) {
    super(
      `Received a negative value (${amountInUsdCents.toString()}) for amountInUsdCents`,
      ServiceName.PAYMENTS,
    );
  }
}

export class CreateNewPaymentFailure extends ServiceError {
  constructor() {
    super(
      'Failed to create a new Payment entry in the database',
      ServiceName.PAYMENTS,
    );
  }
}
