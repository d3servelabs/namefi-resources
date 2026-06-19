'use client';

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
} from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from '@/hooks/use-search';
import { useSearchFromQuery } from '@/hooks/use-search-from-query';
import { useSearchModeFromHash } from '@/hooks/use-search-mode-from-hash';
import { useScrollToHash } from '@/hooks/use-scroll-to-hash';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { SearchInput, SearchModeTabs } from '@/components/search/search-input';
import {
  LazySearchResults,
  preloadSearchResults,
} from '@/components/search/lazy-search-results';
import {
  eppAuthorizationCodesFormSchema,
  SearchMode,
  type LandingComponent,
  type EppAuthorizationCodesFormData,
} from '@/components/search/types';
import { isDomainImportable } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { ArrowLeft, Loader2, SearchIcon, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import type { MarketingSectionsProps } from './landing-marketing';
import { FloatingCart } from '@/components/floating-cart';

const MarketingSections = dynamic<MarketingSectionsProps>(() =>
  import('./landing-marketing').then((module) => module.MarketingSections),
);

const HeroSection = ({
  searchMode,
  onSearchModeChange,
  query,
  setQuery,
  isLoading,
  runSearch,
  parentDomain,
  onClearParentDomain,
  showScrollIndicator = true,
  onScrollIndicatorClick,
  onV3BetaClick,
  isSearchActive = false,
  searchAnchorRef,
  onSearchIntent,
}: {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  query: string;
  setQuery: (value: string) => void;
  isLoading: boolean;
  runSearch: () => void;
  parentDomain: string | undefined;
  onClearParentDomain?: () => void;
  showScrollIndicator?: boolean;
  onScrollIndicatorClick?: () => void;
  onV3BetaClick?: () => void;
  /**
   * When a search is active (results are being shown), the hero collapses from
   * its full-viewport landing height to a compact header so the results panel
   * that follows can render directly below the search input instead of being
   * pulled up over it. See the results container in `Landing` below.
   */
  isSearchActive?: boolean;
  /**
   * Anchor for the hero search input. `Landing` observes it to decide when the
   * compact floating search bar should take over (once this scrolls out of view
   * while results are showing).
   */
  searchAnchorRef?: RefObject<HTMLDivElement | null>;
  onSearchIntent?: () => void;
}) => {
  const t = useTranslations('landing');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end center'],
  });

  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const haloOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <section
      ref={heroRef}
      className={
        isSearchActive
          ? // Compact hero: just enough height for the search controls, with top
            // padding to clear the fixed/overlaying header (h-16). The results
            // panel renders right below in normal flow.
            'relative flex min-h-0 items-start justify-center overflow-hidden pt-20 pb-4 md:pt-24'
          : 'relative flex min-h-[95vh] items-center justify-center overflow-hidden'
      }
    >
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ opacity: haloOpacity }}
      >
        <motion.div
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
          className="absolute inset-0"
        >
          <motion.div
            className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-primary/20 blur-3xl"
            style={{ scale: glowScale }}
          />
          <motion.div
            className="absolute left-[10%] top-1/2 h-[340px] w-[340px] -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[110px]"
            animate={{ y: [0, -20, 20, 0] }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute right-[12%] top-[65%] h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-[120px]"
            animate={{ y: [0, 30, -30, 0] }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent" />
      </motion.div>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-[8px] md:text-[10px] uppercase tracking-[0.18em] text-emerald-100 backdrop-blur">
          {t('hero.badge')}
        </span>
        <h1 className="mt-6 text-balance text-2xl font-semibold leading-tight md:mt-8 md:text-6xl">
          {t('hero.heading')}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm text-muted-foreground md:mt-4 md:text-xl">
          {t('hero.subtitle')}
        </p>

        <div className="mt-8 md:mt-12 flex w-full max-w-3xl flex-col items-center gap-6">
          <div className="mx-auto w-full max-w-md">
            <SearchModeTabs
              searchMode={searchMode}
              onSearchModeChange={onSearchModeChange}
            />
          </div>
          <div className="relative z-10 flex w-full justify-center">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-x-12 -inset-y-6 z-0 rounded-full bg-gradient-to-r from-brand-primary/40 via-emerald-300/25 to-sky-400/25 blur-3xl mix-blend-screen"
              animate={{
                opacity: [0.55, 0.75, 0.66, 0.72, 0.58, 0.55],
                scale: [0.93, 1.08, 0.97, 1.04, 0.99, 0.93],
                x: [0, -18, 12, 22, -14, 0],
                y: [0, 14, -12, 18, -16, 0],
                rotate: [0, 4, -3, 2, -2, 0],
              }}
              transition={{
                duration: 7.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-x-4 -inset-y-4 z-0 rounded-[120px] bg-[radial-gradient(circle_at_top,rgba(94,255,220,0.6),rgba(92,176,255,0.32)_45%,transparent_75%)] blur-2xl mix-blend-screen"
              animate={{
                rotate: [0, 8, 3, -6, -2, 0],
                scale: [1.02, 1.12, 1.06, 1.08, 1.04, 1.02],
                x: [0, 14, -18, 10, -12, 0],
                y: [0, -10, 16, -18, 12, 0],
                opacity: [0.45, 0.7, 0.58, 0.64, 0.5, 0.45],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-x-2 -inset-y-1 z-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55)0%,rgba(196,255,243,0.2)45%,transparent_75%)] blur-3xl mix-blend-screen"
              animate={{
                opacity: [0.25, 0.45, 0.36, 0.42, 0.3, 0.25],
                scale: [0.98, 1.04, 1.02, 1.05, 1, 0.98],
              }}
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <div
              id="domain-search"
              ref={searchAnchorRef}
              className="relative z-20 w-full"
            >
              <SearchInput
                query={query}
                setQuery={setQuery}
                isLoading={isLoading}
                searchMode={searchMode}
                onSearch={runSearch}
                parentDomain={parentDomain}
                onClearParentDomain={onClearParentDomain}
                isFirstPartyOrigin
                ctaClassName="text-primary-foreground"
                onSearchIntent={onSearchIntent}
              />
              <div className="mt-4 flex justify-center">
                <Link
                  href="https://search.labs.namefi.io"
                  target="_blank"
                  onClick={onV3BetaClick}
                  className="flex items-center gap-2 text-sm"
                >
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{
                      color: [
                        'var(--muted-foreground)',
                        'var(--brand-primary)',
                        'var(--muted-foreground)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t('hero.tryV3Beta')}</span>
                    <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {!isSearchActive && (
          <ScrollIndicator
            visible={showScrollIndicator}
            onClick={onScrollIndicatorClick}
          />
        )}
      </div>
    </section>
  );
};

const ScrollIndicator = ({
  visible = true,
  onClick,
}: {
  visible?: boolean;
  onClick?: () => void;
}) => {
  const t = useTranslations('landing');
  return (
    <div className="mt-8 flex h-16 items-center justify-center">
      <AnimatePresence initial={true}>
        {visible ? (
          <motion.button
            key="scroll-indicator"
            type="button"
            onClick={onClick}
            aria-label={t('scrollIndicator.ariaLabel')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 0.75, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 text-[11px] font-medium text-white/65 transition hover:text-white focus:outline-none"
          >
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 2.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
              className="flex h-10 w-6 items-center justify-center rounded-full border border-white/25 bg-white/12 backdrop-blur-sm"
            >
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{
                  duration: 2.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                  delay: 0.25,
                }}
                className="block h-2 w-0.5 rounded-full bg-white"
              />
            </motion.div>
            <span>{t('scrollIndicator.label')}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

/**
 * Compact search bar that floats at the top of the viewport while results are
 * showing and the user has scrolled the hero search out of view. It is a
 * lightweight controlled input (not a second `SearchInput`) bound to the same
 * `query`/`runSearch`, so a new name can be searched without scrolling back up.
 *
 * Positioned `fixed` (escapes the hero's `overflow-hidden` ancestors) flush
 * beneath the app header, mirroring its pinned bottom edge at each breakpoint:
 * - mobile (<md): header is `fixed top-[--announcement-strip-height]` + h-16,
 *   so the bar sits at `calc(var(--announcement-strip-height) + 4rem)`.
 * - tablet (md–lg): header is `sticky top-0` + h-16 → `md:top-16`.
 * - desktop (lg+): header is `static` (scrolls away) → `lg:top-0`.
 * The strip var collapses to 0 when no announcement is shown.
 */
const FloatingSearchBar = ({
  query,
  setQuery,
  onSearch,
  isLoading,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}) => {
  const t = useTranslations('landing');
  return (
    <motion.div
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -72, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-x-0 top-[calc(var(--announcement-strip-height,0px)+4rem)] z-30 border-b border-white/10 bg-[#04050A]/85 backdrop-blur md:top-16 lg:top-0"
    >
      <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/14 bg-[#14161D] py-1.5 ps-4 pe-2 text-white transition-[border-color,box-shadow] focus-within:border-brand-primary/60 focus-within:ring-2 focus-within:ring-brand-primary/35">
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/70" />
          ) : (
            <SearchIcon className="h-4 w-4 shrink-0 text-white/60" />
          )}
          <Input
            name="floating-search-input"
            placeholder={t('floatingSearch.placeholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSearch();
              }
            }}
            className="h-9 min-w-0 flex-1 border-0 bg-transparent! px-0 text-base text-white placeholder:text-white/55 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <NamefiButton
            onClick={onSearch}
            className="h-9 shrink-0 rounded-full px-5 text-sm font-semibold text-primary-foreground shadow-none"
            title={t('floatingSearch.searchButton')}
          >
            {t('floatingSearch.searchButton')}
          </NamefiButton>
        </div>
      </div>
    </motion.div>
  );
};

export const Landing: LandingComponent = ({ origin }) => {
  const [parentDomain, setParentDomain] = useState<string | undefined>(
    undefined,
  );
  const newsletterRef = useRef<HTMLDivElement>(null);
  const marketingSectionsRef = useRef<HTMLDivElement>(null);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const [hasSeenStorylineThisCycle, setHasSeenStorylineThisCycle] =
    useState(false);
  const [isNewsletterVisible, setNewsletterVisible] = useQueryState(
    'newsletter',
    parseAsBoolean.withDefault(false),
  );
  const isNewsletterInView = useInView(newsletterRef, {
    once: false,
    margin: '-20% 0px -20% 0px',
  });

  useEffect(() => {
    const section = newsletterRef.current;
    if (!section) return;

    if (isNewsletterVisible && !isNewsletterInView) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    if (isNewsletterVisible && isNewsletterInView) {
      void setNewsletterVisible(false);
    }
  }, [isNewsletterVisible, isNewsletterInView, setNewsletterVisible]);

  const {
    registerSetParentDomain,
    registerSetSearchMode,
    consumePendingFreeMintsSearch,
    startFreeMintsSearchGuidance,
  } = useFreeMintsGuidance();

  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const {
    query,
    setQuery,
    runSearch,
    searchMode,
    onSearchModeChange,
    startImportForDomain,
    importQuery,
    isLoading,
    isError,
    error,
    hasData,
    domainInfos,
    authoritativeDomainInfos,
    domains,
    canLoadMore,
    loadMore,
    isLoadingMore,
    freeClaimEligibility,
  } = useSearch(parentDomain, { suggestionSource: 'client-ranked-tlds' });

  useSearchFromQuery(setQuery, runSearch);

  const form = useForm<EppAuthorizationCodesFormData>({
    resolver: zodResolver(eppAuthorizationCodesFormSchema),
    defaultValues: {
      eppAuthorizationCodes: {},
    },
  });

  const initializeEppCodes = useCallback(() => {
    if (importQuery && importQuery.size > 0) {
      const initialCodes: Record<string, string> = {};
      importQuery.forEach((searchParams, domain) => {
        if (searchParams.eppAuthorizationCode) {
          initialCodes[domain] = searchParams.eppAuthorizationCode;
        }
      });
      form.reset({ eppAuthorizationCodes: initialCodes });
    }
  }, [importQuery, form]);

  const enhancedOnSearchModeChange = useCallback(
    (mode: SearchMode) => {
      onSearchModeChange(mode);
      if (mode === SearchMode.IMPORT) {
        setParentDomain(undefined);
      }
    },
    [onSearchModeChange],
  );

  // Order matters: useSearchModeFromHash consumes & clears `#import` /
  // `#register` before useScrollToHash looks for a scrollable target. For
  // any other hash (e.g. `#newsletter`), the first hook no-ops and the
  // second scrolls to the matching `id` once the client tree has hydrated.
  useSearchModeFromHash(enhancedOnSearchModeChange);
  useScrollToHash();

  useEffect(() => {
    initializeEppCodes();
  }, [initializeEppCodes]);

  useEffect(() => {
    registerSetParentDomain(setParentDomain);
  }, [registerSetParentDomain]);

  useEffect(() => {
    registerSetSearchMode((mode) =>
      enhancedOnSearchModeChange(mode as SearchMode),
    );
  }, [registerSetSearchMode, enhancedOnSearchModeChange]);

  useEffect(() => {
    const pending = consumePendingFreeMintsSearch();
    if (pending) {
      startFreeMintsSearchGuidance(pending);
    }
  }, [consumePendingFreeMintsSearch, startFreeMintsSearchGuidance]);

  const eppAuthorizationCodes = form.watch('eppAuthorizationCodes');

  const handleEppCodeChange = useCallback(
    (domain: NamefiNormalizedDomain, eppCode: string) => {
      form.setValue('eppAuthorizationCodes', {
        ...form.getValues('eppAuthorizationCodes'),
        [domain]: eppCode,
      });
    },
    [form],
  );

  const importableDomains = useMemo(() => {
    if (
      searchMode !== SearchMode.IMPORT ||
      !domains ||
      !authoritativeDomainInfos
    ) {
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
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [searchMode, domains, authoritativeDomainInfos, eppAuthorizationCodes]);

  const handleStorylineEnter = useCallback(() => {
    setHasSeenStorylineThisCycle(true);
  }, []);

  const showSearchResults =
    query.length > 0 && (isLoading || hasData || isError);

  useEffect(() => {
    if (query.trim().length > 0) {
      preloadSearchResults();
    }
  }, [query]);

  // The hero search is considered "visible" until its bottom scrolls within the
  // header band (~72px). Once results are showing and it scrolls past, the
  // compact floating search bar takes over so a new name can be searched
  // without scrolling back to the top.
  const isHeroSearchVisible = useInView(searchAnchorRef, {
    margin: '-72px 0px 0px 0px',
  });
  const showFloatingSearch = showSearchResults && !isHeroSearchVisible;

  useEffect(() => {
    if (showSearchResults) {
      setHasSeenStorylineThisCycle(false);
    }
  }, [showSearchResults]);

  const handleScrollIndicatorClick = useCallback(() => {
    const element = marketingSectionsRef.current;
    if (!element) {
      return;
    }

    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, top - 96),
      behavior: 'smooth',
    });
  }, []);

  const handleV3BetaClick = useCallback(() => {
    logEventWithInteractionLoggers({
      name: InteractionLoggingEventName.PromoClick,
      properties: {
        id: 'search-v3-beta',
        target_url: 'https://search.labs.namefi.io',
      },
    });
  }, [logEventWithInteractionLoggers]);

  const shouldShowScrollIndicator =
    !showSearchResults && !hasSeenStorylineThisCycle;

  if (!origin) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050A] text-white">
      <main>
        <HeroSection
          searchMode={searchMode}
          onSearchModeChange={enhancedOnSearchModeChange}
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          runSearch={runSearch}
          parentDomain={parentDomain}
          onClearParentDomain={() => setParentDomain(undefined)}
          showScrollIndicator={shouldShowScrollIndicator}
          onScrollIndicatorClick={handleScrollIndicatorClick}
          onV3BetaClick={handleV3BetaClick}
          isSearchActive={showSearchResults}
          searchAnchorRef={searchAnchorRef}
          onSearchIntent={preloadSearchResults}
        />

        <AnimatePresence>
          {showFloatingSearch && (
            <FloatingSearchBar
              query={query}
              setQuery={setQuery}
              onSearch={runSearch}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {showSearchResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                className="mx-auto max-w-6xl px-6 pb-16 pt-2 md:pt-4"
              >
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur">
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
                    onRequestImportForDomain={startImportForDomain}
                    freeClaimEligibility={freeClaimEligibility}
                    canLoadMore={canLoadMore}
                    onLoadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="marketing"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
                className="-mt-32"
              >
                <div
                  ref={marketingSectionsRef}
                  className="min-h-screen [contain-intrinsic-size:1400px] [content-visibility:auto]"
                >
                  <MarketingSections
                    newsletterRef={newsletterRef}
                    onStorylineEnter={handleStorylineEnter}
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
      </main>
    </div>
  );
};

Landing.displayName = 'AstraLanding';
