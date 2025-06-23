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
  return !domain.availability;
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
 * Gets the appropriate pricing details for a domain operation
 * @param domain - Domain availability information
 * @param operationType - Either itemTypeSchema.Values.REGISTER or itemTypeSchema.Values.IMPORT
 * @returns The pricing details for the specified operation
 */
export function getDomainPricingForOperation(
  domain: DomainAvailabilityInfo,
  operationType:
    | typeof itemTypeSchema.Values.REGISTER
    | typeof itemTypeSchema.Values.IMPORT,
) {
  if (!domain.pricingDetails) {
    return undefined;
  }

  return operationType === itemTypeSchema.Values.IMPORT
    ? domain.pricingDetails.importPrice
    : domain.pricingDetails.registrationPrice;
}
