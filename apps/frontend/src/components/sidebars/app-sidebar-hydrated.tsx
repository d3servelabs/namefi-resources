'use client';

import { SidebarDomains } from '@/components/sidebars/sidebar-domains';
import { SidebarItems } from '@/components/sidebars/sidebar-items';
import { useAuth } from '@/hooks/use-auth';
import { useFreeMints } from '@/hooks/use-free-mints';
import { useRecentDomains } from '@/hooks/use-recent-domains';
import { useWishlist } from '@/hooks/use-wishlist';
import type { NavItem } from '@/lib/types/nav-item';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo, type FC } from 'react';

export type AppSidebarHydratedContentProps = {
  items: NavItem[];
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

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
    return items
      .filter((item) => {
        if (item.title.toLowerCase() === 'manage') {
          return showManageEntrypoint;
        }
        return true;
      })
      .map((item) => {
        if (item.href === '/wishlist') {
          return {
            ...item,
            badge:
              !(isWishlistLoading || isAuthLoading) && wishlistData
                ? { content: wishlistData.length }
                : undefined,
          };
        }
        if (item.href === '/free-mints') {
          return {
            ...item,
            badge:
              !(isFreeMintsLoading || isAuthLoading) &&
              availableFreeMintsCount > 0
                ? { content: availableFreeMintsCount }
                : undefined,
          };
        }
        return item;
      });
  }, [
    items,
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
        <SidebarDomains name="Recent domains" domains={domains} />
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

  const backendVersion = useQuery({
    ...trpc.version.queryOptions(),
    enabled: !isCollapsed,
  });

  if (isCollapsed) return null;

  return (
    <div className="grid grid-cols-2 gap-1 text-xs font-medium text-secondary-foreground/40">
      <div className="flex flex-row px-2 gap-1">
        <span className="whitespace-nowrap">App: {process.env.version}</span>
      </div>
      <div className="flex flex-row gap-1">
        <span className="whitespace-nowrap">
          API: {backendVersion.data?.version}
        </span>
      </div>
    </div>
  );
};
