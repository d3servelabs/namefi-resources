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
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

const NO_OP = () => undefined;

const deploymentCards = [
  {
    title: 'Investor Relations',
    body: 'dedicated.token.com for updates, decks, and event registration.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Partner Portal',
    body: 'partners.token.com as an identity layer for ecosystem operators.',
    icon: Building2,
  },
  {
    title: 'Member Programs',
    body: 'member.token.com names for loyalty and community segmentation.',
    icon: UsersRound,
  },
];

function VariantCContent() {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-200/30 bg-[#0a1512]/95 p-6 md:p-10">
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 -translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-lime-300/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48 }}
          className="space-y-5"
        >
          <p className="inline-flex rounded-full border border-emerald-200/45 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-100">
            Variant C / Institutional
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-emerald-50 md:text-5xl">
            Trust-forward token naming for teams operating at enterprise scale.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-emerald-100/80 md:text-lg">
            Token.com domains become deployment surfaces for partner onboarding,
            community infrastructure, and campaign accountability.
          </p>
          <div className="rounded-2xl border border-emerald-200/25 bg-black/25 p-4">
            <div className="flex items-center gap-2 text-emerald-100">
              <BadgeCheck className="h-4 w-4" />
              <p className="text-sm font-medium">
                Compliance-ready naming stack
              </p>
            </div>
            <p className="mt-2 text-sm text-emerald-100/80">
              Clear ownership records, secure registrar flows, and high-uptime
              infrastructure for business-critical launches.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.54, delay: 0.1 }}
          className="rounded-2xl border border-emerald-200/25 bg-[#0f201b]/80 p-5"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">
            Deployment map
          </p>
          <ul className="mt-4 space-y-3">
            <li className="rounded-xl border border-emerald-100/15 bg-black/20 px-3 py-2 text-sm text-emerald-50">
              Reserve strategic namespaces pre-launch
            </li>
            <li className="rounded-xl border border-emerald-100/15 bg-black/20 px-3 py-2 text-sm text-emerald-50">
              Open public search for contributors and customers
            </li>
            <li className="rounded-xl border border-emerald-100/15 bg-black/20 px-3 py-2 text-sm text-emerald-50">
              Monitor registrations by segment and campaign source
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="relative mt-8 grid gap-4 md:grid-cols-3">
        {deploymentCards.map(({ title, body, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-emerald-100/20 bg-slate-950/60 p-4"
          >
            <Icon className="h-5 w-5 text-emerald-300" />
            <h3 className="mt-3 text-base font-semibold text-emerald-50">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-emerald-100/80">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const TokenComVariantCLanding: LandingComponent = ({ origin }) => {
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
          tagline="Enterprise-ready names on token.com"
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
          <div className="rounded-3xl border border-emerald-200/25 bg-[#091610]/85 px-4 pb-6 pt-2 backdrop-blur-xl">
            <div className="flex items-center justify-between py-5">
              <h2 className="text-xl font-semibold tracking-tight text-emerald-100 md:text-2xl">
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
          <VariantCContent />
        )}
      </div>

      <FloatingCart
        searchMode={searchMode}
        importableDomains={importableDomains}
      />
    </div>
  );
};

TokenComVariantCLanding.displayName = 'TokenComVariantCLanding';
