'use client';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/cn';
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
            ? 'You can continue the remaining payment amount with credit cards'
            : 'You can use existing balance to cover a portion of the payment amount'}
        </span>
        <Button variant="outline" onClick={onUseMultiPayment}>
          Use Multi-payment
        </Button>
      </div>
    </div>
  );
}
