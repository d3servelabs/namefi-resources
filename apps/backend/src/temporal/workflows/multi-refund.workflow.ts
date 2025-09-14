import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { refundUserWorkflow } from './refund-user.workflow';
import { values } from 'ramda';

const { getMultiplePaymentsDetails } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});

export interface MultiRefundWorkflowInput {
  orderId: string;
  paymentIds: string[];
  amountToRefundInUsdCents: number;
}

const priorityOrder = [
  'STRIPE',
  'NFSC_ETHEREUM_SEPOLIA',
  'NFSC_BASE',
  'NFSC_ETHEREUM',
];

export async function multiRefundWorkflow({
  orderId,
  paymentIds,
  amountToRefundInUsdCents,
}: MultiRefundWorkflowInput): Promise<void> {
  // Priority: Stripe, NFSC_SEPOLIA, NFSC_BASE, NFSC_ETHEREUM
  const paymentsWithProvidersMap = await getMultiplePaymentsDetails({
    paymentIds,
  });
  const paymentsWithProviders = values(paymentsWithProvidersMap);

  const sorted = paymentsWithProviders.sort(
    (a, b) =>
      priorityOrder.indexOf(a.paymentProvider) -
      priorityOrder.indexOf(b.paymentProvider),
  );

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
      remainingAmountToRefundInUsdCents -= amountRefundableInUsdCents;
    }
  }

  if (remainingAmountToRefundInUsdCents > 0) {
    workflow.log.warn(
      `multiRefundWorkflow: remaining refund (${remainingAmountToRefundInUsdCents}) could not be fulfilled for order ${orderId}`,
    );
  }
}
