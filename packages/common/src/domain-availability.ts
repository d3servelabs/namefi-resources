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

/**
 * A TLD-specific registration requirement surfaced in the cart before
 * checkout. Sourced from a hardcoded backend list (see
 * `getTldRegistrationRequirement` in the backend) and attached to each
 * {@link DomainAvailabilityInfo}.
 *
 * `confirmation`:
 * - `'explicit'` — the registry mandates a conspicuous pre-purchase notice
 *   (e.g. Google secure namespaces like .app/.dev that require HTTPS). The
 *   cart shows a checkbox and blocks checkout until the user acknowledges it.
 * - `'implicit'` — informational disclosure only; showing the banner is
 *   sufficient and checkout is never blocked.
 */
export type TldRegistrationRequirement = {
  /** TLD this applies to, without the leading dot (e.g. "app", "ing"). */
  tld: string;
  /** Short banner headline, front-loaded with the key fact. */
  title: string;
  /** One-line summary shown in the banner. */
  summary: string;
  /** Bullet-point outline of the requirements, shown in the modal. */
  outline: string[];
  /** External policy/example links shown in the modal. */
  links: { label: string; url: string }[];
  confirmation: 'explicit' | 'implicit';
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
  /**
   * TLD-specific registration requirement (e.g. Google's HTTPS notice for
   * .app/.dev). Present only for TLDs in the hardcoded requirements list;
   * `undefined` otherwise.
   */
  registrationRequirement?: TldRegistrationRequirement;
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
