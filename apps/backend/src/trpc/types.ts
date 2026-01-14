import { paymentProviderDetailsSchema } from '@namefi-astra/db/types';
import { z } from 'zod';
import {
  createOrderInputSchema as baseCreateOrderInputSchema,
  paymentMetadataSchema,
} from '@namefi-astra/contracts/order-input';
import type { DomainAvailabilityInfo } from '@namefi-astra/contracts/domain-availability';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';

export const createOrderInputSchema = baseCreateOrderInputSchema.extend({
  // Keep server-side validation aligned with DB constraints.
  paymentProviderDetails: paymentProviderDetailsSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

const nftMetadataSchema2 = z.object({
  nftWalletAddress: checksumWalletAddressSchema,
  nftChainId: z.number().refine(
    (chainId) => {
      // const { config } = await import('#lib/env');
      // const allowedChains = await import('../lib/env').then((env) => env.config.ALLOWED_CHAINS);
      const allowedChains = [1, 11155111, 8453];
      return allowedChains.includes(chainId);
    },
    {
      message: 'Chain ID provided is not allowed',
      path: ['nftChainId'],
    },
  ),
});
// Stage 5: Multi-payment order creation (V2)
export const createOrderV2InputSchema = z.object({
  cartItemIds: z.array(z.string()).min(1, 'At least one cart item is required'),
  payments: z
    .array(
      z.object({
        amountInUsdCents: z
          .number()
          .int()
          .positive('Payment amount must be positive'),
        paymentProviderDetails: paymentProviderDetailsSchema,
        paymentMetadata: paymentMetadataSchema.optional(),
      }),
    )
    .min(1)
    .superRefine((payments, ctx) => {
      for (const [idx, p] of payments.entries()) {
        const provider = (p.paymentProviderDetails as any)?.paymentProvider;
        // Enforce Stripe minimum $1.00
        if (typeof provider === 'string' && provider === 'STRIPE') {
          if (p.amountInUsdCents < 100) {
            ctx.addIssue({
              code: 'too_small',
              origin: 'number',
              minimum: 100,
              type: 'number',
              inclusive: true,
              path: [idx, 'amountInUsdCents'],
              message: 'Stripe charge must be at least 100 cents',
            });
          }
        }
      }
    }),
  nftMetadata: nftMetadataSchema2,
});

export type CreateOrderV2Input = z.infer<typeof createOrderV2InputSchema>;

// Instant buy schema - single domain purchase without cart
const paymentsArraySchema = z
  .array(
    z.object({
      amountInUsdCents: z
        .number()
        .int()
        .nonnegative('Payment amount must be non-negative'),
      paymentProviderDetails: paymentProviderDetailsSchema,
      paymentMetadata: paymentMetadataSchema.optional(),
    }),
  )
  .min(1)
  .superRefine((payments, ctx) => {
    for (const [idx, p] of payments.entries()) {
      const provider = (p.paymentProviderDetails as any)?.paymentProvider;
      // Enforce Stripe minimum $1.00 (only if amount > 0)
      if (typeof provider === 'string' && provider === 'STRIPE') {
        if (p.amountInUsdCents > 0 && p.amountInUsdCents < 100) {
          ctx.addIssue({
            code: 'too_small',
            origin: 'number',
            minimum: 100,
            type: 'number',
            inclusive: true,
            path: [idx, 'amountInUsdCents'],
            message: 'Stripe charge must be at least 100 cents',
          });
        }
      }
    }
  });

export const instantBuyInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  durationInYears: z.number().int().min(1).max(10).default(1),
  payments: paymentsArraySchema,
  nftMetadata: nftMetadataSchema2,
});

export type InstantBuyInput = z.infer<typeof instantBuyInputSchema>;

export {
  isDomainImportable,
  isDomainRegistrable,
  isDomainUnsupported,
  getDomainPricingForOperation,
} from '@namefi-astra/contracts/domain-availability';

export type { DomainAvailabilityInfo };

export {
  addressSchema,
  privyCustomMetadataSchema,
  privyStorageSchema,
  privyCustomMetadataToPrivyStorage,
  privyStorageToPrivyCustomMetadata,
} from '@namefi-astra/contracts/privy-custom-metadata';

export type {
  Address,
  PrivyCustomMetadata,
  PrivyStorage,
} from '@namefi-astra/contracts/privy-custom-metadata';
