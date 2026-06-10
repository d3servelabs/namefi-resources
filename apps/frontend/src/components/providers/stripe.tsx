'use client';

import { config } from '@/lib/env';
import { normalizeStripeAmountInSubunits } from '@/lib/stripe-amount';
import { useTheme } from 'next-themes';
import { Elements } from '@stripe/react-stripe-js';
import type {
  StripeElementsOptions,
  StripeElementsOptionsClientSecret,
} from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { type PropsWithChildren, useMemo } from 'react';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise() {
  stripePromise ??= loadStripe(config.STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

export type StripeProviderProps = PropsWithChildren<{
  amount: number;
  customerSessionClientSecret?: string;
  clientSecret?: string;
}>;

export function StripeProvider({
  children,
  amount,
  clientSecret,
  customerSessionClientSecret,
}: StripeProviderProps) {
  const { theme } = useTheme();
  const appearance: StripeElementsOptions['appearance'] = useMemo(() => {
    return {
      theme: 'night',
      variables: {
        colorPrimary: theme === '0x.city' ? '#4f46e5' : '#1cd17d',
        colorBackground: '#09090b',
      },
    };
  }, [theme]);

  const stripeElementOptions: StripeElementsOptions | null = useMemo(() => {
    if (clientSecret) {
      return { clientSecret, appearance } as StripeElementsOptionsClientSecret;
    }

    if (customerSessionClientSecret) {
      return {
        mode: 'payment',
        currency: 'usd',
        amount: normalizeStripeAmountInSubunits(amount),
        capture_method: 'automatic',
        appearance,
        customerSessionClientSecret,
      };
    }

    return null;
  }, [amount, appearance, clientSecret, customerSessionClientSecret]);

  if (!stripeElementOptions) return null;

  return (
    <Elements stripe={getStripePromise()} options={stripeElementOptions}>
      {children}
    </Elements>
  );
}
