'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import { useRecentDomains } from '@/hooks/use-recent-domains';
import { cn } from '@namefi-astra/ui/lib/cn';
import { config } from '@/lib/env';
import { useTRPC } from '@/lib/trpc';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
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
import { DomainOverviewPanel } from './panels/dns/domain-overview-panel';
import { DnsRecordsPanel } from './panels/dns/dns-records-panel';
import { DnssecPanel } from './panels/dnssec/dnssec-panel';
import { DomainConfigAndPrefs } from './panels/domain-config-and-prefs/domain-config-and-prefs';
import { NameserversPanel } from './panels/nameservers/nameservers-panel';
import { useAuth } from '@/hooks/use-auth';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import dynamic from 'next/dynamic';

const MarketplacePanel = dynamic(
  () =>
    import('./panels/marketplace/marketplace-panel').then(
      (m) => m.MarketplacePanel,
    ),
  {
    ssr: false,
  },
);

export type DomainManagementProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

const DOMAIN_FLAG_DEFINITION: FeatureFlagDefinition[] = [
  {
    key: 'new_overview_page',
    label: 'New Overview Page',
    description: 'use the new overview page',
    scope: 'page',
    pageKey: 'users',
    defaultValue: true,
  },
  {
    key: 'marketplace_listing',
    label: 'Marketplace Listing',
    description: 'show the Marketplace tab on the domain detail page',
    scope: 'page',
    pageKey: 'users',
    defaultValue: false,
  },
];

export const DomainManagement: FC<DomainManagementProps> = ({
  domain,
  className,
  ...rest
}: DomainManagementProps) => {
  useRegisterAdminFlags(DOMAIN_FLAG_DEFINITION);

  const [newOverviewComponent] = useAdminFeatureFlag(DOMAIN_FLAG_DEFINITION[0]);
  const [marketplaceListingEnabled] = useAdminFeatureFlag(
    DOMAIN_FLAG_DEFINITION[1],
  );

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
  const defaultTab = isPbn ? 'dns-management' : 'domain-overview';
  const [currentTab, setCurrentTab] = useState(() => {
    if (
      requestedTab === 'domain-overview' ||
      requestedTab === 'dns-records' ||
      requestedTab === 'dns-management' ||
      (requestedTab === 'marketplace' && marketplaceListingEnabled)
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

  // A domain that's exportable to another registrar can't be listed on a
  // marketplace — its NFT may be burned when the export completes. Fetched
  // here (only when the Marketplace tab is enabled) so a direct
  // `?tab=marketplace` link renders the right state without a loading flash.
  const domainExportDetailsQuery = useQuery(
    trpc.domainConfig.getDomainExportDetails.queryOptions(
      { domainName: domain },
      { enabled: marketplaceListingEnabled },
    ),
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
      requestedTab !== 'domain-overview' &&
      requestedTab !== 'dns-records' &&
      requestedTab !== 'dns-management' &&
      !(requestedTab === 'marketplace' && marketplaceListingEnabled)
    ) {
      return;
    }
    setCurrentTab((prev) => (prev === requestedTab ? prev : requestedTab));
  }, [requestedTab, marketplaceListingEnabled]);

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
      <div className="my-2 flex items-center gap-3">
        <h1 className="text-4xl font-bold font-mono">
          {capitalizeFirstLetter(domain)}
        </h1>
        <NotificationsBell
          variant="inline"
          filter={{ type: 'domain', identifier: domain }}
          autoSurfaceOnIncrease
        />
      </div>

      {domainSupportedFeatures.domainManagement.enabled ? (
        <Tabs defaultValue="dns-setting" className="w-full">
          <MainTabs />

          <TabsContent value="dns-setting">
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className="border-1 border-brand-primary/5 bg-gradient-to-r from-brand-primary/15 via-transparent to-brand-secondary/15 mb-8">
                <TabsTrigger value="domain-overview">
                  Domain Overview
                </TabsTrigger>

                {showDnsTable && (
                  <TabsTrigger value="dns-records">DNS Records</TabsTrigger>
                )}
                {showDnsManagement && (
                  <TabsTrigger value="dns-management">
                    DNS Management
                  </TabsTrigger>
                )}
                {marketplaceListingEnabled && (
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="domain-overview">
                {newOverviewComponent ? (
                  <DomainOverviewPanel
                    domain={domain as PunycodeDomainName}
                    nftChainId={nft.chainId}
                  />
                ) : (
                  <DnsOverviewPanel
                    domain={domain as PunycodeDomainName}
                    nftChainId={nft.chainId}
                  />
                )}
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

              {marketplaceListingEnabled && (
                <TabsContent value="marketplace">
                  <MarketplacePanel
                    domain={domain}
                    nftChainId={nft.chainId}
                    isReadyForExport={
                      domainExportDetailsQuery.data?.readyToExport ?? false
                    }
                    isExportStatusLoading={domainExportDetailsQuery.isLoading}
                  />
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
function capitalizeFirstLetter(text: string) {
  return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
}
