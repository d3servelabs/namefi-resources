'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import { useRecentDomains } from '@/hooks/use-recent-domains';
import { cn } from '@namefi-astra/ui/lib/cn';
import { config } from '@/lib/env';
import { useTRPC } from '@/lib/trpc';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import {
  type FC,
  type HTMLAttributes,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  EmailRequiredModal,
  DNS_MANAGEMENT_EMAIL_REQUIRED,
} from '../dialogs/email-required-dialog';
import { DnsOverviewPanel } from './panels/dns/dns-overview-panel';
import { DnsRecordsPanel } from './panels/dns/dns-records-panel';
import { DnssecPanel } from './panels/dnssec/dnssec-panel';
import { DomainConfigAndPrefs } from './panels/domain-config-and-prefs/domain-config-and-prefs';
import { NameserversPanel } from './panels/nameservers/nameservers-panel';
import { useAuth } from '@/hooks/use-auth';
export type DomainManagementProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DomainManagement: FC<DomainManagementProps> = ({
  domain,
  className,
  ...rest
}: DomainManagementProps) => {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const requestedSection = searchParams.get('section');

  // Check if domain matches any third-party hostname
  const isPbn = useMemo(
    () =>
      config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.some((hostname) =>
        domain.endsWith(hostname),
      ),
    [domain],
  );

  // Set default tab based on whether it's a third-party hostname
  const defaultTab = isPbn ? 'dns-management' : 'dns-overview';
  const [currentTab, setCurrentTab] = useState(() => {
    if (
      requestedTab === 'dns-overview' ||
      requestedTab === 'dns-records' ||
      requestedTab === 'dns-management'
    ) {
      return requestedTab;
    }
    return defaultTab;
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { hasEmail } = useEmailPrompt();
  const { isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const trpc = useTRPC();
  const { data: isDomainOwnedByCurrentUser } = useSuspenseQuery(
    trpc.users.isDomainOwnedByCurrentUser.queryOptions({
      normalizedDomainName: domain,
    }),
  );
  const {
    data: { nft },
  } = useSuspenseQuery(
    trpc.domainConfig.getDomainOwnerWallet.queryOptions({
      domainName: domain,
    }),
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

  // Show email modal only after auth is loaded and user doesn't have email
  useEffect(() => {
    if (!isAuthLoading && !hasEmail) {
      setShowEmailModal(true);
    }
  }, [hasEmail, isAuthLoading]);

  useEffect(() => {
    if (
      requestedTab !== 'dns-overview' &&
      requestedTab !== 'dns-records' &&
      requestedTab !== 'dns-management'
    ) {
      return;
    }
    setCurrentTab((prev) => (prev === requestedTab ? prev : requestedTab));
  }, [requestedTab]);

  const handleTabChange = (value: string) => {
    // If user doesn't have email, don't allow tab changes
    if (!hasEmail) {
      setShowEmailModal(true);
      return;
    }
    setCurrentTab(value);
  };

  const handleGoBack = () => {
    router.back();
  };
  const showDnsTable =
    domainSupportedFeatures?.dnsManagement?.enabled &&
    domainSupportedFeatures?.dnsManagement?.config.showPanel;

  const showNameservers =
    domainSupportedFeatures?.nameserversManagement?.enabled &&
    domainSupportedFeatures?.nameserversManagement?.config.showPanel;
  const showDnssec =
    domainSupportedFeatures?.dnssecManagement?.enabled &&
    domainSupportedFeatures?.dnssecManagement?.config.showPanel;
  const showDomainPreferences =
    domainSupportedFeatures?.domainPreferencesManagement?.enabled &&
    domainSupportedFeatures?.domainPreferencesManagement?.config.showPanel;

  const showDnsManagement =
    showNameservers || showDnssec || showDomainPreferences;

  useEffect(() => {
    if (requestedSection !== 'forward-to') {
      return;
    }
    if (currentTab !== 'dns-management') {
      return;
    }
    if (!showDomainPreferences) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      document
        .getElementById('forward-to')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(raf);
  }, [requestedSection, currentTab, showDomainPreferences]);

  return (
    <div className={cn('', className)} {...rest}>
      <EmailRequiredModal
        isOpen={showEmailModal}
        onOpenChange={setShowEmailModal}
        title={DNS_MANAGEMENT_EMAIL_REQUIRED.title}
        description={DNS_MANAGEMENT_EMAIL_REQUIRED.description}
        actionText={DNS_MANAGEMENT_EMAIL_REQUIRED.actionText}
        dismissible={false}
        onGoBack={handleGoBack}
      />

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
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className="mb-8">
                <TabsTrigger value="dns-overview">Domain Overview</TabsTrigger>

                {showDnsTable && (
                  <TabsTrigger value="dns-records">DNS Records</TabsTrigger>
                )}
                {showDnsManagement && (
                  <TabsTrigger value="dns-management">
                    DNS Management
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="dns-overview">
                <DnsOverviewPanel
                  domain={domain as PunycodeDomainName}
                  nftChainId={nft.chainId}
                />
              </TabsContent>

              {showDnsTable && (
                <TabsContent value="dns-records">
                  <DnsRecordsPanel domain={domain} />
                </TabsContent>
              )}

              {showDnsManagement && (
                <TabsContent value="dns-management">
                  <div className="flex flex-col gap-4">
                    <NameserversPanel
                      domainName={domain as PunycodeDomainName}
                      nftChainId={nft.chainId}
                    />

                    <DnssecPanel domainName={domain as PunycodeDomainName} />
                    <DomainConfigAndPrefs
                      domainName={domain as PunycodeDomainName}
                    />
                  </div>
                </TabsContent>
              )}
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
              <Button
                render={(props) => (
                  <a
                    {...props}
                    href={
                      domainSupportedFeatures.domainManagement.config.redirectTo
                    }
                  >
                    {props.children}
                  </a>
                )}
                nativeButton={false}
                variant="outline"
              >
                Redirect to Registrar
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

export const ComingSoonCard = ({ title }: { title: string }) => {
  return (
    <Card className={cn('bg-zinc-900 border-zinc-800')}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="text-center py-12">Coming Soon ...</div>
    </Card>
  );
};
