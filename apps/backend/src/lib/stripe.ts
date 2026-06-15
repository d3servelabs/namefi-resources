import Stripe from 'stripe';
import { lazy } from '@namefi-astra/utils/lazy';
import { secrets } from './env';

/** Lazily-constructed shared Stripe client (one per process). */
export const getStripe = lazy(() => new Stripe(secrets.STRIPE_SECRET_KEY));
