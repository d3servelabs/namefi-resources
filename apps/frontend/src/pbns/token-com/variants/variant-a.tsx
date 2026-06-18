'use client';

import {
  type EppAuthorizationCodesFormData,
  type LandingComponent,
  SearchMode,
  eppAuthorizationCodesFormSchema,
} from '@/components/search/types';
import { FloatingCart } from '@/components/floating-cart';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { SearchInput } from '@/components/search/search-input';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { useSearch } from '@/hooks/use-search';
import { zodResolver } from '@hookform/resolvers/zod';
import { isDomainImportable } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { ArrowUpRight, Link2, ShieldCheck, FileText } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { buttonVariants } from '@namefi-astra/ui/components/shadcn/button';
import { Marquee } from '@/components/ui/magicui/marquee';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  LazySearchResults as TokenComSearchResults,
  preloadSearchResults as preloadTokenComSearchResults,
} from '@/components/search/lazy-search-results';

const uiFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-token-ui',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: false,
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-token-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
});

const liveTickerTape = [
  { symbol: 'BTC', price: '$67,234.12', change: '+2.4%' },
  { symbol: 'ETH', price: '$3,891.45', change: '+1.8%' },
  { symbol: 'USDC', price: '$1.00', change: '0.0%' },
  { symbol: 'SOL', price: '$142.88', change: '-0.9%' },
  { symbol: 'ARB', price: '$1.23', change: '+5.2%' },
  { symbol: 'UNI', price: '$8.94', change: '+3.1%' },
  { symbol: 'MATIC', price: '$0.89', change: '-1.2%' },
];

const rotatingTickerDomains = ['btc', 'eth', 'sol', 'xrp', 'doge', 'usdc'];

const identityCards = [
  {
    domain: 'usdc.token.com',
    desc: 'Official issuer links + multi-chain contracts',
  },
  {
    domain: 'wif.token.com',
    desc: 'Contracts + socials + listing metadata',
  },
  {
    domain: 'arb.token.com',
    desc: 'Governance + bridge + contracts',
  },
  {
    domain: 'uni.token.com',
    desc: 'Docs + security contacts',
  },
  {
    domain: 'tia.token.com',
    desc: 'Ecosystem links + contracts',
  },
  {
    domain: 'btc.token.com',
    desc: 'Canonical identity hub',
  },
];

const faqItems = [
  {
    value: 'dns',
    question: "What's included in DNS management?",
    answer:
      'A full console for A, AAAA, CNAME, and TXT records, with exportable audit history for every change.',
  },
  {
    value: 'pointing',
    question: 'Can I point it to my existing site?',
    answer:
      'Yes. You can point subdomains to existing providers with CNAME or A records, without changing your current hosting stack.',
  },
  {
    value: 'squatting',
    question: 'How do you prevent squatting?',
    answer:
      'Wallet signature verification, protected namespaces for known issuers, and manual review for sensitive ticker allocations.',
  },
];

type SearchState = ReturnType<typeof useSearch>;

type VariantAContentProps = {
  parentDomain: string;
  shouldShowResults: boolean;
  eppAuthorizationCodes: Record<string, string | undefined>;
  onEppCodeChange: (domain: NamefiNormalizedDomain, eppCode: string) => void;
} & Pick<
  SearchState,
  | 'query'
  | 'setQuery'
  | 'runSearch'
  | 'isLoading'
  | 'isError'
  | 'error'
  | 'hasData'
  | 'domainInfos'
  | 'authoritativeDomainInfos'
  | 'domains'
  | 'freeClaimEligibility'
>;

function isPositiveChange(value: string) {
  return value.startsWith('+');
}

function isNeutralChange(value: string) {
  return value.startsWith('0');
}

function HeroTickerMarquee() {
  return (
    <div className="absolute top-8 left-0 right-0 overflow-hidden">
      <Marquee className="[--duration:25s] py-1" pauseOnHover={true}>
        {liveTickerTape.map((entry) => (
          <p
            key={entry.symbol}
            className="mx-4 text-sm font-bold text-[#18181B]/45"
          >
            {entry.symbol} {entry.price}{' '}
            <span
              className={cn({
                'text-green-600': isPositiveChange(entry.change),
                'text-red-600':
                  !isPositiveChange(entry.change) &&
                  !isNeutralChange(entry.change),
                'text-zinc-500': isNeutralChange(entry.change),
              })}
            >
              {entry.change}
            </span>
          </p>
        ))}
      </Marquee>
    </div>
  );
}

function FeaturesGrid() {
  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <FeatureCard
        iconBg="#FDE6A5"
        title="Stop Link Confusion"
        description="One official URL to share everywhere. Listings, socials, docs, and contracts under one canonical root."
        icon={<Link2 className="h-5 w-5 text-[#18181B]" />}
      />
      <FeatureCard
        iconBg="#B8E1EE"
        title="Reduce Risk"
        description="A consistent official source for token contracts. Reduce impersonation attacks with DNS provenance."
        icon={<ShieldCheck className="h-5 w-5 text-[#18181B]" />}
      />
      <FeatureCard
        iconBg="#D4E8B8"
        title="Speed Up Ops"
        description="A predictable endpoint for wallets and exchanges to fetch structured metadata automatically."
        icon={<FileText className="h-5 w-5 text-[#18181B]" />}
      />
    </section>
  );
}

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="h-full min-h-[320px] rounded-[32px] bg-white p-10 transition-transform duration-300 hover:scale-[1.02]">
      <div
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-[#18181B]">{title}</h3>
      <p className="mt-3 font-medium leading-7 text-[#18181B]/70">
        {description}
      </p>
    </div>
  );
}

function HumanMachineSection() {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="relative overflow-hidden rounded-[40px] bg-[#B8E1EE] p-10 md:p-14">
        <p className="absolute top-8 right-8 rounded-full bg-[#18181B]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#18181B]">
          Human View
        </p>

        <div className="relative z-10 mt-12 space-y-4">
          {[
            {
              label: 'OFF',
              title: 'Official Links',
              sub: 'Site, docs, socials',
            },
            {
              label: '0x',
              title: 'Contract Addresses',
              sub: 'By chain (ETH, SOL, ARB)',
            },
            { label: 'SEC', title: 'Security', sub: 'Audits, bug bounty' },
          ].map((row) => (
            <div
              key={row.title}
              className="flex items-center gap-4 rounded-2xl bg-white/60 p-4 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18181B] text-xs font-bold text-white">
                {row.label}
              </div>
              <div>
                <p className="font-bold text-[#18181B]">{row.title}</p>
                <p className="text-xs text-[#18181B]/60">{row.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-3xl font-bold text-[#18181B]">
          One-Stop Identity.
        </h3>
        <p className="mt-2 font-medium text-[#18181B]/70">
          Canonical destination for people.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#1C1C1E] p-10 md:p-14">
        <p className="absolute top-8 right-8 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
          Machine View
        </p>

        <div className="relative mt-12 overflow-hidden rounded-3xl border border-white/5 bg-[#111111] p-6 [font-family:var(--font-token-mono)] text-sm text-gray-400">
          <div className="absolute top-0 left-0 flex h-8 w-full items-center gap-2 border-b border-white/5 bg-[#111111] px-4">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ms-2 text-xs text-gray-500">
              .well-known/token.json
            </span>
          </div>

          <div className="mt-6 space-y-1">
            <p>
              <span className="text-purple-400">"ticker"</span>:{' '}
              <span className="text-green-400">"USDC"</span>,
            </p>
            <p>
              <span className="text-purple-400">"contracts"</span>: {'{'}
            </p>
            <p className="ps-4">
              <span className="text-purple-400">"ethereum"</span>:{' '}
              <span className="text-green-400">"0xa0b8..."</span>,
            </p>
            <p className="ps-4">
              <span className="text-purple-400">"solana"</span>:{' '}
              <span className="text-green-400">"EPjF..."</span>
            </p>
            <p>{'}'},</p>
            <p>
              <span className="text-purple-400">"links"</span>: {'{'}
            </p>
            <p className="ps-4">
              <span className="text-purple-400">"governance"</span>:{' '}
              <span className="text-green-400">"..."</span>
            </p>
            <p>{'}'}</p>
          </div>
        </div>

        <h3 className="mt-8 text-3xl font-bold text-white">
          Structured Metadata.
        </h3>
        <p className="mt-2 font-medium text-gray-400">
          Automated discovery for wallets and partners.
        </p>
      </div>
    </section>
  );
}

function TrustedIdentityCarousel() {
  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
      <h3 className="mb-10 text-center text-sm font-bold tracking-[0.2em] text-white/60 uppercase">
        Trusted Identity For Ecosystems
      </h3>

      <Marquee className="[--duration:30s]" pauseOnHover={true}>
        {identityCards.map((card) => (
          <div
            key={card.domain}
            className="mx-3 w-[320px] rounded-[24px] bg-white p-6"
          >
            <p className="text-xl font-bold text-[#18181B]">{card.domain}</p>
            <p className="mt-2 text-sm text-gray-500">{card.desc}</p>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3 text-center">
        <p className="text-xs font-bold tracking-[0.22em] text-[#B8E1EE]/90 uppercase">
          Questions
        </p>
        <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Frequently asked questions
        </h2>
      </div>
      <Accordion className="space-y-3">
        {faqItems.map((faq) => (
          <AccordionItem
            key={faq.value}
            value={faq.value}
            className="rounded-[24px] border border-white/10 bg-[#1C1C1E] px-5"
          >
            <AccordionTrigger className="text-base font-semibold text-white hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-[15px] leading-7 text-gray-400">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function CTASection() {
  return (
    <section
      id="pricing"
      className="flex flex-col items-center justify-center rounded-[40px] bg-[#B8E1EE] p-10 text-center md:p-24"
    >
      <p className="text-xs font-bold tracking-[0.22em] text-[#18181B]/75 uppercase">
        Get started
      </p>
      <h2 className="max-w-4xl text-4xl font-extrabold tracking-tight text-[#18181B] md:text-6xl">
        Claim your canonical link.
      </h2>
      <p className="mt-4 mb-8 max-w-2xl text-xl font-medium text-[#18181B]/70">
        Secure your token's official identity. One URL, verified metadata,
        trusted by wallets and exchanges.
      </p>

      <div className="mt-4 flex w-full flex-col justify-center gap-4 md:flex-row">
        <Link
          href="#ticker-search"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-14 rounded-full bg-[#18181B] px-10 text-lg font-bold text-white hover:bg-black',
          )}
        >
          Check Availability
          <ArrowUpRight className="ms-2 h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

function ProblemSectionHeading() {
  return (
    <section className="mx-auto max-w-4xl space-y-4 text-center">
      <p className="text-xs font-bold tracking-[0.22em] text-[#B8E1EE]/90 uppercase">
        Why this matters
      </p>
      <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white md:text-5xl">
        The problem with token identity
      </h2>
    </section>
  );
}

function IdentitySectionHeading() {
  return (
    <section className="mx-auto max-w-5xl space-y-4 text-center">
      <p className="text-xs font-bold tracking-[0.22em] text-[#FDE6A5]/90 uppercase">
        One-stop identity
      </p>
      <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white md:text-5xl">
        What lives at <span className="text-[#D4E8B8]">TICKER.token.com</span>
      </h2>
      <p className="mx-auto max-w-3xl text-base leading-8 font-medium text-white/75 md:text-xl">
        A single endpoint for humans and machines. Your token's entire identity,
        verified and always up to date.
      </p>
    </section>
  );
}

function MarketingSections() {
  return (
    <div className="mt-16 space-y-[5.2rem] md:mt-20 md:space-y-[6.5rem]">
      <ProblemSectionHeading />
      <FeaturesGrid />
      <IdentitySectionHeading />
      <HumanMachineSection />
      <TrustedIdentityCarousel />
      <FAQSection />
      <CTASection />
    </div>
  );
}

function HeroSection({
  query,
  setQuery,
  runSearch,
  isLoading,
  parentDomain,
  onSearchIntent,
}: Pick<
  VariantAContentProps,
  'query' | 'setQuery' | 'runSearch' | 'isLoading' | 'parentDomain'
> & {
  onSearchIntent?: () => void;
}) {
  return (
    <section className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="relative col-span-12 flex w-full min-h-[700px] flex-col items-center justify-center overflow-hidden rounded-[40px] bg-[#D4E8B8] p-10 text-center md:p-20 lg:p-24">
        <HeroTickerMarquee />

        <div className="mt-8 mb-8 flex items-center gap-2 rounded-full bg-[#18181B] px-5 py-2 text-sm font-medium text-white">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Verified token endpoint
        </div>

        <h1 className="text-balance text-5xl font-extrabold leading-[0.9] tracking-tight text-[#18181B] md:text-7xl lg:text-8xl">
          Claim
          <br />
          <span className="inline-flex flex-wrap items-baseline justify-center gap-2 md:gap-3">
            <ContainerTextFlip
              words={rotatingTickerDomains}
              interval={2200}
              animationDuration={500}
              className="mx-1 !rounded-2xl !pt-1 !pb-2 !text-3xl !font-extrabold !text-[#18181B] ![background:linear-gradient(to_bottom,#FDE6A5,#F8D978)] !shadow-[inset_0_-1px_rgba(16,21,33,0.14),inset_0_0_0_1px_rgba(16,21,33,0.14),0_10px_22px_rgba(16,21,33,0.18)] dark:![background:linear-gradient(to_bottom,#FDE6A5,#F8D978)] dark:!text-[#18181B] dark:!shadow-[inset_0_-1px_rgba(16,21,33,0.14),inset_0_0_0_1px_rgba(16,21,33,0.14),0_10px_22px_rgba(16,21,33,0.18)] md:!text-6xl lg:!text-7xl"
              textClassName="uppercase tracking-tight"
            />
            <span className="text-3xl font-extrabold text-[#18181B] md:text-6xl lg:text-7xl">
              .token.com
            </span>
          </span>
        </h1>

        <p className="mt-6 mb-8 max-w-xl text-base font-medium leading-7 text-[#18181B]/80 md:mb-10 md:max-w-2xl md:text-2xl md:leading-relaxed">
          A canonical, DNS-controlled identity link for tokens. The official
          destination for contracts, links, and verified metadata.
        </p>

        <div id="ticker-search" className="w-full max-w-3xl space-y-4">
          <SearchInput
            query={query}
            setQuery={setQuery}
            isLoading={isLoading}
            onSearch={runSearch}
            searchMode={SearchMode.REGISTER}
            parentDomain={parentDomain}
            isFirstPartyOrigin={false}
            ctaClassName="bg-[#18181B] text-white hover:bg-black"
            onSearchIntent={onSearchIntent}
          />
        </div>

        <p className="mt-6 text-sm font-semibold text-[#18181B]/60">
          Managed issuance + DNS control.
        </p>
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
  authoritativeDomainInfos,
  domains,
  query,
  eppAuthorizationCodes,
  onEppCodeChange,
  freeClaimEligibility,
}: Pick<
  VariantAContentProps,
  | 'isLoading'
  | 'isError'
  | 'error'
  | 'hasData'
  | 'domainInfos'
  | 'authoritativeDomainInfos'
  | 'domains'
  | 'query'
  | 'eppAuthorizationCodes'
  | 'onEppCodeChange'
  | 'freeClaimEligibility'
>) {
  return (
    <section className="w-full rounded-[36px] border border-[#3BC2C8]/30 bg-[#101521] p-8 shadow-[0_24px_70px_-42px_rgba(16,21,33,0.7)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Search Results</h2>
        <p className="hidden text-sm font-semibold tracking-wide text-[#B8E1EE]/85 uppercase md:block">
          Live Availability
        </p>
      </div>
      <div className="[&_[data-slot=card]]:!h-[152px] [&_[data-slot=card]]:!rounded-[28px] [&_[data-slot=card]]:!border-[#3BC2C8]/25 [&_[data-slot=card]]:!bg-gradient-to-b [&_[data-slot=card]]:!from-[#182136] [&_[data-slot=card]]:!to-[#121A2C] [&_[data-slot=card]]:!text-[#ECF2FF] [&_[data-slot=card]]:[box-shadow:0_18px_30px_-22px_rgba(0,0,0,0.55)] [&_[data-slot=card]_h3_span.text-brand-tertiary]:!text-[#F8A51A] [&_[data-slot=card]_h3_span.text-foreground]:!text-[#E6EDF9] [&_[data-slot=card]_.text-muted-foreground]:!text-[#9FB0C8] [&_[data-slot=card]_[data-slot=badge][data-variant=secondary]]:!bg-[#22314B] [&_[data-slot=card]_[data-slot=badge][data-variant=secondary]]:!text-[#D5E2F6] [&_[data-slot=card]_[data-slot=badge][data-variant=destructive]]:!bg-[#42232A] [&_[data-slot=card]_[data-slot=badge][data-variant=destructive]]:!text-[#FFD7DE] [&_[data-slot=card]_[data-slot=button].bg-brand-primary]:!bg-[#F8A51A] [&_[data-slot=card]_[data-slot=button].bg-brand-primary]:!text-[#101521]">
        <TokenComSearchResults
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasData={hasData}
          domainInfos={domainInfos}
          authoritativeDomainInfos={authoritativeDomainInfos}
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

function VariantAContent({
  parentDomain,
  query,
  setQuery,
  runSearch,
  shouldShowResults,
  isLoading,
  isError,
  error,
  hasData,
  domainInfos,
  authoritativeDomainInfos,
  domains,
  eppAuthorizationCodes,
  onEppCodeChange,
  freeClaimEligibility,
}: VariantAContentProps) {
  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-10">
      <div className="w-full">
        <HeroSection
          query={query}
          setQuery={setQuery}
          runSearch={runSearch}
          isLoading={isLoading}
          parentDomain={parentDomain}
          onSearchIntent={preloadTokenComSearchResults}
        />
      </div>

      {shouldShowResults ? (
        <SearchResultsPanel
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasData={hasData}
          domainInfos={domainInfos}
          authoritativeDomainInfos={authoritativeDomainInfos}
          domains={domains}
          query={query}
          eppAuthorizationCodes={eppAuthorizationCodes}
          onEppCodeChange={onEppCodeChange}
          freeClaimEligibility={freeClaimEligibility}
        />
      ) : (
        <MarketingSections />
      )}
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
    authoritativeDomainInfos,
    domains,
    freeClaimEligibility,
  } = useSearch(origin.thirdPartyHostname || undefined);

  useSearchFromQuery(setQuery, runSearch);

  useEffect(() => {
    if (query.trim().length > 0) {
      preloadTokenComSearchResults();
    }
  }, [query]);

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
        const availabilityInfo = authoritativeDomainInfos.get(domain);
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
  }, [authoritativeDomainInfos, domains, eppAuthorizationCodes, searchMode]);

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
        uiFont.variable,
        monoFont.variable,
        'relative flex flex-col gap-10 bg-[#111111] px-6 pb-0 pt-24 [font-family:var(--font-token-ui)] md:px-10 md:pt-28 lg:px-14',
      )}
    >
      <VariantAContent
        parentDomain={origin.thirdPartyHostname}
        query={query}
        setQuery={setQuery}
        runSearch={runSearch}
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={hasData}
        domainInfos={domainInfos}
        authoritativeDomainInfos={authoritativeDomainInfos}
        domains={domains}
        freeClaimEligibility={freeClaimEligibility}
        shouldShowResults={shouldShowResults}
        eppAuthorizationCodes={eppAuthorizationCodes}
        onEppCodeChange={handleEppCodeChange}
      />

      <FloatingCart
        searchMode={searchMode}
        importableDomains={importableDomains}
      />
    </div>
  );
};

TokenComVariantALanding.displayName = 'TokenComVariantALanding';
