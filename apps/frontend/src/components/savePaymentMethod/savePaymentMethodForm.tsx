'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  ConfirmSetupData,
  SetupIntent,
  StripeElements,
} from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';

interface SavePaymentMethodFormProps {
  onSuccess?: (setupIntent: SetupIntent) => void;
  onError?: (error: Error) => void;
  returnUrl?: string;
}

export function SavePaymentMethodForm({
  onSuccess,
  onError,
  returnUrl,
}: SavePaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!(stripe && elements)) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      const paymentOptions: {
        elements: StripeElements;
        confirmParams?: Partial<ConfirmSetupData>;
        redirect: 'if_required';
      } = {
        elements,
        redirect: 'if_required',
      };

      if (returnUrl) {
        paymentOptions.confirmParams = {
          return_url: returnUrl,
        };
      }

      try {
        // Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit();
        if (submitError) {
          onError?.(new Error(submitError.message));
          return;
        }

        const { setupIntent, error: setupIntentError } =
          await stripe.confirmSetup(paymentOptions);

        if (setupIntentError) {
          setError(setupIntentError.message ?? 'An error occurred');
          onError?.(new Error(setupIntentError.message));
        } else {
          onSuccess?.(setupIntent);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        onError?.(err as Error);
      } finally {
        setIsProcessing(false);
      }
    },
    [elements, onError, onSuccess, stripe, returnUrl],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={!(stripe && elements) || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Save this Payment Method'
        )}
      </Button>
    </form>
  );
}
