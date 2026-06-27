'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';
import { getResourcesSidebarItems } from '@/components/resources-sidebar-items';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';

/**
 * Left navigation rail for the resources site, mirroring the main app's sidebar
 * shell. Holds the full section nav (the header keeps search as its primary
 * element); collapses to an icon rail on desktop and an off-canvas drawer on
 * mobile. `side` is the logical inline-start edge: the Sidebar primitive already
 * positions the desktop rail with logical CSS and mirrors the mobile drawer for
 * RTL via `useDirection`, so it must stay `"left"` (don't pre-flip it for RTL,
 * or the mobile drawer double-mirrors and slides from the wrong edge).
 */
export function AppSidebar({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const pathname = usePathname();
  const { nav } = dictionary;
  const { isMobile, setOpenMobile } = useSidebar();
  const items = getResourcesSidebarItems({ locale, nav });

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{nav.resources}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      data-testid={`nav.sidebar.item.${item.href}`}
                      render={
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        />
                      }
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
