import type {
  PaymentProvider,
  PaymentProviderDetails,
  PaymentStatus,
} from '@namefi-astra/db/types';
import { paymentProviderSchema } from '@namefi-astra/db/types';
import type { ChecksumWalletAddress } from '@namefi-astra/utils';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import type { StripePaymentMethod } from '../activities/payment.activities';
import * as workflow from '@temporalio/workflow';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

// Import activities
const paymentActivities = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});

// Import child workflows
import { multiChargeWorkflow } from './multi-charge.workflow';

export interface PrepareMultiPaymentsAndChargeInput {
  userId: string;
  totalAmountInUsd: number;
  orderId?: string; // Optional order ID
  stripePaymentMethodId?: string; // Optional specific Stripe payment method to use
}

export interface PaymentAllocation {
  paymentId: string;
  amount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  walletAddress?: ChecksumWalletAddress;
  stripePaymentMethodId?: string;
}

export interface PrepareMultiPaymentsAndChargeOutput {
  payments: PaymentAllocation[];
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
 * Priority for creation: NFSC Sepolia → Base → Ethereum → Stripe
 * Priority for charging: Stripe → Sepolia → Base → Ethereum (handled by multiChargeWorkflow)
 */
export async function prepareMultiPaymentsAndChargeWorkflow(
  input: PrepareMultiPaymentsAndChargeInput,
): Promise<PrepareMultiPaymentsAndChargeOutput> {
  const { userId, totalAmountInUsd, orderId, stripePaymentMethodId } = input;

  // Get all available payment sources
  const paymentSources =
    await paymentActivities.getAllUserPaymentSourcesWithBalances(userId);

  const allocations: Array<{
    provider: PaymentProvider;
    amount: number;
    walletAddress?: ChecksumWalletAddress;
    stripePaymentMethodId?: string;
  }> = [];

  let remainingAmount = totalAmountInUsd;

  // Define chain priority order: Sepolia (11155111) → Base (8453) → Ethereum (1)
  const chainPriority = [11155111, 8453, 1]; // Sepolia, Base, Ethereum

  // Allocate NFSC payments by priority order
  for (const chainId of chainPriority) {
    if (remainingAmount <= 0) break;

    // Check all wallets for this chain
    for (const source of paymentSources.nfscSources) {
      if (remainingAmount <= 0) break;

      const balance = source.balances[chainId as keyof typeof source.balances];
      if (balance && balance > 0) {
        const allocation = Math.min(balance, remainingAmount);
        const provider = getPaymentProviderFromChainId(chainId);

        allocations.push({
          provider,
          walletAddress: source.walletAddress,
          amount: allocation,
        });
        remainingAmount -= allocation;
      }
    }
  }

  // Priority 4: Stripe (if amount remains and cards available)
  if (remainingAmount > 0 && paymentSources.stripePaymentMethods.length > 0) {
    // Select the specific payment method or default to first available
    const selectedMethod = stripePaymentMethodId
      ? paymentSources.stripePaymentMethods.find(
          (m: StripePaymentMethod) => m.id === stripePaymentMethodId,
        )
      : paymentSources.stripePaymentMethods[0];

    if (selectedMethod) {
      // Stripe minimum charge is 100 cents ($1.00)
      const stripeMinimumChargeCents = 100;
      const remainingCents = Math.round(remainingAmount * 100);

      if (remainingCents < stripeMinimumChargeCents && allocations.length > 0) {
        // Need to charge at least 100 cents with Stripe
        // Reduce the last NFSC allocation to make up the difference
        const shortfallCents = stripeMinimumChargeCents - remainingCents;

        // Find the last NFSC allocation (reverse search)
        for (let i = allocations.length - 1; i >= 0; i--) {
          if (allocations[i].provider !== paymentProviderSchema.enum.STRIPE) {
            const nfscAllocationCents = Math.round(allocations[i].amount * 100);

            if (nfscAllocationCents >= shortfallCents) {
              // Reduce this NFSC allocation
              allocations[i].amount =
                (nfscAllocationCents - shortfallCents) / 100;
              remainingAmount += shortfallCents / 100;
              break;
            }
          }
        }
      }

      // If we couldn't adjust NFSC to meet Stripe minimum and remaining is below minimum, skip Stripe to avoid overcharge.
      if (remainingCents >= stripeMinimumChargeCents) {
        const stripeAmount = Math.max(
          remainingAmount,
          stripeMinimumChargeCents / 100,
        );
        allocations.push({
          provider: paymentProviderSchema.enum.STRIPE,
          stripePaymentMethodId: selectedMethod.id,
          amount: stripeAmount,
        });
        remainingAmount = 0;
      }
    }
  }

  // If we couldn't allocate the full amount, throw an error
  if (remainingAmount > 0) {
    return {
      payments: [],
      totalChargedInUsdCents: 0,
      totalRefundedInUsdCents: 0,
      chargeSummary: {
        status: 'SKIPPED',
        skipReason: 'INSUFFICIENT_FUNDS',
        message: `Insufficient funds across all payment methods. Short by $${remainingAmount.toFixed(2)}`,
        shortByInUsdCents: Math.round(remainingAmount * 100),
      },
      refundSummary: {
        status: 'SKIPPED',
        failedRefunds: [],
      },
    };
  }

  // Create payment records for each allocation
  const paymentIds: string[] = [];
  const paymentDetails: PaymentAllocation[] = [];

  for (const allocation of allocations) {
    try {
      // Build payment provider details
      let paymentProviderDetails: PaymentProviderDetails;

      if (allocation.provider === paymentProviderSchema.enum.STRIPE) {
        if (!allocation.stripePaymentMethodId) {
          throw new workflow.ApplicationFailure(
            'Stripe payment method ID is required for Stripe payments',
          );
        }
        paymentProviderDetails = {
          paymentProvider: paymentProviderSchema.enum.STRIPE,
          stripePaymentDetails: {
            paymentMethodId: allocation.stripePaymentMethodId,
          },
        };
      } else {
        // NFSC payment
        if (!allocation.walletAddress) {
          throw new workflow.ApplicationFailure(
            'Wallet address is required for NFSC payments',
          );
        }
        const chainId = getChainIdFromProvider(allocation.provider);
        paymentProviderDetails = {
          paymentProvider: allocation.provider,
          nfscPaymentDetails: {
            chainId,
            walletAddress: allocation.walletAddress,
          },
        };
      }

      // Create payment record
      const payment = await paymentActivities.createPayment({
        amountInUsdCents: Math.round(allocation.amount * 100), // Convert to cents
        paymentProviderDetails,
      });

      paymentIds.push(payment.id);
      paymentDetails.push({
        paymentId: payment.id,
        amount: allocation.amount,
        provider: allocation.provider,
        status: payment.status,
        walletAddress: allocation.walletAddress,
        stripePaymentMethodId: allocation.stripePaymentMethodId,
      });
    } catch (error) {
      workflow.log.error(
        `createPayment failed for provider=${allocation.provider}, amount=${allocation.amount}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw workflow.ApplicationFailure.create({
        message: `createPayment failed for provider=${allocation.provider}, amount=${allocation.amount}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        nonRetryable: true,
      });
    }
  }

  // If no payments were created, throw an error
  if (paymentIds.length === 0) {
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

  // Prepare payments data for multi-charge workflow
  const paymentsData = paymentDetails.map((detail) => ({
    paymentId: detail.paymentId,
    amountInUSDCents: Math.round(detail.amount * 100), // Convert to cents
    metadata: undefined, // Can be extended with metadata if needed
  }));

  // Execute multi-charge workflow
  // Charging priority (Stripe first) is handled within multiChargeWorkflow
  const { totalChargedInUsdCents, totalRefundedInUsdCents, refundResult } =
    await multiChargeWorkflow({
      paymentsData,
      orderId, // Can be undefined
      userId,
      failOnNotAllCharged: false,
    });

  // Update payment details with final statuses
  const finalPaymentDetails = await Promise.all(
    paymentDetails.map(async (detail) => {
      const updatedPayment = await paymentActivities.getPaymentDetails({
        paymentId: detail.paymentId,
      });
      return {
        ...detail,
        status: updatedPayment.status,
      };
    }),
  );

  return {
    payments: finalPaymentDetails,
    totalChargedInUsdCents: totalChargedInUsdCents,
    totalRefundedInUsdCents: totalRefundedInUsdCents,
    chargeSummary: {
      status: totalChargedInUsdCents > 0 ? 'SUCCESS' : 'FAILED',
    },
    refundSummary: {
      status: totalRefundedInUsdCents > 0 ? 'SUCCESS' : 'FAILED',
      failedRefunds: refundResult?.failedRefunds || [],
    },
  };
}

/**
 * Helper to map chain ID to payment provider
 */
function getPaymentProviderFromChainId(chainId: number): PaymentProvider {
  switch (chainId) {
    case 11155111: // Sepolia testnet
      return paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA;
    case 8453: // Base mainnet
      return paymentProviderSchema.enum.NFSC_BASE;
    case 1: // Ethereum mainnet
      return paymentProviderSchema.enum.NFSC_ETHEREUM;
    default:
      throw new Error(`Invalid chain ID: ${chainId}`);
  }
}

/**
 * Helper to map payment provider to chain ID
 */
function getChainIdFromProvider(provider: PaymentProvider): number {
  switch (provider) {
    case paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA:
      return 11155111; // Sepolia testnet
    case paymentProviderSchema.enum.NFSC_BASE:
      return 8453; // Base mainnet
    case paymentProviderSchema.enum.NFSC_ETHEREUM:
      return 1; // Ethereum mainnet
    default:
      throw new Error(`Invalid NFSC provider: ${provider}`);
  }
}
