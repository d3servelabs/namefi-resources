import {
  Hero,
  WhyCVMatters,
  FamousPeople,
  WhoCanJoin,
  ExampleProfiles,
  Testimonials,
  CTA,
  CVHuntSection,
  type FamousPerson,
  type ExampleProfile,
  type Testimonial,
} from './index';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { useSearch } from '@/hooks/use-search';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import FloatingCart from '@/components/floating-cart';
import {
  type EppAuthorizationCodesFormData,
  SearchMode,
  eppAuthorizationCodesFormSchema,
  SearchResults,
} from '@/components/search';
import { isDomainImportable } from '@namefi-astra/backend/trpc/types';

export interface CVLandingConfig {
  /** The name (e.g., "taylor") - will be auto-capitalized for display */
  name: string;
  /** Array of rotating example names to show before the main name */
  rotatingNames: string[];
  /** Background image URL */
  backgroundImage: string;
  /** Array of famous people with that name */
  famousPeople: FamousPerson[];
  /** Array of example profiles */
  exampleProfiles: ExampleProfile[];
  /** Array of testimonials */
  testimonials: Testimonial[];
}

export const CVLanding = ({ config }: { config: CVLandingConfig }) => {
  const [searchEnabled] = useQueryState(
    'search',
    parseAsBoolean.withDefault(false),
  );
  // Generate derived values
  const displayName =
    config.name.charAt(0).toUpperCase() + config.name.slice(1);
  const domainName = namefiNormalizedDomainSchema.parse(`${config.name}.cv`);
  const huntUrl = `/hunt/domains/${domainName}`;

  // Search functionality
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
    freeClaimEligibility,
    refetchFreeClaimEligibility,
  } = useSearch(`${config.name}.cv`); // Filter for .cv domains

  // Handle initial search from query parameters
  useSearchFromQuery(setQuery, runSearch);

  // Form for EPP authorization codes
  const form = useForm<EppAuthorizationCodesFormData>({
    resolver: zodResolver(eppAuthorizationCodesFormSchema),
    defaultValues: {
      eppAuthorizationCodes: {},
    },
  });

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
    (domain: string, eppCode: string) => {
      form.setValue('eppAuthorizationCodes', {
        ...form.getValues('eppAuthorizationCodes'),
        [domain]: eppCode,
      });
    },
    [form],
  );

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

  // Check if user is actively searching
  const isSearching = searchEnabled && query.trim().length > 0;
  const showSearchResults = isSearching && (isLoading || hasData || isError);

  return (
    <>
      {/* Hero with search or hunt widget */}
      <Hero
        name={config.name}
        rotatingNames={config.rotatingNames}
        backgroundImage={config.backgroundImage}
        huntUrl={huntUrl}
        searchEnabled={searchEnabled}
        searchProps={
          searchEnabled
            ? {
                query,
                setQuery,
                runSearch,
                isLoading,
                searchMode,
                importQuery,
                hasSearchResults: showSearchResults,
              }
            : undefined
        }
      />

      {/* Search Results */}
      {searchEnabled && showSearchResults && (
        <div className="relative flex gap-4 flex-col p-4 pb-0 -mt-88">
          <div className="-mx-4">
            <div className="backdrop-blur-3xl bg-slate-900/20 px-4 pb-4 relative">
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
                freeClaimEligibility={freeClaimEligibility}
              />
            </div>

            <div className="sticky bottom-5 flex justify-center mt-4 px-4">
              <FloatingCart
                searchMode={searchMode}
                importableDomains={importableDomains}
              />
            </div>
          </div>
        </div>
      )}

      {/* Original CV content when not searching or search disabled */}
      {(!searchEnabled || !isSearching) && (
        <>
          <CVHuntSection name={config.name} />

          <FamousPeople name={displayName} famousPeople={config.famousPeople} />

          <WhoCanJoin name={displayName} />

          <ExampleProfiles exampleProfiles={config.exampleProfiles} />

          <Testimonials name={displayName} testimonials={config.testimonials} />

          <WhyCVMatters />

          <CTA name={config.name} huntUrl={huntUrl} />
        </>
      )}
    </>
  );
};
