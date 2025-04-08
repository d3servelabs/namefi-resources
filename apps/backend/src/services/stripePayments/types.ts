import { z } from 'zod';

export const createStripePaymentIntentSchema = z.object({
  totalAmountInUsdCents: z.number(),
  stripeCustomerId: z.string(),
  confirmationTokenId: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

export type CreateStripePaymentIntentInput = z.infer<
  typeof createStripePaymentIntentSchema
>;
