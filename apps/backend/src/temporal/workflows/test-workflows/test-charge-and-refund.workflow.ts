import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import {
  chargeUserAndCreatePaymentWorkflow,
  type ChargeUserAndCreatePaymentWorkflowOutput,
} from '../charge-user-and-create-payment.workflow';
import { refundUserWorkflow } from '../refund-user.workflow';

export type TestChargeAndRefundWorkflowInput = {
  userId: string;
  testAmountInUsd: number;
};

export type TestChargeAndRefundWorkflowOutput = {
  chargeResult: ChargeUserAndCreatePaymentWorkflowOutput;
  refundSuccess: boolean;
  summary: string;
};

const { determineAvailablePaymentMethods } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

export async function testChargeAndRefundWorkflow({
  userId,
  testAmountInUsd,
}: TestChargeAndRefundWorkflowInput): Promise<TestChargeAndRefundWorkflowOutput> {
  workflow.log.info(
    `Starting charge and refund test for user ${userId} with amount $${testAmountInUsd}`,
  );

  // Step 1: Charge the user
  let chargeResult: ChargeUserAndCreatePaymentWorkflowOutput;
  try {
    chargeResult = await workflow.executeChild(
      chargeUserAndCreatePaymentWorkflow,
      {
        args: [
          {
            userId,
            totalAmountInUsd: testAmountInUsd,
          },
        ],
        workflowId: `test-charge-${new Date().toISOString()}-${userId}`,
      },
    );

    workflow.log.info(
      `Successfully charged user ${userId}: paymentType=${chargeResult.paymentType}, paymentId=${chargeResult.namefiPaymentIntentId}`,
    );
  } catch (error) {
    workflow.log.error(
      `Failed to charge user ${userId}: ${JSON.stringify(error)}`,
    );
    throw workflow.ApplicationFailure.create({
      message: `Test failed during charge phase: ${error}`,
      nonRetryable: true,
    });
  }

  // Step 2: Get wallet address for refund (needed for NFSC refunds)
  const { walletAddressToBeCharged } = await determineAvailablePaymentMethods(
    testAmountInUsd,
    userId,
  );

  // Step 3: Perform total refund
  let refundSuccess = false;
  try {
    if (!chargeResult.namefiPaymentIntentId) {
      throw new Error('No payment ID available for refund');
    }

    await workflow.executeChild(refundUserWorkflow, {
      args: [
        {
          paymentId: chargeResult.namefiPaymentIntentId,
          amountToRefundInUsdCents: testAmountInUsd * 100,
        },
      ],
      workflowId: `test-refund-${new Date().toISOString()}-${userId}`,
    });

    refundSuccess = true;
    workflow.log.info(
      `Successfully refunded $${testAmountInUsd} to user ${userId} via ${chargeResult.paymentType}`,
    );
  } catch (error) {
    workflow.log.error(
      `Failed to refund user ${userId}: ${JSON.stringify(error)}`,
    );
    refundSuccess = false;
  }

  const summary = refundSuccess
    ? `✅ Test completed successfully: Charged $${testAmountInUsd} via ${chargeResult.paymentType}, then refunded the full amount`
    : `❌ Test partially failed: Charged $${testAmountInUsd} via ${chargeResult.paymentType}, but refund failed`;

  workflow.log.info(summary);

  return {
    chargeResult,
    refundSuccess,
    summary,
  };
}
