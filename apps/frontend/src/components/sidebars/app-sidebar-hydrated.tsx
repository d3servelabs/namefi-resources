'use client';

import { SidebarDomains } from '@/components/sidebars/sidebar-domains';
import {
  filterSidebarItemsByAuth,
  SidebarItems,
} from '@/components/sidebars/sidebar-items';
import { useManageEntrypointViewable } from '@/components/sidebars/use-manage-entrypoint';
import { useAuth } from '@/hooks/use-auth';
import { useFreeMints } from '@/hooks/use-free-mints';
import { useRecentDomains } from '@/hooks/use-recent-domains';
import { useWishlist } from '@/hooks/use-wishlist';
import type { NavItem } from '@/lib/types/nav-item';
import { recordPerfOnce } from '@/lib/perf/marks';
import {
  API_VERSION_URL,
  FRONTEND_COMMIT_URL,
  FRONTEND_VERSION_STAMP,
} from '@/lib/version-info';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, type FC } from 'react';

export type AppSidebarHydratedContentProps = {
  items: NavItem[];
};

type SidebarBadgeOptions = {
  availableFreeMintsCount: number;
  isAuthLoading: boolean;
  isFreeMintsLoading: boolean;
  isWishlistLoading: boolean;
  wishlistCount?: number;
};

const withSidebarBadge = (
  item: NavItem,
  {
    availableFreeMintsCount,
    isAuthLoading,
    isFreeMintsLoading,
    isWishlistLoading,
    wishlistCount,
  }: SidebarBadgeOptions,
): NavItem => {
  if (item.href === '/wishlist') {
    return {
      ...item,
      badge:
        !(isWishlistLoading || isAuthLoading) && wishlistCount != null
          ? { content: wishlistCount }
          : undefined,
    };
  }

  if (item.href === '/free-mints') {
    return {
      ...item,
      badge:
        !(isFreeMintsLoading || isAuthLoading) && availableFreeMintsCount > 0
          ? { content: availableFreeMintsCount }
          : undefined,
    };
  }

  return item;
};

/**
 * Lazily loaded sidebar logic.
 *
 * This component is imported via `next/dynamic({ ssr: false })` from the app shell,
 * so that heavy data hooks and queries don't inflate the initial app-shell module graph.
 */
export const AppSidebarHydratedContent: FC<AppSidebarHydratedContentProps> = ({
  items,
}) => {
  const t = useTranslations('nav');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // This component only mounts once its dynamic ({ ssr: false }) chunk has
  // loaded after app-shell hydration, so mount marks the chunk-arrival
  // milestone; `sidebar.activate` then marks when auth first resolves and the
  // real (authenticated) sidebar items can render. recordPerfOnce dedups across
  // re-renders AND remounts, so each fires at most once per page load.
  useEffect(() => {
    recordPerfOnce('sidebar.hydrated_mounted');
  }, []);
  useEffect(() => {
    if (isAuthLoading) return;
    recordPerfOnce('sidebar.activate', { authenticated: isAuthenticated });
  }, [isAuthLoading, isAuthenticated]);

  const { wishlistData, isWishlistLoading } = useWishlist();
  const {
    availableCount: availableFreeMintsCount,
    isLoading: isFreeMintsLoading,
  } = useFreeMints();

  const showManageEntrypoint = useManageEntrypointViewable();

  const computedItems = useMemo(() => {
    const badgeOptions = {
      availableFreeMintsCount,
      isAuthLoading,
      isFreeMintsLoading,
      isWishlistLoading,
      wishlistCount: wishlistData?.length,
    };

    return filterSidebarItemsByAuth(items, isAuthenticated)
      .filter((item) => {
        if (item.title === 'items.manage') {
          return showManageEntrypoint;
        }
        return true;
      })
      .map((item) => withSidebarBadge(item, badgeOptions));
  }, [
    items,
    isAuthenticated,
    showManageEntrypoint,
    isAuthLoading,
    isFreeMintsLoading,
    availableFreeMintsCount,
    isWishlistLoading,
    wishlistData,
  ]);

  const { recentDomains } = useRecentDomains({ newlyVisitedDomain: '' });
  const domains = useMemo(
    () => recentDomains?.toReversed() ?? [],
    [recentDomains],
  );

  return (
    <>
      <SidebarItems items={computedItems} />
      {domains.length > 0 && (
        <SidebarDomains name={t('recentDomains')} domains={domains} />
      )}
    </>
  );
};

export type AppSidebarHydratedFooterProps = {
  isCollapsed: boolean;
};

export const AppSidebarHydratedFooter: FC<AppSidebarHydratedFooterProps> = ({
  isCollapsed,
}) => {
  if (isCollapsed) return null;

  return (
    <div className="flex min-w-0 flex-col gap-1 px-2 text-xs font-medium text-secondary-foreground/40">
      {FRONTEND_COMMIT_URL ? (
        <a
          href={FRONTEND_COMMIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-mono transition hover:text-secondary-foreground/70"
        >
          {FRONTEND_VERSION_STAMP}
        </a>
      ) : (
        <span className="break-all font-mono">{FRONTEND_VERSION_STAMP}</span>
      )}
      <a
        href={API_VERSION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit font-mono transition hover:text-secondary-foreground/70"
      >
        see api version
      </a>
    </div>
  );
};
