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
import { useMemo, useState } from 'react';

interface RecentDomainsProps {
  name: string;
  domains: string[];
}

export function SidebarDomains({ name, domains }: RecentDomainsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { state } = useSidebar();

  const isCollapsed = useMemo(() => state === 'collapsed', [state]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <SidebarGroup>
        {!isCollapsed && (
          <CollapsibleTrigger asChild={true}>
            <div className="flex items-center justify-between px-4 py-2 cursor-pointer">
              <span className="text-xs text-zinc-500">{name}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-zinc-500 transition-transform',
                  !isOpen && 'transform -rotate-90',
                )}
              />
            </div>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {domains.map((domain) => (
                <SidebarMenuItem key={domain}>
                  <SidebarMenuButton tooltip={domain} asChild={true}>
                    <Link href={`/domain/${domain}`}>
                      <Globe className="size-4" />
                      <span className="truncate">{domain}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
