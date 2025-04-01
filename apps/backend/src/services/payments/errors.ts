import { ServiceError, ServiceName } from '#services/serviceError';

export class CreateNewPaymentFailure extends ServiceError {
  constructor() {
    super(
      'Failed to create a new Payment entry in the database',
      ServiceName.PAYMENTS,
    );
  }
}

export class CreateNewRefundFailure extends ServiceError {
  constructor() {
    super(
      'Failed to create a new Payment entry in the database',
      ServiceName.PAYMENTS,
    );
  }
}

export class MissingNfscPaymentDetailsError extends ServiceError {
  constructor({ paymentId }: { paymentId: string }) {
    super(
      `Missing NFSC payment details for Payment with ID: ${paymentId}`,
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

export class StripeRefundsNotSupportedError extends ServiceError {
  constructor() {
    super(
      'Refunds for Payments with PaymentProvider.Stripe not currently supported',
      ServiceName.PAYMENTS,
    );
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

export class UpdateRefundFailure extends ServiceError {
  constructor({ refundId }: { refundId: string }) {
    super(`Failed to update Refund with ID: ${refundId}`, ServiceName.PAYMENTS);
  }
}
