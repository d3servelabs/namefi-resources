import {
  type PaymentProvider,
  type PaymentStatus,
  paymentProviderEnum,
} from '@namefi-astra/db';
import * as workflow from '@temporalio/workflow';
import { stripePaymentIntentStatusToPaymentStatus } from '#services/stripePayments/stripePayments';
import type { PaymentActivities } from '../activities';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { ChargeStripeWorkflow } from './chargeStripe.workflow';

const NFSC_PAYMENT_PROVIDERS = paymentProviderEnum.enumValues.filter(
  (provider) => provider.startsWith('NFSC_'),
);

export type ChargeUserWorkflowInput = {
  paymentProvider: PaymentProvider;
  totalAmountInUsdCents: number;
  userId: string;
  chainId?: number;
  confirmationTokenId?: string;
  paymentMethodId?: string;
  walletAddress?: string;
};

export type ChargeUserWorkflowOutput = {
  paymentId: string;
  paymentStatus: PaymentStatus;
};

export async function chargeUserWorkflow({
  paymentProvider,
  totalAmountInUsdCents,
  userId,
  chainId,
  confirmationTokenId,
  paymentMethodId,
  walletAddress,
}: ChargeUserWorkflowInput): Promise<ChargeUserWorkflowOutput> {
  const { createPayment, updatePayment } = workflow.proxyActivities<
    typeof PaymentActivities
  >({
    ...shortRunningOpts,
  });

  // MARK: Create Payment in db
  const payment = await createPayment({
    amountInUsdCents: totalAmountInUsdCents,
    paymentProvider,
    chainId,
    walletAddress,
  });

  let paymentStatus = payment.status;
  let paymentProviderReferenceId: string | null = null;

  // MARK: Execute Charge ChildWorkflow based on PaymentProvider
  if (paymentProvider === 'STRIPE') {
    const input = {
      userId,
      totalAmountInUsdCents,
      confirmationTokenId,
      paymentMethodId,
    };
    try {
      const { paymentIntentId, paymentIntentStatus } =
        await workflow.executeChild(ChargeStripeWorkflow, {
          args: [input],
          workflowId: `charge-stripe-${payment.id}`,
          taskQueue: TEMPORAL_ENUMS.DEFAULT,
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
        `Error while executing ChargeStripe workflow. workflowId: charge-stripe-${payment.id}, cause: ${JSON.stringify(error)}`,
      );
      paymentStatus = 'FAILED';
    }
  }

  if (NFSC_PAYMENT_PROVIDERS.includes(paymentProvider)) {
    paymentStatus = 'CANCELLED';
  }

  // MARK: Update Payment
  const updatePaymentData = Object.assign(
    { paymentStatus },
    paymentProviderReferenceId && { paymentProviderReferenceId },
  );
  const updatedPayment = await updatePayment({
    paymentId: payment.id,
    updatePaymentData,
  });

  return { paymentId: payment.id, paymentStatus: updatedPayment.status };
}
