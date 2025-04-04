import {
  type PaymentStatus,
  type RefundStatus,
  paymentStatusSchema,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import type { PaymentActivities } from '../activities';
import { TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { mintNfsc } from './mint.workflow';

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
  const { createRefund, getPaymentDetails, updatePayment, updateRefund } =
    workflow.proxyActivities<typeof PaymentActivities>({
      ...shortRunningOpts,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
    });

  const { nfscPaymentDetails } = await getPaymentDetails({
    paymentId,
  });

  let refundStatus: PaymentStatus | undefined;
  let paymentProviderReferenceId: string | undefined;

  const refund = await createRefund({
    paymentId,
    amountToRefundInUsdCents,
  });
  const refundId = refund.id;

  await updatePayment({
    id: paymentId,
    status: paymentStatusSchema.Values.REFUND_REQUESTED,
  });

  const input = {
    chainId: nfscPaymentDetails?.chainId as number,
    account: nfscPaymentDetails?.walletAddress as `0x${string}`,
    amountInUsd: amountToRefundInUsdCents / 100,
  };

  try {
    paymentProviderReferenceId = await workflow.executeChild(mintNfsc, {
      args: [input.chainId, input.account, input.amountInUsd],
      workflowId: `mint-nfsc-${refundId}`,
      taskQueue: TEMPORAL_QUEUES.MINT,
      retry: {
        maximumAttempts: 1,
      },
    });

    refundStatus = 'SUCCEEDED';
  } catch (error) {
    workflow.log.error(
      `Failed to mint NFSC. workflowId: charge-stripe-${paymentId}, cause: ${JSON.stringify(error)}`,
    );
    refundStatus = 'FAILED';
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
