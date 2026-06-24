'use client';

import { SidebarDomains } from '@/components/sidebars/sidebar-domains';
import {
  filterSidebarItemsByAuth,
  SidebarItems,
} from '@/components/sidebars/sidebar-items';
import { useAuth } from '@/hooks/use-auth';
import { useFreeMints } from '@/hooks/use-free-mints';
import { useRecentDomains } from '@/hooks/use-recent-domains';
import { useWishlist } from '@/hooks/use-wishlist';
import { config } from '@/lib/env';
import type { NavItem } from '@/lib/types/nav-item';
import { useTRPC } from '@/lib/trpc';
import { recordPerfOnce } from '@/lib/perf/marks';
import { useQuery } from '@tanstack/react-query';
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
  const trpc = useTRPC();

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

  const managerEntrypointViewable = useQuery({
    ...trpc.users.getManagerPageEntrypointViewable.queryOptions(),
    enabled: !isAuthLoading && isAuthenticated,
  });

  const showManageEntrypoint = useMemo(() => {
    if (!isAuthenticated) return false;
    if (managerEntrypointViewable.isLoading) return false;
    if (managerEntrypointViewable.isFetching) return false;
    if (managerEntrypointViewable.isError) return false;
    if (!managerEntrypointViewable.data) return false;
    return managerEntrypointViewable.data.viewable;
  }, [
    isAuthenticated,
    managerEntrypointViewable.data,
    managerEntrypointViewable.isError,
    managerEntrypointViewable.isFetching,
    managerEntrypointViewable.isLoading,
  ]);

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
  const trpc = useTRPC();
  const commitLabel = config.DEPLOY_COMMIT_SHA.startsWith('unknown')
    ? config.DEPLOY_COMMIT_SHA
    : config.DEPLOY_COMMIT_SHA.slice(0, 12);

  const backendVersion = useQuery({
    ...trpc.version.queryOptions(),
    enabled: !isCollapsed,
  });

  if (isCollapsed) return null;

  return (
    <div className="grid grid-cols-2 gap-1 text-xs font-medium text-secondary-foreground/40">
      <div className="flex flex-col px-2 gap-1">
        <span className="whitespace-nowrap">App: {config.APP_VERSION}</span>
        <span className="whitespace-nowrap">Commit: {commitLabel}</span>
      </div>
      <div className="flex flex-row gap-1">
        <span className="whitespace-nowrap">
          API: {backendVersion.data?.version}
        </span>
      </div>
    </div>
  );
};
