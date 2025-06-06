'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { useRecentDomains } from '@/hooks/useRecentDomains';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { type FC, type HTMLAttributes, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/shadcn/alert';
import { Button } from '../ui/shadcn/button';
import { Card, CardHeader, CardTitle } from '../ui/shadcn/card';
import { DnsRecordsPanel } from './Panels/DNS/DnsRecordsPanel';
export type DomainManagementProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DomainManagement: FC<DomainManagementProps> = ({
  domain,
  className,
  ...rest
}: DomainManagementProps) => {
  const trpc = useTRPC();
  const { data: currentUserDomains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const isDomainOwnedByCurrentUser = useMemo(
    () =>
      currentUserDomains.some(
        (ownedDomain) => ownedDomain.normalizedDomainName === domain,
      ),
    [currentUserDomains, domain],
  );

  const {
    data: { features: domainSupportedFeatures },
  } = useSuspenseQuery(
    trpc.domainConfig.getDomainSupportedFeatures.queryOptions({
      normalizedDomainName: domain,
    }),
  );

  useRecentDomains({
    newlyVisitedDomain: domain,
  });

  return (
    <div className={cn('', className)} {...rest}>
      {isDomainOwnedByCurrentUser ? undefined : (
        <Alert
          variant="default"
          className="my-1 dark:bg-amber-500/50 bg-amber-200"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            This domain is owned by another user. You are viewing public
            information
          </AlertDescription>
        </Alert>
      )}
      <h1 className="text-4xl font-bold my-2">{domain}</h1>

      {domainSupportedFeatures.domainManagement.enabled ? (
        <Tabs defaultValue="dns-setting" className="w-full">
          <MainTabs />

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
      ) : (
        <Card className={cn('bg-zinc-900 border-zinc-800')}>
          <CardHeader>
            <CardTitle>Domain Not Migrated Yet</CardTitle>
          </CardHeader>
          <div className="text-center py-2 flex flex-col gap-4 items-center">
            <p
              className="text-zinc-200 text-md font-medium"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
              dangerouslySetInnerHTML={{
                __html:
                  domainSupportedFeatures.domainManagement.config.message ?? '',
              }}
            />
            {domainSupportedFeatures.domainManagement.config.redirectTo ? (
              <Button variant="outline" asChild={true}>
                <Link
                  href={
                    domainSupportedFeatures.domainManagement.config.redirectTo
                  }
                >
                  Redirect to Registrar
                </Link>
              </Button>
            ) : undefined}
          </div>
        </Card>
      )}
    </div>
  );
};

const showTabs = false;
const MainTabs = () => {
  return (
    <TabsList
      className={cn('w-full grid-cols-1 mb-8', showTabs ? 'grid' : 'hidden')}
    >
      <TabsTrigger value="dns-setting">DNS Setting</TabsTrigger>
    </TabsList>
  );
};
