'use client';

import dynamic from 'next/dynamic';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
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
  Store,
  TrendingUp,
  Heart,
  Gift,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * Sidebar navigation structure. Routes/hrefs, icons and auth/pattern hints stay
 * here as stable data; the `title` field holds an i18n key (under the `nav`
 * namespace's `items.*`) that is resolved to user-visible copy at render time
 * via `t(item.title)` in `SidebarItems`. Keys are also used for the `manage`
 * visibility check, so they double as stable identifiers, not copy.
 */
const ITEMS: NavItem[] = [
  { title: 'items.discover', href: '/', icon: Compass },
  {
    title: 'items.myDomains',
    href: '/domains',
    icon: Globe,
    requiresAuth: true,
  },
  { title: 'items.myWishlist', href: '/wishlist', icon: Heart },
  {
    title: 'items.myOrders',
    href: '/orders',
    icon: ClipboardList,
    requiresAuth: true,
  },
  {
    title: 'items.myFreeMints',
    href: '/free-mints',
    icon: Gift,
    requiresAuth: true,
  },
  {
    title: 'items.myPaymentMethods',
    href: '/payment-methods',
    icon: CreditCard,
    requiresAuth: true,
  },
  {
    title: 'items.manage',
    href: '/manage',
    icon: PenToolIcon,
    requiresAuth: true,
  },
  {
    title: 'items.justAing',
    href: '/studio',
    icon: Sparkles,
    pattern: /^\/(studio|outbound)/,
    submenu: [
      { title: 'items.brandStudio', href: '/studio', icon: Palette },
      { title: 'items.outbound', href: '/outbound', icon: Search },
    ],
  },
  { title: 'items.marketplace', href: '/mart', icon: Store },
  { title: 'items.feed', href: '/feed', icon: Rss },
  { title: 'items.hunt', href: '/hunt', icon: TrendingUp },
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
  const { state, isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations('common');
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // On mobile the sidebar is an off-canvas sheet, not an icon-collapsed rail, so
  // the desktop `collapsed` state must not hide the footer there — otherwise the
  // version info stays hidden in the mobile drawer.
  const isCollapsed = state === 'collapsed' && !isMobile;

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-e-0! [&_[data-sidebar=sidebar]]:bg-background/20! [&_[data-sidebar=sidebar]]:backdrop-blur-2xl"
    >
      <SidebarHeader>
        <SidebarGroup className="px-0.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <BrandLogo animateInitialExpand={isMobile} />
            {isMobile ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('actions.close')}
                className="shrink-0 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                onClick={() => setOpenMobile(false)}
              >
                <X className="size-5" />
              </Button>
            ) : null}
          </div>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        {!hasHydrated && <SidebarItems items={PUBLIC_ITEMS} />}
        {hasHydrated && <AppSidebarHydratedContent items={ITEMS} />}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 w-full">
          <NotificationsBell variant="sidebar" />
          <AppSidebarHydratedFooter isCollapsed={isCollapsed} />
          <UserDropdown forceExpanded={false} />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
