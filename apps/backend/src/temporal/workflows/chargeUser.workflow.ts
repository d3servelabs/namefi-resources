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
import {
  catchAndAlertLocally,
  createDecisionGateRegistry,
  isNfscProvider,
  runWithKnownGate,
} from '../shared/workflow-helpers';
import { txHashSchema } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import { chargeStripeWorkflow } from './chargeStripe.workflow';
import { chargeNfscWorkflow } from './mint.workflow';
import type { SettleX402PaymentInput } from '../activities/x402.activities';

/** Admin decision window once an NFSC-charge gate opens (7 days). */
const CHARGE_NFSC_DECISION_TIMEOUT_MS = 2 * 24 * 60 * 60 * 1000;

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
    verifyPresettledMppPayment,
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
    paymentProviderReferenceId: existingPaymentProviderReferenceId,
    status,
    metadata: paymentMetadata,
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

  if (isNfscProvider(paymentProvider)) {
    if (!nfscPaymentDetails?.chainId || !nfscPaymentDetails?.walletAddress) {
      workflow.log.error(
        `NFSC payment missing required nfscPaymentDetails. paymentId: ${paymentId}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    } else {
      const input = {
        chainId: nfscPaymentDetails.chainId,
        chargee: nfscPaymentDetails.walletAddress as `0x${string}`,
        amountInUSD: amountInUSDCents / 100,
        reason: `charge-user.workflow for Payment with ID: ${paymentId}`,
        // Empty extra data placeholder for the NFSC charge workflow
        extra: '' as `0x${string}`,
      };

      // New runs wrap the NFSC charge in a decision gate: on failure, alert and
      // wait for an admin to RESPOND (the charge landed on-chain — here is the tx
      // hash) or CANCEL (mark the payment FAILED) instead of silently failing.
      // Re-charging is NOT idempotent (double-charge), so RETRY is not offered.
      // In-flight (pre-patch) runs keep the original direct path.
      const chargeGateRegistry = workflow.patched('charge-nfsc-decision-gate')
        ? createDecisionGateRegistry()
        : undefined;

      const chargeNfsc = () =>
        workflow.executeChild(chargeNfscWorkflow, {
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

      try {
        const txHash = chargeGateRegistry
          ? await runWithKnownGate<string, string>({
              registry: chargeGateRegistry,
              gateKind: 'nfsc-charge',
              interactionId: 'nfsc-charge',
              action: chargeNfsc,
              // The admin verifies the charge landed on-chain and RESPONDs with
              // its tx hash; we record it as the payment's provider reference.
              validateResponse: (raw) => txHashSchema.parse(raw),
              evidenceParams: {
                paymentId,
                userId,
                chainId: input.chainId,
                walletAddress: input.chargee,
                amountInUsd: input.amountInUSD,
                paymentProvider,
              },
              allowedActors: ['ADMIN'],
              allowedActions: ['RETRY', 'RESPOND', 'CANCEL'],
              timeoutMs: CHARGE_NFSC_DECISION_TIMEOUT_MS,
              onTimeout: { kind: 'throw' },
              alertMessage: `NFSC charge failed for payment ${paymentId}; verify the wallet's on-chain state before deciding`,
              alertDetails: {
                paymentId,
                userId,
                chainId: input.chainId,
                walletAddress: input.chargee,
                amountInUsd: input.amountInUSD,
              },
            })
          : await chargeNfsc();
        paymentStatus = paymentStatusSchema.enum.SUCCEEDED;
        paymentProviderReferenceId = txHash;
      } catch (error) {
        workflow.log.error(
          `Error while executing ChargeNfsc workflow. workflowId: charge-nfsc-${paymentId}, cause: ${JSON.stringify(error)}`,
        );
        paymentStatus = paymentStatusSchema.enum.FAILED;
      }
    }
  }

  if (paymentProvider === paymentProviderSchema.enum.MPP) {
    const mppPaymentDetails = paymentMetadata?.mppPaymentDetails;

    if (!mppPaymentDetails) {
      workflow.log.error(
        `MPP payment missing mppPaymentDetails. paymentId: ${paymentId}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    } else if (!mppPaymentDetails.presettled) {
      workflow.log.error(
        `MPP payment is not pre-settled. paymentId: ${paymentId}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    } else if (!existingPaymentProviderReferenceId) {
      workflow.log.error(
        `MPP payment missing provider reference. paymentId: ${paymentId}`,
      );
      paymentStatus = paymentStatusSchema.enum.FAILED;
    } else {
      try {
        const verifyResult = await verifyPresettledMppPayment({
          paymentId,
          paymentProviderReferenceId: existingPaymentProviderReferenceId,
          settledAt: mppPaymentDetails.settledAt,
        });

        if (verifyResult.valid) {
          paymentStatus = paymentStatusSchema.enum.SUCCEEDED;
          paymentProviderReferenceId = existingPaymentProviderReferenceId;
        } else {
          workflow.log.error(
            `Pre-settled MPP payment verification failed. paymentId: ${paymentId}, error: ${verifyResult.error}`,
          );
          paymentStatus = paymentStatusSchema.enum.FAILED;
        }
      } catch (error) {
        workflow.log.error(
          `Error verifying pre-settled MPP payment. paymentId: ${paymentId}, cause: ${JSON.stringify(error)}`,
        );
        paymentStatus = paymentStatusSchema.enum.FAILED;
      }
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
      const paymentPayload = x402PaymentDetails.paymentPayload;
      if (!paymentPayload) {
        workflow.log.error(
          `X402 payment missing payment payload. paymentId: ${paymentId}`,
        );
        paymentStatus = paymentStatusSchema.enum.FAILED;
      } else {
        try {
          const settleInput: SettleX402PaymentInput = {
            paymentPayload,
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
