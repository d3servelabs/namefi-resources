'use client';

import { useStreamingSearch } from '@/hooks/use-streaming-search';
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
    runSearch,
    isLoading,
    isError,
    error,
    hasData,
    domainInfos,
    domains,
  } = useStreamingSearch(parentDomain || undefined);

  console.log({ domains, domainInfos, isLoading, hasData });

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
          isLoading={isLoading}
          onSearch={() => runSearch()}
        />
      </div>

      {query.length > 0 && (isLoading || hasData || isError) && (
        <>
          <div className="flex justify-between items-center py-5">
            <h2 className="text-2xl font-semibold">Search Results</h2>
          </div>

          <SearchResults
            isLoading={isLoading}
            isError={isError}
            error={error}
            hasData={hasData}
            domainInfos={domainInfos}
            domains={domains}
            query={query}
          />

          <div className="sticky bottom-5 flex justify-center mt-4 px-4">
            <FloatingCart />
          </div>
        </>
      )}
    </div>
  );
};

Search.displayName = 'AstraSearch';
