import { CartCard } from '@/components/cart-card';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { AddPaymentMethodDialog } from '@/components/payment-method/add-payment-method-dialog';
import { PaymentSummary } from '@/components/payment-method/payment-summary';
import { NetworkLogo } from '@/components/network-logo';
import { getShortAddress } from '@/lib/string';
import { formatAmountInUSD } from '@/lib/number';
import type { AppRouterInput } from '@/lib/trpc';
import { CHAINS } from '@namefi-astra/utils/chains';
import {
  Loader2,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserChainBalances } from '@/hooks/use-user-chain-balances';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/shadcn/button';

import type { HybridPaymentCalculation } from './hybrid-payment-utils';
import { calculateHybridPayments } from './hybrid-payment-utils';
import { Switch } from '../ui/shadcn/switch';
import type { ConfirmationToken } from '@stripe/stripe-js';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

export type HybridPaymentCardProps = {
  totalAmountInUsdCents: number;
  userWalletAddresses: `0x${string}`[];
  isDisabled: boolean;
  isProcessing: boolean;
  submitButtonText: string;
  submitOrderDisabled: boolean;
  onSubmit: (payments: CreateOrderV2Input['payments']) => void;
};

export function HybridPaymentCard({
  totalAmountInUsdCents,
  userWalletAddresses,
  isDisabled,
  isProcessing,
  submitButtonText,
  submitOrderDisabled,
  onSubmit,
}: HybridPaymentCardProps) {
  const [shouldUseBalance, setShouldUseBalance] = useState(true);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [stripeConfirmationTokenId, setStripeConfirmationTokenId] = useState<
    string | null
  >(null);
  const [showAddPaymentMethodDialog, setShowAddPaymentMethodDialog] =
    useState(false);
  const [calculation, setCalculation] =
    useState<HybridPaymentCalculation | null>(null);

  // Use the custom hook for chain balances
  const {
    chainBalances,
    totalBalanceInUsdCents,
    canUseBalance,
    isLoadingBalance,
    refetchBalances,
  } = useUserChainBalances({
    enabled: true,
    walletAddresses: userWalletAddresses,
  });

  // Recalculate payments whenever dependencies change
  const recalculatePayments = useCallback(() => {
    if (chainBalances.length === 0 && shouldUseBalance) {
      return;
    }
    if (!shouldUseBalance || totalBalanceInUsdCents === 0) {
      // Only use Stripe
      const stripePayment: CreateOrderV2Input['payments'][0] = {
        amountInUsdCents: totalAmountInUsdCents,
        paymentProviderDetails: {
          paymentProvider: 'STRIPE',
          stripePaymentDetails: { paymentMethodId: undefined },
        },
        paymentMetadata: stripeConfirmationTokenId
          ? {
              confirmationTokenId: stripeConfirmationTokenId,
            }
          : undefined,
      };

      const isValid = !!stripeConfirmationTokenId;

      setCalculation({
        totalBalanceInUsdCents: 0,
        balancePayments: [],
        stripePayment: isValid ? stripePayment : null,
        totalPayments: isValid ? [stripePayment] : [],
        isValid,
        errorMessage: isValid
          ? undefined
          : 'Please add a credit card to continue',
      });
    } else {
      // Use hybrid calculation
      const calc = calculateHybridPayments({
        totalAmountInUsdCents,
        chainBalances,
        stripeConfirmationTokenId,
      });
      setCalculation(calc);
    }
  }, [
    shouldUseBalance,
    totalAmountInUsdCents,
    chainBalances,
    totalBalanceInUsdCents,
    stripeConfirmationTokenId,
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
      title="Payment Method"
      footer={
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-end text-xl gap-4">
            <span>Total</span>
            <span>{formatAmountInUSD(totalAmountInUsdCents, true)} USD</span>
          </div>
          <NamefiButton
            variant="default"
            className="w-full"
            disabled={
              submitOrderDisabled || isDisabled || !calculation?.isValid
            }
            onClick={handleSubmit}
            size="lg"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </NamefiButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Balance Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#18181B] border border-white/10">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-brand-primary" />
            <div>
              <div className="font-medium">Use Available Balance</div>
              {canUseBalance && totalBalanceInUsdCents > 0 ? (
                <div className="text-sm text-muted-foreground">
                  {formatAmountInUSD(totalBalanceInUsdCents, true)} NFSC
                  available
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No $NFSC balance available
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
                >
                  <span className="text-sm">Balance Breakdown</span>
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

        {/* Credit Card Section */}
        {/* Credit Card Section - Only show if balance is disabled or insufficient */}
        {(!shouldUseBalance ||
          totalBalanceInUsdCents < totalAmountInUsdCents) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Credit Card</span>
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
                <Button variant="outline" className="w-full">
                  {stripeConfirmationTokenId
                    ? 'Change Card'
                    : 'Add or Select Card'}
                </Button>
              }
            />

            {!stripeConfirmationTokenId && (
              <p className="text-xs text-muted-foreground">
                {shouldUseBalance &&
                totalBalanceInUsdCents >= totalAmountInUsdCents
                  ? 'Credit card optional - you have sufficient balance'
                  : shouldUseBalance &&
                      totalBalanceInUsdCents > 0 &&
                      totalBalanceInUsdCents < totalAmountInUsdCents
                    ? `Credit card required for ${formatAmountInUSD(calculation?.stripePayment?.amountInUsdCents || 0, true)} USD remaining amount`
                    : 'Credit card required for full amount'}
              </p>
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
                  Payment Covered by Balance
                </span>
              </div>
              {/* <p className="text-xs text-muted-foreground">
                Your $NFSC balance is sufficient to cover this order. No credit
                card needed.
              </p> */}
            </div>
          )}

        {/* Payment Summary */}
        {calculation && (
          <PaymentSummary
            calculation={calculation}
            userWalletAddresses={userWalletAddresses}
            totalAmountInUsdCents={totalAmountInUsdCents}
          />
        )}
      </div>
    </CartCard>
  );
}
