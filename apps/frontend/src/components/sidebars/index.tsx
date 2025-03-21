'use client';

import { UserDropdown } from '@/components/dropdowns/UserDropdown';
import { Logotype } from '@/components/logotype';
import { isRouteActive } from '@/components/sidebars/utils';
import { Badge } from '@/components/ui/shadcn/badge';
import { Label } from '@/components/ui/shadcn/label';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
import {
  Bell,
  Bookmark,
  CreditCard,
  Globe,
  PenToolIcon,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ChangeEvent, useCallback, useMemo, useState } from 'react';
import { SidebarDomains } from './SidebarDomains';
import type { NavItem } from './types';

const DOMAINS = ['test1.com', 'test2.com', 'test3.com'];

const ITEMS: NavItem[] = [
  { title: 'My Domains', href: '#', icon: Globe },
  { title: 'Domain Bookmark', href: '#', icon: Bookmark },
  { title: 'My Credits', href: '#', icon: CreditCard },
  {
    title: 'Notification',
    href: '#',
    icon: Bell,
    badge: {
      content: 2,
      variant: 'default',
    },
  },
  { title: 'Tools', href: '#', icon: PenToolIcon },
];

export function AppSidebar() {
  const [search, setSearch] = useState('');

  const pathname = usePathname();

  const { state } = useSidebar();

  const domains = useMemo(
    () =>
      DOMAINS.filter((domain) =>
        domain.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const items = useMemo(
    () =>
      ITEMS.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const isCollapsed = useMemo(() => state === 'collapsed', [state]);

  const handleSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarGroup>
          <div className="flex overflow-hidden items-center justify-between">
            <Logotype />
            {!isCollapsed && (
              <div
                className={cn(
                  'flex items-center justify-center size-6 rounded border border-zinc-700 text-xs',
                  'hidden',
                )}
              >
                ID
              </div>
            )}
          </div>
        </SidebarGroup>
        {!isCollapsed && (
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <SidebarInput
                value={search}
                onChange={handleSearch}
                id="search"
                placeholder="Search..."
                className="pl-8"
              />
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarHeader>

      <SidebarContent>
        {items.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={`${item.href}-${index}`}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isRouteActive(item, pathname)}
                        asChild={true}
                      >
                        <Link href={item.href} target={item.target}>
                          {Icon && (
                            <Icon
                              className={cn(index === 0 && 'text-emerald-500')}
                            />
                          )}
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge className="ml-auto text-white bg-emerald-500 h-5 w-5 flex items-center justify-center rounded-full p-0">
                              {item.badge.content}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {domains.length > 0 && (
          <SidebarDomains name="Domains" domains={domains} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <UserDropdown collapsed={isCollapsed} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
