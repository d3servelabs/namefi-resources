import {
  type PaymentProvider,
  paymentProviderSchema,
} from '@namefi-astra/db/types';

const PAYMENT_PROVIDER_COUNT = paymentProviderSchema.options.length;

export type PaymentPriority = PaymentProvider[] & {
  _: { brand: 'PAYMENT_PRIORITY' };
};

export const createPaymentPriority = (
  paymentProviders: PaymentProvider[],
): PaymentPriority => {
  if (paymentProviders.length !== PAYMENT_PROVIDER_COUNT) {
    throw new Error(
      `Payment providers must be exactly ${PAYMENT_PROVIDER_COUNT}, got ${paymentProviders.length}`,
    );
  }
  const uniquePaymentProviders = new Set(paymentProviders);
  if (uniquePaymentProviders.size !== PAYMENT_PROVIDER_COUNT) {
    throw new Error(
      `Payment providers must be exactly ${PAYMENT_PROVIDER_COUNT} unique providers, got ${uniquePaymentProviders.size}`,
    );
  }
  return paymentProviders as PaymentPriority;
};
