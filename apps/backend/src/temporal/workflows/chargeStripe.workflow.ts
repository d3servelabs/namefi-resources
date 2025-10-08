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
  'confirmationTokenId' | 'paymentMethodId'
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
