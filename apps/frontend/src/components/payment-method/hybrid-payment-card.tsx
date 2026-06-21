import { CartCard } from '@/components/cart-card';
import { DisabledReasonTooltip } from '@/components/disabled-reason-tooltip';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { AddPaymentMethodDialog } from '@/components/payment-method/add-payment-method-dialog';
import { PaymentSummary } from '@/components/payment-method/payment-summary';
import { NetworkLogo } from '@/components/network-logo';
import { getShortAddress } from '@/lib/string';
import { formatAmountInUSD } from '@/lib/number';
import type { AppRouterInput, AppRouterOutput } from '@/lib/trpc';
import {
  Loader2,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useUserChainBalances } from '@/hooks/use-user-chain-balances';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useBalance } from 'wagmi';

import type {
  HybridPaymentCalculation,
  HybridRemainderPaymentProvider,
} from './hybrid-payment-utils';
import { calculateHybridPayments } from './hybrid-payment-utils';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import type { ConfirmationToken } from '@stripe/stripe-js';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];
type X402PaymentConfig = Extract<
  AppRouterOutput['config']['x402Payment'],
  { enabled: true }
>;

export type HybridPaymentCardProps = {
  totalAmountInUsdCents: number;
  userWalletAddresses: `0x${string}`[];
  parentDomain?: string;
  x402PaymentConfig?: X402PaymentConfig | null;
  x402BuyerWalletAddress?: `0x${string}` | null;
  isDisabled: boolean;
  isProcessing: boolean;
  submitButtonText: string;
  submitOrderDisabled: boolean;
  /** When the submit button is disabled, explains why (shown in a tooltip). */
  submitDisabledReason?: string;
  onSubmit: (payments: CreateOrderV2Input['payments']) => void;
};

function formatUsdcAmount(value: string, symbol: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return `${value} ${symbol}`;
  }

  return `${parsed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${symbol}`;
}

function getX402NetworkLabel(network: string): string {
  if (network === 'eip155:8453') {
    return 'Base';
  }
  if (network === 'eip155:84532') {
    return 'Base Sepolia';
  }
  return network;
}

export function HybridPaymentCard({
  totalAmountInUsdCents,
  userWalletAddresses,
  parentDomain,
  x402PaymentConfig,
  x402BuyerWalletAddress,
  isDisabled,
  isProcessing,
  submitButtonText,
  submitOrderDisabled,
  submitDisabledReason,
  onSubmit,
}: HybridPaymentCardProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const [shouldUseBalance, setShouldUseBalance] = useState(true);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [stripeConfirmationTokenId, setStripeConfirmationTokenId] = useState<
    string | null
  >(null);
  const [showAddPaymentMethodDialog, setShowAddPaymentMethodDialog] =
    useState(false);
  const [remainderPaymentProvider, setRemainderPaymentProvider] =
    useState<HybridRemainderPaymentProvider>(
      x402PaymentConfig ? 'X402' : 'STRIPE',
    );
  const [calculation, setCalculation] =
    useState<HybridPaymentCalculation | null>(null);

  const x402RemainderAmountInUsdCents =
    calculation?.x402Payment?.amountInUsdCents ?? 0;

  const x402RequiredUsdc = useMemo(() => {
    return (x402RemainderAmountInUsdCents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [x402RemainderAmountInUsdCents]);

  useEffect(() => {
    if (!x402PaymentConfig && remainderPaymentProvider === 'X402') {
      setRemainderPaymentProvider('STRIPE');
    }
  }, [x402PaymentConfig, remainderPaymentProvider]);

  // Use the custom hook for chain balances
  const { chainBalances, totalBalanceInUsdCents, canUseBalance } =
    useUserChainBalances({
      enabled: true,
      parentDomain,
      walletAddresses: userWalletAddresses,
    });

  const {
    data: x402UsdcBalance,
    isLoading: isX402UsdcBalanceLoading,
    isError: isX402UsdcBalanceError,
  } = useBalance({
    address: x402BuyerWalletAddress ?? undefined,
    chainId: x402PaymentConfig?.chainId,
    token: x402PaymentConfig?.asset as `0x${string}` | undefined,
    query: {
      enabled: Boolean(
        x402PaymentConfig &&
          x402BuyerWalletAddress &&
          remainderPaymentProvider === 'X402',
      ),
    },
  });

  const x402UsdcBalanceLabel = useMemo(() => {
    if (!x402UsdcBalance) {
      return null;
    }

    return formatUsdcAmount(
      x402UsdcBalance.formatted,
      x402UsdcBalance.symbol || 'USDC',
    );
  }, [x402UsdcBalance]);

  const hasSufficientX402UsdcBalance = useMemo(() => {
    if (!x402UsdcBalance || x402RemainderAmountInUsdCents <= 0) {
      return null;
    }

    const requiredValue = BigInt(x402RemainderAmountInUsdCents) * 10_000n;
    return x402UsdcBalance.value >= requiredValue;
  }, [x402RemainderAmountInUsdCents, x402UsdcBalance]);

  // Recalculate payments whenever dependencies change
  const recalculatePayments = useCallback(() => {
    const x402PaymentDetails =
      x402PaymentConfig && x402BuyerWalletAddress
        ? {
            buyerWalletAddress: x402BuyerWalletAddress,
            receiverWalletAddress: x402PaymentConfig.payTo,
            network: x402PaymentConfig.network,
          }
        : undefined;

    const calc = calculateHybridPayments({
      totalAmountInUsdCents,
      chainBalances: shouldUseBalance ? chainBalances : [],
      stripeConfirmationTokenId,
      remainderPaymentProvider,
      x402PaymentDetails,
    });
    setCalculation(calc);
  }, [
    chainBalances,
    remainderPaymentProvider,
    shouldUseBalance,
    stripeConfirmationTokenId,
    totalAmountInUsdCents,
    x402BuyerWalletAddress,
    x402PaymentConfig,
  ]);

  useEffect(() => {
    recalculatePayments();
  }, [recalculatePayments]);

  const handleSubmit = useCallback(() => {
    if (calculation?.isValid && calculation.totalPayments.length > 0) {
      onSubmit(calculation.totalPayments);
    }
  }, [calculation, onSubmit]);

  const handleAddPaymentMethodSuccess = useCallback(
    (token: ConfirmationToken) => {
      setStripeConfirmationTokenId(token.id);
      setShowAddPaymentMethodDialog(false);
    },
    [],
  );

  const handleAddPaymentMethodError = useCallback(() => {
    setStripeConfirmationTokenId(null);
  }, []);

  return (
    <CartCard
      title={t('hybridPaymentCard.title')}
      footer={
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-end text-xl gap-4">
            <span>{t('hybridPaymentCard.total')}</span>
            <span data-testid="payment.hybrid.total">
              {formatAmountInUSD(totalAmountInUsdCents, true)} USD
            </span>
          </div>
          <DisabledReasonTooltip
            reason={
              submitOrderDisabled || isDisabled || !calculation?.isValid
                ? submitDisabledReason
                : undefined
            }
          >
            <NamefiButton
              variant="default"
              className="w-full"
              disabled={
                submitOrderDisabled || isDisabled || !calculation?.isValid
              }
              onClick={handleSubmit}
              size="lg"
              data-testid="payment.hybrid.submit"
            >
              {isProcessing && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {submitButtonText}
            </NamefiButton>
          </DisabledReasonTooltip>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Balance Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#18181B] border border-white/10">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-brand-primary" />
            <div>
              <div className="font-medium">
                {t('hybridPaymentCard.useAvailableBalance')}
              </div>
              {canUseBalance && totalBalanceInUsdCents > 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t('hybridPaymentCard.nfscAvailable', {
                    amount: formatAmountInUSD(totalBalanceInUsdCents, true),
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t('hybridPaymentCard.noNfscBalance')}
                </div>
              )}
            </div>
          </div>
          <Switch
            className="data-[state=checked]:bg-brand-primary"
            checked={canUseBalance && shouldUseBalance}
            onCheckedChange={
              canUseBalance
                ? () => setShouldUseBalance(!shouldUseBalance)
                : undefined
            }
            disabled={!canUseBalance}
            data-testid="payment.hybrid.use-balance-toggle"
          />
        </div>

        {/* Balance Details */}
        <AnimatePresence>
          {canUseBalance && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                  className="w-full justify-between h-8"
                  data-testid="payment.hybrid.balance-breakdown-toggle"
                >
                  <span className="text-sm">
                    {t('hybridPaymentCard.balanceBreakdown')}
                  </span>
                  {showBalanceDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showBalanceDetails && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {chainBalances.map((balance) => (
                      <div
                        key={`${balance.chainId}-${balance.walletAddress}`}
                        className="flex items-center justify-between p-2 rounded-md bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-2">
                          <NetworkLogo
                            className="size-4"
                            network={balance.chainId}
                          />
                          <span className="text-sm">{balance.chainName}</span>
                          <span className="text-xs text-muted-foreground">
                            {getShortAddress(balance.walletAddress)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatAmountInUSD(balance.balanceInUsdCents, true)}{' '}
                          USD
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remainder Payment Section - Only shown when balance does not fully cover */}
        {(!shouldUseBalance ||
          totalBalanceInUsdCents < totalAmountInUsdCents) && (
          <div className="space-y-3">
            {x402PaymentConfig && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={
                    remainderPaymentProvider === 'X402' ? 'default' : 'outline'
                  }
                  className="w-full"
                  onClick={() => setRemainderPaymentProvider('X402')}
                  data-testid="payment.hybrid.provider-x402"
                >
                  x402 (USDC)
                </Button>
                <Button
                  variant={
                    remainderPaymentProvider === 'STRIPE'
                      ? 'default'
                      : 'outline'
                  }
                  className="w-full"
                  onClick={() => setRemainderPaymentProvider('STRIPE')}
                  data-testid="payment.hybrid.provider-stripe"
                >
                  {t('hybridPaymentCard.creditCard')}
                </Button>
              </div>
            )}

            {remainderPaymentProvider === 'X402' && x402PaymentConfig ? (
              <div className="space-y-2 rounded-lg border border-white/10 bg-[#18181B] p-4">
                <p className="text-sm font-medium">x402 (USDC)</p>
                <p className="text-xs text-muted-foreground">
                  {t('hybridPaymentCard.x402SignAuthorization', {
                    amount: formatAmountInUSD(
                      calculation?.x402Payment?.amountInUsdCents || 0,
                      true,
                    ),
                  })}
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('hybridPaymentCard.network')}</span>
                    <span>
                      {getX402NetworkLabel(x402PaymentConfig.network)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('hybridPaymentCard.required')}</span>
                    <span>{x402RequiredUsdc} USDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('hybridPaymentCard.yourWalletBalance')}</span>
                    <span>
                      {!x402BuyerWalletAddress
                        ? tCommon('actions.connectWallet')
                        : isX402UsdcBalanceLoading
                          ? tCommon('actions.loading')
                          : isX402UsdcBalanceError
                            ? t('hybridPaymentCard.unavailable')
                            : x402UsdcBalanceLabel || '0.00 USDC'}
                    </span>
                  </div>
                  {hasSufficientX402UsdcBalance === false && (
                    <p className="pt-1 text-amber-400">
                      {t('hybridPaymentCard.insufficientUsdcBalance')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">
                    {t('hybridPaymentCard.creditCard')}
                  </span>
                  {calculation?.stripePayment && (
                    <span className="text-sm font-medium text-green-400">
                      {formatAmountInUSD(
                        calculation.stripePayment.amountInUsdCents,
                        true,
                      )}{' '}
                      USD
                    </span>
                  )}
                </div>

                <AddPaymentMethodDialog
                  amountInUsdCents={
                    calculation?.stripePayment?.amountInUsdCents ||
                    totalAmountInUsdCents
                  }
                  onAddPaymentMethodSuccess={handleAddPaymentMethodSuccess}
                  onAddPaymentMethodError={handleAddPaymentMethodError}
                  onOpenChange={setShowAddPaymentMethodDialog}
                  showAddPaymentMethodDialog={showAddPaymentMethodDialog}
                  disabled={isDisabled}
                  dialogTrigger={
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="payment.hybrid.add-card"
                    >
                      {stripeConfirmationTokenId
                        ? t('hybridPaymentCard.changeCard')
                        : t('hybridPaymentCard.addOrSelectCard')}
                    </Button>
                  }
                />

                {!stripeConfirmationTokenId && (
                  <p className="text-xs text-muted-foreground">
                    {shouldUseBalance &&
                    totalBalanceInUsdCents >= totalAmountInUsdCents
                      ? t('hybridPaymentCard.creditCardOptional')
                      : shouldUseBalance &&
                          totalBalanceInUsdCents > 0 &&
                          totalBalanceInUsdCents < totalAmountInUsdCents
                        ? t(
                            'hybridPaymentCard.creditCardRequiredForRemaining',
                            {
                              amount: formatAmountInUSD(
                                calculation?.stripePayment?.amountInUsdCents ||
                                  0,
                                true,
                              ),
                            },
                          )
                        : t('hybridPaymentCard.creditCardRequiredForFull')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Show message when balance is sufficient and toggle is on */}
        {shouldUseBalance &&
          totalBalanceInUsdCents >= totalAmountInUsdCents && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500/80" />
                <span className="font-medium text-green-500/80">
                  {t('hybridPaymentCard.paymentCoveredByBalance')}
                </span>
              </div>
              {/* <p className="text-xs text-muted-foreground">
                Your $NFSC balance is sufficient to cover this order. No credit
                card needed.
              </p> */}
            </div>
          )}

        {/* Payment Summary */}
        {calculation && <PaymentSummary calculation={calculation} />}
      </div>
    </CartCard>
  );
}
