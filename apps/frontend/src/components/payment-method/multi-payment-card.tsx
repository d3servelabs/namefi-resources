import { AddPaymentMethodDialog } from '@/components/payment-method/add-payment-method-dialog';
import { CartCard } from '@/components/cart-card';
import { DisabledReasonTooltip } from '@/components/disabled-reason-tooltip';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { useEffect, useMemo, useState } from 'react';
import { CHAINS } from '@namefi-astra/utils/chains';
import { paymentProviderSchema } from '@namefi-astra/common/payment-provider';
import type { AppRouterInput } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { NetworkLogo } from '@/components/network-logo';
import { getShortAddress } from '@/lib/string';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';

export type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

export type MultiPaymentSelectionChange = {
  includeNfsc: boolean;
  includeStripe: boolean;
  stripeConfirmationTokenId: string | null;
  nfscAmountInUsdCents: number;
  stripeAmountInUsdCents: number;
  payments: CreateOrderV2Input['payments'];
  isValid: boolean;
};
export type MultiPaymentCardProps = {
  isDisabled: boolean;
  isProcessing: boolean;
  submitButtonText: string;
  submitOrderDisabled: boolean;
  /** When the submit button is disabled, explains why (shown in a tooltip). */
  submitDisabledReason?: string;
  totalAmountInUsdCents: number;
  nfscMaxUsableInUsdCents: number;
  initialIncludeNfsc?: boolean;
  initialIncludeStripe?: boolean;
  initialNfscWalletAddress?: string | null;
  initialNfscChainId?: number | null;
  onSelectionChange?: (sel: MultiPaymentSelectionChange) => void;
  onSubmit: () => void;
};

export function MultiPaymentCard({
  isDisabled,
  isProcessing,
  submitButtonText,
  submitOrderDisabled,
  submitDisabledReason,
  totalAmountInUsdCents,
  nfscMaxUsableInUsdCents,
  initialIncludeNfsc = true,
  initialIncludeStripe = true,
  initialNfscWalletAddress,
  initialNfscChainId,
  onSelectionChange,
  onSubmit,
}: MultiPaymentCardProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const [includeNfsc, setIncludeNfsc] = useState<boolean>(initialIncludeNfsc);
  const [includeStripe, setIncludeStripe] =
    useState<boolean>(initialIncludeStripe);
  const [stripeConfirmationTokenId, setStripeConfirmationTokenId] = useState<
    string | null
  >(null);
  const [showAddPaymentMethodDialog, setShowAddPaymentMethodDialog] =
    useState(false);

  const { nfscAmountInUsdCents, stripeAmountInUsdCents } = useMemo(() => {
    // Base suggested usage
    let nfscUse = includeNfsc ? nfscMaxUsableInUsdCents : 0;
    let stripeAmt = includeStripe
      ? Math.max(totalAmountInUsdCents - nfscUse, 0)
      : 0;

    // Enforce Stripe minimum (100 cents) by reducing balance usage when both are selected
    if (includeStripe && stripeAmt > 0 && stripeAmt < 100) {
      stripeAmt = 100;
      nfscUse = Math.max(totalAmountInUsdCents - 100, 0);
      nfscUse = Math.min(nfscUse, nfscMaxUsableInUsdCents);
    }

    return {
      nfscAmountInUsdCents: nfscUse,
      stripeAmountInUsdCents: stripeAmt,
    };
  }, [
    includeNfsc,
    includeStripe,
    nfscMaxUsableInUsdCents,
    totalAmountInUsdCents,
  ]);

  useEffect(() => {
    const paymentsDraft: CreateOrderV2Input['payments'] = [];
    if (
      includeNfsc &&
      nfscAmountInUsdCents > 0 &&
      initialNfscWalletAddress &&
      initialNfscChainId
    ) {
      const paymentProvider =
        initialNfscChainId === CHAINS.base.id
          ? paymentProviderSchema.enum.NFSC_BASE
          : initialNfscChainId === CHAINS.mainnet.id
            ? paymentProviderSchema.enum.NFSC_ETHEREUM
            : paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA;
      paymentsDraft.push({
        amountInUsdCents: nfscAmountInUsdCents,
        paymentProviderDetails: {
          paymentProvider,
          nfscPaymentDetails: {
            walletAddress: initialNfscWalletAddress,
            chainId: initialNfscChainId,
          },
        },
      });
    }
    if (includeStripe && stripeAmountInUsdCents > 0) {
      paymentsDraft.push({
        amountInUsdCents: stripeAmountInUsdCents,
        paymentProviderDetails: {
          paymentProvider: paymentProviderSchema.enum.STRIPE,
          stripePaymentDetails: { paymentMethodId: undefined },
        },
        paymentMetadata: stripeConfirmationTokenId
          ? { confirmationTokenId: stripeConfirmationTokenId }
          : undefined,
      });
    }

    const totalsEqual =
      paymentsDraft.reduce((acc, p) => acc + p.amountInUsdCents, 0) ===
      totalAmountInUsdCents;

    const stripeOk =
      !includeStripe ||
      stripeAmountInUsdCents === 0 ||
      !!stripeConfirmationTokenId;
    const nfscOk =
      !includeNfsc ||
      nfscAmountInUsdCents === 0 ||
      (!!initialNfscWalletAddress && !!initialNfscChainId);
    const atLeastOne = paymentsDraft.length > 0;

    onSelectionChange?.({
      includeNfsc,
      includeStripe,
      stripeConfirmationTokenId,
      nfscAmountInUsdCents,
      stripeAmountInUsdCents,
      payments: paymentsDraft,
      isValid: totalsEqual && stripeOk && nfscOk && atLeastOne,
    });
  }, [
    includeNfsc,
    includeStripe,
    stripeConfirmationTokenId,
    nfscAmountInUsdCents,
    stripeAmountInUsdCents,
    totalAmountInUsdCents,
    initialNfscWalletAddress,
    initialNfscChainId,
    onSelectionChange,
  ]);

  const availableAmountInUsdCents = useMemo(() => {
    return (
      (includeNfsc ? nfscAmountInUsdCents : 0) +
      (includeStripe && stripeConfirmationTokenId ? stripeAmountInUsdCents : 0)
    );
  }, [
    includeNfsc,
    nfscAmountInUsdCents,
    includeStripe,
    stripeAmountInUsdCents,
    stripeConfirmationTokenId,
  ]);

  return (
    <CartCard
      title={t('multiPaymentCard.title')}
      footer={
        <DisabledReasonTooltip
          reason={
            isDisabled || submitOrderDisabled || isProcessing
              ? submitDisabledReason
              : undefined
          }
        >
          <NamefiButton
            variant="default"
            className="w-full"
            disabled={isDisabled || submitOrderDisabled || isProcessing}
            onClick={onSubmit}
            size="lg"
          >
            {isProcessing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </NamefiButton>
        </DisabledReasonTooltip>
      }
    >
      <div className="space-y-3">
        {includeNfsc ? (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#18181B]">
            <div className="text-sm">
              <div className="font-medium flex items-center gap-2">
                {t('multiPaymentCard.nfscBalance')}{' '}
                {!!initialNfscChainId && (
                  <NetworkLogo
                    className="size-4 inline-block"
                    network={initialNfscChainId}
                  />
                )}{' '}
                {!!initialNfscWalletAddress &&
                  getShortAddress(initialNfscWalletAddress)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('multiPaymentCard.usingNfsc', {
                  amount: formatAmountInUSD(nfscAmountInUsdCents),
                })}
              </div>
            </div>
            {/* <Button variant="ghost" onClick={() => setIncludeNfsc(false)}>
              Remove
            </Button> */}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIncludeNfsc(true)}
          >
            {t('multiPaymentCard.addNfscBalance')}
          </Button>
        )}

        {includeStripe ? (
          <div className="p-3 rounded-md bg-[#18181B]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {t('multiPaymentCard.creditCard')}
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setIncludeStripe(false);
                  setStripeConfirmationTokenId(null);
                }}
              >
                {tCommon('actions.remove')}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('multiPaymentCard.usingCreditCard', {
                amount: formatAmountInUSD(stripeAmountInUsdCents),
              })}
            </div>
            <div className="mt-2">
              <AddPaymentMethodDialog
                amountInUsdCents={stripeAmountInUsdCents}
                onAddPaymentMethodSuccess={(token) => {
                  setStripeConfirmationTokenId(token.id);
                  setShowAddPaymentMethodDialog(false);
                }}
                onAddPaymentMethodError={() =>
                  setStripeConfirmationTokenId(null)
                }
                onOpenChange={(open) => setShowAddPaymentMethodDialog(open)}
                showAddPaymentMethodDialog={showAddPaymentMethodDialog}
                disabled={isDisabled}
                dialogTrigger={
                  <Button variant="outline" className="w-full">
                    {stripeConfirmationTokenId
                      ? t('multiPaymentCard.changeCard')
                      : t('multiPaymentCard.addOrSelectCard')}
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIncludeStripe(true)}
          >
            {t('multiPaymentCard.addCreditCard')}
          </Button>
        )}

        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span>{t('multiPaymentCard.total')}</span>
          <span>
            <span
              className={cn(
                availableAmountInUsdCents === totalAmountInUsdCents &&
                  'text-green-500',
                availableAmountInUsdCents < totalAmountInUsdCents &&
                  'text-yellow-500',
                availableAmountInUsdCents === 0 ? 'text-red-500' : '',
              )}
            >
              {formatAmountInUSD(availableAmountInUsdCents)}
            </span>{' '}
            /{` ${formatAmountInUSD(totalAmountInUsdCents)} USD`}
          </span>
        </div>
      </div>
    </CartCard>
  );
}

function formatAmountInUSD(amount: number) {
  return (amount / 100).toFixed(2);
}
