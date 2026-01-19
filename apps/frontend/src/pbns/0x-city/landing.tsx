'use client';

import { useSearch } from '@/hooks/use-search';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useInView, motion, AnimatePresence } from 'motion/react';
import { FloatingCart } from '@/components/floating-cart';
import {
  type EppAuthorizationCodesFormData,
  type LandingComponent,
  SearchMode,
  eppAuthorizationCodesFormSchema,
  SearchHeader,
  SearchInput,
  SearchResults,
} from '@/components/search';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Content } from './content';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isDomainImportable } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import dynamic from 'next/dynamic';
import { useQueryState, parseAsBoolean } from 'nuqs';

const NewsletterForm = dynamic(
  () =>
    import('@/components/newsletter/newsletter-form').then(
      (module) => module.NewsletterForm,
    ),
  {
    ssr: false,
    loading: () => <div className="h-12 rounded-md bg-muted animate-pulse" />,
  },
);

const NO_OP = () => undefined;

// Main component
export const Landing: LandingComponent = ({ origin }) => {
  const newsletterRef = useRef<HTMLDivElement>(null);
  const [isNewsletterVisible, setNewsletterVisible] = useQueryState(
    'newsletter',
    parseAsBoolean.withDefault(false),
  );

  // Use InView to automatically scroll to newsletter when visible
  const isInView = useInView(newsletterRef, {
    once: false,
    margin: '-20% 0px -20% 0px',
  });

  // Scroll to newsletter when it becomes visible
  useEffect(() => {
    if (isNewsletterVisible && newsletterRef.current && !isInView) {
      newsletterRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isNewsletterVisible, isInView]);
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
  } = useSearch(origin.thirdPartyHostname || undefined);

  // Handle initial search from query parameters
  useSearchFromQuery(setQuery, runSearch);

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

  const { consumePendingFreeMintsSearch, startFreeMintsSearchGuidance } =
    useFreeMintsGuidance();

  // Check for pending guidance after navigation
  useEffect(() => {
    const pending = consumePendingFreeMintsSearch();
    if (pending) {
      startFreeMintsSearchGuidance(pending);
    }
  }, [consumePendingFreeMintsSearch, startFreeMintsSearchGuidance]);

  if (!origin.thirdPartyHostname) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className="relative flex gap-4 flex-col p-4 pb-0 pt-20">
      <div className="flex flex-col items-center gap-4">
        <SearchHeader
          parentDomain={origin.thirdPartyHostname}
          hideNetworkSelection={true}
          setParentDomain={NO_OP}
          isFirstPartyOrigin={false}
          tagline="Claim your citizenship for the future world"
        />
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          searchMode={searchMode}
          importQuery={importQuery}
          onSearch={runSearch}
          parentDomain={origin.thirdPartyHostname}
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
              freeClaimEligibility={freeClaimEligibility}
            />
          </div>
        ) : (
          <Content />
        )}

        {/* Newsletter Subscription Section - Hidden by default, shown via footer link */}
        <AnimatePresence mode="wait">
          {isNewsletterVisible && (
            <motion.div
              ref={newsletterRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="mt-16 mb-8 px-4 flex justify-center"
            >
              <div className="w-full max-w-screen-xl">
                <NewsletterForm
                  from="0x-city"
                  title="Stay in the Loop"
                  description="Get the latest updates on 0x.city domain releases, features, and announcements."
                  showNameField={true}
                  variant="default"
                  showCloseButton={true}
                  onClose={() => setNewsletterVisible(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <FloatingCart
        searchMode={searchMode}
        importableDomains={importableDomains}
      />
    </div>
  );
};

Landing.displayName = 'ZeroXCityLanding';
