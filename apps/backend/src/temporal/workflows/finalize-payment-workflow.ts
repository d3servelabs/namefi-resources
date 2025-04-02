import type { PaymentStatus, RefundStatus } from '@namefi-astra/db/types';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { stripePaymentIntentStatusToPaymentStatus } from '#services/stripePayments/stripePaymentHelpers';
import type { PaymentActivities } from '../activities';
import { TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { refundUserWorkflow } from './refund-user.workflow';

export type CaptureStripeWorkflowInput = {
  paymentId: string;
  amountToCaptureInUsdCents: number;
  amountToRefundInUsdCents?: number;
};

export type CaptureStripeWorkflowOutput = {
  paymentStatus: PaymentStatus;
  refundStatus?: RefundStatus;
};

export async function finalizePaymentWorkflow({
  paymentId,
  amountToCaptureInUsdCents,
  amountToRefundInUsdCents,
}: CaptureStripeWorkflowInput): Promise<CaptureStripeWorkflowOutput> {
  const { captureStripePayment, updatePayment, getPaymentDetails } =
    workflow.proxyActivities<typeof PaymentActivities>({
      ...shortRunningOpts,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
    });

  const paymentDetails = await getPaymentDetails({ paymentId });
  if (paymentDetails.paymentProvider === 'STRIPE') {
    if (amountToCaptureInUsdCents > 0) {
      const { capturedStripePaymentIntent } = await captureStripePayment({
        amountToCaptureInUsdCents: amountToCaptureInUsdCents,
        paymentId,
      });

      const newPaymentStatus = stripePaymentIntentStatusToPaymentStatus({
        paymentIntentStatus: capturedStripePaymentIntent.status,
      });
      const updatedPayment = await updatePayment({
        paymentId,
        updatePaymentData: { paymentStatus: newPaymentStatus },
      });
      return {
        paymentStatus: updatedPayment.status,
      };
    }
    return {
      paymentStatus: paymentDetails.status,
    };
  }

  if (
    matchAny(
      paymentDetails.paymentProvider,
      'NFSC_BASE',
      'NFSC_ETHEREUM',
      'NFSC_ETHEREUM_SEPOLIA',
    )
  ) {
    if (amountToRefundInUsdCents && amountToRefundInUsdCents > 0) {
      await workflow.executeChild(refundUserWorkflow, {
        args: [
          {
            amountToRefundInUsdCents,
            paymentId,
          },
        ],
        workflowId: `refund-user-${paymentId}`,
        taskQueue: TEMPORAL_QUEUES.DEFAULT,
        retry: {
          maximumAttempts: 1,
        },
      });
      return {
        paymentStatus: 'REFUND_REQUESTED',
        refundStatus: 'SUCCEEDED',
      };
    }
  }

  throw workflow.ApplicationFailure.create({
    message: `Unsupported payment provider: ${paymentDetails.paymentProvider}`,
  });
}
