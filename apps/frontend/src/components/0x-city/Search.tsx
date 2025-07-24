'use client';

import { useSearch } from '@/hooks/use-search';
import { config } from '@/lib/env';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback, useEffect } from 'react';
import FloatingCart from '../floating-cart';
import {
  type SearchComponent,
  SearchHeader,
  SearchInput,
  SearchResults,
} from '../search';
import { Alert, AlertDescription } from '../ui/shadcn/alert';
import { Landing } from './Landing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  eppAuthorizationCodesFormSchema,
  type EppAuthorizationCodesFormData,
} from '../search/types';
import { isDomainImportable } from '@namefi-astra/backend/trpc/types';
import { SearchMode } from '../search/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

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
    runSearch,
    searchMode,
    importQuery,
    isLoading,
    isError,
    error,
    hasData,
    domainInfos,
    domains,
  } = useSearch(parentDomain || undefined);

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

  if (!parentDomain) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className="relative flex gap-4 flex-col p-4 pb-0 pt-20">
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
          isLoading={isLoading}
          searchMode={searchMode}
          importQuery={importQuery}
          onSearch={runSearch}
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
        {query.length > 0 && (isLoading || hasData || isError) ? (
          <>
            <div className="backdrop-blur-3xl bg-black/20 px-4 pb-4 relative">
              <div className="flex flex-col md:flex-row justify-between items-center py-5">
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
              />
            </div>
            <div className="sticky bottom-5 flex justify-center mt-4 px-4">
              <FloatingCart
                searchMode={searchMode}
                importableDomains={importableDomains}
                onBusyChange={setIsBusy}
              />
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
