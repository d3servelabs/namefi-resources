'use client';

import dynamic from 'next/dynamic';
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
import type { NavItem } from '@/lib/types/nav-item';
import {
  ClipboardList,
  Compass,
  CreditCard,
  Globe,
  PenToolIcon,
  Sparkles,
  TrendingUp,
  Heart,
  Gift,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ITEMS: NavItem[] = [
  { title: 'Discover', href: '/', icon: Compass },
  { title: 'My Domains', href: '/domains', icon: Globe },
  { title: 'My Wishlist', href: '/wishlist', icon: Heart },
  { title: 'My Orders', href: '/orders', icon: ClipboardList },
  { title: 'My Free Mints', href: '/free-mints', icon: Gift },
  { title: 'My Payment Methods', href: '/payment-methods', icon: CreditCard },
  { title: 'Manage', href: '/manage', icon: PenToolIcon },
  { title: "Just AI'ng™", href: '/ai-brand-generator', icon: Sparkles },
  { title: 'Hunt', href: '/hunt', icon: TrendingUp },
];

const AppSidebarHydratedContent = dynamic(
  () =>
    import('@/components/sidebars/app-sidebar-hydrated').then(
      (mod) => mod.AppSidebarHydratedContent,
    ),
  {
    ssr: false,
    loading: () => <SidebarItems items={ITEMS} />,
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
        {!hasHydrated && <SidebarItems items={ITEMS} />}
        {hasHydrated && <AppSidebarHydratedContent items={ITEMS} />}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 w-full">
          <UserDropdown forceExpanded={false} />
          <AppSidebarHydratedFooter isCollapsed={isCollapsed} />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
