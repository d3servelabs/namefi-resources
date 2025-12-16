'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import type { NavItem } from '@/lib/types/nav-item';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC, HTMLAttributes } from 'react';
import { isRouteActive } from './utils';

export type SidebarItemsProps = HTMLAttributes<HTMLDivElement> & {
  items: NavItem[];
};

export const SidebarItems: FC<SidebarItemsProps> = ({
  items,
  ...rest
}: SidebarItemsProps) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup {...rest}>
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
                  <Link
                    href={item.href}
                    target={item.target}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                    className="relative"
                  >
                    {Icon && <Icon />}
                    <span className="whitespace-nowrap">{item.title}</span>
                    {item.badge && (
                      <Badge
                        className="absolute text-secondary-foreground bg-brand-primary flex items-center justify-center rounded-full p-0 transition-all duration-200 ease-in-out z-10
                        h-5 w-5 min-w-5 right-0 top-1/2 -translate-y-1/2
                        group-data-[collapsible=icon]:h-2 group-data-[collapsible=icon]:w-2 group-data-[collapsible=icon]:min-w-2
                        group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1
                        group-data-[collapsible=icon]:translate-x-0 group-data-[collapsible=icon]:translate-y-0"
                      >
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.badge.content}
                        </span>
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
  );
};

SidebarItems.displayName = 'SidebarItems';
