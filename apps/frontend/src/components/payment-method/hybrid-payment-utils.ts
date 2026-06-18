import { CHAINS } from '@namefi-astra/utils/chains';
import type { AppRouterInput } from '@/lib/trpc';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];
type CreateOrderV2Payment = CreateOrderV2Input['payments'][0];
type CreateOrderV2PaymentProviderDetails =
  CreateOrderV2Payment['paymentProviderDetails'];
type X402PaymentDetails = Extract<
  CreateOrderV2PaymentProviderDetails,
  { paymentProvider: 'X402' }
>['x402PaymentDetails'];

export type HybridRemainderPaymentProvider = 'STRIPE' | 'X402';

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
  x402Payment: CreateOrderV2Input['payments'][0] | null;
  totalPayments: CreateOrderV2Input['payments'];
  remainderPaymentProvider: HybridRemainderPaymentProvider;
  isValid: boolean;
  /**
   * i18n key (under the `payment.hybridPaymentUtils` namespace) describing why
   * the calculation is invalid, resolved to localized copy at the display site
   * (see `PaymentSummary`). Not user-facing text itself.
   */
  errorMessageKey?: 'x402Unavailable' | 'addCreditCard' | 'calculationError';
};

// Chain priority: [Sepolia, Robinhood Testnet, Base, Ethereum]
const CHAIN_PRIORITY = [
  CHAINS.sepolia.id as number,
  CHAINS.robinhoodTestnet.id as number,
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
  remainderPaymentProvider = 'STRIPE',
  x402PaymentDetails,
}: {
  totalAmountInUsdCents: number;
  chainBalances: ChainBalance[];
  stripeConfirmationTokenId: string | null;
  remainderPaymentProvider?: HybridRemainderPaymentProvider;
  x402PaymentDetails?: X402PaymentDetails;
}): HybridPaymentCalculation {
  // Sort balances by chain priority
  const sortedBalances = chainBalances
    .filter((cb) => cb.balanceInUsdCents >= 1)
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
  let x402Payment: CreateOrderV2Input['payments'][0] | null = null;
  let remainderAmountInUsdCents = remainingAmount;

  // Handle Stripe minimum charge constraint
  if (
    remainderPaymentProvider === 'STRIPE' &&
    remainderAmountInUsdCents > 0 &&
    remainderAmountInUsdCents < STRIPE_MINIMUM_CHARGE_CENTS
  ) {
    // Need to reduce balance usage to meet Stripe minimum
    const additionalAmountNeeded =
      STRIPE_MINIMUM_CHARGE_CENTS - remainderAmountInUsdCents;

    if (usedBalanceAmount >= additionalAmountNeeded) {
      // We have enough balance to reduce usage
      remainderAmountInUsdCents = STRIPE_MINIMUM_CHARGE_CENTS;
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
      remainderAmountInUsdCents = totalAmountInUsdCents;
    }
  }

  // Create remainder payment if needed
  if (remainderPaymentProvider === 'STRIPE' && remainderAmountInUsdCents > 0) {
    stripePayment = {
      amountInUsdCents: remainderAmountInUsdCents,
      paymentProviderDetails: {
        paymentProvider: 'STRIPE',
        stripePaymentDetails: { paymentMethodId: undefined },
      },
      paymentMetadata: {
        confirmationTokenId: stripeConfirmationTokenId ?? undefined,
      },
    };
  } else if (
    remainderPaymentProvider === 'X402' &&
    remainderAmountInUsdCents > 0 &&
    x402PaymentDetails
  ) {
    x402Payment = {
      amountInUsdCents: remainderAmountInUsdCents,
      paymentProviderDetails: {
        paymentProvider: 'X402',
        x402PaymentDetails: {
          ...x402PaymentDetails,
          presettled: false,
        },
      },
    };
  }

  const totalPayments = [...balancePayments];
  if (x402Payment) {
    totalPayments.push(x402Payment);
  }
  if (stripePayment) {
    totalPayments.push(stripePayment);
  }

  const totalCalculated = totalPayments.reduce(
    (sum, p) => sum + p.amountInUsdCents,
    0,
  );
  const hasX402ConfigWhenNeeded =
    remainderPaymentProvider !== 'X402' ||
    remainderAmountInUsdCents <= 0 ||
    !!x402PaymentDetails;
  const isValid =
    totalCalculated === totalAmountInUsdCents &&
    totalPayments.length > 0 &&
    hasX402ConfigWhenNeeded &&
    (!stripePayment || !!stripeConfirmationTokenId);

  return {
    totalBalanceInUsdCents,
    balancePayments,
    stripePayment,
    x402Payment,
    totalPayments,
    remainderPaymentProvider,
    isValid,
    errorMessageKey: isValid
      ? undefined
      : remainderPaymentProvider === 'X402' && !x402PaymentDetails
        ? 'x402Unavailable'
        : !stripeConfirmationTokenId && stripePayment
          ? 'addCreditCard'
          : 'calculationError',
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
