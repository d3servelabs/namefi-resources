import type {
  PaymentProvider,
  PaymentSelect,
  PaymentStatus,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { PreparedPaymentAllocation } from './prepare-multi-payments.workflow';
import { multiChargeWorkflow } from './multi-charge.workflow';
import type { MultiChargeWorkflowOutput } from './multi-charge.workflow';

// Import activities
const { getPaymentDetails, criticalAlertNamefi } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

export interface ChargePreparedPaymentsInput {
  userId: string;
  preparedPayments: PreparedPaymentAllocation[];
  orderId?: string; // Optional order ID
  failOnNotAllCharged?: boolean;
}

export interface ChargePreparedPaymentsOutput {
  payments: {
    id: string;
    paymentProvider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripePaymentMethodId?: string;
    status: PaymentStatus;
  }[];
  totalChargedInUsdCents: number;
  totalRefundedInUsdCents: number;
  chargeSummary: {
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    message?: string;
    succeededPaymentIds: string[];
    failedPaymentIds: string[];
  };
  refundSummary: {
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    failedRefunds: Array<{
      paymentId: string;
      amountInUsdCents: number;
      error?: string;
    }>;
  };
}

/**
 * Charges prepared payments using the multi-charge workflow.
 * Priority for charging: Stripe → Sepolia → Base → Ethereum (handled by multiChargeWorkflow)
 * Returns details about which payments were charged, refunded, etc.
 */
export async function chargePreparedPaymentsWorkflow(
  input: ChargePreparedPaymentsInput,
): Promise<ChargePreparedPaymentsOutput> {
  const {
    userId,
    preparedPayments,
    orderId,
    failOnNotAllCharged = false,
  } = input;

  // If no payments provided, skip charging
  if (preparedPayments.length === 0) {
    return {
      payments: [],
      totalChargedInUsdCents: 0,
      totalRefundedInUsdCents: 0,
      chargeSummary: {
        status: 'SKIPPED',
        message: 'No payments to charge',
        succeededPaymentIds: [],
        failedPaymentIds: [],
      },
      refundSummary: {
        status: 'SKIPPED',
        failedRefunds: [],
      },
    };
  }

  // Prepare payments data for multi-charge workflow
  const paymentsData = preparedPayments.map((payment) => ({
    paymentId: payment.paymentId,
    amountInUSDCents: payment.amountInUsdCents,
    metadata: undefined, // Can be extended with metadata if needed
  }));

  // Execute multi-charge workflow
  // Charging priority (Stripe first) is handled within multiChargeWorkflow
  let chargeResult: MultiChargeWorkflowOutput;
  try {
    chargeResult = await multiChargeWorkflow({
      paymentsData,
      orderId, // Can be undefined
      userId,
      failOnNotAllCharged,
    });
  } catch (error) {
    workflow.log.error('Multi-charge workflow failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      orderId,
      paymentCount: preparedPayments.length,
    });
    criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Failed to charge payments: ${error instanceof Error ? error.message : String(error)}`,
      level: 'fatal',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }

  // Update payment details with final statuses
  const updatedPayments: ChargePreparedPaymentsOutput['payments'] =
    await Promise.all(
      preparedPayments.map(async (payment) => {
        try {
          const paymentDetails = await getPaymentDetails({
            paymentId: payment.paymentId,
          });
          return {
            id: payment.paymentId,
            paymentProvider: payment.provider,
            amountInUsdCents: payment.amountInUsdCents,
            paymentId: payment.paymentId,
            walletAddress: payment.walletAddress,
            stripePaymentMethodId: payment.stripePaymentMethodId,
            status: paymentDetails.status,
          };
        } catch (error) {
          workflow.log.warn(
            `Failed to get updated payment details for ${payment.paymentId}`,
            {
              error: error instanceof Error ? error.message : String(error),
            },
          );
          throw error;
        }
      }),
    );

  // Determine overall charge status
  let chargeStatus: ChargePreparedPaymentsOutput['chargeSummary']['status'];
  if (chargeResult.succeededPaymentIds.length === preparedPayments.length) {
    chargeStatus = 'SUCCESS';
  } else {
    chargeStatus = 'FAILED';
  }

  // Determine refund status
  let refundStatus: ChargePreparedPaymentsOutput['refundSummary']['status'];
  if (chargeResult.totalRefundedInUsdCents <= 0) {
    refundStatus = 'SKIPPED';
  } else {
    refundStatus =
      chargeResult.refundResult?.failedRefunds &&
      chargeResult.refundResult.failedRefunds.length > 0
        ? 'FAILED'
        : 'SUCCESS';
  }

  return {
    payments: updatedPayments,
    totalChargedInUsdCents: chargeResult.totalChargedInUsdCents,
    totalRefundedInUsdCents: chargeResult.totalRefundedInUsdCents,
    chargeSummary: {
      status: chargeStatus,
      message: `Charged ${chargeResult.succeededPaymentIds.length} of ${preparedPayments.length} payment(s)`,
      succeededPaymentIds: chargeResult.succeededPaymentIds,
      failedPaymentIds: chargeResult.failedPaymentIds,
    },
    refundSummary: {
      status: refundStatus,
      failedRefunds: chargeResult.refundResult?.failedRefunds || [],
    },
  };
}
