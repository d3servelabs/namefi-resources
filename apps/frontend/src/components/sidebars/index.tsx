'use client';

import { BrandLogo } from '@/components/brand-logo';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { SidebarItems } from '@/components/sidebars/sidebar-items';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import { SidebarRail } from '@/components/ui/sidebar-rail';
import { useAuth } from '@/hooks/use-auth';
import { useRecentDomains } from '@/hooks/use-recent-domains';
import { useWishlist } from '@/hooks/use-wishlist';
import type { NavItem } from '@/types';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Compass,
  CreditCard,
  Globe,
  PenToolIcon,
  Sparkles,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { useMemo } from 'react';
import { SidebarDomains } from './sidebar-domains';
import { motion, AnimatePresence } from 'motion/react';

const ITEMS: NavItem[] = [
  { title: 'Discover', href: '/', icon: Compass },
  { title: "Just AI'ng™", href: '/ai-brand-generator', icon: Sparkles },
  { title: 'Hunt', href: '/hunt', icon: TrendingUp },
  { title: 'My Domains', href: '/domains', icon: Globe },
  { title: 'My Wishlist', href: '/wishlist', icon: Heart },
  { title: 'My Orders', href: '/orders', icon: ClipboardList },
  { title: 'My Payment Methods', href: '/payment-methods', icon: CreditCard },
  { title: 'Manage', href: '/manage', icon: PenToolIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Move useWishlist to top level
  const { wishlistData, isWishlistLoading } = useWishlist();

  const {
    data,
    isError: isManagerEntryPointViewableError,
    isFetching: isManagerEntryPointViewableFetching,
    isLoading: isManagerEntryPointViewableLoading,
  } = useQuery({
    ...trpc.users.getManagerPageEntrypointViewable.queryOptions(),
    enabled: !isAuthLoading && isAuthenticated,
  });

  const frontendVersion = useMemo(() => {
    return {
      version: process.env.version,
      name: process.env.name,
    };
  }, []);

  const backendVersion = useQuery(trpc.version.queryOptions());

  const showManageEntrypoint = useMemo(() => {
    if (
      !isAuthenticated ||
      isManagerEntryPointViewableLoading ||
      isManagerEntryPointViewableFetching ||
      isManagerEntryPointViewableError ||
      !data
    ) {
      return false;
    }

    return data.viewable;
  }, [
    data,
    isAuthenticated,
    isManagerEntryPointViewableError,
    isManagerEntryPointViewableFetching,
    isManagerEntryPointViewableLoading,
  ]);

  const { recentDomains } = useRecentDomains({
    newlyVisitedDomain: '',
  });

  const domains = useMemo(
    () => recentDomains?.toReversed() ?? [],
    [recentDomains],
  );

  const items = useMemo(() => {
    return ITEMS.filter((item) => {
      if (item.title.toLowerCase() === 'manage') {
        return showManageEntrypoint;
      }
      return true;
    }).map((item) => {
      if (item.href === '/wishlist') {
        return {
          ...item,
          badge:
            !(isWishlistLoading || isAuthLoading) && wishlistData
              ? { content: wishlistData.length }
              : undefined,
        };
      }
      return item;
    });
  }, [showManageEntrypoint, wishlistData, isWishlistLoading, isAuthLoading]);

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r-0! [&_[data-sidebar=sidebar]]:bg-background/20! [&_[data-sidebar=sidebar]]:backdrop-blur-2xl"
    >
      <SidebarHeader>
        <SidebarGroup className="px-0.5 py-2.5">
          <BrandLogo />
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarItems items={items} />
        {domains.length > 0 && (
          <SidebarDomains name="Recent domains" domains={domains} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <motion.div className="flex flex-col gap-2 w-full" layout>
          <AnimatePresence initial={false}>
            <motion.div layout key="user-dropdown">
              <UserDropdown />
            </motion.div>
            {!isCollapsed && (
              <motion.div
                key="sidebar-version-info"
                className="grid grid-cols-2 gap-1 text-xs font-medium text-secondary-foreground/40"
              >
                <div className="flex flex-row px-2 gap-1">
                  <span className="whitespace-nowrap">
                    App: {frontendVersion.version}
                  </span>
                </div>
                <div className="flex flex-row gap-1">
                  <span className="whitespace-nowrap">
                    API: {backendVersion.data?.version}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
