'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { useCart } from '@/hooks/landing/use-cart';
import { useDomainFilters } from '@/hooks/landing/use-domain-filters';
import { useSearch } from '@/hooks/landing/use-search';
import { config } from '@/lib/env';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import FloatingCart from '../floating-cart';
import {
  type SearchComponent,
  SearchHeader,
  SearchInput,
  SearchResults,
} from '../search';
import { Alert, AlertDescription } from '../ui/shadcn/alert';
import { Landing } from './Landing';

// Main component
export const Search: SearchComponent = ({ originInfo }) => {
  const [parentDomain, setParentDomain] = useState<string | undefined>(() => {
    if (originInfo.isFirstPartyOrigin) {
      return config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES[0];
    }

    if (originInfo.thirdPartyHostname) {
      return originInfo.thirdPartyHostname;
    }
    return undefined;
  });

  const {
    query,
    setQuery,
    domains,
    isSearchLoading,
    refetch,
    areSuggestionsLoading,
  } = useSearch(parentDomain);

  const { isDomainInCart } = useCart();

  const { activeTab, setActiveTab, filteredDomains } = useDomainFilters(
    domains,
    isDomainInCart,
  );

  const trpc = useTRPC();

  const { data: rolloutPercent, isLoading: isLoadingRolloutPercent } = useQuery(
    trpc.registry.get0xDotCityPercentageRollout.queryOptions(),
  );

  const shouldShowRolloutBanner = useMemo(() => {
    return (
      query.length === 0 && // hide when showing search results
      !isLoadingRolloutPercent &&
      rolloutPercent !== undefined &&
      rolloutPercent !== 100
    );
  }, [isLoadingRolloutPercent, query, rolloutPercent]);

  if (!parentDomain) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className="relative flex gap-4 flex-col">
      <div className="flex flex-col items-center gap-4">
        <SearchHeader
          parentDomain={parentDomain}
          setParentDomain={setParentDomain}
          isFirstPartyOrigin={originInfo.isFirstPartyOrigin}
          tagline="Claim your citizenship for the future world"
        />
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isSearchLoading}
          onSearch={() => refetch()}
        />
        {shouldShowRolloutBanner && (
          <Alert className="w-full max-w-3xl mx-auto bg-gray-700/80">
            <AlertDescription className="text-foreground">
              *We are making domain names available in waves. Currently,{' '}
              {rolloutPercent}% of domain names are available. Already use a 0x
              username elsewhere? Skip the line by using the claim feature
              below!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="-mx-4">
        {query.length > 0 ? (
          <>
            <div className="backdrop-blur-3xl bg-black/20 px-4 pb-4 relative">
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex flex-col md:flex-row justify-between items-center py-5">
                  <h2 className="text-2xl font-semibold">Search Results</h2>
                  <TabsList className="grid grid-cols-4 mt-4 md:mt-0 backdrop-blur-2xl rounded-md bg-black/50">
                    <TabsTrigger
                      className="py-2 px-3 md:w-32 rounded-sm"
                      value="all"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      className="py-2 px-3 md:w-32 rounded-sm"
                      value="available"
                    >
                      Available
                    </TabsTrigger>
                    <TabsTrigger
                      className="py-2 px-3 md:w-32 rounded-sm"
                      value="unavailable"
                    >
                      Unavailable
                    </TabsTrigger>
                    <TabsTrigger
                      className="py-2 px-3 md:w-32 rounded-sm"
                      value="cart"
                    >
                      In Cart
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-4">
                  <SearchResults
                    isLoading={isSearchLoading}
                    isLoadingMore={areSuggestionsLoading}
                    filteredDomains={filteredDomains}
                    query={query}
                    parentDomain={parentDomain}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <div className="sticky bottom-5 flex justify-center mt-4 px-4">
              <FloatingCart />
            </div>
          </>
        ) : (
          <Landing />
        )}
      </div>
    </div>
  );
};

Search.displayName = 'ZeroXCitySearch';
