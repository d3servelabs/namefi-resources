import type { PaymentProvider, PaymentStatus } from '@namefi-astra/db/types';
import type { ChecksumWalletAddress } from '@namefi-astra/utils';

// Import child workflows
import { prepareMultiPaymentsWorkflow } from './prepare-multi-payments.workflow';
import {
  chargePreparedPaymentsWorkflow,
  type ChargePreparedPaymentsOutput,
} from './charge-prepared-payments.workflow';

export interface PrepareMultiPaymentsAndChargeInput {
  userId: string;
  totalAmountInUsd: number;
  orderId?: string; // Optional order ID
  stripePaymentMethodId?: string; // Optional specific Stripe payment method to use
}

export interface PaymentAllocation {
  paymentId: string;
  amountInUsd: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  walletAddress?: ChecksumWalletAddress;
  stripePaymentMethodId?: string;
}

export interface PrepareMultiPaymentsAndChargeOutput {
  payments: ChargePreparedPaymentsOutput['payments'];
  totalChargedInUsdCents: number;
  totalRefundedInUsdCents: number;
  chargeSummary: {
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    skipReason?: 'INSUFFICIENT_FUNDS' | 'NO_PAYMENT_METHODS_AVAILABLE';
    message?: string;
    shortByInUsdCents?: number;
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
 * Prepares multiple payments based on user's available balances and charges them.
 * This is a composition workflow that combines prepare and charge operations.
 * Priority for creation: NFSC Sepolia → Base → Ethereum → Stripe
 * Priority for charging: Stripe → Sepolia → Base → Ethereum (handled by chargePreparedPaymentsWorkflow)
 */
export async function prepareMultiPaymentsAndChargeWorkflow(
  input: PrepareMultiPaymentsAndChargeInput,
): Promise<PrepareMultiPaymentsAndChargeOutput> {
  const { userId, totalAmountInUsd, orderId, stripePaymentMethodId } = input;

  // Step 1: Prepare the payments
  const preparationResult = await prepareMultiPaymentsWorkflow({
    userId,
    totalAmountInUsd,
    stripePaymentMethodId,
  });

  // If preparation failed (insufficient funds), return early
  if (preparationResult.preparationSummary.status === 'INSUFFICIENT_FUNDS') {
    return {
      payments: [],
      totalChargedInUsdCents: 0,
      totalRefundedInUsdCents: 0,
      chargeSummary: {
        status: 'SKIPPED',
        skipReason: 'INSUFFICIENT_FUNDS',
        message: preparationResult.preparationSummary.message,
        shortByInUsdCents:
          preparationResult.preparationSummary.shortByInUsdCents,
      },
      refundSummary: {
        status: 'SKIPPED',
        failedRefunds: [],
      },
    };
  }

  // If no payments were prepared, return early
  if (preparationResult.payments.length === 0) {
    return {
      payments: [],
      totalChargedInUsdCents: 0,
      totalRefundedInUsdCents: 0,
      chargeSummary: {
        status: 'FAILED',
        skipReason: 'NO_PAYMENT_METHODS_AVAILABLE',
      },
      refundSummary: {
        status: 'SKIPPED',
        failedRefunds: [],
      },
    };
  }

  // Step 2: Charge the prepared payments
  const chargeResult = await chargePreparedPaymentsWorkflow({
    userId,
    preparedPayments: preparationResult.payments,
    orderId,
    failOnNotAllCharged: false,
  });

  return chargeResult;
}
