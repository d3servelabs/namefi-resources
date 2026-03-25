import type {
  NfscPaymentProvider,
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

export interface PrepareMultiPaymentsInput {
  userId: string;
  totalAmountInUsd: number;
  stripePaymentMethodId?: string; // Optional specific Stripe payment method to use
}

export interface PreparedPaymentAllocation {
  paymentId: string;
  amountInUsd: number;
  amountInUsdCents: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  walletAddress?: ChecksumWalletAddress;
  stripePaymentMethodId?: string;
}

export interface PrepareMultiPaymentsOutput {
  paymentSources: Awaited<
    ReturnType<typeof paymentActivities.getAllUserPaymentSourcesWithBalances>
  >;
  payments: PreparedPaymentAllocation[];
  totalAllocatedInUsdCents: number;
  preparationSummary: {
    status: 'SUCCESS' | 'FAILED' | 'INSUFFICIENT_FUNDS' | 'SKIPPED';
    message?: string;
    shortByInUsdCents?: number;
  };
}

/**
 * Prepares multiple payments based on user's available balances.
 * Priority for allocation: NFSC Sepolia → Base → Ethereum → Stripe
 * Creates payment records but does not charge them.
 */
export async function prepareMultiPaymentsWorkflow(
  input: PrepareMultiPaymentsInput,
): Promise<PrepareMultiPaymentsOutput> {
  const { userId, totalAmountInUsd, stripePaymentMethodId } = input;

  // Get all available payment sources
  const paymentSources =
    await paymentActivities.getAllUserPaymentSourcesWithBalances(userId);

  if (totalAmountInUsd <= 0) {
    return {
      paymentSources,
      payments: [],
      totalAllocatedInUsdCents: 0,
      preparationSummary: {
        status: 'SKIPPED',
        message: 'Total amount in USD is less than or equal to 0',
      },
    };
  }
  const allocations: Array<{
    provider: PaymentProvider;
    amountInUsd: number;
    walletAddress?: ChecksumWalletAddress;
    stripePaymentMethodId?: string;
  }> = [];

  let remainingAmountInUsdCents = Math.round(totalAmountInUsd * 100);

  // Define chain priority order: Sepolia (11155111) → Base (8453) → Ethereum (1)
  const chainPriority = [11155111, 8453, 1]; // Sepolia, Base, Ethereum

  // Allocate NFSC payments by priority order
  for (const chainId of chainPriority) {
    if (remainingAmountInUsdCents <= 0) break;

    // Check all wallets for this chain
    for (const source of paymentSources.nfscSources) {
      if (remainingAmountInUsdCents <= 0) break;

      const balance = source.balances[chainId as keyof typeof source.balances];
      if (balance && balance > 0) {
        const allocation = Math.min(balance, remainingAmountInUsdCents / 100);
        const provider = getPaymentProviderFromChainId(chainId);

        allocations.push({
          provider,
          walletAddress: source.walletAddress,
          amountInUsd: allocation,
        });
        remainingAmountInUsdCents -= Math.round(allocation * 100);
      }
    }
  }

  // Priority 4: Stripe (if amount remains and cards available)
  if (
    remainingAmountInUsdCents > 0 &&
    paymentSources.stripePaymentMethods.length > 0
  ) {
    // Select the specific payment method or default to first available
    const selectedMethod = stripePaymentMethodId
      ? paymentSources.stripePaymentMethods.find(
          (m: StripePaymentMethod) => m.id === stripePaymentMethodId,
        )
      : paymentSources.stripePaymentMethods[0];

    if (selectedMethod) {
      // Stripe minimum charge is 100 cents ($1.00)
      const stripeMinimumChargeCents = 100;

      if (
        remainingAmountInUsdCents < stripeMinimumChargeCents &&
        allocations.length > 0
      ) {
        // Need to charge at least 100 cents with Stripe
        // Reduce the last NFSC allocation to make up the difference
        const shortfallCents = Math.round(
          stripeMinimumChargeCents - remainingAmountInUsdCents,
        );

        // Find the last NFSC allocation (reverse search)
        for (let i = allocations.length - 1; i >= 0; i--) {
          if (allocations[i].provider !== paymentProviderSchema.enum.STRIPE) {
            const nfscAllocationCents = Math.round(
              allocations[i].amountInUsd * 100,
            );

            if (nfscAllocationCents >= shortfallCents) {
              // Reduce this NFSC allocation
              allocations[i].amountInUsd =
                Math.round(nfscAllocationCents - shortfallCents) / 100;
              remainingAmountInUsdCents += shortfallCents;
              break;
            }
          }
        }
      }

      // If we couldn't adjust NFSC to meet Stripe minimum and remaining is below minimum, skip Stripe to avoid overcharge.
      if (remainingAmountInUsdCents >= stripeMinimumChargeCents) {
        const stripeAmountInUsdCents = Math.max(
          remainingAmountInUsdCents,
          stripeMinimumChargeCents,
        );
        allocations.push({
          provider: paymentProviderSchema.enum.STRIPE,
          stripePaymentMethodId: selectedMethod.id,
          amountInUsd: stripeAmountInUsdCents / 100,
        });
        remainingAmountInUsdCents = 0;
      }
    }
  }

  // If we couldn't allocate the full amount, return insufficient funds
  if (remainingAmountInUsdCents > 0) {
    return {
      paymentSources,
      payments: [],
      totalAllocatedInUsdCents: 0,
      preparationSummary: {
        status: 'INSUFFICIENT_FUNDS',
        message: `Insufficient funds across all payment methods. Short by $${(remainingAmountInUsdCents / 100).toFixed(2)}`,
        shortByInUsdCents: remainingAmountInUsdCents,
      },
    };
  }

  // Create payment records for each allocation
  const paymentDetails: PreparedPaymentAllocation[] = [];

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
      } else if (
        allocation.provider === paymentProviderSchema.enum.X402 ||
        allocation.provider === paymentProviderSchema.enum.MPP
      ) {
        throw new workflow.ApplicationFailure(
          `${allocation.provider} payment provider is not supported for multi-payments`,
        );
      } else {
        // NFSC payment
        if (!allocation.walletAddress) {
          throw new workflow.ApplicationFailure(
            'Wallet address is required for NFSC payments',
          );
        }
        const provider = allocation.provider as NfscPaymentProvider;
        const chainId = getChainIdFromProvider(provider);
        paymentProviderDetails = {
          paymentProvider: provider,
          nfscPaymentDetails: {
            chainId,
            walletAddress: allocation.walletAddress,
          },
        };
      }

      // Create payment record
      const payment = await paymentActivities.createPayment({
        amountInUsdCents: Math.round(allocation.amountInUsd * 100), // Convert to cents
        paymentProviderDetails,
      });

      paymentDetails.push({
        paymentId: payment.id,
        amountInUsd: allocation.amountInUsd,
        amountInUsdCents: Math.round(allocation.amountInUsd * 100),
        provider: allocation.provider,
        status: payment.status,
        walletAddress: allocation.walletAddress,
        stripePaymentMethodId: allocation.stripePaymentMethodId,
      });
    } catch (error) {
      workflow.log.error(
        `createPayment failed for provider=${allocation.provider}, amount=${allocation.amountInUsd}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw workflow.ApplicationFailure.create({
        message: `createPayment failed for provider=${allocation.provider}, amount=${allocation.amountInUsd}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        nonRetryable: true,
      });
    }
  }

  // Calculate total allocated
  const totalAllocatedInUsdCents = paymentDetails.reduce(
    (sum, payment) => sum + payment.amountInUsdCents,
    0,
  );

  return {
    paymentSources,
    payments: paymentDetails,
    totalAllocatedInUsdCents,
    preparationSummary: {
      status: 'SUCCESS',
      message: `Successfully prepared ${paymentDetails.length} payment(s) totaling $${(totalAllocatedInUsdCents / 100).toFixed(2)}`,
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
