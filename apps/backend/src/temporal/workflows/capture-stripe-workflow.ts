import type { PaymentStatus } from '@namefi-astra/db';
import { stripePaymentIntentStatusToPaymentStatus } from '../activities/helpers/stripePaymentHelpers';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export type CaptureStripeWorkflowInput = {
  paymentId: string;
  amountToCaptureInUsdCents: number;
};

export type CaptureStripeWorkflowOutput = {
  paymentStatus: PaymentStatus;
};

export async function captureStripeWorkflow({
  paymentId,
  amountToCaptureInUsdCents,
}: CaptureStripeWorkflowInput): Promise<CaptureStripeWorkflowOutput> {
  const { captureStripePayment, updatePayment } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const { capturedStripePaymentIntent } = await captureStripePayment({
    amountToCaptureInUsdCents: amountToCaptureInUsdCents,
    paymentId,
  });

  const newPaymentStatus = stripePaymentIntentStatusToPaymentStatus({
    paymentIntentStatus: capturedStripePaymentIntent.status,
  });

  const updatedPayment = await updatePayment({
    id: paymentId,
    status: newPaymentStatus,
    amountInUSDCents:
      newPaymentStatus === 'SUCCEEDED' ? amountToCaptureInUsdCents : undefined,
  });

  return {
    paymentStatus: updatedPayment.status,
  };
}
