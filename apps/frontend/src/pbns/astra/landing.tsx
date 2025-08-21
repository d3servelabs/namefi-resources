'use client';

import { useSearch } from '@/hooks/use-search';
import { useState, useCallback, useEffect, useMemo } from 'react';
import FloatingCart from '@/components/floating-cart';
import {
  type LandingComponent,
  SearchHeader,
  SearchInput,
  SearchResults,
  SearchModeTabs,
} from '@/components/search';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SearchMode,
  eppAuthorizationCodesFormSchema,
  type EppAuthorizationCodesFormData,
} from '@/components/search';
import { isDomainImportable } from '@namefi-astra/backend/trpc/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';

// Main component
export const Landing: LandingComponent = ({ origin }) => {
  const [parentDomain, setParentDomain] = useState<string | undefined>(
    undefined,
  );
  const {
    registerSetParentDomain,
    registerSetSearchMode,
    consumePendingFreeMintsSearch,
    startFreeMintsSearchGuidance,
  } = useFreeMintsGuidance();

  const {
    query,
    setQuery,
    runSearch,
    searchMode,
    onSearchModeChange,
    importQuery,
    isLoading,
    isError,
    error,
    hasData,
    domainInfos,
    domains,
    freeClaimEligibility,
  } = useSearch(parentDomain);

  // Handle initial search from query parameters
  useSearchFromQuery(setQuery, runSearch);

  // Form for EPP authorization codes
  const form = useForm<EppAuthorizationCodesFormData>({
    resolver: zodResolver(eppAuthorizationCodesFormSchema),
    defaultValues: {
      eppAuthorizationCodes: {},
    },
  });

  const [isBusy, setIsBusy] = useState(false);

  // Initialize form with auth codes from importQuery
  const initializeEppCodes = useCallback(() => {
    if (importQuery && importQuery.size > 0) {
      const initialCodes: Record<string, string> = {};
      importQuery.forEach((query, domain) => {
        if (query.eppAuthorizationCode) {
          initialCodes[domain] = query.eppAuthorizationCode;
        }
      });
      form.reset({ eppAuthorizationCodes: initialCodes });
    }
  }, [importQuery, form]);

  // Initialize when importQuery changes
  useEffect(() => {
    initializeEppCodes();
  }, [initializeEppCodes]);

  // Register setters so other components can update via context
  useEffect(() => {
    registerSetParentDomain(setParentDomain);
  }, [registerSetParentDomain]);

  useEffect(() => {
    registerSetSearchMode((mode) => onSearchModeChange(mode as SearchMode));
  }, [registerSetSearchMode, onSearchModeChange]);

  // Check for pending guidance after navigation
  useEffect(() => {
    const pending = consumePendingFreeMintsSearch();
    if (pending) {
      // Small delay to ensure all handlers are registered
      setTimeout(() => {
        startFreeMintsSearchGuidance(pending);
      }, 0);
    }
  }, [consumePendingFreeMintsSearch, startFreeMintsSearchGuidance]);

  // Handle EPP authorization code changes
  const handleEppCodeChange = useCallback(
    (domain: NamefiNormalizedDomain, eppCode: string) => {
      form.setValue('eppAuthorizationCodes', {
        ...form.getValues('eppAuthorizationCodes'),
        [domain]: eppCode,
      });
    },
    [form],
  );

  // Get current EPP authorization codes
  const eppAuthorizationCodes = form.watch('eppAuthorizationCodes');

  // Calculate importable domains for FloatingCart
  const importableDomains = useMemo(() => {
    if (searchMode !== SearchMode.IMPORT || !domains || !domainInfos) {
      return [];
    }

    return domains
      .map((domain) => {
        const availabilityInfo = domainInfos.get(domain);
        const eppCode = eppAuthorizationCodes[domain];

        if (!availabilityInfo || !eppCode || !eppCode.trim()) return null;

        if (!isDomainImportable(availabilityInfo)) return null;

        return {
          domain,
          availabilityInfo,
          eppAuthorizationCode: eppCode,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [searchMode, domains, domainInfos, eppAuthorizationCodes]);

  if (!origin) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className="relative flex gap-4 flex-col p-4 pb-0 pt-20">
      <div className="flex flex-col items-center gap-8">
        <SearchHeader
          parentDomain={parentDomain}
          setParentDomain={setParentDomain}
          isFirstPartyOrigin={true}
          hideNetworkSelection={true}
        />
        <SearchModeTabs
          searchMode={searchMode}
          onSearchModeChange={onSearchModeChange}
        />
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          searchMode={searchMode}
          importQuery={importQuery}
          onSearch={runSearch}
          parentDomain={parentDomain}
          isFirstPartyOrigin={true}
          onClearParentDomain={() => setParentDomain(undefined)}
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
            eppAuthorizationCodes={eppAuthorizationCodes}
            onEppCodeChange={handleEppCodeChange}
            searchMode={searchMode}
            freeClaimEligibility={freeClaimEligibility}
          />

          <div className="sticky bottom-5 flex justify-center mt-4 px-4">
            <FloatingCart
              searchMode={searchMode}
              importableDomains={importableDomains}
              onBusyChange={setIsBusy}
            />
          </div>
        </>
      )}
    </div>
  );
};

Landing.displayName = 'AstraLanding';
