'use client';

import {
  type EppAuthorizationCodesFormData,
  type LandingComponent,
  SearchHeader,
  SearchInput,
  SearchMode,
  SearchResults,
  eppAuthorizationCodesFormSchema,
} from '@/components/search';
import { FloatingCart } from '@/components/floating-cart';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { useSearch } from '@/hooks/use-search';
import { zodResolver } from '@hookform/resolvers/zod';
import { isDomainImportable } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { motion } from 'motion/react';
import { BarChart3, Coins, Network, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

const NO_OP = () => undefined;

const proofPoints = [
  {
    label: 'Name claim latency',
    value: '< 700ms',
    icon: BarChart3,
  },
  {
    label: 'Wallet-aware checkouts',
    value: 'Built in',
    icon: Coins,
  },
  {
    label: 'Issuer-safe settlement',
    value: 'Auditable',
    icon: ShieldCheck,
  },
  {
    label: 'Distribution channels',
    value: 'Multi-chain',
    icon: Network,
  },
];

function VariantAContent() {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-amber-200/20 bg-[#0f1624]/90 px-6 py-8 md:px-10 md:py-12">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-[#f59e0b]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#2dd4bf]/25 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-5"
        >
          <p className="inline-flex w-fit rounded-full border border-[#f59e0b]/45 bg-[#f59e0b]/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#fde68a]">
            Variant A / Narrative
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Campaign-grade naming for teams shipping token products fast.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Use token.com to launch member passes, staking cohorts, and referral
            drops with names that convert like product endpoints.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, delay: 0.08 }}
          className="rounded-2xl border border-slate-200/20 bg-slate-950/65 p-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Launch sequence
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li className="rounded-xl border border-slate-200/20 bg-white/5 px-3 py-2">
              01. Reserve strategic names for creators and partners
            </li>
            <li className="rounded-xl border border-slate-200/20 bg-white/5 px-3 py-2">
              02. Open public claims with in-page search + cart checkout
            </li>
            <li className="rounded-xl border border-slate-200/20 bg-white/5 px-3 py-2">
              03. Track campaign momentum by naming cohort
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {proofPoints.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/20 bg-black/20 p-4"
          >
            <div className="flex items-center gap-2 text-slate-100">
              <Icon className="h-4 w-4 text-[#f59e0b]" />
              <p className="text-sm font-medium">{label}</p>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const TokenComVariantALanding: LandingComponent = ({ origin }) => {
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
    importQuery.forEach((importItem, domain) => {
      if (importItem.eppAuthorizationCode) {
        initialCodes[domain] = importItem.eppAuthorizationCode;
      }
    });

    form.reset({ eppAuthorizationCodes: initialCodes });
  }, [form, importQuery]);

  useEffect(() => {
    initializeEppCodes();
  }, [initializeEppCodes]);

  const handleEppCodeChange = useCallback(
    (domain: NamefiNormalizedDomain, eppCode: string) => {
      form.setValue('eppAuthorizationCodes', {
        ...form.getValues('eppAuthorizationCodes'),
        [domain]: eppCode,
      });
    },
    [form],
  );

  const eppAuthorizationCodes = form.watch('eppAuthorizationCodes');

  const importableDomains = useMemo(() => {
    if (searchMode !== SearchMode.IMPORT) {
      return [];
    }

    return domains
      .map((domain) => {
        const availabilityInfo = domainInfos.get(domain);
        const eppCode = eppAuthorizationCodes[domain];

        if (!availabilityInfo || !eppCode?.trim()) {
          return null;
        }

        if (!isDomainImportable(availabilityInfo)) {
          return null;
        }

        return {
          domain,
          availabilityInfo,
          eppAuthorizationCode: eppCode,
        };
      })
      .filter(
        (domain): domain is NonNullable<typeof domain> => domain !== null,
      );
  }, [domainInfos, domains, eppAuthorizationCodes, searchMode]);

  const { consumePendingFreeMintsSearch, startFreeMintsSearchGuidance } =
    useFreeMintsGuidance();

  useEffect(() => {
    const pending = consumePendingFreeMintsSearch();
    if (pending) {
      startFreeMintsSearchGuidance(pending);
    }
  }, [consumePendingFreeMintsSearch, startFreeMintsSearchGuidance]);

  if (!origin.thirdPartyHostname) {
    return null;
  }

  const shouldShowResults =
    query.length > 0 && (isLoading || hasData || isError);

  return (
    <div className="relative flex flex-col gap-6 px-4 pb-0 pt-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4">
        <SearchHeader
          parentDomain={origin.thirdPartyHostname}
          hideNetworkSelection={true}
          setParentDomain={NO_OP}
          isFirstPartyOrigin={false}
          tagline="Claim names that make token launches memorable"
          className="mt-20"
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
      </div>

      <div className="mx-auto -mb-1 w-full max-w-6xl">
        {shouldShowResults ? (
          <div className="rounded-3xl border border-amber-200/20 bg-[#0f172a]/75 px-4 pb-6 pt-2 backdrop-blur-xl">
            <div className="flex items-center justify-between py-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">
                Search Results
              </h2>
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
          <VariantAContent />
        )}
      </div>

      <FloatingCart
        searchMode={searchMode}
        importableDomains={importableDomains}
      />
    </div>
  );
};

TokenComVariantALanding.displayName = 'TokenComVariantALanding';
