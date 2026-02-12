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
import { ArrowUpRight, CandlestickChart, Layers2, Radar } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

const NO_OP = () => undefined;

const marketRows = [
  { pair: 'launch.token.com', spread: '0.8%', velocity: '+18%' },
  { pair: 'claim.token.com', spread: '1.1%', velocity: '+22%' },
  { pair: 'mint.token.com', spread: '0.9%', velocity: '+16%' },
  { pair: 'airdrop.token.com', spread: '1.6%', velocity: '+11%' },
];

function VariantBContent() {
  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-[#040c14]/95 p-6 md:p-10">
      <div className="pointer-events-none absolute left-[-8%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-[20%] h-56 w-56 rounded-full bg-orange-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative grid gap-8 xl:grid-cols-[1.25fr_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42 }}
          className="space-y-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
            <Radar className="h-3.5 w-3.5" />
            Variant B / Market Grid
          </div>
          <h2 className="font-mono text-3xl uppercase tracking-tight text-slate-50 md:text-5xl">
            Run token naming like a live order book.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Publish campaigns with fast domain search, instant import checks,
            and conversion surfaces tuned for onchain product launches.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-cyan-200/30 bg-[#061223] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Active cohorts
              </p>
              <p className="mt-3 text-3xl font-semibold text-cyan-100">24</p>
            </div>
            <div className="rounded-xl border border-orange-200/35 bg-[#1a1210] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-200/80">
                Campaign fill rate
              </p>
              <p className="mt-3 text-3xl font-semibold text-orange-100">91%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.52, delay: 0.08 }}
          className="rounded-2xl border border-slate-200/20 bg-black/40 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Market Pulse
            </p>
            <CandlestickChart className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="space-y-2">
            {marketRows.map((row) => (
              <div
                key={row.pair}
                className="grid grid-cols-[1.3fr_0.8fr_0.8fr] items-center rounded-xl border border-slate-200/10 bg-slate-900/70 px-3 py-2.5"
              >
                <p className="truncate text-sm text-slate-100">{row.pair}</p>
                <p className="text-right text-xs text-slate-400">
                  {row.spread}
                </p>
                <p className="text-right text-xs font-semibold text-emerald-300">
                  {row.velocity}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200/30 bg-cyan-400/10 px-3 py-2.5 text-sm font-medium text-cyan-100">
            Open campaign dashboard
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </motion.div>
      </div>

      <div className="relative mt-8 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200/20 bg-slate-950/70 p-4">
          <Layers2 className="h-4 w-4 text-cyan-300" />
          <p className="mt-3 text-base font-medium text-slate-100">
            One flow for register + import
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/20 bg-slate-950/70 p-4">
          <CandlestickChart className="h-4 w-4 text-orange-300" />
          <p className="mt-3 text-base font-medium text-slate-100">
            Metrics-ready naming endpoints
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/20 bg-slate-950/70 p-4">
          <Radar className="h-4 w-4 text-emerald-300" />
          <p className="mt-3 text-base font-medium text-slate-100">
            Built for launch-day traffic spikes
          </p>
        </div>
      </div>
    </div>
  );
}

export const TokenComVariantBLanding: LandingComponent = ({ origin }) => {
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
          tagline="Trade-ready names for token communities"
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
          <div className="rounded-[2rem] border border-cyan-200/20 bg-[#050e1a]/85 px-4 pb-6 pt-2 backdrop-blur-xl">
            <div className="flex items-center justify-between py-5">
              <h2 className="font-mono text-xl uppercase tracking-wide text-cyan-100 md:text-2xl">
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
          <VariantBContent />
        )}
      </div>

      <FloatingCart
        searchMode={searchMode}
        importableDomains={importableDomains}
      />
    </div>
  );
};

TokenComVariantBLanding.displayName = 'TokenComVariantBLanding';
