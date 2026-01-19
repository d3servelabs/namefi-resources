import { z } from 'zod';
import { paymentProviderDetailsSchema } from './payment-provider';

export const paymentMetadataSchema = z
  .object({
    confirmationTokenId: z.string().optional(),
  })
  .optional();

export const nftMetadataSchema = z.object({
  nftWalletAddress: z.string(),
  nftChainId: z.number(),
});

export const createOrderInputSchema = z.object({
  cartItemIds: z.array(z.string()),
  paymentProviderDetails: paymentProviderDetailsSchema,
  paymentMetadata: paymentMetadataSchema,
  nftMetadata: nftMetadataSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
