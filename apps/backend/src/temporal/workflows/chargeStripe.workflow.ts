import type Stripe from 'stripe';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export type ChargeStripeWorkflowInput = {
  userId: string;
  totalAmountInUsdCents: number;
  confirmationTokenId?: string;
  paymentMethodId?: string;
};

export type ChargeStripeWorkflowOutput = {
  paymentIntentId: string;
  paymentIntentStatus: Stripe.PaymentIntent.Status;
};

export async function chargeStripeWorkflow({
  userId,
  totalAmountInUsdCents,
  confirmationTokenId,
  paymentMethodId,
}: ChargeStripeWorkflowInput): Promise<ChargeStripeWorkflowOutput> {
  const { createStripePaymentIntent } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const { stripePaymentIntent } = await createStripePaymentIntent({
    totalAmountInUsdCents,
    userId,
    confirmationTokenId,
    paymentMethodId,
  });

  return {
    paymentIntentId: stripePaymentIntent.id,
    paymentIntentStatus: stripePaymentIntent.status,
  };
}
