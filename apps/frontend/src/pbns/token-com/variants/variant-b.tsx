'use client';

import {
  type EppAuthorizationCodesFormData,
  type LandingComponent,
  SearchInput,
  SearchMode,
  SearchResults,
  eppAuthorizationCodesFormSchema,
} from '@/components/search';
import { FloatingCart } from '@/components/floating-cart';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import { Marquee } from '@/components/ui/magicui/marquee';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/shadcn/accordion';
import { cn } from '@/lib/cn';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { useSearch } from '@/hooks/use-search';
import { zodResolver } from '@hookform/resolvers/zod';
import { isDomainImportable } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Coins,
  ShieldAlert,
  ShieldCheck,
  WalletMinimal,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

const rotatingProjects = [
  'openclaw',
  'portkey',
  'openguardrails',
  'langgraph',
  'crewai',
  'autogen',
];

const marqueeTickers = [
  'openclaw.token.com',
  'portkey.token.com',
  'openguardrails.token.com',
  'langgraph.token.com',
  'autogen.token.com',
  'crewai.token.com',
  'openrouter.token.com',
  'litellm.token.com',
];

const identityProblems = [
  {
    icon: <ShieldAlert className="h-7 w-7 text-[#1A1A1A]" />,
    title: 'Supply-Chain Trust is Breaking',
    description:
      'Recent reports show malicious skills distributed via open ecosystems targeting crypto users. A canonical endpoint solves the install trust problem.',
  },
  {
    icon: <ShieldCheck className="h-7 w-7 text-[#1A1A1A]" />,
    title: 'Prompt Injection Risks',
    description:
      'Injection is now a production security issue for tool-using systems. Teams need a standard way to document defense-in-depth defaults.',
  },
  {
    icon: <WalletMinimal className="h-7 w-7 text-[#1A1A1A]" />,
    title: 'Token Spend Governance',
    description:
      'Tokens are the billing unit. Rate limiting and caching controls are now required, but configuration guidance is fragmented.',
  },
];

const machineEndpoints = [
  {
    title: 'Extensions / Skills',
    description: 'Registry and install guidance.',
    endpoint: 'GET /.well-known/ai-extensions.json',
    note: 'Approved IDs, hashes, and deprecation lists.',
  },
  {
    title: 'Guardrails and Safety',
    description: 'Prompt-injection guidance and safety posture.',
    endpoint: 'GET /.well-known/ai-guardrails.json',
    note: 'Recommended policies and versions.',
  },
  {
    title: 'Token Spend Guidance',
    description: 'Budgeting and rate-limit/caching guidance.',
    endpoint: 'GET /.well-known/ai-tokens.json',
    note: 'Quota guidance and metering fields.',
  },
];

const faqItems = [
  {
    value: 'docs-registry',
    question: 'Can we point to our existing docs or registry?',
    answer: 'Yes. DNS only. You keep your current hosting and infrastructure.',
  },
  {
    value: 'hosting',
    question: 'Do you host any project content?',
    answer:
      'No. Your subdomain can point anywhere you host: Vercel, GitHub Pages, S3, or custom infra.',
  },
  {
    value: 'machine',
    question: 'Do we have to publish machine endpoints?',
    answer:
      'No. They are optional conventions for automation and agent tooling.',
  },
  {
    value: 'private',
    question: 'Can some endpoints remain private?',
    answer:
      'Yes. Keep sensitive paths behind auth and publish only what you want public.',
  },
];

type SearchState = ReturnType<typeof useSearch>;

type HeroSectionProps = Pick<
  SearchState,
  'query' | 'setQuery' | 'runSearch' | 'importQuery' | 'isLoading'
> & {
  parentDomain: string;
};

type SearchResultsPanelProps = Pick<
  SearchState,
  | 'isLoading'
  | 'isError'
  | 'error'
  | 'hasData'
  | 'domainInfos'
  | 'domains'
  | 'query'
  | 'freeClaimEligibility'
> & {
  eppAuthorizationCodes: Record<string, string | undefined>;
  onEppCodeChange: (domain: NamefiNormalizedDomain, eppCode: string) => void;
};

function PixelFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-[14px] border-4 border-[#1A1A1A] bg-[#FFD08A] p-6 shadow-[6px_6px_0_0_#1A1A1A] md:p-8',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-2 bottom-2 h-2 bg-[linear-gradient(90deg,#1A1A1A_50%,transparent_50%)] bg-[length:12px_8px]" />
      {children}
    </div>
  );
}

function HeroSection({
  query,
  setQuery,
  runSearch,
  importQuery,
  isLoading,
  parentDomain,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[52vh] overflow-hidden rounded-[16px] border-4 border-[#1A1A1A] bg-[#FF8C00] px-6 pb-8 pt-10 shadow-[8px_8px_0_0_#1A1A1A] md:min-h-[56vh] md:px-12 md:pb-10 md:pt-12">
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:8px_8px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(to_bottom,#000_1px,transparent_1px)] [background-size:100%_4px]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
          className="space-y-6 md:space-y-8"
        >
          <h1 className="text-[40px] leading-[0.92] tracking-[-0.02em] text-[#1A1A1A] md:text-[64px] font-semibold">
            Claim{' '}
            <span className="inline-flex flex-wrap items-baseline gap-2 md:gap-3">
              <ContainerTextFlip
                words={rotatingProjects}
                interval={2200}
                animationDuration={500}
                className="!rounded-[4px] !bg-[#1A1A1A] !px-2 !py-0 !text-[34px] !font-semibold !text-[#FF8C00] !shadow-none md:!text-[56px]"
                textClassName="lowercase"
              />
              <span className="text-[34px] md:text-[56px]">.token.com</span>
            </span>{' '}
            for your AI project
          </h1>

          <p className="max-w-3xl text-[26px] leading-[1.12] text-[#1A1A1A]/85 md:text-[30px]">
            Publish a single, stable URL where developers can find your
            project&apos;s safe defaults, including extensions, guardrails, and
            token-spend guidance.
          </p>

          <div id="ticker-search" className="pt-2">
            <SearchInput
              query={query}
              setQuery={setQuery}
              importQuery={importQuery}
              isLoading={isLoading}
              onSearch={runSearch}
              searchMode={SearchMode.REGISTER}
              parentDomain={parentDomain}
              isFirstPartyOrigin={false}
              ctaClassName="bg-[#FF8C00] text-[#1A1A1A] hover:bg-[#ff9b1f] border border-[#1A1A1A]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SearchResultsPanel({
  isLoading,
  isError,
  error,
  hasData,
  domainInfos,
  domains,
  query,
  eppAuthorizationCodes,
  onEppCodeChange,
  freeClaimEligibility,
}: SearchResultsPanelProps) {
  return (
    <section className="rounded-[16px] border-4 border-[#1A1A1A] bg-[#1A1A1A] p-6 shadow-[8px_8px_0_0_#7A3E00] md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl text-[#FF8C00] md:text-4xl font-semibold">
          Search Results
        </h2>
        <p className="hidden text-xl uppercase tracking-[0.16em] text-[#FFC777] md:block">
          Live Availability
        </p>
      </div>

      <div className="[&_[data-slot=card]]:!h-[168px] [&_[data-slot=card]]:!border-[#FF8C00]/35 [&_[data-slot=card]]:!bg-[#222222] [&_[data-slot=card]]:!text-[#FFECD2] [&_[data-slot=card]]:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.05)] [&_[data-slot=card]_h3_span.text-brand-tertiary]:!text-[#FFB347] [&_[data-slot=card]_h3_span.text-foreground]:!text-[#FFE2BC] [&_[data-slot=card]_.text-muted-foreground]:!text-[#D5B48A] [&_[data-slot=card]_[data-slot=badge][data-variant=secondary]]:!bg-[#3C2D14] [&_[data-slot=card]_[data-slot=badge][data-variant=secondary]]:!text-[#FFD7A5] [&_[data-slot=card]_[data-slot=badge][data-variant=destructive]]:!bg-[#4A2525] [&_[data-slot=card]_[data-slot=badge][data-variant=destructive]]:!text-[#FFD7D7] [&_[data-slot=card]_[data-slot=button].bg-brand-primary]:!bg-[#FF8C00] [&_[data-slot=card]_[data-slot=button].bg-brand-primary]:!text-[#1A1A1A]">
        <SearchResults
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasData={hasData}
          domainInfos={domainInfos}
          domains={domains}
          query={query}
          eppAuthorizationCodes={eppAuthorizationCodes}
          onEppCodeChange={onEppCodeChange}
          searchMode={SearchMode.REGISTER}
          freeClaimEligibility={freeClaimEligibility}
        />
      </div>
    </section>
  );
}

function MarketingSections() {
  return (
    <div className="space-y-24 md:space-y-28">
      <section className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {identityProblems.map((item) => (
          <div
            key={item.title}
            className="border-l-[8px] border-[#1A1A1A] pl-6"
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-sm border-2 border-[#1A1A1A] bg-[#FFC47A]">
              {item.icon}
            </div>
            <h3 className="text-3xl leading-[1.02] text-[#1A1A1A] font-semibold">
              {item.title}
            </h3>
            <p className="mt-3 text-2xl leading-[1.2] text-[#1A1A1A]/88 md:text-[30px]">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      <section className="border-y-4 border-[#1A1A1A] py-8 text-center">
        <h2 className="text-4xl text-[#1A1A1A] md:text-5xl font-semibold">
          DNS MANAGEMENT / SUBDOMAIN ISSUANCE
        </h2>
        <p className="mx-auto mt-2 max-w-4xl text-2xl text-[#1A1A1A]/90 md:text-[30px]">
          You point <strong>project.token.com</strong> to your existing docs,
          registry, or gateway.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {machineEndpoints.map((item) => (
          <PixelFrame key={item.title} className="bg-[#FF8C00]">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-sm border-2 border-[#1A1A1A] bg-[#FFC47A]">
              <Coins className="h-7 w-7 text-[#1A1A1A]" />
            </div>
            <h3 className="text-3xl leading-[1.04] text-[#1A1A1A] font-semibold">
              {item.title}
            </h3>
            <p className="mt-3 text-2xl leading-[1.2] text-[#1A1A1A]/88 md:text-[30px]">
              {item.description}
            </p>
            <code className="mt-5 block rounded-[4px] border-2 border-[#1A1A1A] bg-[#F8B65B] px-3 py-2 text-xl text-[#1A1A1A]">
              {item.endpoint}
            </code>
            <p className="mt-3 text-lg text-[#1A1A1A]/80 md:text-xl">
              {item.note}
            </p>
          </PixelFrame>
        ))}
      </section>

      <section className="space-y-6">
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y-4 border-[#FF8C00] bg-[#1A1A1A] py-4">
          <Marquee className="[--duration:22s] py-1" pauseOnHover={true}>
            {marqueeTickers.map((domain) => (
              <p
                key={domain}
                className="mx-6 text-2xl uppercase tracking-[0.06em] text-[#FF8C00] md:text-3xl font-semibold"
              >
                {domain}
              </p>
            ))}
          </Marquee>
        </div>
        <p className="mx-auto max-w-4xl text-center text-2xl text-[#1A1A1A]/85 md:text-[30px]">
          Each project uses its subdomain to publish its own docs, manifests,
          and defaults. token.com only provides the namespace plus DNS.
        </p>
      </section>

      <section
        id="how-it-works"
        className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10"
      >
        <PixelFrame className="bg-[#FFC47A]">
          <h3 className="text-3xl text-[#1A1A1A] md:text-4xl font-semibold">
            Why now?
          </h3>
          <p className="mt-4 text-2xl leading-[1.2] text-[#1A1A1A]/88 md:text-[30px]">
            Agents and extension ecosystems now create new distribution attack
            surfaces. Enterprises are also formalizing defenses against indirect
            prompt injection for tool-using systems.
          </p>
          <p className="mt-4 text-2xl leading-[1.2] text-[#1A1A1A]/88 md:text-[30px]">
            Because token billing is the core unit of cost, teams increasingly
            adopt rate limiting and caching to keep spend predictable.
          </p>
        </PixelFrame>

        <PixelFrame className="bg-[#FFD79E]">
          <h3 className="text-3xl text-[#1A1A1A] md:text-4xl font-semibold">
            How it works
          </h3>
          <ol className="mt-5 space-y-4">
            {[
              'Request Subdomain: claim project.token.com with optional child subdomains.',
              'Point DNS: CNAME/A/TXT records to docs, registry, or gateway.',
              'Publish Defaults: human pages plus optional /.well-known JSON endpoints.',
            ].map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 text-2xl leading-[1.2] text-[#1A1A1A]/90 md:text-[30px]"
              >
                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-[#1A1A1A] bg-[#1A1A1A] text-xl text-[#FF8C00]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </PixelFrame>
      </section>

      <section className="mx-auto w-full max-w-4xl rounded-[14px] border-4 border-[#1A1A1A] bg-[#FFD08A] p-6 shadow-[6px_6px_0_0_#1A1A1A] md:p-8">
        <h3 className="text-3xl text-[#1A1A1A] md:text-4xl font-semibold">
          System F.A.Q.
        </h3>
        <Accordion className="mt-4">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className="border-b-2 border-[#1A1A1A]/35"
            >
              <AccordionTrigger className="text-left text-2xl text-[#1A1A1A] hover:no-underline md:text-3xl font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-2xl leading-[1.2] text-[#1A1A1A]/88 md:text-[28px]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section
        id="request"
        className="relative overflow-hidden rounded-[14px] border-4 border-[#1A1A1A] bg-[#1A1A1A] px-6 py-10 text-center text-[#FF8C00] shadow-[6px_6px_0_0_#7A3E00] md:px-10 md:py-14"
      >
        <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-[#FF8C00]/60" />
        <div className="relative z-10 space-y-5">
          <h3 className="text-3xl md:text-5xl font-semibold">
            Give your project one stable home.
          </h3>
          <a
            href="#ticker-search"
            className="inline-flex items-center gap-2 rounded-md border-2 border-[#FF8C00] bg-[#FF8C00] px-4 py-2 text-xl text-[#1A1A1A] transition hover:bg-[#ff9b1f] md:text-2xl font-semibold"
          >
            Request project.token.com
            <ArrowUpRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <footer className="pb-4 text-center text-lg text-[#1A1A1A]/65">
        SYSTEM STATUS: ONLINE | ID: 894-XJ | TOKEN.COM NETWORK
      </footer>
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
    <div
      className={cn(
        'font-sans relative overflow-x-clip bg-[#FF8C00] px-5 pb-0 pt-20 md:px-10 md:pt-24 lg:px-14',
      )}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(to_bottom,rgba(0,0,0,0.55)_1px,transparent_1px)] [background-size:100%_4px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] space-y-20 md:space-y-24">
        <HeroSection
          query={query}
          setQuery={setQuery}
          runSearch={runSearch}
          importQuery={importQuery}
          isLoading={isLoading}
          parentDomain={origin.thirdPartyHostname}
        />

        {shouldShowResults ? (
          <SearchResultsPanel
            isLoading={isLoading}
            isError={isError}
            error={error}
            hasData={hasData}
            domainInfos={domainInfos}
            domains={domains}
            query={query}
            eppAuthorizationCodes={eppAuthorizationCodes}
            onEppCodeChange={handleEppCodeChange}
            freeClaimEligibility={freeClaimEligibility}
          />
        ) : (
          <MarketingSections />
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
