'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import type { NavItem } from '@/lib/types/nav-item';
import { reportReactBoundaryError } from '@/lib/datadog-react-error';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ErrorInfo, FC, HTMLAttributes, ReactElement } from 'react';
import { isRouteActive } from './utils';
import { ErrorBoundary } from '@suspensive/react';
import { ChevronRight } from 'lucide-react';

export type SidebarItemsProps = HTMLAttributes<HTMLDivElement> & {
  items: NavItem[];
};

const logSidebarItemsError = (error: Error, info: ErrorInfo) => {
  reportReactBoundaryError('SidebarItems', error, info);
};

const SidebarItemTooltip: FC<{
  label: string;
  children: ReactElement;
}> = ({ label, children }) => {
  const { state, isMobile } = useSidebar();

  if (state !== 'collapsed' || isMobile) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex w-full" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        {label}
      </TooltipContent>
    </Tooltip>
  );
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
          {items.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = (item.submenu?.length ?? 0) > 0;
            const isActive = isRouteActive(item, pathname);
            return (
              <ErrorBoundary
                key={item.href}
                fallback={null}
                onError={logSidebarItemsError}
              >
                {hasSubmenu ? (
                  <Collapsible
                    defaultOpen={isActive}
                    className="w-full group/collapsible"
                    render={<SidebarMenuItem />}
                  >
                    <SidebarItemTooltip label={item.title}>
                      <CollapsibleTrigger
                        render={<SidebarMenuButton isActive={isActive} />}
                      >
                        {Icon && <Icon />}
                        <span className="whitespace-nowrap">{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                      </CollapsibleTrigger>
                    </SidebarItemTooltip>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.submenu?.map((subItem) => {
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
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem>
                    <SidebarItemTooltip label={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
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
                        <span className="whitespace-nowrap">{item.title}</span>
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
                    </SidebarItemTooltip>
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
