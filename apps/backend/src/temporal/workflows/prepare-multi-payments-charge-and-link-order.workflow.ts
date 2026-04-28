import { ApplicationFailure, executeChild } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  prepareMultiPaymentsAndChargeWorkflow,
  type PrepareMultiPaymentsAndChargeInput,
  type PrepareMultiPaymentsAndChargeOutput,
} from './prepare-multi-payments-and-charge.workflow';

const { linkAllPaymentsToOrderOrThrow } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

export type PrepareMultiPaymentsChargeAndLinkOrderInput =
  PrepareMultiPaymentsAndChargeInput;

export type PrepareMultiPaymentsChargeAndLinkOrderOutput =
  PrepareMultiPaymentsAndChargeOutput & {
    linkedPaymentIds: string[];
  };

/**
 * Charges with prepareMultiPaymentsAndChargeWorkflow, then links all returned
 * payment records to the order that the charge was created for.
 */
export async function prepareMultiPaymentsChargeAndLinkOrderWorkflow(
  input: PrepareMultiPaymentsChargeAndLinkOrderInput,
): Promise<PrepareMultiPaymentsChargeAndLinkOrderOutput> {
  if (!input.orderId) {
    throw ApplicationFailure.create({
      message: 'orderId is required to link charged payments to an order',
      nonRetryable: true,
    });
  }

  const chargeResult = await executeChild(
    prepareMultiPaymentsAndChargeWorkflow,
    {
      args: [input],
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      workflowId: `prepare-multi-payments-and-charge-[${input.orderId}]`,
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
    },
  );
  const paymentIds = chargeResult.payments.map((payment) => payment.paymentId);
  const { linkedPaymentIds } = await linkAllPaymentsToOrderOrThrow({
    paymentIds,
    orderId: input.orderId,
  });

  return {
    ...chargeResult,
    linkedPaymentIds,
  };
}
