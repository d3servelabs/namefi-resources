/**
 * Single source of truth for the Profile page's tabs. Each value is the `tab`
 * query-param that deep-links to that section, e.g. `/profile?tab=security`.
 *
 * Kept in a data-only module (no `'use client'`, no React) so it can be shared
 * by `profile.tsx` (which renders the tabs) and the header OmniSearch
 * destination catalog (which deep-links to them) without pulling the profile
 * client graph into the search bundle.
 */
export enum ProfileTab {
  WALLETS = 'wallets',
  ACCOUNTS = 'accounts',
  CONTACT_DETAILS = 'contact-details',
  SECURITY = 'security',
}

/** The tab shown when no (or an unknown) `?tab=` value is present. */
export const DEFAULT_PROFILE_TAB = ProfileTab.ACCOUNTS;
