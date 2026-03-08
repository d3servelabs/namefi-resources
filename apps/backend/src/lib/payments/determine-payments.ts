import type {
  NfscPaymentProviderDetails,
  PaymentProvider,
} from '@namefi-astra/db/types';
import { paymentProviderSchema } from '@namefi-astra/db/types';
import type { ChecksumWalletAddress } from '@namefi-astra/utils';
import { CHAINS } from '@namefi-astra/utils';

// ============================================================================
// Types
// ============================================================================

export type PaymentMethod = 'NFSC' | 'STRIPE';

export type ChainBalance = {
  chainId: number;
  chainName: string;
  walletAddress: ChecksumWalletAddress;
  balanceInUsdCents: number;
  paymentProvider: 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA';
};

export type DeterminePaymentsInput = {
  /** Total amount to allocate in USD cents */
  totalAmountInUsdCents: number;
  /** User's available chain balances */
  chainBalances: ChainBalance[];
  /** Payment methods to consider. @default ['NFSC'] */
  allowedMethods?: PaymentMethod[];
  /**
   * When true and totalAmountInUsdCents is 0, creates a single 0-amount
   * NFSC_BASE payment instead of returning an empty payments array.
   * Requires defaultWalletAddress to be provided.
   * @default false
   */
  allowZeroPayments?: boolean;
  /**
   * Wallet address to use for zero-amount payments.
   * Required when allowZeroPayments is true.
   */
  defaultWalletAddress?: ChecksumWalletAddress;
};

export type PaymentAllocation = {
  amountInUsdCents: number;
  paymentProviderDetails: NfscPaymentProviderDetails;
};

export type DeterminePaymentsResult = {
  payments: PaymentAllocation[];
  totalAllocatedInUsdCents: number;
  remainingInUsdCents: number;
  status: 'SUCCESS' | 'INSUFFICIENT_FUNDS';
  errorMessage?: string;
};

// ============================================================================
// Constants
// ============================================================================

// Chain priority: Sepolia → Robinhood Testnet → Base → Ethereum
const CHAIN_PRIORITY: number[] = [
  CHAINS.sepolia.id, // 11155111
  CHAINS.robinhoodTestnet.id,
  CHAINS.base.id, // 8453
  CHAINS.mainnet.id, // 1
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get payment provider for a given chain ID
 */
export function getPaymentProviderForChain(
  chainId: number,
): 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA' {
  switch (chainId) {
    case CHAINS.base.id:
      return paymentProviderSchema.enum.NFSC_BASE;
    case CHAINS.mainnet.id:
      return paymentProviderSchema.enum.NFSC_ETHEREUM;
    case CHAINS.sepolia.id:
    default:
      return paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA;
  }
}

/**
 * Get chain name for display
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case CHAINS.base.id:
      return 'Base';
    case CHAINS.mainnet.id:
      return 'Ethereum';
    case CHAINS.sepolia.id:
      return 'Sepolia';
    default:
      return 'Unknown Chain';
  }
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Determine payment allocations from user's NFSC balances across chains.
 * Allocates payments following chain priority: Sepolia → Base → Ethereum.
 *
 * @param input - The input parameters for payment determination
 * @param input.totalAmountInUsdCents - Total amount to allocate in USD cents
 * @param input.chainBalances - User's available chain balances
 * @param input.allowedMethods - Payment methods to consider. Defaults to ['NFSC']
 * @param input.allowZeroPayments - When true and amount is 0, creates a 0-amount payment
 * @param input.defaultWalletAddress - Wallet for zero-amount payments (required if allowZeroPayments)
 * @returns Payment allocations and status
 *
 * @example
 * // Standard allocation from balances
 * determinePayments({
 *   totalAmountInUsdCents: 1000,
 *   chainBalances: [...],
 * });
 *
 * @example
 * // Zero-price with payment record
 * determinePayments({
 *   totalAmountInUsdCents: 0,
 *   chainBalances: [],
 *   allowZeroPayments: true,
 *   defaultWalletAddress: '0x...',
 * });
 */
export function determinePayments(
  input: DeterminePaymentsInput,
): DeterminePaymentsResult {
  const {
    totalAmountInUsdCents,
    chainBalances,
    allowedMethods = ['NFSC'],
    allowZeroPayments = false,
    defaultWalletAddress,
  } = input;

  // Handle zero amount case
  if (totalAmountInUsdCents <= 0) {
    // If allowZeroPayments is enabled, create a 0-amount NFSC_BASE payment
    if (allowZeroPayments && defaultWalletAddress) {
      return {
        payments: [
          {
            amountInUsdCents: 0,
            paymentProviderDetails: {
              paymentProvider: paymentProviderSchema.enum.NFSC_BASE,
              nfscPaymentDetails: {
                walletAddress: defaultWalletAddress,
                chainId: CHAINS.base.id,
              },
            },
          },
        ],
        totalAllocatedInUsdCents: 0,
        remainingInUsdCents: 0,
        status: 'SUCCESS',
      };
    }

    // Default: return empty payments array
    return {
      payments: [],
      totalAllocatedInUsdCents: 0,
      remainingInUsdCents: 0,
      status: 'SUCCESS',
    };
  }

  // Sort balances by chain priority
  const sortedBalances = chainBalances
    .filter((cb) => cb.balanceInUsdCents > 0)
    .sort((a, b) => {
      const aPriority = CHAIN_PRIORITY.indexOf(a.chainId);
      const bPriority = CHAIN_PRIORITY.indexOf(b.chainId);
      if (aPriority === -1 && bPriority === -1) return 0;
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });

  const payments: PaymentAllocation[] = [];
  let remainingAmount = totalAmountInUsdCents;

  // Allocate NFSC payments if allowed
  if (allowedMethods.includes('NFSC')) {
    for (const chainBalance of sortedBalances) {
      if (remainingAmount <= 0) break;

      const amountToUse = Math.min(
        chainBalance.balanceInUsdCents,
        remainingAmount,
      );

      payments.push({
        amountInUsdCents: amountToUse,
        paymentProviderDetails: {
          paymentProvider: chainBalance.paymentProvider,
          nfscPaymentDetails: {
            walletAddress: chainBalance.walletAddress,
            chainId: chainBalance.chainId,
          },
        },
      });

      remainingAmount -= amountToUse;
    }
  }

  // Calculate totals
  const totalAllocated = payments.reduce(
    (sum, p) => sum + p.amountInUsdCents,
    0,
  );

  return {
    payments,
    totalAllocatedInUsdCents: totalAllocated,
    remainingInUsdCents: remainingAmount,
    status: remainingAmount <= 0 ? 'SUCCESS' : 'INSUFFICIENT_FUNDS',
    errorMessage:
      remainingAmount > 0
        ? `Insufficient funds. Short by ${(remainingAmount / 100).toFixed(2)} USD`
        : undefined,
  };
}
