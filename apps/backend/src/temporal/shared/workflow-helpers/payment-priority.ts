import type { PaymentProvider } from '@namefi-astra/db/types';

export type PaymentPriority = [
  PaymentProvider,
  PaymentProvider,
  PaymentProvider,
  PaymentProvider,
  PaymentProvider,
] & { _: { brand: 'PAYMENT_PRIORITY' } };

export const createPaymentPriority = (
  paymentProviders: PaymentProvider[],
): PaymentPriority => {
  if (paymentProviders.length !== 5) {
    throw new Error(
      `Payment providers must be exactly 5, got ${paymentProviders.length}`,
    );
  }
  const uniquePaymentProviders = new Set(paymentProviders);
  if (uniquePaymentProviders.size !== 5) {
    throw new Error(
      `Payment providers must be exactly 5 *unique* providers, got ${uniquePaymentProviders.size}`,
    );
  }
  return paymentProviders as PaymentPriority;
};
