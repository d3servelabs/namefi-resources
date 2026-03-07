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
import { transferUsdcX402Workflow } from './x402/transfer-usdc-x402.workflow';

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

  if (workflow.patched('lifecycle-timestamps')) {
    await updateRefund({
      id: refundId,
      status: 'PROCESSING',
    });
  }
  await updatePayment({
    id: paymentId,
    status: paymentStatusSchema.enum.REFUND_REQUESTED,
  });

  // MARK: Process refund depending on payment provider
  const { nfscPaymentDetails, paymentProvider, x402PaymentDetails } =
    await getPaymentDetails({
      paymentId,
    });

  let refundStatus: RefundStatus = status;
  if (workflow.patched('lifecycle-timestamps')) {
    refundStatus = 'PROCESSING';
  }
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
  } else if (paymentProvider === paymentProviderSchema.enum.X402) {
    // MARK: X402 Refund - Transfer USDC back to buyer via workflow
    if (!x402PaymentDetails) {
      criticalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: `X402 payment missing x402PaymentDetails. Payment ID: ${paymentId}`,
        level: 'fatal',
      });
      throw workflow.ApplicationFailure.create({
        message: 'X402 payment missing required details for refund',
      });
    }

    // Parse chain ID from CAIP-2 network (e.g., "eip155:84532" -> 84532)
    const networkMatch = x402PaymentDetails.network.match(/^eip155:(\d+)$/);
    if (!networkMatch) {
      throw workflow.ApplicationFailure.create({
        message: `Invalid network format: ${x402PaymentDetails.network}`,
      });
    }
    const chainId = Number.parseInt(networkMatch[1], 10);

    const input = {
      chainId,
      toAddress: x402PaymentDetails.buyerWalletAddress as `0x${string}`,
      amountInUsdCents: amountToRefundInUsdCents,
    };

    try {
      paymentProviderReferenceId = await workflow.executeChild(
        transferUsdcX402Workflow,
        {
          args: [input],
          workflowId: transferUsdcX402Workflow.generateId(input),
          taskQueue: TEMPORAL_QUEUES.MINT,
          searchAttributes: {
            callerType: ['system'],
            caller: ['refund-user.workflow'],
            userId: [x402PaymentDetails.buyerWalletAddress],
            affectedResources: [
              'x402',
              'usdc',
              `usdc:${x402PaymentDetails.buyerWalletAddress}`,
              `usdc:${x402PaymentDetails.receiverWalletAddress}`,
              `refund:${refundId}`,
            ],
          },
          memo: {
            description: `X402 USDC Refund for Payment with ID: ${paymentId}`,
            refundId,
            paymentId,
            amountInUsdCents: amountToRefundInUsdCents,
            chainId,
          },
          retry: {
            maximumAttempts: 1,
          },
        },
      );

      refundStatus = 'SUCCEEDED';
      workflow.log.info(
        `X402 refund completed. refundId: ${refundId}, txHash: ${paymentProviderReferenceId}`,
      );

      // Store refund txHash in x402PaymentDetails on the payment record
      await updatePayment({
        id: paymentId,
        x402PaymentDetails: {
          ...x402PaymentDetails,
          refundTxHash: paymentProviderReferenceId,
        },
      });
    } catch (error) {
      workflow.log.error(
        `Error refunding X402 payment. paymentId: ${paymentId}, cause: ${JSON.stringify(error)}`,
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
