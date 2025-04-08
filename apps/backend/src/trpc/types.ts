import {
  orderInsertSchema,
  paymentProviderDetailsSchema,
} from '@namefi-astra/db/types';

import { z } from 'zod';
import { createStripePaymentIntentSchema } from '../services/stripePayments/types';

const paymentMetadataSchema = z
  .object({
    ...createStripePaymentIntentSchema.pick({
      confirmationTokenId: true,
    }).shape,
  })
  .optional();

const nftMetadataSchema = orderInsertSchema.pick({
  nftWalletAddress: true,
  nftChainId: true,
});

export const createOrderInputSchema = z.object({
  cartId: z.string(),
  paymentProviderDetails: paymentProviderDetailsSchema,
  paymentMetadata: paymentMetadataSchema,
  nftMetadata: nftMetadataSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
