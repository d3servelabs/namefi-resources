import {
  paymentStatusSchema,
  type PaymentStatus,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { chargeUserWorkflow } from './chargeUser.workflow';
import { multiRefundWorkflow } from './multi-refund.workflow';
import type { PaymentExtraMetadata } from './chargeUser.workflow';

const { getMultiplePaymentsDetails } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});

export interface MultiChargeWorkflowInput {
  orderId: string;
  userId: string;
  paymentsData: {
    paymentId: string;
    amountInUSDCents: number;
    metadata?: PaymentExtraMetadata;
  }[];
}

export interface MultiChargeWorkflowOutput {
  succeededPaymentIds: string[];
  failedPaymentIds: string[];
  totalChargedInUsdCents: number;
}

export async function multiChargeWorkflow(
  input: MultiChargeWorkflowInput,
): Promise<MultiChargeWorkflowOutput> {
  const { paymentsData, userId, orderId } = input;
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

  // validate payment amounts
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

  for (const { paymentId, amountInUSDCents, metadata } of paymentsData) {
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
        await workflow.executeChild(multiRefundWorkflow, {
          args: [
            {
              orderId,
              paymentIds: succeeded,
              amountToRefundInUsdCents: totalCharged,
            },
          ],
          workflowId: `refund-order-[${orderId}]`,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          retry: { maximumAttempts: 1 },
          workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
        });
      }
      throw e;
    }
  }

  return {
    succeededPaymentIds: succeeded,
    failedPaymentIds: failed,
    totalChargedInUsdCents: totalCharged,
  };
}
