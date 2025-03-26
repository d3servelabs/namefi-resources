'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { cn } from '@/lib/utils';
import type { FC, HTMLAttributes } from 'react';
import { DnsRecordsPanel } from './DnsRecordsPanel';

export type DnsManagementProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DnsManagement: FC<DnsManagementProps> = ({
  domain,
  className,
  ...rest
}: DnsManagementProps) => {
  return (
    <div className={cn('', className)} {...rest}>
      <Tabs defaultValue="dns-setting" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
              <div className="text-center py-12">
                Forwarding content would go here
              </div>
            </TabsContent>

            <TabsContent value="nameservers">
              <div className="text-center py-12">
                Nameservers content would go here
              </div>
            </TabsContent>

            <TabsContent value="dnssec">
              <div className="text-center py-12">
                DNSSEC content would go here
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="overview">
          <div className="text-center py-12">
            Overview content would go here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

DnsManagement.displayName = 'DnsManagement';
