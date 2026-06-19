'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import type { NavItem } from '@/lib/types/nav-item';
import { reportReactBoundaryError } from '@/lib/datadog-react-error';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { ErrorInfo, FC, HTMLAttributes } from 'react';
import { isRouteActive } from './utils';
import { ErrorBoundary } from '@suspensive/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

export type SidebarItemsProps = HTMLAttributes<HTMLDivElement> & {
  items: NavItem[];
};

export const filterSidebarItemsByAuth = (
  items: NavItem[],
  isAuthenticated: boolean,
): NavItem[] => {
  return items
    .filter((item) => isAuthenticated || !item.requiresAuth)
    .map((item) => {
      if (!item.submenu) return item;

      return {
        ...item,
        submenu: filterSidebarItemsByAuth(item.submenu, isAuthenticated),
      };
    });
};

const logSidebarItemsError = (error: Error, info: ErrorInfo) => {
  reportReactBoundaryError('SidebarItems', error, info);
};

const CollapsedSidebarSubmenuItem: FC<{
  item: NavItem;
  pathname: string;
}> = ({ item, pathname }) => {
  const t = useTranslations('nav');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;
  const [open, setOpen] = useState(false);
  const [suppressTooltip, setSuppressTooltip] = useState(false);
  const Icon = item.icon;
  const label = tDynamic(item.title);
  const submenuItems = item.submenu ?? [];
  const isActive = isRouteActive(item, pathname);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen || suppressTooltip) {
      setSuppressTooltip(true);
    }
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <Tooltip disabled={open || suppressTooltip}>
          <DropdownMenuTrigger
            render={
              <TooltipTrigger
                render={
                  <SidebarMenuButton
                    aria-label={label}
                    isActive={isActive}
                    onPointerDown={() => {
                      setSuppressTooltip(true);
                    }}
                    onPointerEnter={() => {
                      if (!open) {
                        setSuppressTooltip(false);
                      }
                    }}
                    onFocus={() => {
                      setSuppressTooltip(true);
                    }}
                  />
                }
              />
            }
          >
            {Icon && <Icon />}
            <span className="whitespace-nowrap">{label}</span>
          </DropdownMenuTrigger>
          <TooltipContent
            side="right"
            align="center"
            hidden={open || suppressTooltip}
          >
            {label}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={10}
          className="w-52"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {submenuItems.map((subItem) => {
              const SubIcon = subItem.icon;
              const subItemActive = isRouteActive(subItem, pathname);
              return (
                <DropdownMenuItem
                  key={subItem.href}
                  className={cn(
                    'cursor-pointer',
                    subItemActive && 'bg-accent text-accent-foreground',
                  )}
                  render={
                    <Link
                      aria-current={subItemActive ? 'page' : undefined}
                      href={subItem.href as Route}
                      target={subItem.target}
                    />
                  }
                >
                  {SubIcon && <SubIcon />}
                  <span>{tDynamic(subItem.title)}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const SidebarItems: FC<SidebarItemsProps> = ({
  items,
  ...rest
}: SidebarItemsProps) => {
  const t = useTranslations('nav');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isDesktopCollapsed = state === 'collapsed' && !isMobile;

  return (
    <SidebarGroup {...rest}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const label = tDynamic(item.title);
            const hasSubmenu = (item.submenu?.length ?? 0) > 0;
            const isActive = isRouteActive(item, pathname);
            const submenuItems = item.submenu ?? [];
            return (
              <ErrorBoundary
                key={item.href}
                fallback={null}
                onError={logSidebarItemsError}
              >
                {hasSubmenu && isDesktopCollapsed ? (
                  <CollapsedSidebarSubmenuItem
                    item={item}
                    pathname={pathname}
                  />
                ) : hasSubmenu ? (
                  <Collapsible
                    defaultOpen={isActive}
                    className="w-full group/collapsible"
                    render={<SidebarMenuItem />}
                  >
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton
                          className="group/collapsible-trigger"
                          isActive={isActive}
                        />
                      }
                    >
                      {Icon && <Icon />}
                      <span className="whitespace-nowrap">{label}</span>
                      <ChevronRight className="ms-auto transition-transform duration-200 group-data-panel-open/collapsible-trigger:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {submenuItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                isActive={isRouteActive(subItem, pathname)}
                                render={
                                  <Link
                                    href={subItem.href as Route}
                                    target={subItem.target}
                                    onClick={() => {
                                      if (isMobile) {
                                        setOpenMobile(false);
                                      }
                                    }}
                                  />
                                }
                              >
                                {SubIcon && <SubIcon />}
                                <span>{tDynamic(subItem.title)}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={label}
                      render={
                        <Link
                          href={item.href as Route}
                          target={item.target}
                          onClick={() => {
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                          className="relative"
                        />
                      }
                    >
                      {Icon && <Icon />}
                      <span className="whitespace-nowrap">{label}</span>
                      {item.badge &&
                        item.badge.content != null &&
                        item.badge.content !== 0 &&
                        item.badge.content !== '0' && (
                          <Badge
                            className="absolute text-secondary-foreground bg-brand-primary flex items-center justify-center rounded-full p-0 transition-all duration-200 ease-in-out z-10
                          h-5 w-5 min-w-5 right-2 top-1/2 -translate-y-1/2
                          group-data-[collapsible=icon]:h-2 group-data-[collapsible=icon]:w-2 group-data-[collapsible=icon]:min-w-2
                          group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1
                          group-data-[collapsible=icon]:translate-x-0 group-data-[collapsible=icon]:translate-y-0"
                          >
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.badge.content}
                            </span>
                          </Badge>
                        )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </ErrorBoundary>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

SidebarItems.displayName = 'SidebarItems';
