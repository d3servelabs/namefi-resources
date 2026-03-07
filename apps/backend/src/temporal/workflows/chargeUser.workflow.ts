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
import type { SettleX402PaymentInput } from '../activities/x402.activities';

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
  const {
    getPaymentDetails,
    updatePayment,
    updatePaymentMetadata,
    settleX402Payment,
    verifyPresettledX402Payment,
  } = typedProxyActivities({
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
    x402PaymentDetails,
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

  if (workflow.patched('lifecycle-timestamps')) {
    await updatePayment({
      id: paymentId,
      status: paymentStatusSchema.enum.PROCESSING,
    });
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

  // MARK: X402 Payment - Settle with facilitator (or verify pre-settlement)
  let updatedX402PaymentDetails = x402PaymentDetails;
  if (paymentProvider === paymentProviderSchema.enum.X402) {
    if (!x402PaymentDetails) {
      workflow.log.error(
        `X402 payment missing x402PaymentDetails. paymentId: ${paymentId}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    } else if (x402PaymentDetails.presettled) {
      // MARK: Pre-settled payment - verify it was done correctly
      workflow.log.info(
        `X402 payment is pre-settled. paymentId: ${paymentId}, txHash: ${x402PaymentDetails.settlementTxHash}`,
      );

      if (
        !x402PaymentDetails.settlementTxHash ||
        !x402PaymentDetails.settledAt
      ) {
        workflow.log.error(
          `Pre-settled X402 payment missing required fields. paymentId: ${paymentId}`,
        );
        paymentStatus = paymentStatusSchema.enum.FAILED;
      } else {
        try {
          const verifyResult = await verifyPresettledX402Payment({
            settlementTxHash: x402PaymentDetails.settlementTxHash,
            settledAt: x402PaymentDetails.settledAt,
            expectedAmountInUsdCents: amountInUSDCents,
            network: x402PaymentDetails.network,
          });

          if (verifyResult.valid) {
            paymentStatus = paymentStatusSchema.enum.SUCCEEDED;
            paymentProviderReferenceId = x402PaymentDetails.settlementTxHash;
            workflow.log.info(
              `Pre-settled X402 payment verified. paymentId: ${paymentId}, txHash: ${x402PaymentDetails.settlementTxHash}`,
            );
          } else {
            workflow.log.error(
              `Pre-settled X402 payment verification failed. paymentId: ${paymentId}, error: ${verifyResult.error}`,
            );
            paymentStatus = paymentStatusSchema.enum.FAILED;
          }
        } catch (error) {
          workflow.log.error(
            `Error verifying pre-settled X402 payment. paymentId: ${paymentId}, cause: ${JSON.stringify(error)}`,
          );
          paymentStatus = paymentStatusSchema.enum.FAILED;
        }
      }
    } else {
      // MARK: Standard settlement - settle with facilitator
      try {
        const settleInput: SettleX402PaymentInput = {
          paymentPayload: x402PaymentDetails.paymentPayload,
          network: x402PaymentDetails.network,
          chargeAmountInUsdCents: amountInUSDCents,
        };

        const result = await settleX402Payment(settleInput);

        if (result.success) {
          paymentStatus = paymentStatusSchema.enum.SUCCEEDED;
          paymentProviderReferenceId = result.txHash;
          // Store settlement txHash in x402PaymentDetails
          updatedX402PaymentDetails = {
            ...x402PaymentDetails,
            settlementTxHash: result.txHash,
            settledAt: new Date().toISOString(),
          };
          workflow.log.info(
            `X402 payment settled successfully. paymentId: ${paymentId}, txHash: ${result.txHash}`,
          );
        } else {
          workflow.log.error(
            `X402 settlement failed. paymentId: ${paymentId}, error: ${result.error}`,
          );
          paymentStatus = paymentStatusSchema.enum.FAILED;
        }
      } catch (error) {
        workflow.log.error(
          `Error while settling X402 payment. paymentId: ${paymentId}, cause: ${JSON.stringify(error)}`,
        );
        paymentStatus = paymentStatusSchema.enum.FAILED;
      }
    }
  }

  // MARK: Update Payment
  const updatedPayment = await updatePayment({
    id: paymentId,
    status: paymentStatus,
    paymentProviderReferenceId,
    x402PaymentDetails: updatedX402PaymentDetails,
  });

  return { paymentStatus: updatedPayment.status };
}
