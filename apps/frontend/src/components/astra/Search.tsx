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
import { useState } from 'react';
import FloatingCart from '../floating-cart';
import {
  type SearchComponent,
  SearchHeader,
  SearchInput,
  SearchResults,
} from '../search';

// Main component
export const Search: SearchComponent = ({ originInfo }) => {
  const [parentDomain, setParentDomain] = useState<string | undefined>(() => {
    if (originInfo.isFirstPartyOrigin) {
      return undefined; // All Networks
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
  const {
    isCartDataLoading,
    isAddingToCart,
    isRemovingFromCart,
    isDomainInCart,
    handleDomainAction,
  } = useCart();
  const { activeTab, setActiveTab, filteredDomains } = useDomainFilters(
    domains,
    isDomainInCart,
  );

  if (!originInfo) {
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
          hideNetworkSelection={true}
        />
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isSearchLoading || areSuggestionsLoading}
          onSearch={() => refetch()}
        />
      </div>

      {query.length > 0 && (
        <>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-between items-center py-5">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              <TabsList className="grid grid-cols-4 backdrop-blur-2xl rounded-md bg-black/50">
                <TabsTrigger className="py-2 px-3 w-32 rounded-sm" value="all">
                  All
                </TabsTrigger>
                <TabsTrigger
                  className="py-2 px-3 w-32 rounded-sm"
                  value="available"
                >
                  Available
                </TabsTrigger>
                <TabsTrigger
                  className="py-2 px-3 w-32 rounded-sm"
                  value="unavailable"
                >
                  Unavailable
                </TabsTrigger>
                <TabsTrigger className="py-2 px-3 w-32 rounded-sm" value="cart">
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
                isDomainInCart={isDomainInCart}
                handleDomainAction={handleDomainAction}
                isAddingToCart={isAddingToCart}
                isRemovingFromCart={isRemovingFromCart}
                isCartLoading={isCartDataLoading}
                parentDomain={parentDomain}
              />
            </TabsContent>
          </Tabs>
          <div className="sticky bottom-5 flex justify-center mt-4 px-4">
            <FloatingCart />
          </div>
        </>
      )}
    </div>
  );
};

Search.displayName = 'AstraSearch';
