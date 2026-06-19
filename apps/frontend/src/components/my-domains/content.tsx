'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import {
  MARKETPLACE_LISTINGS_FLAG,
  useBooleanOpenFeatureFlag,
} from '@/lib/openfeature-flags';
import { orderStatusSchema } from '@namefi-astra/common/shared-schemas';
import { MyDomainsEmptyPlaceholder } from './empty-placeholder';
import { LoadingSkeletons } from './loading-skeletons';
import { MyDomainsTable } from './table';
import {
  type MakerListingRow,
  makerListingKey,
  useMyMakerListings,
} from './marketplace-orders/use-maker-orders';
import { OtherWalletOrdersTable } from './other-wallet-orders-table';
import { isDomainPossiblyRenewable } from './utils';
import type { Address } from 'viem';

// Heavy: pulls the marketplace adapter factory + every adapter via dynamic
// imports. Keep it out of the /domains app-shell bundle.
const MarketplaceOrdersTab = dynamic(
  () =>
    import('./marketplace-orders/marketplace-orders-tab').then(
      (m) => m.MarketplaceOrdersTab,
    ),
  { ssr: false },
);

export const MyDomainsContent = () => {
  const t = useTranslations('domains');
  const marketplaceOrdersEnabled = useBooleanOpenFeatureFlag(
    MARKETPLACE_LISTINGS_FLAG,
  );

  const trpc = useTRPC();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const { data: _domains, isLoading: isDomainsLoading } = useQuery({
    ...trpc.users.getCurrentUserDomains.queryOptions(void 0, {
      placeholderData: (prev) => prev,
      trpc: { context: { skipBatch: true } },
    }),
  });
  const domains = _domains ?? [];

  const { data: orderItems } = useQuery({
    ...trpc.orders.getOrderItems.queryOptions(),
  });

  const processingOrderItems = useMemo(() => {
    if (!orderItems) return [];
    return orderItems.filter((item) =>
      ['CREATED', 'PROCESSING'].includes(item.status ?? ''),
    );
  }, [orderItems]);

  const ownedDomainNames = useMemo(
    () => new Set(domains.map((domain) => domain.normalizedDomainName)),
    [domains],
  );

  // Active marketplace listings for the user's wallets, keyed by chain+tokenId
  // so the domains table can show a per-row listing badge (tokenId alone is
  // ambiguous across chains). Gated on the marketplace flag — when off, the
  // query never runs and the column is hidden. Note: this
  // fans out across chains/wallets on /domains load (the cost of showing listing
  // status inline rather than behind the "My Listings & Offers" tab).
  const makerListings = useMyMakerListings({
    walletAddresses: linkedWalletAddresses as Address[],
    enabled: marketplaceOrdersEnabled && linkedWalletsReady,
  });
  const listingByChainToken = useMemo(() => {
    if (!marketplaceOrdersEnabled) return undefined;
    const map = new Map<string, MakerListingRow>();
    for (const row of makerListings.data) {
      const key = makerListingKey(row.chainId, row.listing.tokenId);
      if (!map.has(key)) {
        map.set(key, row);
      }
    }
    return map;
  }, [makerListings.data, marketplaceOrdersEnabled]);

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
      domains,
    );
    return {
      activeDomains: activeDomains ?? [],
      inactiveDomains: [...(expiredDomains ?? []), ...(otherDomains ?? [])],
    };
  }, [domains]);

  if (isDomainsLoading || !_domains) {
    return <LoadingSkeletons />;
  }

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
          {t.rich('processingBanner', {
            domains: () => (
              <span className="font-medium text-foreground">
                ⏳{' '}
                {processingOrderItems
                  .map((item) => item.normalizedDomainName)
                  .join(', ')}
              </span>
            ),
            ordersLink: (chunks) => (
              <Link href="/orders" className="text-primary hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </div>
      )}

      <Tabs defaultValue="active">
        {/* On a phone the tab labels don't fit on one line, so let the strip
            wrap to a second row instead of overflowing the viewport. Desktop
            (sm+) keeps the single-row segmented control. */}
        <TabsList className="w-fit max-sm:h-auto! max-sm:w-full max-sm:flex-wrap max-sm:justify-start max-sm:gap-1">
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="inactive">{t('tabs.inactive')}</TabsTrigger>
          <TabsTrigger value="previously-owned">
            {t('tabs.previouslyOwned')}
          </TabsTrigger>
          {hasOtherWalletOrders && (
            <TabsTrigger value="other-wallets">
              {t('tabs.otherWallets')}
            </TabsTrigger>
          )}
          {marketplaceOrdersEnabled && (
            <TabsTrigger value="marketplace-orders">
              {t('tabs.marketplaceOrders')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>
                {t('emptyActive')}
              </EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable
              kind="active"
              domains={activeDomains}
              listingByChainToken={listingByChainToken}
            />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {inactiveDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>
                {t('emptyInactive')}
              </EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable
              kind="inactive"
              domains={inactiveDomains}
              listingByChainToken={listingByChainToken}
            />
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
