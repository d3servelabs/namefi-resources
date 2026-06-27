import {
  AtSign,
  Coins,
  KeyRound,
  ListTree,
  Mail,
  Settings2,
  ShieldCheck,
  Tag,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { ProfileTab } from '@/components/profile/tabs';
import { ITEMS } from '@/components/sidebars/nav-items';
import type { NavItem } from '@/lib/types/nav-item';

/**
 * Destination catalog for the header OmniSearch "Pages & actions" group.
 *
 * Data-driven and single-sourced: top-level pages come from the shared nav
 * registry (`ITEMS`), account routes derive from the Profile tab enum
 * (`ProfileTab`), and per-domain deep-links mirror the domain-management tabs —
 * so the catalog can't drift from the real app. Titles are resolved by the host
 * component (literal i18n keys), keeping this module free of React/`'use client'`
 * so it stays out of the search bundle's heavy graph.
 */

type IconType = ComponentType<{ className?: string }>;

/** A static jump target — an account page or a quick action not in the sidebar. */
export interface AppDestination {
  id: string;
  /** Leaf under `search.omniSearch.destinations.*`, resolved by the host. */
  titleKey: string;
  href: string;
  icon: IconType;
  requiresAuth?: boolean;
  /** English-only search synonyms (never rendered); see `NavItem.keywords`. */
  keywords?: string[];
  /** Drives the row badge: a navigable page vs. a one-shot action. */
  badge: 'page' | 'action';
}

/** A management action applied per owned domain, deep-linked via `?tab=`. */
export interface DomainAction {
  id: string;
  /** Leaf under `search.omniSearch.domainActions.*`, resolved by the host. */
  titleKey: string;
  /**
   * `?tab=` value on `/domains/{name}`; omitted for the overview/base route.
   * Mirrors the canonical tab values in
   * `components/domain-and-dns-managment/domain-management.tsx`.
   */
  tab?: string;
  icon: IconType;
  keywords?: string[];
}

/**
 * Flatten the sidebar nav registry for OmniSearch: a submenu parent is replaced
 * by its children (the `justAing` parent shares `/studio` with its Brand Studio
 * child, so listing both would duplicate the route).
 */
export function flattenNavDestinations(): NavItem[] {
  return ITEMS.flatMap((item) => item.submenu ?? [item]);
}

/**
 * Account pages and quick actions that have no sidebar entry. Titles are
 * action-phrased (per the ux-copywriting rule) under the `search` namespace;
 * routes mirror `ProfileTab` and the NFSC top-up deep-link.
 */
export const ACCOUNT_DESTINATIONS: AppDestination[] = [
  {
    id: 'profile',
    titleKey: 'profile',
    href: '/profile',
    icon: UserRound,
    requiresAuth: true,
    badge: 'page',
    keywords: ['account', 'settings', 'my profile'],
  },
  {
    id: 'apiKey',
    titleKey: 'apiKey',
    href: `/profile?tab=${ProfileTab.SECURITY}`,
    icon: KeyRound,
    requiresAuth: true,
    badge: 'action',
    keywords: ['api', 'developer', 'token', 'secret', 'apikey', 'x402'],
  },
  {
    id: 'topUp',
    titleKey: 'topUp',
    // Deep-link that auto-opens the NFSC top-up dialog on the payment page.
    href: '/payment-methods?action=add-funds',
    icon: Coins,
    requiresAuth: true,
    badge: 'action',
    keywords: [
      'top up',
      'topup',
      'add funds',
      'credit',
      'credits',
      'deposit',
      'recharge',
      'nfsc',
      'balance',
      'fund',
      'buy credits',
    ],
  },
  {
    id: 'linkedWallets',
    titleKey: 'linkedWallets',
    href: `/profile?tab=${ProfileTab.WALLETS}`,
    icon: Wallet,
    requiresAuth: true,
    badge: 'page',
    keywords: ['wallet', 'address', 'connect', 'privy', 'metamask'],
  },
  {
    id: 'linkedAccounts',
    titleKey: 'linkedAccounts',
    href: `/profile?tab=${ProfileTab.ACCOUNTS}`,
    icon: AtSign,
    requiresAuth: true,
    badge: 'page',
    keywords: ['social', 'google', 'oauth', 'link account'],
  },
  {
    id: 'contactDetails',
    titleKey: 'contactDetails',
    href: `/profile?tab=${ProfileTab.CONTACT_DETAILS}`,
    icon: Mail,
    requiresAuth: true,
    badge: 'page',
    keywords: ['email', 'contact', 'phone', 'details'],
  },
];

/**
 * Per-domain management deep-links generated over a user's owned domains. `tab`
 * values mirror the canonical tabs in `domain-management.tsx`.
 */
export const DOMAIN_ACTIONS: DomainAction[] = [
  {
    id: 'manage',
    titleKey: 'manage',
    icon: Settings2,
    keywords: ['manage', 'overview', 'settings', 'details'],
  },
  {
    id: 'dnsRecords',
    titleKey: 'dnsRecords',
    tab: 'dns-records',
    icon: ListTree,
    keywords: ['dns', 'records', 'a record', 'cname', 'txt', 'mx', 'aaaa'],
  },
  {
    id: 'dnssec',
    titleKey: 'dnssec',
    tab: 'dns-management',
    icon: ShieldCheck,
    keywords: [
      'dnssec',
      'ds record',
      'nameserver',
      'nameservers',
      'secure dns',
    ],
  },
  {
    id: 'sell',
    titleKey: 'sell',
    tab: 'marketplace',
    icon: Tag,
    keywords: ['sell', 'list', 'listing', 'marketplace', 'offer', 'for sale'],
  },
];

/** Max per-domain action rows shown at once, to keep the panel scannable. */
export const MAX_DOMAIN_ACTION_RESULTS = 6;

const WHITESPACE = /\s+/;

/** Lower-case, trim, and split a query into searchable tokens (≥2 chars). */
export function tokenizeQuery(rawQuery: string): string[] {
  return rawQuery
    .trim()
    .toLowerCase()
    .split(WHITESPACE)
    .filter((token) => token.length >= 2);
}

/**
 * Match a query against a localized title plus English synonym keywords.
 *
 * The localized `title` keeps the current substring behavior at any query length
 * (so locale-native queries still work). Keyword matching only engages for
 * queries of ≥2 chars, so a single character can't dredge up every synonym.
 */
export function destinationMatches(
  rawQuery: string,
  title: string,
  keywords?: string[],
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;
  if (title.toLowerCase().includes(q)) return true;
  if (q.length < 2 || !keywords?.length) return false;
  const tokens = tokenizeQuery(q);
  return keywords.some((keyword) => {
    const k = keyword.toLowerCase();
    return (
      k.includes(q) || q.includes(k) || tokens.some((tok) => k.includes(tok))
    );
  });
}
