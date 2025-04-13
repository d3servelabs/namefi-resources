'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { cn } from '@/lib/utils';
import { LocalStorageKeys } from '@/utils/localStorageKeys';
import { type FC, type HTMLAttributes, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { DnsRecordsPanel } from './DnsRecordsPanel';

export type DnsManagementProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DnsManagement: FC<DnsManagementProps> = ({
  domain,
  className,
  ...rest
}: DnsManagementProps) => {
  const [, setRecentDomains] = useLocalStorage(
    LocalStorageKeys.RECENT_DOMAINS,
    [domain] as string[],
  );

  useEffect(() => {
    setRecentDomains((prevRecentDomains) => {
      const filtered = prevRecentDomains.filter(
        (recentDomain) => recentDomain !== domain,
      );
      return [...filtered, domain];
    });
  }, [setRecentDomains, domain]);

  return (
    <div className={cn('', className)} {...rest}>
      <Tabs defaultValue="dns-setting" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-8">
          <TabsTrigger value="dns-setting">DNS Setting</TabsTrigger>
        </TabsList>

        <TabsContent value="dns-setting">
          <Tabs defaultValue="dns-records">
            <TabsList className="mb-8">
              <TabsTrigger value="dns-records">DNS Records</TabsTrigger>
              <TabsTrigger value="forwarding">Forwarding</TabsTrigger>
              <TabsTrigger value="nameservers">Nameservers</TabsTrigger>
              <TabsTrigger value="dnssec">DNSSEC</TabsTrigger>
            </TabsList>

            <TabsContent value="dns-records">
              <DnsRecordsPanel domain={domain} />
            </TabsContent>

            <TabsContent value="forwarding">
              <div className="text-center py-12">Coming Soon ...</div>
            </TabsContent>

            <TabsContent value="nameservers">
              <div className="text-center py-12">Coming Soon ...</div>
            </TabsContent>

            <TabsContent value="dnssec">
              <div className="text-center py-12">Coming Soon ...</div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

DnsManagement.displayName = 'DnsManagement';
