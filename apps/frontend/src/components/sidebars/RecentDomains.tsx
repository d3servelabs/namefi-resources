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
} from '@/components/ui/shadcn/sidebar';
import { ChevronDown, Globe } from 'lucide-react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useCallback, useState } from 'react';

interface RecentDomainsProps {
  domains: string[];
}

export function RecentDomains({ domains }: RecentDomainsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [, setDomain] = useQueryState('domain');

  const handleDomain = useCallback(
    (domain: string) => () => {
      setDomain(domain);
    },
    [setDomain],
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <SidebarGroup>
        <CollapsibleTrigger asChild={true}>
          <div className="flex items-center justify-between px-4 py-2 cursor-pointer">
            <span className="text-xs text-zinc-500">Recent domains</span>
            <ChevronDown
              className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? '' : 'transform -rotate-90'}`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {domains.map((domain) => (
                <SidebarMenuItem key={domain}>
                  <SidebarMenuButton
                    onClick={handleDomain(domain)}
                    asChild={true}
                  >
                    <Link href={`/dns?domain=${domain}`}>
                      <Globe className="h-4 w-4" />
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
