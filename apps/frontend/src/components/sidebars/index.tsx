'use client';

import { Logotype } from '@/components/logotype';
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
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
  SidebarSeparator,
} from '@/components/ui/shadcn/sidebar';
import {
  Bell,
  Bookmark,
  ChevronDown,
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
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between p-4">
          <Logotype />
          <div className="flex items-center justify-center w-6 h-6 rounded border border-zinc-700 text-xs">
            ID
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <SidebarInput placeholder="Search for" className="pl-8" />
          </div>
        </div>
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

        <SidebarSeparator />

        <RecentDomains domains={RECENT_DOMAINS} />
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <button
              type="button"
              className="flex items-center gap-2 p-4 w-full hover:bg-zinc-800/50 transition-colors"
            >
              <Avatar className="h-8 w-8 bg-orange-500">
                <AvatarFallback>0x</AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">0xf428112c...5883</span>
              <ChevronDown className="ml-auto h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
