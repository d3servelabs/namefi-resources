'use client';

import { BrandLogo } from '@/components/brandLogo';
import { UserDropdown } from '@/components/dropdowns/UserDropdown';
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
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { LocalStorageKeys } from '@/utils/localStorageKeys';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Globe, PenToolIcon, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ChangeEvent, useCallback, useMemo, useState } from 'react';
import { useReadLocalStorage } from 'usehooks-ts';
import { SidebarDomains } from './SidebarDomains';

const ITEMS: NavItem[] = [
  { title: 'My Domains', href: '/my-domains', icon: Globe },
  { title: 'My Payment Methods', href: '/payment-methods', icon: CreditCard },
  { title: 'Manage', href: '/manage', icon: PenToolIcon },
];

export function AppSidebar() {
  const [search, setSearch] = useState('');

  const { state } = useSidebar();

  const pathname = usePathname();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const {
    data,
    isError: isManagerEntryPointViewableError,
    isFetching: isManagerEntryPointViewableFetching,
    isLoading: isManagerEntryPointViewableLoading,
  } = useQuery({
    ...trpc.users.getManagerPageEntrypointViewable.queryOptions(),
    enabled: !isAuthLoading && isAuthenticated,
  });

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

  const recentDomains = useReadLocalStorage<string[]>(
    LocalStorageKeys.RECENT_DOMAINS,
    { initializeWithValue: false },
  );

  const domains = useMemo(
    () =>
      recentDomains
        ?.filter((domain) =>
          domain.toLowerCase().includes(search.toLowerCase()),
        )
        .toReversed() ?? [],
    [recentDomains, search],
  );

  const items = useMemo(() => {
    return ITEMS.filter((item) => {
      if (item.title.toLowerCase() === 'manage') {
        return (
          showManageEntrypoint &&
          item.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      return item.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, showManageEntrypoint]);

  const isCollapsed = useMemo(() => state === 'collapsed', [state]);

  const handleSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className={cn('border-none!', {
        '[--sidebar:alpha(var(--color-zinc-600),0.6)] backdrop-blur-3xl':
          pathname === '/',
      })}
    >
      <SidebarHeader>
        <SidebarGroup className={cn(isCollapsed && 'px-0.5')}>
          <div className="flex items-center justify-between py-2">
            <BrandLogo collapsed={isCollapsed} />
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
          <SidebarDomains name="Recent domains" domains={domains} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <UserDropdown collapsed={isCollapsed} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
