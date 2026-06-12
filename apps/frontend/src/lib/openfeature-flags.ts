'use client';

import { useBooleanFlagValue } from '@openfeature/react-sdk';
import type { FeatureFlagDefinition } from '@/types/feature-flags';

export type BooleanAdminQueryFlag = FeatureFlagDefinition & {
  source: 'admin-query';
  scope: 'global';
  defaultValue: boolean;
};

export type BooleanOpenFeatureFlag = {
  source: 'openfeature';
  key: string;
  label: string;
  description?: string;
  defaultValue: boolean;
};

export type BooleanFeatureFlag = BooleanAdminQueryFlag | BooleanOpenFeatureFlag;

export const SHOW_BALANCE_IN_USER_DROPDOWN_FLAG = {
  source: 'admin-query',
  key: 'show_balance_in_user_dropdown',
  label: 'Show Balance in User Dropdown',
  scope: 'global',
  defaultValue: true,
} satisfies BooleanAdminQueryFlag;

export const FORCE_HEADER_MISSING_EMAIL_WARNING_FLAG = {
  source: 'admin-query',
  key: 'force_header_missing_email_warning',
  label: 'Force Header Missing Email Warning',
  scope: 'global',
  defaultValue: false,
} satisfies BooleanAdminQueryFlag;

export const INSTANT_BUY_FLAG = {
  source: 'admin-query',
  key: 'instant_buy',
  label: 'Instant Buy',
  description: 'Show the instant buy button',
  scope: 'global',
  defaultValue: false,
} satisfies BooleanAdminQueryFlag;

export const MARKETPLACE_LISTINGS_FLAG = {
  source: 'openfeature',
  key: 'marketplace-listings',
  label: 'Marketplace Listings',
  description:
    'Show marketplace listing surfaces for owned domains and outbound runs',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export const CANCEL_DNS_WORKFLOW_FLAG = {
  source: 'admin-query',
  key: 'cancel_dns_workflow',
  label: 'Cancel Workflow',
  description: 'Show cancel button for active DNS/DNSSEC workflows',
  scope: 'global',
  defaultValue: false,
} satisfies BooleanAdminQueryFlag;

export const CART_ITEM_DOMAIN_SETUP_OPTIONS_FLAG = {
  source: 'openfeature',
  key: 'cart-item-domain-setup-options',
  label: 'Cart Item Domain Setup Options',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export const BOOLEAN_FEATURE_FLAGS: readonly BooleanFeatureFlag[] = [
  SHOW_BALANCE_IN_USER_DROPDOWN_FLAG,
  FORCE_HEADER_MISSING_EMAIL_WARNING_FLAG,
  INSTANT_BUY_FLAG,
  MARKETPLACE_LISTINGS_FLAG,
  CANCEL_DNS_WORKFLOW_FLAG,
  CART_ITEM_DOMAIN_SETUP_OPTIONS_FLAG,
] as const;

export const ADMIN_QUERY_BOOLEAN_FEATURE_FLAGS: readonly BooleanAdminQueryFlag[] =
  BOOLEAN_FEATURE_FLAGS.filter(
    (flag): flag is BooleanAdminQueryFlag => flag.source === 'admin-query',
  );

export function useBooleanOpenFeatureFlag(
  flag: BooleanOpenFeatureFlag,
): boolean {
  return useBooleanFlagValue(flag.key, flag.defaultValue);
}
