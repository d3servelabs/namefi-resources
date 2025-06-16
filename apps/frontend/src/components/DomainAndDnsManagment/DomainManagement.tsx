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
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { type FC, type HTMLAttributes, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/shadcn/alert';
import { Button } from '../ui/shadcn/button';
import { Card, CardHeader, CardTitle } from '../ui/shadcn/card';
import { DnsRecordsPanel } from './Panels/DNS/DnsRecordsPanel';
import { DnssecPanel } from './Panels/DNSSEC/DnssecPanel';
import { NameserversPanel } from './Panels/Nameservers/NameserversPanel';
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
    trpc.domainConfig.getDomainSupportedFeatures.queryOptions(
      {
        normalizedDomainName: domain,
      },
      {
        refetchInterval: 10000,
      },
    ),
  );

  useRecentDomains({
    newlyVisitedDomain: domain,
  });

  const nameserversManagement = useMemo(() => {
    return (
      domainSupportedFeatures.nameserversManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);

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
                <TabsTrigger value="dns-management">DNS Management</TabsTrigger>
              </TabsList>

              <TabsContent value="dns-records">
                <DnsRecordsPanel domain={domain} />
              </TabsContent>

              <TabsContent value="dns-management">
                <div className="flex flex-col gap-4">
                  {nameserversManagement.config.showPanel ? (
                    nameserversManagement.enabled ? (
                      <NameserversPanel
                        domainName={domain as PunycodeDomainName}
                      />
                    ) : nameserversManagement.config.message ? (
                      <Card className={cn('bg-zinc-900 border-zinc-800')}>
                        <CardHeader>
                          <CardTitle>Nameservers Management</CardTitle>
                        </CardHeader>
                        <div
                          className="text-center py-12"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml:
                          dangerouslySetInnerHTML={{
                            __html: nameserversManagement.config.message,
                          }}
                        />
                      </Card>
                    ) : (
                      <ComingSoonCard title="Nameservers Management" />
                    )
                  ) : undefined}

                  <DnssecPanel domainName={domain as PunycodeDomainName} />
                </div>
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

export const ComingSoonCard = ({
  title,
}: {
  title: string;
}) => {
  return (
    <Card className={cn('bg-zinc-900 border-zinc-800')}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="text-center py-12">Coming Soon ...</div>
    </Card>
  );
};
