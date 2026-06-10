import type {
  DomainAvailabilityInfo,
  TldRegistrationRequirement,
} from '@namefi-astra/common/domain-availability';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import type { UnifiedCartItem } from '@/hooks/use-cart';
import type { FeatureFlagDefinition } from '@/types/feature-flags';

/**
 * Admin feature flag toggling how per-item TLD registration requirements are
 * presented in the cart:
 * - off (default): a banner inside each cart item (see CartItem).
 * - on: requirements aggregated into the cart footnote, deduped by TLD (see
 *   CartRegistrationFootnote).
 */
export const CART_REQUIREMENTS_VARIANT_FLAG: FeatureFlagDefinition[] = [
  {
    key: 'cart_requirements_in_footnote',
    label: 'Cart: TLD requirements in footnote',
    description:
      'Aggregate per-item TLD registration requirements (deduped by TLD) into the cart footnote instead of showing a banner inside each cart item.',
    scope: 'page',
    pageKey: 'cart',
    defaultValue: false,
  },
];

/**
 * A TLD requirement plus the cart item ids (REGISTER/IMPORT) that share it.
 * `itemIds` lets the footnote persist a single acknowledgement across every
 * item of that TLD.
 */
export type AggregatedRequirement = {
  requirement: TldRegistrationRequirement;
  itemIds: string[];
};

/**
 * Collapses the per-item registration requirements into a TLD-deduped set,
 * split by confirmation type. Only REGISTER/IMPORT items are considered
 * (requirements apply when acquiring a domain, not renewing).
 */
export function aggregateRegistrationRequirements(
  items: UnifiedCartItem[] | undefined,
  domainAvailabilityInfo: DomainAvailabilityInfo[] | undefined,
): { implicit: AggregatedRequirement[]; explicit: AggregatedRequirement[] } {
  const byTld = new Map<string, AggregatedRequirement>();

  for (const item of items ?? []) {
    if (
      item.type !== itemTypeSchema.enum.REGISTER &&
      item.type !== itemTypeSchema.enum.IMPORT
    ) {
      continue;
    }
    const requirement = domainAvailabilityInfo?.find(
      (domain) => domain.domain === item.normalizedDomainName,
    )?.registrationRequirement;
    if (!requirement) {
      continue;
    }
    const existing = byTld.get(requirement.tld);
    if (existing) {
      existing.itemIds.push(item.id);
    } else {
      byTld.set(requirement.tld, { requirement, itemIds: [item.id] });
    }
  }

  const all = [...byTld.values()];
  return {
    implicit: all.filter((a) => a.requirement.confirmation === 'implicit'),
    explicit: all.filter((a) => a.requirement.confirmation === 'explicit'),
  };
}
