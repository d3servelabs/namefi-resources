import type { PaymentStatus, RefundStatus } from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import type { PaymentActivities } from '../activities';
import type { MoneyAmount } from '../activities/mint.activities';
import { TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { mintNfsc } from './mint.workflow';

export type RefundUserWorkflowInput = {
  paymentId: string;
  amountToRefundInUsdCents?: number;
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
    amountToRefundInUsdCents: amountToRefundInUsdCents as number,
  });
  const refundId = refund.id;

  await updatePayment({
    paymentId,
    updatePaymentData: { paymentStatus: 'REFUND_REQUESTED' },
  });

  const input = {
    chainId: nfscPaymentDetails?.chainId as number,
    account: nfscPaymentDetails?.walletAddress as `0x${string}`,
    namefiMoneyAmount: {
      amount: amountToRefundInUsdCents as number,
      currency: 'USD',
    } as MoneyAmount,
  };

  try {
    paymentProviderReferenceId = await workflow.executeChild(mintNfsc, {
      args: [input.chainId, input.account, input.namefiMoneyAmount],
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
    refundId,
    updateRefundData: { refundStatus, paymentProviderReferenceId },
  });

  return {
    refundId,
    refundStatus: updatedRefund.status,
  };
}
