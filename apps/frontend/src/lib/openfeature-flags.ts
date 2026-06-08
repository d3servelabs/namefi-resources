'use client';

import { useBooleanFlagValue } from '@openfeature/react-sdk';

export type BooleanOpenFeatureFlag = {
  key: string;
  defaultValue: boolean;
};

export const SHOW_BALANCE_IN_USER_DROPDOWN_FLAG = {
  key: 'show_balance_in_user_dropdown',
  defaultValue: true,
} satisfies BooleanOpenFeatureFlag;

export const FORCE_HEADER_MISSING_EMAIL_WARNING_FLAG = {
  key: 'force_header_missing_email_warning',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export const INSTANT_BUY_FLAG = {
  key: 'instant_buy',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export const MARKETPLACE_LISTINGS_FLAG = {
  key: 'marketplace-listings',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export const CANCEL_DNS_WORKFLOW_FLAG = {
  key: 'cancel_dns_workflow',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export const CART_ITEM_DOMAIN_SETUP_OPTIONS_FLAG = {
  key: 'cart-item-domain-setup-options',
  defaultValue: false,
} satisfies BooleanOpenFeatureFlag;

export function useBooleanOpenFeatureFlag(
  flag: BooleanOpenFeatureFlag,
): boolean {
  return useBooleanFlagValue(flag.key, flag.defaultValue);
}
