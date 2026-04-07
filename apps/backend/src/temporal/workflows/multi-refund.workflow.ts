import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { sortByProviderPriority } from '../shared/workflow-helpers/payment-dispatch';
import { refundUserWorkflow } from './refund-user.workflow';
import { values } from 'ramda';
import type { PaymentPriority } from '../shared/workflow-helpers/payment-priority';

const { getMultiplePaymentsDetails } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});

export interface MultiRefundWorkflowInput {
  orderId?: string; // Made optional for multi-payment scenarios
  paymentIds: string[];
  amountToRefundInUsdCents: number;
  /**
   * Optional priority order for refunding payments.
   * Default: ['STRIPE', 'NFSC_ETHEREUM_SEPOLIA', 'NFSC_BASE', 'NFSC_ETHEREUM']
   * Payments will be refunded in this order based on their provider.
   */
  refundPriority?: PaymentPriority;
}

export interface MultiRefundWorkflowOutput {
  successfulRefunds: Array<{
    paymentId: string;
    amountInUsdCents: number;
  }>;
  failedRefunds: Array<{
    paymentId: string;
    amountInUsdCents: number;
    error?: string;
  }>;
  totalRefundedInUsdCents: number;
}

export async function multiRefundWorkflow({
  orderId,
  paymentIds,
  amountToRefundInUsdCents,
  refundPriority,
}: MultiRefundWorkflowInput): Promise<MultiRefundWorkflowOutput> {
  const paymentsWithProvidersMap = await getMultiplePaymentsDetails({
    paymentIds,
  });
  const paymentsWithProviders = values(paymentsWithProvidersMap);

  // Sort payments by provider priority
  const sorted = sortByProviderPriority(
    paymentsWithProviders,
    (p) => p.paymentProvider,
    refundPriority,
  );

  const successfulRefunds: Array<{
    paymentId: string;
    amountInUsdCents: number;
  }> = [];
  const failedRefunds: Array<{
    paymentId: string;
    amountInUsdCents: number;
    error?: string;
  }> = [];
  let totalRefundedInUsdCents = 0;

  let remainingAmountToRefundInUsdCents = amountToRefundInUsdCents;
  for (const p of sorted) {
    if (remainingAmountToRefundInUsdCents <= 0) break;
    // Choose the amount to refund based on the payment amount and the remaining amount
    // if the remaining amount is higher than the payment amount, refund the full amount
    // if the remaining amount is lower than the payment amount, partially refund the remaining amount
    const amountRefundableInUsdCents = Math.min(
      p.amountInUSDCents,
      remainingAmountToRefundInUsdCents,
    );
    if (amountRefundableInUsdCents > 0) {
      try {
        await workflow.executeChild(refundUserWorkflow, {
          args: [
            {
              paymentId: p.id,
              amountToRefundInUsdCents: amountRefundableInUsdCents,
            },
          ],
          workflowId: `refund-payment-[${p.id}]`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: { maximumAttempts: 1 },
          workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
        });
        successfulRefunds.push({
          paymentId: p.id,
          amountInUsdCents: amountRefundableInUsdCents,
        });
        totalRefundedInUsdCents += amountRefundableInUsdCents;
        remainingAmountToRefundInUsdCents -= amountRefundableInUsdCents;
      } catch (error) {
        failedRefunds.push({
          paymentId: p.id,
          amountInUsdCents: amountRefundableInUsdCents,
          error: error instanceof Error ? error.message : String(error),
        });
        workflow.log.error(
          `Failed to refund payment ${p.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  if (remainingAmountToRefundInUsdCents > 0) {
    workflow.log.warn(
      `multiRefundWorkflow: remaining refund (${remainingAmountToRefundInUsdCents}) could not be fulfilled${
        orderId ? ` for order ${orderId}` : ''
      }`,
    );
  }

  return {
    successfulRefunds,
    failedRefunds,
    totalRefundedInUsdCents,
  };
}
