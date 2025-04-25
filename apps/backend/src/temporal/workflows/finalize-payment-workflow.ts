import {
  type PaymentStatus,
  type RefundStatus,
  paymentProviderSchema,
  paymentStatusSchema,
} from '@namefi-astra/db/types';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import type { PaymentActivities } from '../activities';
import { stripePaymentIntentStatusToPaymentStatus } from '../activities/helpers/stripePaymentHelpers';
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

  // MARK: Payments with original amountInUSDCents === 0 (because of promos) should already be marked as successful
  // and amountToCapture and amountToRefund should === 0 or be null
  if (
    paymentDetails.status === paymentStatusSchema.Values.SUCCEEDED &&
    amountToCaptureInUsdCents === 0 &&
    !amountToRefundInUsdCents
  ) {
    return { paymentStatus: paymentDetails.status };
  }

  if (paymentDetails.paymentProvider === paymentProviderSchema.Values.STRIPE) {
    if (amountToCaptureInUsdCents > 0) {
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
      paymentProviderSchema.Values.NFSC_BASE,
      paymentProviderSchema.Values.NFSC_ETHEREUM,
      paymentProviderSchema.Values.NFSC_ETHEREUM_SEPOLIA,
    )
  ) {
    if (amountToRefundInUsdCents && amountToRefundInUsdCents > 0) {
      const { refundStatus } = await workflow.executeChild(refundUserWorkflow, {
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
        paymentStatus: paymentStatusSchema.Values.REFUND_REQUESTED,
        refundStatus: refundStatus,
      };
    }

    return {
      paymentStatus: paymentDetails.status,
    };
  }

  throw workflow.ApplicationFailure.create({
    message: `Unsupported payment provider: ${paymentDetails.paymentProvider}`,
  });
}
