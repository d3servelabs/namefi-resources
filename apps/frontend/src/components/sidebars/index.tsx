'use client';

import { UserDropdown } from '@/components/dropdowns/UserDropdown';
import { Logotype } from '@/components/logotype';
import { SidebarItems } from '@/components/sidebars/SidebarItems';
import { Label } from '@/components/ui/shadcn/label';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import {
  Bell,
  Bookmark,
  CreditCard,
  Globe,
  PenToolIcon,
  Search,
} from 'lucide-react';
import { type ChangeEvent, useCallback, useMemo, useState } from 'react';
import { SidebarDomains } from './SidebarDomains';

const DOMAINS = ['test1.com', 'test2.com', 'test3.com'];

const ITEMS: NavItem[] = [
  { title: 'My Domains', href: '/my-domains', icon: Globe },
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
        <SidebarGroup className={cn(isCollapsed && 'px-0.5')}>
          <div className="flex items-center justify-between">
            {!isCollapsed && <Logotype />}
            <SidebarTrigger />
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
        {items.length > 0 && <SidebarItems items={items} />}

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
