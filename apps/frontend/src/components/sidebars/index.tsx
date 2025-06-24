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
import { useRecentDomains } from '@/hooks/useRecentDomains';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ClipboardList,
  Compass,
  CreditCard,
  Globe,
  PenToolIcon,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { type ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Button } from '../ui/shadcn/button';
import { SidebarDomains } from './SidebarDomains';

const ITEMS: NavItem[] = [
  { title: 'Discover', href: '/', icon: Compass },
  { title: 'AI Tools', href: '/ai-brand-generator', icon: Sparkles },
  { title: 'Hunt', href: '/hunt', icon: TrendingUp },
  { title: 'My Domains', href: '/my-domains', icon: Globe },
  { title: 'My Orders', href: '/orders', icon: ClipboardList },
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
        return showManageEntrypoint;
      }

      return true;
    });
  }, [showManageEntrypoint]);

  const isCollapsed = useMemo(() => state === 'collapsed', [state]);

  const handleSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const router = useRouter();
  const searchForDomain = useCallback(() => {
    router.push(`/?query=${search}`);
  }, [search, router]);

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
          <div className="flex items-center flex-row">
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
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      searchForDomain();
                    }
                  }}
                />
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
              </SidebarGroupContent>
            </SidebarGroup>
            {search.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={searchForDomain}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    searchForDomain();
                  }
                }}
              >
                <ArrowRight className="size-4 select-none opacity-50" />
              </Button>
            )}
          </div>
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
        {!isCollapsed && (
          <div className="grid grid-cols-2 gap-1 text-xs font-medium text-white/40">
            <div className="flex flex-row gap-1">
              <span>App: {frontendVersion.version}</span>
            </div>
            <div className="flex flex-row gap-1">
              <span>API: {backendVersion.data?.version}</span>
            </div>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
