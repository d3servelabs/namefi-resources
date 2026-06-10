import type { OrderItemDomainSetupOptions } from '@namefi-astra/common/contract/entity-schemas';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { supportsDnssec } from '@namefi-astra/registrars/data/supports-dnssec';
import type { UnifiedCartItem } from '@/hooks/use-cart';
import type { FeatureFlagDefinition } from '@/types/feature-flags';

/**
 * Admin feature flag toggling how the per-item domain setup options are
 * presented in the cart:
 * - off (default): the chips are always visible in a row under the price.
 * - on: the chips are collapsed behind a settings toggle next to the trash
 *   button; a summary of enabled flags shows while collapsed, and the duration
 *   stepper moves to the right (next to the price).
 */
export const CART_SETUP_OPTIONS_COLLAPSIBLE_FLAG: FeatureFlagDefinition[] = [
  {
    key: 'cart_setup_options_collapsible',
    label: 'Cart: collapsible domain setup options',
    description:
      'Hide the per-item domain setup chips behind a settings toggle (with an enabled-flags summary when collapsed) and move the duration stepper next to the price.',
    scope: 'page',
    pageKey: 'cart',
    defaultValue: false,
  },
];

/**
 * Display defaults for the per-item domain setup chips. These mirror the
 * built-in defaults applied at order processing (`fillDefaultDomainConfig`):
 * autoEns/autoPark/autoRenew = true, dnssec = false. The cart is authoritative
 * — once the user touches a chip the full option set is persisted to the
 * item's `metadata.domainSetupOptions`.
 */
export const DEFAULT_DOMAIN_SETUP_OPTIONS = {
  autoRenew: true,
  autoPark: true,
  autoEns: true,
  dnssec: false,
  keepExistingNameservers: false,
} as const;

export type ResolvedDomainSetupOptions = {
  autoRenew: boolean;
  autoPark: boolean;
  autoEns: boolean;
  dnssec: boolean;
  keepExistingNameservers: boolean;
};

/** Human labels for each setup flag, shared by the chips and the summary. */
export const SETUP_OPTION_LABELS: Record<
  keyof ResolvedDomainSetupOptions,
  string
> = {
  autoRenew: 'AutoRenew',
  autoPark: 'AutoPark',
  autoEns: 'AutoENS',
  dnssec: 'DNSSEC',
  keepExistingNameservers: 'Keep NS',
};

/**
 * Resolves the effective setup options for a cart item: stored values merged
 * over the defaults, with AutoENS/DNSSEC forced off when the TLD doesn't
 * support DNSSEC and Keep NS only meaningful for IMPORT items.
 */
export function computeCurrentSetupOptions(
  item: UnifiedCartItem,
  dnssecSupported: boolean,
): ResolvedDomainSetupOptions {
  const isImport = item.type === itemTypeSchema.enum.IMPORT;
  const stored = item.metadata?.domainSetupOptions ?? {};
  return {
    autoRenew: stored.autoRenew ?? DEFAULT_DOMAIN_SETUP_OPTIONS.autoRenew,
    autoPark: stored.autoPark ?? DEFAULT_DOMAIN_SETUP_OPTIONS.autoPark,
    // Auto ENS requires DNSSEC, so it can only be on when the TLD supports it.
    autoEns: dnssecSupported
      ? (stored.autoEns ?? DEFAULT_DOMAIN_SETUP_OPTIONS.autoEns)
      : false,
    // DNSSEC can only be on when the TLD supports it.
    dnssec: dnssecSupported
      ? (stored.dnssec ?? DEFAULT_DOMAIN_SETUP_OPTIONS.dnssec)
      : false,
    keepExistingNameservers: isImport
      ? (stored.keepExistingNameservers ??
        DEFAULT_DOMAIN_SETUP_OPTIONS.keepExistingNameservers)
      : false,
  };
}

/**
 * Persists the full option set, mirroring the chip behavior: when keeping
 * existing nameservers (IMPORT only) the middle three flags don't apply and are
 * omitted; otherwise the complete object is written.
 */
export function buildPersistedSetupOptions(
  next: ResolvedDomainSetupOptions,
  {
    isImport,
    dnssecSupported,
  }: { isImport: boolean; dnssecSupported: boolean },
): OrderItemDomainSetupOptions {
  if (isImport && next.keepExistingNameservers) {
    return { autoRenew: next.autoRenew, keepExistingNameservers: true };
  }
  return {
    autoRenew: next.autoRenew,
    autoPark: next.autoPark,
    autoEns: dnssecSupported ? next.autoEns : false,
    dnssec: dnssecSupported ? next.dnssec : false,
    ...(isImport ? { keepExistingNameservers: false } : {}),
  };
}

/**
 * Labels of the currently-enabled setup flags, for the collapsed summary. When
 * keeping existing nameservers, only AutoRenew + Keep NS apply.
 */
export function getEnabledSetupOptionLabels(item: UnifiedCartItem): string[] {
  const dnssecSupported = supportsDnssec(item.normalizedDomainName);
  const current = computeCurrentSetupOptions(item, dnssecSupported);
  const labels: string[] = [];
  if (current.autoRenew) {
    labels.push(SETUP_OPTION_LABELS.autoRenew);
  }
  if (current.keepExistingNameservers) {
    labels.push(SETUP_OPTION_LABELS.keepExistingNameservers);
    return labels;
  }
  if (current.autoPark) {
    labels.push(SETUP_OPTION_LABELS.autoPark);
  }
  if (current.autoEns) {
    labels.push(SETUP_OPTION_LABELS.autoEns);
  }
  if (current.dnssec) {
    labels.push(SETUP_OPTION_LABELS.dnssec);
  }
  return labels;
}
