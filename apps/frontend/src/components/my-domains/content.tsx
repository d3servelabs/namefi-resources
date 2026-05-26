'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { groupBy } from 'ramda';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { MyPreviouslyOwnedDomainsContent } from '@/components/my-previously-owned-domains';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { useTRPC } from '@/lib/trpc';
import { orderStatusSchema } from '@namefi-astra/common/shared-schemas';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { MyDomainsEmptyPlaceholder } from './empty-placeholder';
import { MyDomainsTable } from './table';
import { OtherWalletOrdersTable } from './other-wallet-orders-table';
import { isDomainPossiblyRenewable } from './utils';

// Heavy: pulls the marketplace adapter factory + every adapter via dynamic
// imports. Keep it out of the /domains app-shell bundle.
const MarketplaceOrdersTab = dynamic(
  () =>
    import('./marketplace-orders/marketplace-orders-tab').then(
      (m) => m.MarketplaceOrdersTab,
    ),
  { ssr: false },
);

const MY_DOMAINS_FLAG_DEFINITIONS: FeatureFlagDefinition[] = [
  {
    key: 'marketplace_orders',
    label: 'Marketplace Orders',
    description:
      'show the "My Listings & Offers" tab on /domains (cross-marketplace order view)',
    scope: 'page',
    pageKey: 'users',
    defaultValue: false,
  },
];

export const MyDomainsContent = () => {
  useRegisterAdminFlags(MY_DOMAINS_FLAG_DEFINITIONS);
  const [marketplaceOrdersEnabled] = useAdminFeatureFlag(
    MY_DOMAINS_FLAG_DEFINITIONS[0],
  );

  const trpc = useTRPC();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const { data: _domains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(void 0, {
      placeholderData: (prev) => prev,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const { data: orderItems } = useQuery(
    trpc.orders.getOrderItems.queryOptions(),
  );

  const processingOrderItems = useMemo(() => {
    if (!orderItems) return [];
    return orderItems.filter((item) =>
      ['CREATED', 'PROCESSING'].includes(item.status ?? ''),
    );
  }, [orderItems]);

  const ownedDomainNames = useMemo(
    () => new Set(_domains.map((domain) => domain.normalizedDomainName)),
    [_domains],
  );

  const otherWalletOrderItems = useMemo(() => {
    if (!orderItems) {
      return [];
    }
    if (!linkedWalletsReady) {
      return [];
    }
    const linkedWalletSet = new Set(
      linkedWalletAddresses.map((address) => address.toLowerCase()),
    );
    return orderItems.filter((item) => {
      if (item.status !== orderStatusSchema.enum.SUCCEEDED) {
        return false;
      }
      if (!item.nftWalletAddress) {
        return false;
      }
      if (ownedDomainNames.has(item.normalizedDomainName)) {
        return false;
      }
      return !linkedWalletSet.has(item.nftWalletAddress.toLowerCase());
    });
  }, [linkedWalletAddresses, linkedWalletsReady, orderItems, ownedDomainNames]);

  const hasOtherWalletOrders = otherWalletOrderItems.length > 0;

  const { activeDomains, inactiveDomains } = useMemo(() => {
    const { activeDomains, expiredDomains, otherDomains } = groupBy(
      (domain) => {
        const expirationDate = domain.expirationDate
          ? new Date(domain.expirationDate)
          : null;
        const canBeRenewed = isDomainPossiblyRenewable(expirationDate);
        const isExpired =
          expirationDate !== null
            ? differenceInDays(expirationDate, new Date()) < 0
            : false;

        if (canBeRenewed && !isExpired) {
          return 'activeDomains';
        }
        if (!canBeRenewed && isExpired) {
          return 'expiredDomains';
        }
        return 'otherDomains';
      },
      _domains,
    );
    return {
      activeDomains: activeDomains ?? [],
      inactiveDomains: [...(expiredDomains ?? []), ...(otherDomains ?? [])],
    };
  }, [_domains]);

  if (
    activeDomains.length === 0 &&
    inactiveDomains.length === 0 &&
    processingOrderItems.length === 0 &&
    otherWalletOrderItems.length === 0 &&
    // Don't show the global empty placeholder when the marketplace-orders tab
    // is enabled — a buyer-only user (no owned domains) still has meaningful
    // outgoing offers to see.
    !marketplaceOrdersEnabled
  ) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <div className="space-y-4">
      {processingOrderItems.length > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            ⏳{' '}
            {processingOrderItems
              .map((item) => item.normalizedDomainName)
              .join(', ')}
          </span>{' '}
          are being processed. Visit{' '}
          <Link href="/orders" className="text-primary hover:underline">
            Orders
          </Link>{' '}
          to see their status.
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="w-fit">
          <TabsTrigger value="active">My Domains</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Domains</TabsTrigger>
          <TabsTrigger value="previously-owned">
            Previously Owned Domains
          </TabsTrigger>
          {hasOtherWalletOrders && (
            <TabsTrigger value="other-wallets">On Other Wallets</TabsTrigger>
          )}
          {marketplaceOrdersEnabled && (
            <TabsTrigger value="marketplace-orders">
              My Listings & Offers
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>No active domains</EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable kind="active" domains={activeDomains} />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {inactiveDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>
                No inactive domains
              </EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable kind="inactive" domains={inactiveDomains} />
          )}
        </TabsContent>

        {hasOtherWalletOrders && (
          <TabsContent value="other-wallets" className="mt-4">
            <OtherWalletOrdersTable items={otherWalletOrderItems} />
          </TabsContent>
        )}

        <TabsContent value="previously-owned" className="mt-4">
          <MyPreviouslyOwnedDomainsContent />
        </TabsContent>

        {marketplaceOrdersEnabled && (
          <TabsContent value="marketplace-orders" className="mt-4">
            <MarketplaceOrdersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
