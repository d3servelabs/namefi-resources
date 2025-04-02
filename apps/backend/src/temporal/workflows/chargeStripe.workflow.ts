import * as workflow from '@temporalio/workflow';
import type Stripe from 'stripe';
import type { PaymentActivities } from '../activities';
import { TEMPORAL_QUEUES, shortRunningOpts } from '../shared';

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

export async function ChargeStripeWorkflow({
  userId,
  totalAmountInUsdCents,
  confirmationTokenId,
  paymentMethodId,
}: ChargeStripeWorkflowInput): Promise<ChargeStripeWorkflowOutput> {
  const { createStripePaymentIntent } = workflow.proxyActivities<
    typeof PaymentActivities
  >({
    ...shortRunningOpts,
    taskQueue: TEMPORAL_QUEUES.DEFAULT,
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
