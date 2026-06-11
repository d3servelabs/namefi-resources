import {
  type RefundStatus,
  paymentProviderSchema,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { stripeRefundStatusToRefundStatus } from '../activities/helpers/stripePaymentHelpers';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { monitorStripeRefundStatusWorkflow } from './monitor-stripe-refund-status.workflow';

export type RefundStripeWorkflowInput = {
  refundId: string;
};

export type RefundStripeWorkflowOutput = {
  paymentProviderReferenceId: string;
  refundStatus: RefundStatus;
};

export async function refundStripeWorkflow({
  refundId,
}: RefundStripeWorkflowInput): Promise<RefundStripeWorkflowOutput> {
  const workflowInfo = workflow.workflowInfo();
  const { createStripeRefund, getPaymentDetails, getRefundDetails } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        ...shortRunningOpts,
      },
    });

  // MARK: Get Payment and Refund details needed to create Stripe Refund
  const { amountInUSDCents: amountToRefundInUsdCents, paymentId } =
    await getRefundDetails({ refundId });

  const { paymentProvider, paymentProviderReferenceId: stripePaymentIntentId } =
    await getPaymentDetails({ paymentId });

  if (paymentProvider !== paymentProviderSchema.enum.STRIPE) {
    throw workflow.ApplicationFailure.create({
      message: `refundStripeWorkflow invoked for a non-Stripe payment (provider: ${paymentProvider})`,
    });
  }

  if (!stripePaymentIntentId) {
    throw workflow.ApplicationFailure.create({
      message: `Could not create Stripe Refund; missing paymentProviderReferenceId for Payment with ID: ${paymentId}`,
    });
  }

  // MARK: Create Stripe Refund
  // Keyed on the refund record so activity retries (and re-runs for the same
  // refund) replay Stripe's original response instead of refunding twice.
  const { stripeRefund } = await createStripeRefund({
    amountToRefundInUsdCents,
    stripePaymentIntentId,
    idempotencyKey: `refund-${refundId}`,
  });

  // MARK: Monitor Stripe Refund Status
  try {
    const { stripeRefundStatus } = await workflow.executeChild(
      monitorStripeRefundStatusWorkflow,
      {
        args: [
          {
            stripeRefundId: stripeRefund.id,
          },
        ],
        workflowId: `monitor-stripe-refund-status-${stripeRefund.id}`,
        workflowRunTimeout: '31 days',
      },
    );
    return {
      paymentProviderReferenceId: stripeRefund.id,
      refundStatus: stripeRefundStatusToRefundStatus({ stripeRefundStatus }),
    };
  } catch (error) {
    throw workflow.ApplicationFailure.create({
      message: `Failure while monitoring Stripe Refund for Stripe PaymentIntent with ID: ${stripePaymentIntentId}. workflowId: ${workflowInfo.workflowId}, runId: ${workflowInfo.runId}`,
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
