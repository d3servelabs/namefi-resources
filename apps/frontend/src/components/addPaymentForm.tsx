'use client';

import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Button } from './ui/shadcn/button';

interface AddPaymentMethodFormProps {
  onSuccess?: (confirmationToken: ConfirmationToken) => void;
  onError?: (error: Error) => void;
}

export function AddPaymentMethodForm({
  onSuccess,
  onError,
}: AddPaymentMethodFormProps) {
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

      try {
        // Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit();
        if (submitError) {
          onError?.(new Error(submitError.message));
          return;
        }

        const { confirmationToken, error: confirmationTokenError } =
          await stripe.createConfirmationToken({
            elements,
            params: {
              return_url: `${window.location.origin}/payment/success`,
            },
          });

        if (confirmationTokenError) {
          setError(confirmationTokenError.message ?? 'An error occurred');
          onError?.(new Error(confirmationTokenError.message));
        } else {
          onSuccess?.(confirmationToken);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        onError?.(err as Error);
      } finally {
        setIsProcessing(false);
      }
    },
    [elements, onError, onSuccess, stripe],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Use this Payment Method'
        )}
      </Button>
    </form>
  );
}
