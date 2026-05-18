'use client';

import dynamic from 'next/dynamic';
import { BrandLogo } from '@/components/brand-logo';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import {
  filterSidebarItemsByAuth,
  SidebarItems,
} from '@/components/sidebars/sidebar-items';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { SidebarRail } from '@/components/ui/sidebar-rail';
import type { NavItem } from '@/lib/types/nav-item';
import {
  ClipboardList,
  Compass,
  CreditCard,
  Globe,
  Palette,
  PenToolIcon,
  Rss,
  Search,
  Sparkles,
  TrendingUp,
  Heart,
  Gift,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ITEMS: NavItem[] = [
  { title: 'Discover', href: '/', icon: Compass },
  { title: 'My Domains', href: '/domains', icon: Globe, requiresAuth: true },
  { title: 'My Wishlist', href: '/wishlist', icon: Heart },
  {
    title: 'My Orders',
    href: '/orders',
    icon: ClipboardList,
    requiresAuth: true,
  },
  {
    title: 'My Free Mints',
    href: '/free-mints',
    icon: Gift,
    requiresAuth: true,
  },
  {
    title: 'My Payment Methods',
    href: '/payment-methods',
    icon: CreditCard,
    requiresAuth: true,
  },
  { title: 'Manage', href: '/manage', icon: PenToolIcon, requiresAuth: true },
  {
    title: "Just AI'ng™",
    href: '/studio',
    icon: Sparkles,
    pattern: /^\/(studio|outbound)/,
    submenu: [
      { title: 'Namefi Brand Studio', href: '/studio', icon: Palette },
      { title: 'Namefi Outbound', href: '/outbound', icon: Search },
    ],
  },
  { title: 'Namefi Feed', href: '/feed', icon: Rss },
  { title: 'Hunt', href: '/hunt', icon: TrendingUp },
];
const PUBLIC_ITEMS = filterSidebarItemsByAuth(ITEMS, false);

const AppSidebarHydratedContent = dynamic(
  () =>
    import('@/components/sidebars/app-sidebar-hydrated').then(
      (mod) => mod.AppSidebarHydratedContent,
    ),
  {
    ssr: false,
    loading: () => <SidebarItems items={PUBLIC_ITEMS} />,
  },
);

const AppSidebarHydratedFooter = dynamic(
  () =>
    import('@/components/sidebars/app-sidebar-hydrated').then(
      (mod) => mod.AppSidebarHydratedFooter,
    ),
  { ssr: false },
);

export function AppSidebar() {
  const { state } = useSidebar();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

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
        {!hasHydrated && <SidebarItems items={PUBLIC_ITEMS} />}
        {hasHydrated && <AppSidebarHydratedContent items={ITEMS} />}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 w-full">
          <NotificationsBell variant="sidebar" className="hidden md:block" />
          <UserDropdown forceExpanded={false} />
          <AppSidebarHydratedFooter isCollapsed={isCollapsed} />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
