'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { useCart } from '@/hooks/landing/use-cart';
import {
  type DomainData,
  useDomainFilters,
} from '@/hooks/landing/use-domain-filters';
import { useSearch } from '@/hooks/landing/use-search';
import { config } from '@/lib/env';
import { createAsyncInterval } from '@/utils/createAsyncInterval';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import FloatingCart from '../floating-cart';
import {
  type SearchComponent,
  SearchHeader,
  SearchInput,
  SearchResults,
} from '../search';
import { Button } from '../ui/shadcn/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/shadcn/dialog';

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
  const {
    isCartDataLoading,
    isAddingToCart,
    isRemovingFromCart,
    isDomainInCart,
    handleDomainAction: handleDomainActionFromCart,
  } = useCart();
  const { activeTab, setActiveTab, filteredDomains } = useDomainFilters(
    domains,
    isDomainInCart,
  );

  const [redirectToRegistrar, setRedirectToRegistrar] = useState<
    DomainData | undefined
  >();
  const handleDomainAction = (domain: DomainData) => {
    if (domain.registrarKey) {
      setRedirectToRegistrar(domain);
    } else {
      handleDomainActionFromCart(domain);
    }
  };

  if (!originInfo) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className="relative flex gap-4 flex-col">
      {redirectToRegistrar && (
        <RegistrarRedirect
          domain={redirectToRegistrar}
          cancelRedirect={() => setRedirectToRegistrar(undefined)}
        />
      )}
      <div className="flex flex-col items-center gap-4">
        <SearchHeader
          parentDomain={parentDomain}
          setParentDomain={setParentDomain}
          isFirstPartyOrigin={originInfo.isFirstPartyOrigin}
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

const RegistrarRedirect = ({
  domain,
  cancelRedirect,
}: { domain: DomainData; cancelRedirect: () => void }) => {
  const [countdown, setCountdown] = useState(10);

  const redirect = useCallback(() => {
    window.location.href = `https://app.namefi.io/v3/payment?cart=${encodeURIComponent(domain.domain)}`;
  }, [domain.domain]);

  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      const interval = 1000;
      try {
        for await (const _ of createAsyncInterval(
          interval,
          abortController.signal,
          { maxCount: 10 },
        )) {
          setCountdown((countdown) => Math.max(countdown - 1, 0));
        }
        redirect();
      } catch (error) {
        console.error('error', error);
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [redirect]);
  const _cancelRedirect = useCallback(() => {
    toast.warning('User cancelled redirect');
    cancelRedirect();
  }, [cancelRedirect]);

  return (
    <Dialog open={true} modal={true}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Redirect to NamefiApp</DialogTitle>
          <DialogClose onClick={_cancelRedirect} />
        </DialogHeader>
        <div className="flex flex-col gap-4 w-full">
          <DialogDescription className="text-md font-medium text-gray-300">
            This domain is not available on Namefi Astra, but it is available on
            NamefiApp.
          </DialogDescription>
          <DialogDescription className="text-sm font-medium text-gray-400">
            You will be redirected to the registrar to complete the purchase. in{' '}
            {countdown} seconds
          </DialogDescription>
        </div>
        <DialogFooter>
          <Button onClick={redirect}>Redirect Now</Button>
          <Button onClick={_cancelRedirect}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
