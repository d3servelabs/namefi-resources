'use client';

import type { Route } from 'next';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { ChevronRight, Globe, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC, ReactElement } from 'react';

interface RecentDomainsProps {
  name: string;
  domains: string[];
}

const SidebarDomainTooltip: FC<{
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

export function SidebarDomains({ name, domains }: RecentDomainsProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        <Collapsible
          defaultOpen={true}
          className="w-full group/collapsible"
          render={<SidebarMenuItem />}
        >
          <CollapsibleTrigger render={<SidebarMenuButton />}>
            <History className="size-4" />
            <span className="whitespace-nowrap">{name}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenuSub>
                {domains.map((domain) => {
                  const href = `/domains/${domain}`;
                  return (
                    <SidebarMenuItem key={domain}>
                      <SidebarDomainTooltip label={domain}>
                        <SidebarMenuButton
                          isActive={href === pathname}
                          render={<Link href={href as Route} />}
                        >
                          <Globe className="size-4" />
                          <span className="truncate">{domain}</span>
                        </SidebarMenuButton>
                      </SidebarDomainTooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenuSub>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
