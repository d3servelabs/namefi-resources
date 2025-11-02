import {
  paymentStatusSchema,
  type PaymentProvider,
  type PaymentStatus,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { chargeUserWorkflow } from './chargeUser.workflow';
import {
  multiRefundWorkflow,
  type MultiRefundWorkflowOutput,
} from './multi-refund.workflow';
import type { PaymentExtraMetadata } from './chargeUser.workflow';
import type { PaymentPriority } from '../shared/workflow-helpers/payment-priority';

const { getMultiplePaymentsDetails } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});

export interface MultiChargeWorkflowInput {
  orderId?: string; // Made optional for multi-payment scenarios
  userId: string;
  paymentsData: {
    paymentId: string;
    amountInUSDCents: number;
    metadata?: PaymentExtraMetadata;
  }[];
  /**
   * Optional priority order for charging payments.
   * Default: ['STRIPE', 'NFSC_ETHEREUM_SEPOLIA', 'NFSC_BASE', 'NFSC_ETHEREUM']
   * Payments will be charged in this order based on their provider.
   */
  chargePriority?: PaymentPriority;
  /**
   * Optional flag to fail the workflow if not all payments are charged.
   * Default: true
   * @default true
   */
  failOnNotAllCharged?: boolean;
}

export interface MultiChargeWorkflowOutput {
  succeededPaymentIds: string[];
  failedPaymentIds: string[];
  totalChargedInUsdCents: number;
  totalRefundedInUsdCents: number;
  refundResult: MultiRefundWorkflowOutput | undefined;
}

export async function multiChargeWorkflow(
  input: MultiChargeWorkflowInput,
): Promise<MultiChargeWorkflowOutput> {
  const {
    paymentsData,
    userId,
    orderId,
    chargePriority,
    failOnNotAllCharged = true,
  } = input;
  const succeeded: string[] = [];
  const failed: string[] = [];
  let totalCharged = 0;
  const paymentIds = Array.from(new Set(paymentsData.map((p) => p.paymentId)));
  if (paymentIds.length === 0) {
    throw new Error('No payments to charge');
  }
  if (paymentIds.length !== paymentsData.length) {
    throw new Error('Some payments are duplicated');
  }

  // Default priority: Stripe first for better UX, then NFSC chains
  const defaultPriority: PaymentPriority = [
    'STRIPE',
    'NFSC_ETHEREUM_SEPOLIA',
    'NFSC_BASE',
    'NFSC_ETHEREUM',
  ] as PaymentPriority;
  const priorityOrder = chargePriority || defaultPriority;

  // validate payment amounts and get payment details
  const details = await getMultiplePaymentsDetails({
    paymentIds: paymentsData.map((p) => p.paymentId),
  });
  for (const { paymentId, amountInUSDCents } of paymentsData) {
    const d = details[paymentId];
    if (d.amountInUSDCents !== amountInUSDCents) {
      throw workflow.ApplicationFailure.create({
        message: 'Payment amount mismatch',
        nonRetryable: true,
        details: [
          {
            paymentId,
            expected: d.amountInUSDCents,
            received: amountInUSDCents,
          },
        ],
      });
    }
    // Optional: enforce pre-charge status sanity
    const allowedPreChargeStatuses: PaymentStatus[] = [
      paymentStatusSchema.enum.CREATED,
      paymentStatusSchema.enum.REQUIRES_CAPTURE,
      paymentStatusSchema.enum.PROCESSING,
    ];
    if (!allowedPreChargeStatuses.includes(d.status as PaymentStatus)) {
      throw workflow.ApplicationFailure.create({
        message: `Payment ${paymentId} is not chargeable in status ${d.status}`,
        nonRetryable: true,
        details: [{ paymentId, status: d.status }],
      });
    }
  }

  // Sort payments based on priority order
  // Since PaymentPriority guarantees all 4 providers are present, indexOf will always find a match
  const sortedPaymentsData = paymentsData.sort((a, b) => {
    const providerA = details[a.paymentId].paymentProvider;
    const providerB = details[b.paymentId].paymentProvider;
    const indexA = priorityOrder.indexOf(providerA);
    const indexB = priorityOrder.indexOf(providerB);
    return indexA - indexB;
  });

  let refundResult: MultiRefundWorkflowOutput | undefined;
  for (const { paymentId, amountInUSDCents, metadata } of sortedPaymentsData) {
    try {
      const res = await workflow.executeChild(chargeUserWorkflow, {
        args: [
          {
            paymentId,
            userId,
            metadata,
          },
        ],
        workflowId: `charge-payment-[${paymentId}]`,
        taskQueue: TEMPORAL_QUEUES.DEFAULT,
        retry: { maximumAttempts: 1 },
        workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
      });
      if ((res.paymentStatus as PaymentStatus) !== 'SUCCEEDED') {
        throw workflow.ApplicationFailure.create({
          message: `Payment charge failed for ${paymentId}`,
          nonRetryable: true,
          details: [{ paymentId, status: res.paymentStatus as PaymentStatus }],
        });
      }
      succeeded.push(paymentId);
      totalCharged += amountInUSDCents;
    } catch (e) {
      failed.push(paymentId);
      // ensure already-charged amounts are refunded
      if (succeeded.length > 0 && totalCharged > 0) {
        refundResult = await workflow.executeChild(multiRefundWorkflow, {
          args: [
            {
              orderId, // Can be undefined
              paymentIds: succeeded,
              amountToRefundInUsdCents: totalCharged,
            },
          ],
          // Use timestamp if orderId is not provided to ensure unique workflow ID
          workflowId: orderId
            ? `refund-order-[${orderId}]`
            : `refund-payments-[${Date.now()}]`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: { maximumAttempts: 1 },
          workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
        });
      }
      if (failOnNotAllCharged) {
        throw workflow.ApplicationFailure.create({
          message: `Payment charge failed for ${paymentId}`,
          nonRetryable: true,
          details: [{ paymentId, refundResult, error: e }],
        });
      }
    }
  }

  return {
    succeededPaymentIds: succeeded,
    failedPaymentIds: failed,
    totalChargedInUsdCents: totalCharged,
    totalRefundedInUsdCents: refundResult?.totalRefundedInUsdCents || 0,
    refundResult,
  };
}
