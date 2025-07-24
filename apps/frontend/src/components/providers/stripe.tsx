'use client';

import { config } from '@/lib/env';
import { useTheme } from 'next-themes';
import { Elements } from '@stripe/react-stripe-js';
import {
  type StripeElementsOptions,
  type StripeElementsOptionsClientSecret,
  loadStripe,
} from '@stripe/stripe-js';
import { type PropsWithChildren, useMemo } from 'react';

const stripePromise = loadStripe(config.STRIPE_PUBLISHABLE_KEY);

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
        amount: amount,
        capture_method: 'automatic',
        appearance,
        customerSessionClientSecret,
      };
    }

    return null;
  }, [amount, appearance, clientSecret, customerSessionClientSecret]);

  return (
    stripeElementOptions && (
      <Elements stripe={stripePromise} options={stripeElementOptions}>
        {children}
      </Elements>
    )
  );
}
