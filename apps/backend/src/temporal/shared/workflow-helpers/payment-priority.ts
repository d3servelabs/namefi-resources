import type { PaymentProvider } from '@namefi-astra/db/types';

export type PaymentPriority = [
  PaymentProvider,
  PaymentProvider,
  PaymentProvider,
  PaymentProvider,
] & { _: { brand: 'PAYMENT_PRIORITY' } };

export const createPaymentPriority = (
  paymentProviders: PaymentProvider[],
): PaymentPriority => {
  if (paymentProviders.length !== 4) {
    throw new Error(
      `Payment providers must be exactly 4, got ${paymentProviders.length}`,
    );
  }
  const uniquePaymentProviders = new Set(paymentProviders);
  if (uniquePaymentProviders.size !== 4) {
    throw new Error(
      `Payment providers must be exactly 4, got ${uniquePaymentProviders.size}`,
    );
  }
  return paymentProviders as PaymentPriority;
};
