'use client';

import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { StripeProvider } from '@/components/providers/stripe';
import { AddPaymentMethodForm } from '@/components/payment-method/add-payment-method-form';
import { useOrderProgress } from '@/hooks/use-order-progress';
import { useTRPC } from '@/lib/trpc';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  /** Wallet that will receive the NFSC. */
  recipientWalletAddress: string | null;
  /** Currently selected network. */
  chainId: number | undefined;
  /** Close the parent dialog. */
  onClose: () => void;
};

const DISPLAY_DECIMALS = 2;
// Stripe minimum charge is $1.00; at 1 USD = 1 NFSC that is 1 NFSC.
const MIN_AMOUNT_IN_USD_CENTS = 100;

// Steps from `ProcessOrderWorkflowPublicState` that are domain-flavored
// bookkeeping; hidden from the card top-up progress UI.
const HIDDEN_NFSC_PROGRESS_STEP_IDS = new Set<string>([
  'post-processing',
  'final-status',
  'notification',
]);

type Phase = 'enter-amount' | 'enter-card' | 'processing';

export function NfscCardTopUpTab(props: Props) {
  const { recipientWalletAddress, chainId, onClose } = props;
  const trpc = useTRPC();

  const [phase, setPhase] = useState<Phase>('enter-amount');
  const [amountUsd, setAmountUsd] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | undefined>(undefined);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [hasNotified, setHasNotified] = useState(false);

  // 1 USD = 1 NFSC.
  const amountInUsdCents = useMemo(() => {
    const parsed = Number.parseFloat(amountUsd);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountUsd]);
  const isAmountValid = amountInUsdCents >= MIN_AMOUNT_IN_USD_CENTS;

  const { mutate: createCustomerSession } = useMutation(
    trpc.payments.createCustomerSession.mutationOptions({
      onSuccess: (data) => {
        setCustomerSessionClientSecret(data.customerSessionClientSecret);
      },
      onError: () => {
        setCustomerSessionClientSecret(undefined);
        setErrorMessage('Could not initialize payment. Please try again.');
      },
    }),
  );

  const buyNfsc = useMutation(
    trpc.orders.buyNfsc.mutationOptions({
      onSuccess: (order) => {
        setOrderId(order.id);
        setPhase('processing');
      },
      onError: (error) => {
        setErrorMessage(error.message || 'Failed to start the top-up');
      },
    }),
  );

  const { steps, hasCompleted, state } = useOrderProgress(orderId, {
    enabled: phase === 'processing' && Boolean(orderId),
  });

  // Trim the progress list to what's meaningful for a card top-up: drop the
  // domain-flavored bookkeeping steps, and surface the refund step only when
  // a refund is actually being processed.
  const refundIsNeeded = (state?.refund.amountInUsdCents ?? 0) > 0;
  const visibleSteps = useMemo(
    () =>
      steps.filter((step) => {
        if (HIDDEN_NFSC_PROGRESS_STEP_IDS.has(step.id)) return false;
        if (step.id === 'refund' && !refundIsNeeded) return false;
        return true;
      }),
    [steps, refundIsNeeded],
  );

  useEffect(() => {
    if (phase !== 'processing' || !hasCompleted || !state || hasNotified) {
      return;
    }
    setHasNotified(true);
    if (state.status === 'SUCCEEDED') {
      toast.success('NFSC top-up complete', {
        description: `Added ${(amountInUsdCents / 100).toFixed(DISPLAY_DECIMALS)} NFSC to your wallet`,
      });
      onClose();
    } else {
      toast.error('NFSC top-up did not complete', {
        description:
          state.error ?? 'Check your orders for details, or contact support.',
      });
    }
  }, [phase, hasCompleted, state, hasNotified, amountInUsdCents, onClose]);

  const handleAmountChange = useCallback((value: string) => {
    // Only allow valid decimal numbers.
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountUsd(value);
      setErrorMessage('');
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!isAmountValid) {
      setErrorMessage('Enter an amount of at least $1.00');
      return;
    }
    if (!chainId) {
      setErrorMessage('Select a network first');
      return;
    }
    setErrorMessage('');
    createCustomerSession();
    setPhase('enter-card');
  }, [isAmountValid, chainId, createCustomerSession]);

  const handleConfirmationToken = useCallback(
    (confirmationToken: ConfirmationToken) => {
      if (!chainId) {
        setErrorMessage('Select a network first');
        return;
      }
      if (!recipientWalletAddress) {
        setErrorMessage('No recipient wallet available');
        return;
      }
      setErrorMessage('');
      buyNfsc.mutate({
        amountInUsdCents,
        recipient: {
          recipientWalletAddress,
          nfscChainId: chainId,
        },
        payments: [
          {
            amountInUsdCents,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: {},
            },
            paymentMetadata: { confirmationTokenId: confirmationToken.id },
          },
        ],
      });
    },
    [amountInUsdCents, buyNfsc, chainId, recipientWalletAddress],
  );

  if (!recipientWalletAddress) {
    return (
      <div className="px-6 pb-6 pt-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect or select a wallet to top up its NFSC balance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-6">
      {phase === 'enter-amount' && (
        <div className="mx-6 mb-1">
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-gray-400 mb-2">You pay with card</p>
            <div className="flex justify-between items-center">
              <Input
                type="text"
                inputMode="decimal"
                placeholder={'0'}
                value={amountUsd}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="shadow-none pl-0 bg-transparent dark:bg-transparent border-0 text-secondary-foreground text-xl dark:text-xl focus-visible:ring-0 w-1/2"
              />
              <div className="flex items-center gap-2 bg-zinc-700 p-2 px-4 rounded-lg">
                <span className="font-medium">USD</span>
              </div>
            </div>
          </div>

          <div className="relative my-1 flex justify-center">
            <div className="size-[40px] bg-zinc-950 rounded-full border-2 border-zinc-800 p-2 flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-gray-400 mb-2">You receive</p>
            <div className="flex justify-between items-center">
              <span className="text-secondary-foreground text-xl">
                {amountInUsdCents > 0
                  ? (amountInUsdCents / 100).toFixed(DISPLAY_DECIMALS)
                  : '0'}
              </span>
              <div className="flex items-center bg-zinc-700 gap-2 p-2 px-4 rounded-md">
                <Image src="/nfsc.svg" alt="NFSC" width={24} height={24} />
                <span className="font-medium">NFSC</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">Rate: 1 USD = 1 NFSC</p>
          </div>
        </div>
      )}

      {phase === 'enter-card' && (
        <div className="mx-6 mb-1 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setPhase('enter-amount');
            }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Change amount
          </button>
          <div className="bg-zinc-900 rounded-lg p-4 flex justify-between items-center">
            <span className="text-gray-400">You pay</span>
            <span className="font-medium">
              ${(amountInUsdCents / 100).toFixed(DISPLAY_DECIMALS)} for{' '}
              {(amountInUsdCents / 100).toFixed(DISPLAY_DECIMALS)} NFSC
            </span>
          </div>
          {buyNfsc.isPending ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting your top-up...
            </div>
          ) : (
            <StripeProvider
              amount={amountInUsdCents}
              customerSessionClientSecret={customerSessionClientSecret}
            >
              <AddPaymentMethodForm
                onSuccess={handleConfirmationToken}
                onError={(error) => setErrorMessage(error.message)}
              />
            </StripeProvider>
          )}
        </div>
      )}

      {phase === 'processing' && (
        <div className="mx-6 mb-1 flex flex-col gap-2">
          {visibleSteps.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing your top-up...
            </div>
          ) : (
            <ul className="flex flex-col gap-2 py-2">
              {visibleSteps.map((step) => (
                <li key={step.id} className="flex items-center gap-2">
                  {step.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : step.status === 'FAILED' ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : step.status === 'IN_PROGRESS' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-300 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-zinc-700 shrink-0" />
                  )}
                  <span
                    className={
                      step.status === 'FAILED'
                        ? 'text-red-400 text-sm'
                        : step.status === 'COMPLETED'
                          ? 'text-gray-300 text-sm'
                          : 'text-gray-400 text-sm'
                    }
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="px-6 pt-2">
          <Alert
            variant="destructive"
            className="bg-red-900/50 border-red-800 text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="break-words overflow-auto max-h-[200px] text-ellipsis max-w-full">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {phase === 'enter-amount' && (
        <div className="px-6 pt-2">
          <Button
            className="w-full mt-2 items-center bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground font-medium py-6 rounded-full flex justify-center gap-2"
            onClick={handleContinue}
            disabled={!isAmountValid || !chainId}
          >
            {isAmountValid ? 'Continue to payment' : 'Enter an amount'}
          </Button>
        </div>
      )}
    </div>
  );
}
