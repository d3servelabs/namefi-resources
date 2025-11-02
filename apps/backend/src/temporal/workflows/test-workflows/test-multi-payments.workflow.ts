import { prepareMultiPaymentsAndChargeWorkflow } from '../prepare-multi-payments-and-charge.workflow';
import * as workflow from '@temporalio/workflow';

/**
 * Test workflow to validate multi-payment preparation and charging
 * This workflow simulates charging a user with multiple payment sources
 */
export async function testMultiPaymentsWorkflow({
  testUserId,
  testAmountInUsd,
}: {
  testUserId: string;
  testAmountInUsd: number;
}): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  workflow.log.info('Starting test-multi-payments workflow');

  try {
    // Test with a sample user ID and amount
    workflow.log.info(
      `Testing multi-payment for user ${testUserId} with amount $${testAmountInUsd}`,
    );

    const result = await prepareMultiPaymentsAndChargeWorkflow({
      userId: testUserId,
      totalAmountInUsd: testAmountInUsd,
      // orderId is optional and not provided in this test
    });

    workflow.log.info('Multi-payment workflow completed', {
      totalChargedInUsdCents: result.totalChargedInUsdCents,
      totalRefundedInUsdCents: result.totalRefundedInUsdCents,
      paymentsCount: result.payments.length,
      chargeStatus: result.chargeSummary.status,
      refundStatus: result.refundSummary.status,
    });

    // Log payment breakdown
    for (const payment of result.payments) {
      workflow.log.info('Payment allocation', {
        provider: payment.paymentProvider,
        amount: (payment.amountInUsdCents / 100).toFixed(2),
        status: payment.status,
        walletAddress: payment.walletAddress,
        stripePaymentMethodId: payment.stripePaymentMethodId,
      });
    }

    // Handle different charge statuses
    if (result.chargeSummary.status === 'SKIPPED') {
      return {
        success: false,
        message:
          result.chargeSummary.message ||
          `Charge skipped: ${result.chargeSummary.skipReason}`,
        details: {
          chargeSummary: result.chargeSummary,
          refundSummary: result.refundSummary,
        },
      };
    }

    if (result.chargeSummary.status === 'SUCCESS') {
      return {
        success: true,
        message: `Successfully charged $${(result.totalChargedInUsdCents / 100).toFixed(2)} across ${result.payments.length} payment source(s)`,
        details: {
          payments: result.payments,
          totalChargedInUsdCents: result.totalChargedInUsdCents,
          totalRefundedInUsdCents: result.totalRefundedInUsdCents,
          chargeSummary: result.chargeSummary,
          refundSummary: result.refundSummary,
        },
      };
    }

    // Partial failure
    return {
      success: false,
      message: `Partial failure: Charged $${(result.totalChargedInUsdCents / 100).toFixed(2)}, Refunded $${(result.totalRefundedInUsdCents / 100).toFixed(2)}`,
      details: {
        payments: result.payments,
        totalChargedInUsdCents: result.totalChargedInUsdCents,
        totalRefundedInUsdCents: result.totalRefundedInUsdCents,
        chargeSummary: result.chargeSummary,
        refundSummary: result.refundSummary,
      },
    };
  } catch (error) {
    workflow.log.error('Test multi-payments workflow failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      message: `Test failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Test workflow with specific payment method preference
 */
export async function testMultiPaymentsWithStripePreferenceWorkflow(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  workflow.log.info(
    'Starting test-multi-payments workflow with Stripe preference',
  );

  try {
    // Test with a sample user ID, amount, and specific Stripe payment method
    const testUserId = 'test-user-123'; // Replace with actual test user ID
    const testAmountInUsd = 100; // $100 test charge
    const testStripePaymentMethodId = 'pm_test_123'; // Replace with actual test payment method

    workflow.log.info(
      `Testing multi-payment for user ${testUserId} with amount $${testAmountInUsd} using Stripe method ${testStripePaymentMethodId}`,
    );

    const result = await prepareMultiPaymentsAndChargeWorkflow({
      userId: testUserId,
      totalAmountInUsd: testAmountInUsd,
      stripePaymentMethodId: testStripePaymentMethodId,
    });

    workflow.log.info(
      'Multi-payment workflow with Stripe preference completed',
      {
        totalChargedInUsdCents: result.totalChargedInUsdCents,
        totalRefundedInUsdCents: result.totalRefundedInUsdCents,
        paymentsCount: result.payments.length,
        chargeStatus: result.chargeSummary.status,
        refundStatus: result.refundSummary.status,
      },
    );

    // Handle different charge statuses
    if (result.chargeSummary.status === 'SKIPPED') {
      return {
        success: false,
        message:
          result.chargeSummary.message ||
          `Charge skipped: ${result.chargeSummary.skipReason}`,
        details: {
          chargeSummary: result.chargeSummary,
          refundSummary: result.refundSummary,
        },
      };
    }

    return {
      success: result.chargeSummary.status === 'SUCCESS',
      message:
        result.chargeSummary.status === 'SUCCESS'
          ? `Successfully charged $${(result.totalChargedInUsdCents / 100).toFixed(2)} with Stripe preference`
          : 'Failed to charge with Stripe preference',
      details: {
        payments: result.payments,
        totalChargedInUsdCents: result.totalChargedInUsdCents,
        totalRefundedInUsdCents: result.totalRefundedInUsdCents,
        chargeSummary: result.chargeSummary,
        refundSummary: result.refundSummary,
      },
    };
  } catch (error) {
    workflow.log.error('Test multi-payments with Stripe preference failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      message: `Test failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
