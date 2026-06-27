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
import { ITEMS } from '@/components/sidebars/nav-items';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * The navigation structure now lives in the data-only `./nav-items` module so it
 * can be shared with the header OmniSearch without dragging this client graph
 * into the search bundle. Re-exported here to keep `@/components/sidebars` the
 * stable import path for existing consumers (e.g. `mobile-nav-drawer`).
 */
export { ITEMS };
export const PUBLIC_ITEMS = filterSidebarItemsByAuth(ITEMS, false);

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
          <UserDropdown forceExpanded={false} compactAccountLabel />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
