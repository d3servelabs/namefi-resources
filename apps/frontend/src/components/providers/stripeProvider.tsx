'use client';

import { config } from '@/lib/env';
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
  const stripeElementOptions: StripeElementsOptions | null = useMemo(() => {
    if (clientSecret) {
      return { clientSecret } as StripeElementsOptionsClientSecret;
    }

    if (customerSessionClientSecret) {
      return {
        mode: 'payment',
        currency: 'usd',
        amount: amount,
        capture_method: 'manual',
        appearance: {
          theme: 'stripe',
        },
        customerSessionClientSecret,
      };
    }

    return null;
  }, [amount, clientSecret, customerSessionClientSecret]);

  return (
    stripeElementOptions && (
      <Elements stripe={stripePromise} options={stripeElementOptions}>
        {children}
      </Elements>
    )
  );
}
