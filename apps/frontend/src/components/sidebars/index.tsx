'use client';

import { UserDropdown } from '@/components/dropdowns/UserDropdown';
import { Logotype } from '@/components/logotype';
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
import { RecentDomains } from './RecentDomains';

const RECENT_DOMAINS = [
  'whatsenergy.com',
  'topgamefi.com',
  'bringmethatfromthere.com',
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <Logotype />
            <div
              className={cn(
                'flex items-center justify-center size-6 rounded border border-zinc-700 text-xs',
                '',
              )}
            >
              ID
            </div>
          </div>
        </SidebarGroup>
        <SidebarGroup className="py-0">
          <SidebarGroupContent className="relative">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <SidebarInput
              id="search"
              placeholder="Search..."
              className="pl-8"
            />
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild={true}>
                  <Link href="#">
                    <Globe className="text-emerald-500" />
                    <span>My Domains</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild={true}>
                  <Link href="#">
                    <Bookmark />
                    <span>Domain Bookmark</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild={true}>
                  <Link href="#">
                    <CreditCard />
                    <span>My Credits</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild={true}>
                  <Link href="#">
                    <Bell />
                    <span>Notification</span>
                    <Badge className="ml-auto bg-emerald-500 text-white h-5 w-5 flex items-center justify-center rounded-full p-0">
                      2
                    </Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild={true}>
                  <Link href="#">
                    <PenToolIcon />
                    <span>Tools</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <RecentDomains domains={RECENT_DOMAINS} />
      </SidebarContent>

      <SidebarFooter>
        <UserDropdown />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
