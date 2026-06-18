'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';
import { SelectedPaymentMethod } from './select-payment-method-card';

export function MultiPaymentHints({
  selectedPaymentMethod,
  selectedWalletChainNfscBalanceInUsdCents,
  totalAmountInUsdCents,
  onUseMultiPayment,
}: {
  selectedPaymentMethod: SelectedPaymentMethod | null | undefined;
  selectedWalletChainNfscBalanceInUsdCents: number | null;
  totalAmountInUsdCents: number;
  onUseMultiPayment: () => void;
}) {
  const t = useTranslations('payment');
  const showNfscToCardHint =
    selectedPaymentMethod === SelectedPaymentMethod.NFSC &&
    selectedWalletChainNfscBalanceInUsdCents !== null &&
    selectedWalletChainNfscBalanceInUsdCents < totalAmountInUsdCents;

  const showCardToNfscHint =
    selectedPaymentMethod === SelectedPaymentMethod.CREDIT_CARD &&
    selectedWalletChainNfscBalanceInUsdCents !== null &&
    selectedWalletChainNfscBalanceInUsdCents > 0;

  if (!showNfscToCardHint && !showCardToNfscHint) return null;

  return (
    <div className="mt-4 text-sm text-muted-foreground">
      <div
        className={cn(
          'flex items-center justify-between gap-3 p-3 rounded-md bg-white/5 border border-white/10',
        )}
      >
        <span>
          {showNfscToCardHint
            ? t('multiPaymentHints.nfscToCard')
            : t('multiPaymentHints.cardToNfsc')}
        </span>
        <Button variant="outline" onClick={onUseMultiPayment}>
          {t('multiPaymentHints.useMultiPayment')}
        </Button>
      </div>
    </div>
  );
}
