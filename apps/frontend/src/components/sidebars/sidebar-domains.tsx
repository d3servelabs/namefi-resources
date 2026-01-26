'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/shadcn/sidebar';
import { ChevronRight, Globe, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface RecentDomainsProps {
  name: string;
  domains: string[];
}

export function SidebarDomains({ name, domains }: RecentDomainsProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        <Collapsible
          asChild={true}
          defaultOpen={true}
          className="w-full group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild={true}>
              <SidebarMenuButton>
                <History className="size-4" />
                <span className="whitespace-nowrap">{name}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {domains.map((domain) => {
                    const href = `/domains/${domain}`;
                    return (
                      <SidebarMenuItem key={domain}>
                        <SidebarMenuButton
                          tooltip={domain}
                          isActive={href === pathname}
                          asChild={true}
                        >
                          <Link href={href}>
                            <Globe className="size-4" />
                            <span className="truncate">{domain}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
