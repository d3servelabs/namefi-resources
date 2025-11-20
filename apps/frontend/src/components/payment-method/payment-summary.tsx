import { NetworkLogo } from '@/components/network-logo';
import { getShortAddress } from '@/lib/string';
import { formatAmountInUSD } from '@/lib/number';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import type { AppRouterInput } from '@/lib/trpc';
import type { HybridPaymentCalculation } from './hybrid-payment-utils';
import { getChainName } from './hybrid-payment-utils';
import { Separator } from '../ui/shadcn/separator';
import { ChevronDown, ChevronRight, CreditCard } from 'lucide-react';
import { TruncatedTextWithHover } from '../truncated-text-with-hover';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

export type PaymentSummaryProps = {
  calculation: HybridPaymentCalculation;
  userWalletAddresses: `0x${string}`[];
  totalAmountInUsdCents: number;
};

export function PaymentSummary({
  calculation,
  userWalletAddresses,
  totalAmountInUsdCents,
}: PaymentSummaryProps) {
  // Check if we should show wallet addresses (multiple wallets or different wallets)
  const uniqueWallets = new Set(
    calculation.balancePayments
      .map(
        (p: any) => p.paymentProviderDetails?.nfscPaymentDetails?.walletAddress,
      )
      .filter(Boolean),
  );
  const shouldShowWalletAddresses =
    uniqueWallets.size > 1 || userWalletAddresses.length > 1;
  const [showDetailedChainBalances, setShowDetailedChainBalances] =
    useState(false);
  const totalBalancePaymentsInUsdCents = useMemo(
    () =>
      calculation.balancePayments.reduce(
        (sum: number, p: CreateOrderV2Input['payments'][0]) =>
          sum + p.amountInUsdCents,
        0,
      ),
    [calculation.balancePayments],
  );

  return (
    <div className="space-y-2 p-3 rounded-md bg-[#18181B]">
      <div className="text-sm font-medium mb-2">Payment Summary</div>

      {/* Balance Payments */}

      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1">
          {!showDetailedChainBalances ? (
            <ChevronRight
              className="size-4"
              onClick={() => setShowDetailedChainBalances(true)}
            />
          ) : (
            <ChevronDown
              className="size-4"
              onClick={() => setShowDetailedChainBalances(false)}
            />
          )}
          $NFSC Balance
        </span>
        {!showDetailedChainBalances ? (
          <span>
            {formatAmountInUSD(totalBalancePaymentsInUsdCents, true)} USD
          </span>
        ) : null}
      </div>
      {!showDetailedChainBalances
        ? null
        : calculation.balancePayments.map(
            (payment: CreateOrderV2Input['payments'][0], index: number) => {
              const nfscDetails = payment.paymentProviderDetails as any;
              const walletAddress =
                nfscDetails.nfscPaymentDetails?.walletAddress;
              const chainId = nfscDetails.nfscPaymentDetails?.chainId || 0;

              return (
                <div
                  key={`${payment.paymentProviderDetails.paymentProvider}-${index}`}
                  className="flex justify-between text-xs pl-5"
                >
                  <span className="flex items-center gap-1">
                    <NetworkLogo className="size-4" network={chainId} />(
                    {getChainName(chainId)}
                    {walletAddress && (
                      <span className="text-muted-foreground">
                        {' - '}
                        <TruncatedTextWithHover maxLength={16}>
                          {walletAddress}
                        </TruncatedTextWithHover>
                      </span>
                    )}
                    )
                  </span>
                  <span>
                    {formatAmountInUSD(payment.amountInUsdCents, true)} USD
                  </span>
                </div>
              );
            },
          )}

      {/* Credit Card Payment */}
      {calculation.stripePayment && (
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1">
            <CreditCard className="size-4" />
            Credit Card
          </span>
          <span>
            {formatAmountInUSD(
              calculation.stripePayment.amountInUsdCents,
              true,
            )}{' '}
            USD
          </span>
        </div>
      )}

      <Separator />

      {/* Total */}
      <div className="flex justify-between text-sm font-medium">
        <span>Total</span>
        <span
          className={cn(
            calculation.isValid ? 'text-green-500' : 'text-red-500',
          )}
        >
          {formatAmountInUSD(
            calculation.totalPayments.reduce(
              (sum: number, p: CreateOrderV2Input['payments'][0]) =>
                sum + p.amountInUsdCents,
              0,
            ),
            true,
          )}{' '}
          USD
        </span>
      </div>

      {/* Error Message */}
      {!calculation.isValid && calculation.errorMessage && (
        <div className="text-xs text-red-500 mt-2">
          {calculation.errorMessage}
        </div>
      )}
    </div>
  );
}
