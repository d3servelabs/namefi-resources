import type { PaymentStatus } from '@namefi-astra/db';
import * as workflow from '@temporalio/workflow';
import type { PaymentActivities } from '../activities';
import { stripePaymentIntentStatusToPaymentStatus } from '../activities/helpers/stripePaymentHelpers';
import { TEMPORAL_QUEUES, shortRunningOpts } from '../shared';

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
  const { captureStripePayment, updatePayment } = workflow.proxyActivities<
    typeof PaymentActivities
  >({
    ...shortRunningOpts,
    taskQueue: TEMPORAL_QUEUES.DEFAULT,
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
