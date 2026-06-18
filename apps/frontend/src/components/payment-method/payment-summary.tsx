import { NetworkLogo } from '@/components/network-logo';
import { formatAmountInUSD } from '@/lib/number';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { AppRouterInput } from '@/lib/trpc';
import type { HybridPaymentCalculation } from './hybrid-payment-utils';
import { getChainName } from './hybrid-payment-utils';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { ChevronDown, ChevronRight, CreditCard } from 'lucide-react';
import { TruncatedTextWithHover } from '../truncated-text-with-hover';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

export type PaymentSummaryProps = {
  calculation: HybridPaymentCalculation;
};

function getNfscPaymentDetails(payment: CreateOrderV2Input['payments'][0]) {
  const details = payment.paymentProviderDetails;
  if (
    details.paymentProvider === 'NFSC_BASE' ||
    details.paymentProvider === 'NFSC_ETHEREUM' ||
    details.paymentProvider === 'NFSC_ETHEREUM_SEPOLIA'
  ) {
    return details.nfscPaymentDetails;
  }

  return undefined;
}

export function PaymentSummary({ calculation }: PaymentSummaryProps) {
  const t = useTranslations('payment');
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
      <div className="text-sm font-medium mb-2">
        {t('paymentSummary.title')}
      </div>

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
          {t('paymentSummary.nfscBalance')}
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
              const nfscDetails = getNfscPaymentDetails(payment);
              const walletAddress = nfscDetails?.walletAddress;
              const chainId = nfscDetails?.chainId || 0;

              return (
                <div
                  key={`${payment.paymentProviderDetails.paymentProvider}-${index}`}
                  className="flex justify-between text-xs ps-5"
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
            {t('paymentSummary.creditCard')}
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

      {calculation.x402Payment && (
        <div className="flex justify-between text-xs">
          <span>x402 (USDC)</span>
          <span>
            {formatAmountInUSD(calculation.x402Payment.amountInUsdCents, true)}{' '}
            USD
          </span>
        </div>
      )}

      <Separator />

      {/* Total */}
      <div className="flex justify-between text-sm font-medium">
        <span>{t('paymentSummary.total')}</span>
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
      {!calculation.isValid && calculation.errorMessageKey && (
        <div className="text-xs text-red-500 mt-2">
          {t(`hybridPaymentUtils.${calculation.errorMessageKey}`)}
        </div>
      )}
    </div>
  );
}
