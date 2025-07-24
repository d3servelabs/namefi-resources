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
import type { NavItem } from '@/types';
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
                  >
                    {Icon && <Icon />}
                    <span className="whitespace-nowrap">{item.title}</span>
                    {item.badge && (
                      <Badge className="ml-auto text-secondary-foreground bg-brand-primary h-5 w-5 flex items-center justify-center rounded-full p-0">
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
  );
};

SidebarItems.displayName = 'SidebarItems';
