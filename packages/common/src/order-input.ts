import { z } from 'zod';
import { paymentProviderDetailsSchema } from './payment-provider';
import { paymentMetadataSchema } from './contract/entity-schemas';

export { paymentMetadataSchema };

export const nftMetadataSchema = z.object({
  nftWalletAddress: z.string(),
  nftChainId: z.number(),
});

export const createOrderInputSchema = z.object({
  cartItemIds: z.array(z.string()),
  paymentProviderDetails: paymentProviderDetailsSchema,
  // Preserve the previous request shape: paymentMetadata may be omitted.
  paymentMetadata: paymentMetadataSchema.optional(),
  nftMetadata: nftMetadataSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
