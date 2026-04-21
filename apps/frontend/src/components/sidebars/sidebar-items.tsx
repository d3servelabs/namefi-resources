'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
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
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ErrorInfo, FC, HTMLAttributes, ReactElement } from 'react';
import { isRouteActive } from './utils';
import { ErrorBoundary } from '@suspensive/react';

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
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <ErrorBoundary
                key={`${item.href}-${index}`}
                fallback={<></>}
                onError={logSidebarItemsError}
              >
                <SidebarMenuItem>
                  <SidebarItemTooltip label={item.title}>
                    <SidebarMenuButton
                      isActive={isRouteActive(item, pathname)}
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
              </ErrorBoundary>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

SidebarItems.displayName = 'SidebarItems';
