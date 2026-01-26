import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback, useRef } from 'react';

const HERO_HEADING =
  'Namefi: Next generation domain platform with blockchain and AI';
const HERO_SUBTITLE =
  'Faster, cheaper and verifiable. The best way to own domains.';

const FEATURES = [
  {
    title: 'Faster, safer ownership',
    description:
      'Tokenize traditional DNS names into NFTs so transfers settle in seconds with clear, onchain provenance.',
  },
  {
    title: 'AI potential on tap',
    description:
      'Namefi AI uncovers naming insights, brand hooks, and design inspirations so every registration starts smarter.',
  },
  {
    title: 'Marketplace-ready assets',
    description:
      'Move your domains directly into NFT marketplaces and trade them with onchain security.',
  },
] as const;

type SearchMode = 'REGISTER' | 'IMPORT';

const SearchModeTabs = ({
  searchMode,
  onSearchModeChange,
}: {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
}) => (
  <div className="flex gap-2 rounded-full bg-white/5 p-1">
    <button
      type="button"
      onClick={() => onSearchModeChange('REGISTER')}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        searchMode === 'REGISTER'
          ? 'bg-brand-primary text-white'
          : 'text-white/70 hover:text-white'
      }`}
    >
      Register
    </button>
    <button
      type="button"
      onClick={() => onSearchModeChange('IMPORT')}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        searchMode === 'IMPORT'
          ? 'bg-brand-primary text-white'
          : 'text-white/70 hover:text-white'
      }`}
    >
      Import
    </button>
  </div>
);

const SearchInput = ({
  query,
  setQuery,
  isLoading,
  searchMode,
  onSearch,
}: {
  query: string;
  setQuery: (value: string) => void;
  isLoading: boolean;
  searchMode: SearchMode;
  onSearch: () => void;
}) => (
  <div className="flex w-full items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-3 backdrop-blur">
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={
        searchMode === 'REGISTER'
          ? 'Search for your perfect domain...'
          : 'Enter domain to import...'
      }
      className="flex-1 bg-transparent text-white placeholder:text-white/50 focus:outline-none"
      onKeyDown={(e) => e.key === 'Enter' && onSearch()}
    />
    <button
      type="button"
      onClick={onSearch}
      disabled={isLoading}
      className="rounded-full bg-brand-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
    >
      {isLoading ? 'Searching...' : 'Search'}
    </button>
  </div>
);

const ScrollIndicator = ({
  visible = true,
  onClick,
}: {
  visible?: boolean;
  onClick?: () => void;
}) => (
  <div className="mt-8 flex h-16 items-center justify-center">
    {visible ? (
      <button
        type="button"
        onClick={onClick}
        aria-label="Scroll to Why Use Namefi section"
        className="flex flex-col items-center gap-2 text-[11px] font-medium text-white/65 transition hover:text-white focus:outline-none animate-pulse"
      >
        <div className="flex h-10 w-6 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
          <span className="block h-2 w-0.5 rounded-full bg-white" />
        </div>
        <span>Why Choose Namefi?</span>
      </button>
    ) : null}
  </div>
);

const HeroSection = ({
  searchMode,
  onSearchModeChange,
  query,
  setQuery,
  isLoading,
  runSearch,
  showScrollIndicator = true,
  onScrollIndicatorClick,
}: {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  query: string;
  setQuery: (value: string) => void;
  isLoading: boolean;
  runSearch: () => void;
  showScrollIndicator?: boolean;
  onScrollIndicatorClick?: () => void;
}) => {
  return (
    <section className="relative flex min-h-[95vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="absolute left-[10%] top-1/2 h-[340px] w-[340px] -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[110px]" />
          <div className="absolute right-[12%] top-[65%] h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-[120px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-[8px] md:text-[10px] uppercase tracking-[0.18em] text-emerald-100 backdrop-blur">
          ICANN-accredited registrar on Ethereum & Base
        </span>
        <h1 className="mt-6 text-balance text-2xl font-semibold leading-tight md:mt-8 md:text-6xl">
          {HERO_HEADING}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm text-muted-foreground md:mt-4 md:text-xl">
          {HERO_SUBTITLE}
        </p>

        <div className="mt-8 md:mt-12 flex w-full max-w-3xl flex-col items-center gap-6">
          <div className="mx-auto w-full max-w-md">
            <SearchModeTabs
              searchMode={searchMode}
              onSearchModeChange={onSearchModeChange}
            />
          </div>
          <div className="relative z-10 flex w-full justify-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-12 -inset-y-6 z-0 rounded-full bg-gradient-to-r from-brand-primary/40 via-emerald-300/25 to-sky-400/25 blur-3xl mix-blend-screen opacity-60"
            />
            <div className="relative z-20 w-full">
              <SearchInput
                query={query}
                setQuery={setQuery}
                isLoading={isLoading}
                searchMode={searchMode}
                onSearch={runSearch}
              />
              <div className="mt-4 flex justify-center">
                <a
                  href="https://search.labs.namefi.io"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
                >
                  <span>Or try our new search experience (v3 beta)</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <ScrollIndicator
          visible={showScrollIndicator}
          onClick={onScrollIndicatorClick}
        />
      </div>
    </section>
  );
};

const FeatureCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/20">
      <div className="h-6 w-6 rounded bg-brand-primary/60" />
    </div>
    <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const FeaturesSection = () => (
  <section className="mx-auto max-w-6xl px-6 py-24">
    <div className="mb-12 text-center">
      <h2 className="text-3xl font-semibold text-white md:text-4xl">
        Why Choose Namefi?
      </h2>
      <p className="mt-4 text-muted-foreground">
        The future of domain ownership is here
      </p>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  </section>
);

const MainPageLanding = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('REGISTER');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const marketingSectionsRef = useRef<HTMLDivElement>(null);

  const handleSearchModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    setQuery('');
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim().length === 0) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  }, [query]);

  const handleScrollIndicatorClick = useCallback(() => {
    const element = marketingSectionsRef.current;
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, top - 96),
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050A] text-white">
      <main>
        <HeroSection
          searchMode={searchMode}
          onSearchModeChange={handleSearchModeChange}
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          runSearch={handleSearch}
          showScrollIndicator={true}
          onScrollIndicatorClick={handleScrollIndicatorClick}
        />
        <div ref={marketingSectionsRef}>
          <FeaturesSection />
        </div>
      </main>
    </div>
  );
};

const meta = {
  title: 'Pages/MainPage',
  component: MainPageLanding,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#04050A' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainPageLanding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearchQuery: Story = {
  render: function WithSearchQueryStory() {
    const [searchMode, setSearchMode] = useState<SearchMode>('REGISTER');
    const [query, setQuery] = useState('example');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearchModeChange = useCallback((mode: SearchMode) => {
      setSearchMode(mode);
      setQuery('');
    }, []);

    const handleSearch = useCallback(() => {
      if (query.trim().length === 0) return;
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500);
    }, [query]);

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#04050A] text-white">
        <main>
          <HeroSection
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
            query={query}
            setQuery={setQuery}
            isLoading={isLoading}
            runSearch={handleSearch}
            showScrollIndicator={false}
          />
          <FeaturesSection />
        </main>
      </div>
    );
  },
};

export const ImportMode: Story = {
  render: function ImportModeStory() {
    const [searchMode, setSearchMode] = useState<SearchMode>('IMPORT');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearchModeChange = useCallback((mode: SearchMode) => {
      setSearchMode(mode);
      setQuery('');
    }, []);

    const handleSearch = useCallback(() => {
      if (query.trim().length === 0) return;
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500);
    }, [query]);

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#04050A] text-white">
        <main>
          <HeroSection
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
            query={query}
            setQuery={setQuery}
            isLoading={isLoading}
            runSearch={handleSearch}
            showScrollIndicator={true}
          />
          <FeaturesSection />
        </main>
      </div>
    );
  },
};

export const Loading: Story = {
  render: function LoadingStory() {
    const [searchMode, setSearchMode] = useState<SearchMode>('REGISTER');
    const [query] = useState('namefi');
    const isLoading = true;

    const handleSearchModeChange = useCallback((mode: SearchMode) => {
      setSearchMode(mode);
    }, []);

    const noop = useCallback(() => {
      // Intentionally empty - loading state demo
    }, []);

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#04050A] text-white">
        <main>
          <HeroSection
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
            query={query}
            setQuery={noop}
            isLoading={isLoading}
            runSearch={noop}
            showScrollIndicator={false}
          />
          <FeaturesSection />
        </main>
      </div>
    );
  },
};
