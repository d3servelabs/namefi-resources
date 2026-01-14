import { CHAINS } from '@namefi-astra/utils/chains';
import type { AppRouterInput } from '@/lib/trpc';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

export type ChainBalance = {
  chainId: number;
  chainName: string;
  walletAddress: string;
  balanceInUsdCents: number;
  paymentProvider: 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA';
};

export type HybridPaymentCalculation = {
  totalBalanceInUsdCents: number;
  balancePayments: CreateOrderV2Input['payments'];
  stripePayment: CreateOrderV2Input['payments'][0] | null;
  totalPayments: CreateOrderV2Input['payments'];
  isValid: boolean;
  errorMessage?: string;
};

// Chain priority: [Sepolia, Base, Ethereum]
const CHAIN_PRIORITY = [
  CHAINS.sepolia.id as number,
  CHAINS.base.id as number,
  CHAINS.mainnet.id as number,
];

const STRIPE_MINIMUM_CHARGE_CENTS = 100;

/**
 * Calculate optimal balance usage across multiple chains with given priority
 */
export function calculateHybridPayments({
  totalAmountInUsdCents,
  chainBalances,
  stripeConfirmationTokenId,
}: {
  totalAmountInUsdCents: number;
  chainBalances: ChainBalance[];
  stripeConfirmationTokenId: string | null;
}): HybridPaymentCalculation {
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

  const totalBalanceInUsdCents = sortedBalances.reduce(
    (sum, cb) => sum + cb.balanceInUsdCents,
    0,
  );

  const balancePayments: CreateOrderV2Input['payments'] = [];
  let remainingAmount = totalAmountInUsdCents;
  let usedBalanceAmount = 0;

  // Use balance from chains in priority order
  for (const chainBalance of sortedBalances) {
    if (remainingAmount <= 0) break;

    const amountToUse = Math.min(
      chainBalance.balanceInUsdCents,
      remainingAmount,
    );
    balancePayments.push({
      amountInUsdCents: amountToUse,
      paymentProviderDetails: {
        paymentProvider: chainBalance.paymentProvider,
        nfscPaymentDetails: {
          walletAddress: chainBalance.walletAddress,
          chainId: chainBalance.chainId,
        },
      },
    });

    usedBalanceAmount += amountToUse;
    remainingAmount -= amountToUse;
  }

  // Calculate Stripe payment for remainder
  let stripePayment: CreateOrderV2Input['payments'][0] | null = null;
  let stripeAmountInUsdCents = remainingAmount;

  // Handle Stripe minimum charge constraint
  if (
    stripeAmountInUsdCents > 0 &&
    stripeAmountInUsdCents < STRIPE_MINIMUM_CHARGE_CENTS
  ) {
    // Need to reduce balance usage to meet Stripe minimum
    const additionalAmountNeeded =
      STRIPE_MINIMUM_CHARGE_CENTS - stripeAmountInUsdCents;

    if (usedBalanceAmount >= additionalAmountNeeded) {
      // We have enough balance to reduce usage
      stripeAmountInUsdCents = STRIPE_MINIMUM_CHARGE_CENTS;
      usedBalanceAmount -= additionalAmountNeeded;

      // Recalculate balance payments with reduced amounts
      balancePayments.splice(0); // Clear existing payments
      let remainingForBalance = usedBalanceAmount;

      for (const chainBalance of sortedBalances) {
        if (remainingForBalance <= 0) break;

        const amountToUse = Math.min(
          chainBalance.balanceInUsdCents,
          remainingForBalance,
        );
        balancePayments.push({
          amountInUsdCents: amountToUse,
          paymentProviderDetails: {
            paymentProvider: chainBalance.paymentProvider,
            nfscPaymentDetails: {
              walletAddress: chainBalance.walletAddress,
              chainId: chainBalance.chainId,
            },
          },
        });

        remainingForBalance -= amountToUse;
      }
    } else {
      // Not enough balance to reduce usage, user needs to pay full amount with card
      balancePayments.splice(0);
      stripeAmountInUsdCents = totalAmountInUsdCents;
    }
  }

  // Create Stripe payment if needed
  if (stripeAmountInUsdCents > 0) {
    stripePayment = {
      amountInUsdCents: stripeAmountInUsdCents,
      paymentProviderDetails: {
        paymentProvider: 'STRIPE',
        stripePaymentDetails: { paymentMethodId: undefined },
      },
      paymentMetadata: {
        confirmationTokenId: stripeConfirmationTokenId ?? undefined,
      },
    };
  }

  const totalPayments = [...balancePayments];
  if (stripePayment) {
    totalPayments.push(stripePayment);
  }

  const totalCalculated = totalPayments.reduce(
    (sum, p) => sum + p.amountInUsdCents,
    0,
  );
  const isValid =
    totalCalculated === totalAmountInUsdCents &&
    totalPayments.length > 0 &&
    (!stripePayment || !!stripeConfirmationTokenId);

  return {
    totalBalanceInUsdCents,
    balancePayments,
    stripePayment,
    totalPayments,
    isValid,
    errorMessage: isValid
      ? undefined
      : !stripeConfirmationTokenId && stripePayment
        ? 'Please add a credit card to continue'
        : 'Payment calculation error. Please check your balance and payment method.',
  };
}

/**
 * Get payment provider for a given chain ID
 */
export function getPaymentProviderForChain(
  chainId: number,
): 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA' {
  switch (chainId) {
    case CHAINS.base.id:
      return 'NFSC_BASE';
    case CHAINS.mainnet.id:
      return 'NFSC_ETHEREUM';
    case CHAINS.sepolia.id:
    default:
      return 'NFSC_ETHEREUM_SEPOLIA';
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
