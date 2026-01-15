import { paymentProviderEnum } from '@namefi-astra/db/schema';
import {
  type PaymentStatus,
  paymentProviderSchema,
  paymentStatusSchema,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import type { CreateStripePaymentIntentInput } from '#services/stripe-payments/types';
import { stripePaymentIntentStatusToPaymentStatus } from '../activities/helpers/stripePaymentHelpers';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { chargeStripeWorkflow } from './chargeStripe.workflow';
import { chargeNfscWorkflow } from './mint.workflow';
import { catchAndAlertLocally } from '../shared/workflow-helpers';

export const NFSC_PAYMENT_PROVIDERS = paymentProviderEnum.enumValues.filter(
  (provider) => provider.startsWith('NFSC_'),
);

export type PaymentExtraMetadata = Pick<
  CreateStripePaymentIntentInput,
  'confirmationTokenId'
>;

export type ChargeUserWorkflowInput = {
  paymentId: string;
  userId: string;
  metadata?: PaymentExtraMetadata;
};

export type ChargeUserWorkflowOutput = {
  paymentStatus: PaymentStatus;
};

export async function chargeUserWorkflow({
  paymentId,
  userId,
  metadata,
}: ChargeUserWorkflowInput): Promise<ChargeUserWorkflowOutput> {
  const { getPaymentDetails, updatePayment, updatePaymentMetadata } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        ...shortRunningOpts,
      },
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

  //  MARK: Payments with amountInUSDCents === 0 should be marked as successful
  if (amountInUSDCents === 0) {
    paymentStatus = paymentStatusSchema.enum.SUCCEEDED;

    // MARK: Update Payment
    const updatedPayment = await updatePayment({
      id: paymentId,
      status: paymentStatus,
      paymentProviderReferenceId,
    });

    return { paymentStatus: updatedPayment.status };
  }

  // MARK: Execute Charge ChildWorkflow based on PaymentProvider
  if (paymentProvider === paymentProviderSchema.enum.STRIPE) {
    try {
      const { paymentIntentId, paymentIntentStatus, paymentMethodId } =
        await workflow.executeChild(chargeStripeWorkflow, {
          args: [
            {
              userId,
              totalAmountInUsdCents: amountInUSDCents,
              confirmationTokenId: metadata?.confirmationTokenId,
              paymentMethodId: stripePaymentDetails?.paymentMethodId,
            },
          ],
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
      void catchAndAlertLocally(
        async () => {
          await updatePaymentMetadata({
            id: paymentId,
            stripePaymentDetails: {
              paymentMethodId,
            },
          });
        },
        {
          message: `Error while updating payment metadata for payment ${paymentId}`,
        },
      );
    } catch (error) {
      workflow.log.error(
        `Error while executing ChargeStripe workflow. workflowId: charge-stripe-${paymentId}, cause: ${JSON.stringify(error)}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    }
  }

  if (NFSC_PAYMENT_PROVIDERS.includes(paymentProvider)) {
    const input = {
      chainId: nfscPaymentDetails?.chainId as number,
      chargee: nfscPaymentDetails?.walletAddress as `0x${string}`,
      amountInUSD: amountInUSDCents / 100,
      reason: `charge-user.workflow for Payment with ID: ${paymentId}`,
      extra: '' as `0x${string}`,
    };

    try {
      const txHash = await workflow.executeChild(chargeNfscWorkflow, {
        args: [
          input.chainId,
          input.chargee,
          input.amountInUSD,
          input.reason,
          input.extra,
        ],
        workflowId: `charge-nfsc-${paymentId}`,
        taskQueue: TEMPORAL_QUEUES.MINT,
        retry: {
          maximumAttempts: 1,
        },
      });
      paymentStatus = paymentStatusSchema.enum.SUCCEEDED;
      paymentProviderReferenceId = txHash;
    } catch (error) {
      workflow.log.error(
        `Error while executing ChargeNfsc workflow. workflowId: charge-nfsc-${paymentId}, cause: ${JSON.stringify(error)}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    }
  }

  // MARK: Update Payment
  const updatedPayment = await updatePayment({
    id: paymentId,
    status: paymentStatus,
    paymentProviderReferenceId,
  });

  return { paymentStatus: updatedPayment.status };
}
