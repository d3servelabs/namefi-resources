import {
  orderInsertSchema,
  paymentProviderDetailsSchema,
  itemTypeSchema,
} from '@namefi-astra/db/types';

import { z } from 'zod';
import { createStripePaymentIntentSchema } from '../services/stripePayments/types';
import type { DomainAvailabilityInfo } from '../lib/namefi-registry';

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
  cartItemIds: z.array(z.string()),
  paymentProviderDetails: paymentProviderDetailsSchema,
  paymentMetadata: paymentMetadataSchema,
  nftMetadata: nftMetadataSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Re-export the DomainAvailabilityInfo type for convenience
export type { DomainAvailabilityInfo };

// TODO: move these to a better location
/**
 * Checks if a domain is importable (can be transferred/imported)
 * A domain is importable if it's unavailable
 * @param domain - Domain availability information
 * @returns true if the domain can be imported
 */
export function isDomainImportable(domain: DomainAvailabilityInfo): boolean {
  return domain.importable;
}

// TODO: move these to a better location
/**
 * Checks if a domain is registrable (available for new registration)
 * A domain is registrable if it's available
 * @param domain - Domain availability information
 * @returns true if the domain can be registered
 */
export function isDomainRegistrable(domain: DomainAvailabilityInfo): boolean {
  return domain.availability === true;
}

// TODO: move these to a better location
/**
 * Checks if a domain is not supported (unavailable and not importable)
 * A domain is not supported if it's unavailable and not importable
 * @param domain - Domain availability information
 * @returns true if the domain is not supported
 */
export function isDomainUnsupported(domain: DomainAvailabilityInfo): boolean {
  return domain.importable === false && domain.availability === false;
}

// TODO: move these to a better location
/**
 * Gets the appropriate pricing details for a domain operation
 * @param domain - Domain availability information
 * @param operationType - Either itemTypeSchema.Values.REGISTER or itemTypeSchema.Values.IMPORT
 * @returns The pricing details for the specified operation
 */
export function getDomainPricingForOperation(
  domain: DomainAvailabilityInfo,
  operationType:
    | typeof itemTypeSchema.Values.REGISTER
    | typeof itemTypeSchema.Values.IMPORT
    | typeof itemTypeSchema.Values.RENEW,
) {
  if (!domain.pricingDetails) {
    return undefined;
  }

  switch (operationType) {
    case itemTypeSchema.Values.IMPORT:
      return domain.pricingDetails.importPrice;
    case itemTypeSchema.Values.RENEW:
      return domain.pricingDetails.renewalPrice;
    default:
      return domain.pricingDetails.registrationPrice;
  }
}

// Note: keeping address subfields optional as suggested by Victor
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(2).max(2).optional(), // ISO 3166-1 alpha-2 code
});

export type Address = z.infer<typeof addressSchema>;

// Schema for the actual data structure we want to work with
export const privyCustomMetadataSchema = z.object({
  fullName: z.string().optional(),
  address: addressSchema.optional(),
});

export type PrivyCustomMetadata = z.infer<typeof privyCustomMetadataSchema>;

// Storage schema - represents the primitive format stored in Privy
export const privyStorageSchema = z
  .object({
    data: z.string().optional(),
  })
  .optional();

export type PrivyStorage = z.infer<typeof privyStorageSchema>;

export const privyCustomMetadataToPrivyStorage =
  privyCustomMetadataSchema.transform((data) => {
    return {
      data: JSON.stringify(data),
    };
  });

export const privyStorageToPrivyCustomMetadata = privyStorageSchema.transform(
  (data) => {
    return privyCustomMetadataSchema.parse(JSON.parse(data?.data ?? '{}'));
  },
);
