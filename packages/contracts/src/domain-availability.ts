import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { itemTypeSchema } from './shared-schemas';

export type PriceWithCurrency = {
  amount: number;
  currency: 'USD';
};

export type PricingDetails =
  | {
      type: 'PER_YEAR';
      price: PriceWithCurrency;
    }
  | {
      type: 'MULTI_YEAR';
      price: Record<number, PriceWithCurrency>;
    };

export type DomainPricingDetails = {
  registrationPrice: PricingDetails;
  renewalPrice: PricingDetails;
  importPrice: PricingDetails;
};

export type DomainAvailabilityInfo = {
  domain: NamefiNormalizedDomain;
  availability: boolean;
  pricingDetails: DomainPricingDetails | undefined;
  currentOwner: string | undefined;
  registrarKey?: string;
  durationValidationInYears?: {
    min: number;
    max: number;
  };
  importable: boolean;
  supported: boolean;
};

export function isDomainImportable(domain: DomainAvailabilityInfo): boolean {
  return domain.importable;
}

export function isDomainRegistrable(domain: DomainAvailabilityInfo): boolean {
  return domain.availability === true;
}

export function isDomainUnsupported(domain: DomainAvailabilityInfo): boolean {
  return !domain.supported;
}

export function getDomainPricingForOperation(
  domain: DomainAvailabilityInfo,
  operationType:
    | typeof itemTypeSchema.enum.REGISTER
    | typeof itemTypeSchema.enum.IMPORT
    | typeof itemTypeSchema.enum.RENEW,
) {
  if (!domain.pricingDetails) {
    return undefined;
  }

  switch (operationType) {
    case itemTypeSchema.enum.IMPORT:
      return domain.pricingDetails.importPrice;
    case itemTypeSchema.enum.RENEW:
      return domain.pricingDetails.renewalPrice;
    default:
      return domain.pricingDetails.registrationPrice;
  }
}
