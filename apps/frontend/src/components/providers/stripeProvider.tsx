'use client';

import { config } from '@/lib/env';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { PropsWithChildren } from 'react';

const stripePromise = loadStripe(config.STRIPE_PUBLISHABLE_KEY);

export type StripeProviderProps = PropsWithChildren<{
  amount: number;
  customerSessionClientSecret?: string;
}>;

export function StripeProvider({
  children,
  amount,
  customerSessionClientSecret,
}: StripeProviderProps) {
  return (
    customerSessionClientSecret && (
      <Elements
        stripe={stripePromise}
        options={{
          mode: 'payment',
          currency: 'usd',
          amount: amount,
          capture_method: 'manual',
          appearance: {
            theme: 'stripe',
          },
          customerSessionClientSecret,
        }}
      >
        {children}
      </Elements>
    )
  );
}
