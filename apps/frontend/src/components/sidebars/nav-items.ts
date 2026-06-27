import {
  ClipboardList,
  Compass,
  CreditCard,
  Gift,
  Globe,
  Heart,
  Palette,
  PenToolIcon,
  Rss,
  Search,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';
import type { NavItem } from '@/lib/types/nav-item';

/**
 * Single source of truth for the app's primary navigation destinations.
 *
 * This is data-only (icons + hrefs + i18n key hints, no React components or
 * `'use client'`) so it can be imported by both the sidebar (`./index`) and the
 * lazily-loaded header OmniSearch (`@/components/search/destinations`) without
 * pulling the heavy sidebar client graph into the search bundle.
 *
 * `title` holds an i18n key (under the `nav` namespace's `items.*`) resolved to
 * user-visible copy at render time; it also doubles as a stable identifier (used
 * by the sidebar `manage` visibility check). `keywords` are English-only search
 * synonyms (see `NavItem`) — never rendered — so OmniSearch can resolve e.g.
 * "billing" → My Payment Methods even though the visible label differs.
 */
export const ITEMS: NavItem[] = [
  {
    title: 'items.discover',
    href: '/',
    icon: Compass,
    keywords: ['home', 'search', 'find domains', 'explore'],
  },
  {
    title: 'items.myDomains',
    href: '/domains',
    icon: Globe,
    requiresAuth: true,
    keywords: ['portfolio', 'owned', 'my domains', 'assets'],
  },
  {
    title: 'items.myWishlist',
    href: '/wishlist',
    icon: Heart,
    keywords: ['saved', 'favorites', 'watchlist', 'wishlist'],
  },
  {
    title: 'items.myOrders',
    href: '/orders',
    icon: ClipboardList,
    requiresAuth: true,
    keywords: ['history', 'receipts', 'purchases', 'invoices', 'transactions'],
  },
  {
    title: 'items.myFreeMints',
    href: '/free-mints',
    icon: Gift,
    requiresAuth: true,
    keywords: ['free', 'mint', 'claim', 'gift', 'promo'],
  },
  {
    title: 'items.myPaymentMethods',
    href: '/payment-methods',
    icon: CreditCard,
    requiresAuth: true,
    keywords: ['billing', 'cards', 'wallet', 'payment', 'nfsc', 'balance'],
  },
  {
    title: 'items.manage',
    href: '/manage',
    icon: PenToolIcon,
    requiresAuth: true,
    keywords: ['manage', 'dns', 'settings', 'bulk'],
  },
  {
    title: 'items.justAing',
    href: '/studio',
    icon: Sparkles,
    pattern: /^\/(studio|outbound)/,
    submenu: [
      {
        title: 'items.brandStudio',
        href: '/studio',
        icon: Palette,
        keywords: ['ai', 'brand', 'logo', 'studio', 'generate', 'naming'],
      },
      {
        title: 'items.outbound',
        href: '/outbound',
        icon: Search,
        keywords: ['outreach', 'outbound', 'leads', 'prospect'],
      },
    ],
  },
  {
    title: 'items.marketplace',
    href: '/mart',
    icon: Store,
    keywords: ['buy', 'sell', 'market', 'listings', 'mart'],
  },
  {
    title: 'items.feed',
    href: '/feed',
    icon: Rss,
    keywords: ['feed', 'activity', 'news', 'mls'],
  },
  {
    title: 'items.hunt',
    href: '/hunt',
    icon: TrendingUp,
    keywords: ['hunt', 'trending', 'discover', 'popular'],
  },
];
