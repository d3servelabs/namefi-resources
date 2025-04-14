'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
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
  className,
  ...rest
}: SidebarItemsProps) => {
  const pathname = usePathname();

  return (
    <SidebarGroup className={cn('', className)} {...rest}>
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
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge className="ml-auto text-white bg-brand-primary h-5 w-5 flex items-center justify-center rounded-full p-0">
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
