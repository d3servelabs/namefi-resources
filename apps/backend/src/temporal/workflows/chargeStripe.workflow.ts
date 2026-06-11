import * as workflow from '@temporalio/workflow';
import type Stripe from 'stripe';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  paymentStatusSchema,
  type PaymentStatus,
  paymentProviderSchema,
} from '@namefi-astra/db/types';
import { stripePaymentIntentStatusToPaymentStatus } from '../activities/helpers/stripePaymentHelpers';

export type ChargeStripeWorkflowInput = {
  userId: string;
  totalAmountInUsdCents: number;
  confirmationTokenId?: string;
  paymentMethodId?: string;
  /**
   * Stripe idempotency key for the PaymentIntent creation. Must be
   * deterministic per logical charge — e.g. derived from the payment ID or
   * the charging workflow's ID, never from the current time or attempt — so
   * a retried create-and-confirm call cannot double-charge.
   */
  idempotencyKey: string;
};

export type ChargeStripeWorkflowOutput = {
  paymentIntentId: string;
  paymentIntentStatus: Stripe.PaymentIntent.Status;
  paymentMethodId: string | undefined;
};

export async function chargeStripeWorkflow({
  userId,
  totalAmountInUsdCents,
  confirmationTokenId,
  paymentMethodId,
  idempotencyKey,
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
    idempotencyKey,
  });

  let updatedPaymentMethod = stripePaymentIntent.payment_method ?? undefined;
  if (updatedPaymentMethod) {
    // handle the case where payment_method is an object (learn more: stripe expand)
    updatedPaymentMethod =
      typeof updatedPaymentMethod === 'string'
        ? updatedPaymentMethod
        : updatedPaymentMethod.id;
  }

  return {
    paymentIntentId: stripePaymentIntent.id,
    paymentIntentStatus: stripePaymentIntent.status,
    paymentMethodId: updatedPaymentMethod,
  };
}

export type AutoChargeStripeWorkflowOutput = {
  paymentId: string;
  paymentStatus: PaymentStatus;
  paymentProviderReferenceId: string | undefined;
};

export async function autoChargeStripeAndCreatePaymentWorkflow({
  userId,
  totalAmountInUsdCents,
}: Omit<
  ChargeStripeWorkflowInput,
  'confirmationTokenId' | 'paymentMethodId' | 'idempotencyKey'
>): Promise<AutoChargeStripeWorkflowOutput> {
  const {
    getPreferredPaymentMethodForNamefiUser,
    createPayment,
    updatePayment,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const preferredPaymentMethod = await getPreferredPaymentMethodForNamefiUser({
    namefiUserId: userId,
  });
  if (!preferredPaymentMethod) {
    throw new workflow.ApplicationFailure('No preferred payment method found');
  }
  workflow.log.info(
    `Preferred payment method found for user ${userId}: ${preferredPaymentMethod.id}`,
  );
  let paymentStatus: PaymentStatus;
  let paymentProviderReferenceId: string | undefined;

  const payment = await createPayment({
    amountInUsdCents: totalAmountInUsdCents,
    paymentProviderDetails: {
      paymentProvider: paymentProviderSchema.enum.STRIPE,
      stripePaymentDetails: {
        paymentMethodId: preferredPaymentMethod.id,
      },
    },
  });
  const paymentId = payment.id;
  try {
    const { paymentIntentId, paymentIntentStatus } = await chargeStripeWorkflow(
      {
        userId,
        totalAmountInUsdCents,
        confirmationTokenId: undefined,
        paymentMethodId: preferredPaymentMethod.id,
        // Inline call: the workflow-ID default would key on this (parent)
        // workflow, so key on the payment record created above instead.
        idempotencyKey: `payment-intent-${paymentId}`,
      },
    );
    paymentStatus = stripePaymentIntentStatusToPaymentStatus({
      paymentIntentStatus,
    });
    paymentProviderReferenceId = paymentIntentId;
  } catch (error) {
    workflow.log.error(
      `Error while executing ChargeStripe workflow. workflowId: charge-stripe-${paymentId}, cause: ${JSON.stringify(error)}`,
    );
    paymentStatus = paymentStatusSchema.enum.FAILED;
  }
  await updatePayment({
    id: paymentId,
    status: paymentStatus,
    paymentProviderReferenceId,
  });

  return {
    paymentId,
    paymentStatus,
    paymentProviderReferenceId,
  };
}
