import { paymentProviderEnum } from '@namefi-astra/db/schema';
import type { PaymentStatus } from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { stripePaymentIntentStatusToPaymentStatus } from '#services/stripePayments/stripePaymentHelpers';
import type { PaymentActivities } from '../activities';
import type { MoneyAmount } from '../activities/mint.activities';
import { TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { ChargeStripeWorkflow } from './chargeStripe.workflow';
import { chargeNfscWorkflow } from './mint.workflow';

const NFSC_PAYMENT_PROVIDERS = paymentProviderEnum.enumValues.filter(
  (provider) => provider.startsWith('NFSC_'),
);

export type ChargeUserWorkflowInput = {
  paymentId: string;
  userId: string;
  metadata?: {
    confirmationTokenId?: string;
  };
};

export type ChargeUserWorkflowOutput = {
  paymentStatus: PaymentStatus;
};

export async function chargeUserWorkflow({
  paymentId,
  userId,
  metadata,
}: ChargeUserWorkflowInput): Promise<ChargeUserWorkflowOutput> {
  const { getPaymentDetails, updatePayment } = workflow.proxyActivities<
    typeof PaymentActivities
  >({
    ...shortRunningOpts,
  });

  const {
    amountInUSDCents,
    nfscPaymentDetails,
    paymentProvider,
    status,
    stripePaymentDetails,
  } = await getPaymentDetails({ paymentId });

  let paymentStatus = status;
  let paymentProviderReferenceId: string | undefined;

  // MARK: Execute Charge ChildWorkflow based on PaymentProvider
  if (paymentProvider === 'STRIPE') {
    const input = {
      userId,
      totalAmountInUsdCents: amountInUSDCents,
      confirmationTokenId: metadata?.confirmationTokenId,
      paymentMethodId: stripePaymentDetails?.paymentMethodId,
    };

    try {
      const { paymentIntentId, paymentIntentStatus } =
        await workflow.executeChild(ChargeStripeWorkflow, {
          args: [input],
          workflowId: `charge-stripe-${paymentId}`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: {
            maximumAttempts: 1,
          },
        });
      paymentStatus = stripePaymentIntentStatusToPaymentStatus({
        paymentIntentStatus,
      });
      paymentProviderReferenceId = paymentIntentId;
    } catch (error) {
      workflow.log.error(
        `Error while executing ChargeStripe workflow. workflowId: charge-stripe-${paymentId}, cause: ${JSON.stringify(error)}`,
      );
      paymentStatus = 'FAILED';
    }
  }

  if (NFSC_PAYMENT_PROVIDERS.includes(paymentProvider)) {
    const input = {
      chainId: nfscPaymentDetails?.chainId as number,
      chargee: nfscPaymentDetails?.walletAddress as `0x${string}`,
      namefiMoneyAmount: {
        amount: amountInUSDCents,
        currency: 'USD',
      } as MoneyAmount,
      reason: `charge-user.workflow for Payment with ID: ${paymentId}`,
      extra: '' as `0x${string}`,
    };

    try {
      const txHash = await workflow.executeChild(chargeNfscWorkflow, {
        args: [
          input.chainId,
          input.chargee,
          input.namefiMoneyAmount,
          input.reason,
          input.extra,
        ],
        workflowId: `charge-nfsc-${paymentId}`,
        taskQueue: TEMPORAL_QUEUES.MINT,
        retry: {
          maximumAttempts: 1,
        },
      });
      paymentStatus = 'SUCCEEDED' as PaymentStatus;
      paymentProviderReferenceId = txHash;
    } catch (error) {
      workflow.log.error(
        `Error while executing ChargeNfsc workflow. workflowId: charge-nfsc-${paymentId}, cause: ${JSON.stringify(error)}`,
      );
      paymentStatus = 'FAILED';
    }
  }

  // MARK: Update Payment
  const updatePaymentData = {
    paymentStatus,
    paymentProviderReferenceId,
  };

  const updatedPayment = await updatePayment({
    paymentId,
    updatePaymentData,
  });

  return { paymentStatus: updatedPayment.status };
}
