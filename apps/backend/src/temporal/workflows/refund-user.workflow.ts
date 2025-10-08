import {
  type RefundStatus,
  paymentProviderSchema,
  paymentStatusSchema,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { mintNfsc } from './mint.workflow';
import { refundStripeWorkflow } from './refund-stripe.workflow';

export type RefundUserWorkflowInput = {
  paymentId: string;
  amountToRefundInUsdCents: number;
};

export type RefundUserWorkflowOutput = {
  refundId: string;
  refundStatus: RefundStatus;
};

export async function refundUserWorkflow({
  paymentId,
  amountToRefundInUsdCents,
}: RefundUserWorkflowInput): Promise<RefundUserWorkflowOutput> {
  const {
    createRefund,
    getPaymentDetails,
    updatePayment,
    updateRefund,
    criticalAlertNamefi,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  if (amountToRefundInUsdCents <= 0) {
    throw workflow.ApplicationFailure.create({
      message: `Tried to refund user with an invalid amountToRefundInUsdCents (${amountToRefundInUsdCents}). Payment ID: ${paymentId}`,
      nonRetryable: true,
    });
  }

  // MARK: Create the Refund in the db
  const { id: refundId, status } = await createRefund({
    paymentId,
    amountToRefundInUsdCents,
  });

  await updatePayment({
    id: paymentId,
    status: paymentStatusSchema.enum.REFUND_REQUESTED,
  });

  // MARK: Process refund depending on payment provider
  const { nfscPaymentDetails, paymentProvider } = await getPaymentDetails({
    paymentId,
  });

  let refundStatus = status;
  let paymentProviderReferenceId: string | undefined;

  if (nfscPaymentDetails) {
    const input = {
      chainId: nfscPaymentDetails.chainId,
      account: nfscPaymentDetails.walletAddress as `0x${string}`,
      amountInUsd: amountToRefundInUsdCents / 100,
    };

    try {
      paymentProviderReferenceId = await workflow.executeChild(mintNfsc, {
        args: [input],
        workflowId: mintNfsc.generateId(input),
        taskQueue: TEMPORAL_QUEUES.MINT,
        searchAttributes: {
          callerType: ['system'],
          caller: ['refund-user.workflow'],
          userId: [nfscPaymentDetails.walletAddress], //todo
          affectedResources: [
            'nfsc',
            `nfsc:${nfscPaymentDetails.walletAddress}`,
            `refund:${refundId}`,
          ],
        },
        memo: {
          description: `Refund NFSC for Payment with ID: ${paymentId}`,
          refundId,
          paymentId,
          amountInUsd: amountToRefundInUsdCents / 100,
          chainId: nfscPaymentDetails.chainId,
        },
        retry: {
          maximumAttempts: 1,
        },
      });

      refundStatus = 'SUCCEEDED';
    } catch (error) {
      workflow.log.error(
        `Failed to mint NFSC. workflowId: mint-nfsc-${refundId}, cause: ${JSON.stringify(error)}`,
      );
      refundStatus = 'FAILED';
    }
  } else if (paymentProvider === paymentProviderSchema.enum.STRIPE) {
    try {
      const refundStripeResult = await workflow.executeChild(
        refundStripeWorkflow,
        {
          args: [{ refundId }],
          workflowId: `refund-stripe-${refundId}`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: {
            maximumAttempts: 1,
          },
        },
      );

      refundStatus = refundStripeResult.refundStatus;
      paymentProviderReferenceId =
        refundStripeResult.paymentProviderReferenceId;
    } catch (error) {
      workflow.log.error(
        `Failed to refund Stripe. workflowId: refund-stripe-${refundId}, cause: ${JSON.stringify(error)}`,
      );
      refundStatus = 'FAILED';
    }
  } else {
    criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Unsupported payment provider for refunds. Payment provider: ${paymentProvider}`,
      level: 'fatal',
    });
    throw workflow.ApplicationFailure.create({
      message: `Unsupported payment provider for refunds. Payment provider: ${paymentProvider}`,
    });
  }
  if (refundStatus === 'FAILED') {
    criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Failed to update refund status. Refund ID: ${refundId}`,
      level: 'fatal',
    });
  }

  const updatedRefund = await updateRefund({
    id: refundId,
    status: refundStatus,
    paymentProviderReferenceId,
  });

  return {
    refundId,
    refundStatus: updatedRefund.status,
  };
}
