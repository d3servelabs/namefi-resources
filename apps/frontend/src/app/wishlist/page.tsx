'use client';

import { useWishlist } from '@/hooks/use-wishlist';
import { useTRPC } from '@/lib/trpc';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useState, useEffect, useMemo } from 'react';
import { DomainCard } from '@/components/search/search';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { PageShell } from '@/components/page-shell';

export default function WishlistPage() {
  const { isLoading: isUserLoading } = useAuth();
  const { wishlistData, isWishlistLoading } = useWishlist();
  const trpc = useTRPC();

  const wishlistedDomains: NamefiNormalizedDomain[] = useMemo(
    () => wishlistData?.map((item) => item.normalizedDomainName) ?? [],
    [wishlistData],
  );

  // Progressive domain availability info
  const [domainInfos, setDomainInfos] = useState<
    Map<NamefiNormalizedDomain, DomainAvailabilityInfo>
  >(new Map());

  // Prune domainInfos when wishlist changes
  useEffect(() => {
    setDomainInfos((prev) => {
      const next = new Map();
      for (const domain of wishlistedDomains) {
        if (prev.has(domain)) {
          next.set(domain, prev.get(domain));
        }
      }
      return next;
    });
  }, [wishlistedDomains]);

  useSubscription({
    ...trpc.search.streamDomainAvailability.subscriptionOptions(
      { domains: wishlistedDomains },
      {
        enabled: wishlistedDomains.length > 0,
        onData: (info: DomainAvailabilityInfo) => {
          setDomainInfos((m) => new Map(m).set(info.domain, info));
        },
      },
    ),
  });

  const isLoading = isWishlistLoading || isUserLoading;

  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        My Wishlist
        {isWishlistLoading || isUserLoading ? (
          <Skeleton className="h-7 w-8 rounded-full" />
        ) : (
          <span className="inline-flex items-center justify-center text-base font-semibold bg-brand-primary text-white rounded-full h-7 w-8">
            {wishlistData?.length ?? 0}
          </span>
        )}
      </h1>
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <DomainCard key={i} />
          ))}
        </div>
      ) : wishlistedDomains.length === 0 ? (
        <div className="text-center text-muted-foreground mt-12">
          <p className="text-lg">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {wishlistedDomains.map((domain) => (
            <DomainCard
              key={domain}
              domain={domain}
              availabilityInfo={domainInfos.get(domain)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
