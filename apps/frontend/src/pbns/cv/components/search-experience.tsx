'use client';

import { SearchInput } from '@/components/search/search-input';
import {
  LazySearchResults,
  preloadSearchResults,
} from '@/components/search/lazy-search-results';
import {
  type EppAuthorizationCodesFormData,
  SearchMode,
  eppAuthorizationCodesFormSchema,
} from '@/components/search/types';
import { FloatingCart } from '@/components/floating-cart';
import { useSearch } from '@/hooks/use-search';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { isDomainImportable } from '@namefi-astra/common/domain-availability';
import { zodResolver } from '@hookform/resolvers/zod';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Hero } from './hero';
import type { CVLandingConfig } from './landing';

export function CVSearchExperience({
  config,
  huntUrl,
  children,
}: {
  config: CVLandingConfig;
  huntUrl: string;
  children: ReactNode;
}) {
  const {
    query,
    setQuery,
    runSearch,
    searchMode,
    importQuery,
    isLoading,
    isError,
    error,
    hasData,
    domainInfos,
    authoritativeDomainInfos,
    domains,
    freeClaimEligibility,
  } = useSearch(`${config.name}.cv`);

  useSearchFromQuery(setQuery, runSearch);

  const form = useForm<EppAuthorizationCodesFormData>({
    resolver: zodResolver(eppAuthorizationCodesFormSchema),
    defaultValues: {
      eppAuthorizationCodes: {},
    },
  });

  const initializeEppCodes = useCallback(() => {
    if (importQuery.size === 0) {
      return;
    }

    const initialCodes: Record<string, string> = {};
    importQuery.forEach((searchParams, domain) => {
      if (searchParams.eppAuthorizationCode) {
        initialCodes[domain] = searchParams.eppAuthorizationCode;
      }
    });
    form.reset({ eppAuthorizationCodes: initialCodes });
  }, [importQuery, form]);

  useEffect(() => {
    initializeEppCodes();
  }, [initializeEppCodes]);

  const handleEppCodeChange = useCallback(
    (domain: string, eppCode: string) => {
      form.setValue('eppAuthorizationCodes', {
        ...form.getValues('eppAuthorizationCodes'),
        [domain]: eppCode,
      });
    },
    [form],
  );

  const eppAuthorizationCodes = form.watch('eppAuthorizationCodes');

  const importableDomains = useMemo(() => {
    if (searchMode !== SearchMode.IMPORT || !authoritativeDomainInfos) {
      return [];
    }

    return domains
      .map((domain) => {
        const availabilityInfo = authoritativeDomainInfos.get(domain);
        const eppCode = eppAuthorizationCodes[domain];

        if (!availabilityInfo || !eppCode?.trim()) return null;

        if (!isDomainImportable(availabilityInfo)) return null;

        return {
          domain,
          availabilityInfo,
          eppAuthorizationCode: eppCode,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [searchMode, domains, authoritativeDomainInfos, eppAuthorizationCodes]);

  const isSearching = query.trim().length > 0;
  const showSearchResults = isSearching && (isLoading || hasData || isError);
  const parentDomain = useMemo(
    () => namefiNormalizedDomainSchema.parse(`${config.name}.cv`),
    [config.name],
  );

  useEffect(() => {
    if (isSearching) {
      preloadSearchResults();
    }
  }, [isSearching]);

  return (
    <>
      <Hero
        name={config.name}
        rotatingNames={config.rotatingNames}
        backgroundImage={config.backgroundImage}
        huntUrl={huntUrl}
        hasSearchResults={showSearchResults}
        searchSlot={
          <SearchInput
            query={query}
            setQuery={setQuery}
            isLoading={isLoading}
            searchMode={searchMode}
            onSearch={runSearch}
            parentDomain={parentDomain}
            onSearchIntent={preloadSearchResults}
          />
        }
      />

      {showSearchResults && (
        <div className="relative flex gap-4 flex-col p-4 pb-0 -mt-88">
          <div className="-mx-4">
            <div className="backdrop-blur-3xl bg-slate-900/20 px-4 pb-4 relative">
              <div className="flex flex-col md:flex-row justify-between items-center py-5">
                <h2 className="text-2xl font-semibold">Search Results</h2>
              </div>

              <LazySearchResults
                isLoading={isLoading}
                isError={isError}
                error={error}
                hasData={hasData}
                domainInfos={domainInfos}
                authoritativeDomainInfos={authoritativeDomainInfos}
                domains={domains}
                query={query}
                eppAuthorizationCodes={eppAuthorizationCodes}
                onEppCodeChange={handleEppCodeChange}
                searchMode={searchMode}
                freeClaimEligibility={freeClaimEligibility}
              />
            </div>
          </div>
        </div>
      )}

      {!isSearching && children}

      <FloatingCart
        searchMode={searchMode}
        importableDomains={importableDomains}
      />
    </>
  );
}
