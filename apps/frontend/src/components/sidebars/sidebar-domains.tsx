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
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
import { ChevronDown, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

interface RecentDomainsProps {
  name: string;
  domains: string[];
}

export function SidebarDomains({ name, domains }: RecentDomainsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { state } = useSidebar();

  const pathname = usePathname();

  const isCollapsed = useMemo(() => state === 'collapsed', [state]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <SidebarGroup>
        {!isCollapsed && (
          <CollapsibleTrigger asChild={true}>
            <div className="flex items-center justify-between px-4 py-2 cursor-pointer">
              <span className="text-xs">{name}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  !isOpen && 'transform -rotate-90',
                )}
              />
            </div>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
