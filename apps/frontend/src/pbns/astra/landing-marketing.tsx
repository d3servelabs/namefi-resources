'use client';

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type RefObject,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import EthNetwork from '@/components/chains/eth-network';
import BaseNetwork from '@/components/chains/base-network';
import { getExternalLinkRel } from '@/lib/external-link';
import { GitHubBrandIcon } from '@namefi-astra/ui/components/namefi/brand-icons';
import {
  BrainCircuit,
  Coins,
  ShieldCheck,
  Send,
  Sparkles,
  CalendarCheck,
  Search as SearchIcon,
} from 'lucide-react';

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

const FEATURES = [
  { key: 'ownership', icon: ShieldCheck },
  { key: 'ai', icon: BrainCircuit },
  { key: 'marketplace', icon: Coins },
] as const;

type LogoItem = {
  name: string;
  href: string;
  logo: string;
};

type BackerCategory = 'investor' | 'partner' | 'grant';

type BackerItem = LogoItem & {
  categories: BackerCategory[];
};

type BackerFilter = 'all' | BackerCategory;

const POWERED_BY: LogoItem[] = [
  {
    name: 'Ethereum',
    href: 'https://ethereum.org/',
    logo: '/assets/astra/logos/ethereum.svg',
  },
  {
    name: 'Sign-in with Ethereum',
    href: 'https://login.xyz/',
    logo: '/assets/astra/logos/loginwithethereum.svg',
  },
  {
    name: 'Google Cloud',
    href: 'https://cloud.google.com/',
    logo: '/assets/astra/logos/googlecloud.svg',
  },
  {
    name: 'AWS',
    href: 'https://aws.amazon.com/',
    logo: '/assets/astra/logos/aws.svg',
  },
];

const SUPPORTING_PLATFORMS: LogoItem[] = [
  {
    name: 'OpenSea',
    href: 'https://opensea.io/collection/namefinft',
    logo: '/assets/astra/logos/opensea.svg',
  },
  {
    name: 'NFTFi',
    href: 'https://app.nftfi.com/collection/0x0000000000cf80e7cf8fa4480907f692177f8e06',
    logo: '/assets/astra/logos/nftfi.svg',
  },
  {
    name: 'Teller',
    href: 'https://app.teller.org/ethereum/lend/detail?category=nft&principal=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&collateral=0x0000000000cf80e7cf8fa4480907f692177f8e06',
    logo: '/assets/astra/logos/teller.svg',
  },
  {
    name: 'NameMaxi',
    href: 'https://www.namemaxi.com/',
    logo: '/assets/astra/logos/namemaxi.svg',
  },
  {
    name: 'LooksRare',
    href: 'https://looksrare.org/collections/0x0000000000cf80E7Cf8Fa4480907f692177f8e06',
    logo: '/assets/astra/logos/looksrare.svg',
  },
  {
    name: 'ENS',
    href: 'https://ens.domains/',
    logo: '/assets/astra/logos/ens.svg',
  },
  {
    name: 'MagicEden',
    href: 'https://magiceden.io/collections/ethereum/0x0000000000cf80e7cf8fa4480907f692177f8e06',
    logo: '/assets/astra/logos/magiceden.svg',
  },
  {
    name: 'OKX',
    href: 'https://www.okx.com/web3/nft/collection/eth/namefinft',
    logo: '/assets/astra/logos/okx.svg',
  },
  {
    name: 'Rarible',
    href: 'https://rarible.com/collection/0x0000000000cf80e7cf8fa4480907f692177f8e06/items',
    logo: '/assets/astra/logos/rarible.svg',
  },
  {
    name: 'Zora',
    href: 'https://zora.co/collect/eth:0x0000000000cf80e7cf8fa4480907f692177f8e06',
    logo: '/assets/astra/logos/zora.svg',
  },
  {
    name: 'Element',
    href: 'https://element.market/collections/namefinft',
    logo: '/assets/astra/logos/element.svg',
  },
  {
    name: 'Sudoswap',
    href: 'https://sudoswap.xyz/#/browse/buy/0x0000000000cf80e7cf8fa4480907f692177f8e06',
    logo: '/assets/astra/logos/sudoswap.svg',
  },
  {
    name: 'OpenSea Pro',
    href: 'https://pro.opensea.io/collection/namefinft',
    logo: '/assets/astra/logos/openseapro.svg',
  },
];

const BACKERS_AND_PARTNERS: BackerItem[] = [
  {
    name: 'Orange DAO',
    href: 'https://www.orangedao.xyz/',
    logo: '/assets/astra/logos/orangedao.svg',
    categories: ['investor'],
  },
  {
    name: 'Bloccelerate VC',
    href: 'https://bloccelerate.vc/',
    logo: '/assets/astra/logos/bloccelerate.svg',
    categories: ['investor'],
  },
  {
    name: 'SNZ Holding',
    href: 'https://snzholding.com/',
    logo: '/assets/astra/logos/snz-holding.svg',
    categories: ['investor'],
  },
  {
    name: 'Alchemy Ventures',
    href: 'https://www.alchemy.com/',
    logo: '/assets/astra/logos/alchemy.svg',
    categories: ['investor'],
  },
  {
    name: 'Aleph Crypto Fund',
    href: 'https://alephcrypto.xyz/',
    logo: '/assets/astra/logos/aleph-crypto.svg',
    categories: ['investor'],
  },
  {
    name: 'Foothill Ventures',
    href: 'https://www.foothill.ventures/',
    logo: '/assets/astra/logos/foothill.svg',
    categories: ['investor'],
  },
  {
    name: 'Sinovel Angel Fund',
    href: 'https://sinovel.org/',
    logo: '/assets/astra/logos/sinovel.svg',
    categories: ['investor'],
  },
  {
    name: 'TSVC',
    href: 'https://www.tsvcap.com/',
    logo: '/assets/astra/logos/tsvc.svg',
    categories: ['investor'],
  },
  {
    name: 'Avant Blockchain Capital',
    href: 'https://avant.fund/',
    logo: '/assets/astra/logos/avant.svg',
    categories: ['investor'],
  },
  {
    name: 'Rebase D. Ventures',
    href: 'https://rebased.ventures/',
    logo: '/assets/astra/logos/rebase.svg',
    categories: ['investor'],
  },
  {
    name: 'Mask Network',
    href: 'https://mask.io/',
    logo: '/assets/astra/logos/mask.svg',
    categories: ['partner'],
  },
  {
    name: 'StarkNet',
    href: 'https://www.starknet.io/',
    logo: '/assets/astra/logos/starknet.svg',
    categories: ['partner'],
  },
  {
    name: 'Google Cloud Startup Credit',
    href: 'https://cloud.google.com/',
    logo: '/assets/astra/logos/google-cloud.svg',
    categories: ['grant'],
  },
  {
    name: 'Amazon Activate Program',
    href: 'https://aws.amazon.com/startups',
    logo: '/assets/astra/logos/amazon-activate.svg',
    categories: ['grant'],
  },
  {
    name: 'Ethereum Name Service',
    href: 'https://ens.app/',
    logo: '/assets/astra/logos/ethereum-name-service.svg',
    categories: ['partner'],
  },
  {
    name: 'Vision.io',
    href: 'https://Vision.io',
    logo: '/assets/astra/logos/vision.svg',
    categories: ['partner'],
  },
  {
    name: 'Dynadot',
    href: 'https://Dynadot.com',
    logo: '/assets/astra/logos/dynadot.svg',
    categories: ['partner'],
  },
  {
    name: 'Gifted.art',
    href: 'https://Gifted.art',
    logo: '/assets/astra/logos/gifted-art.svg',
    categories: ['partner'],
  },
  {
    name: 'Privy',
    href: 'https://Privy.io',
    logo: '/assets/astra/logos/privy.svg',
    categories: ['partner'],
  },
  {
    name: 'NameMaxi',
    href: 'https://NameMaxi.com',
    logo: '/assets/astra/logos/namemaxi.svg',
    categories: ['partner'],
  },
];

const BACKER_FILTERS: BackerFilter[] = ['all', 'investor', 'partner', 'grant'];

const CONTRACTS = [
  {
    name: '$NFSC',
    address: '0x0000000000c39a0f674c12a5e63eb8031b550b6f',
    etherscanUrl:
      'https://etherscan.io/token/0x0000000000c39a0f674c12a5e63eb8031b550b6f',
    basescanUrl:
      'https://basescan.org/address/0x0000000000c39a0f674c12a5e63eb8031b550b6f',
    githubUrl: 'https://github.com/d3servelabs/namefi-contracts',
  },
  {
    name: 'Namefi NFT',
    address: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
    etherscanUrl:
      'https://etherscan.io/address/0x0000000000cf80e7cf8fa4480907f692177f8e06',
    basescanUrl:
      'https://basescan.org/token/0x0000000000cf80e7cf8fa4480907f692177f8e06',
    githubUrl: 'https://github.com/d3servelabs/namefi-contracts',
  },
] as const;

type StoryTranslator = ReturnType<typeof useTranslations<'landingMarketing'>>;

type StoryPanel = {
  id: string;
  /** i18n key under `story.<key>` for badge/title/description/highlights. */
  key: string;
  highlightKeys: string[];
  accent: 'brand' | 'emerald' | 'violet';
  renderMedia: (t: StoryTranslator) => ReactNode;
};

const STORY_PANELS: StoryPanel[] = [
  {
    id: 'tokenization',
    key: 'tokenization',
    highlightKeys: ['mintedOnImport', 'autoEns', 'marketplaceReady'],
    accent: 'brand',
    renderMedia: (t) => (
      <Card className="relative overflow-hidden border-white/20 bg-white/[0.04] p-6 backdrop-blur sm:min-h-[360px]">
        <div className="absolute inset-4 rounded-[32px] bg-brand-primary/15 blur-3xl" />
        <div className="relative space-y-6 text-center">
          <div className="relative mx-auto flex w-full max-w-[260px] items-center justify-center">
            <div className="absolute inset-6 rounded-[36px] bg-brand-primary/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-4">
              <Image
                src="/assets/astra/NFTAssetPreview.png"
                alt={t('story.tokenization.media.previewAlt')}
                width={280}
                height={280}
                className="mx-auto w-full drop-shadow-[0_10px_40px_rgba(44,116,255,0.35)]"
              />
            </div>
          </div>
          <div className="space-y-3">
            <span className="block text-xs uppercase tracking-[0.2em] text-white/60">
              {t('story.tokenization.media.previewEyebrow')}
            </span>
            <h4 className="text-lg font-semibold text-white/70">
              {t('story.tokenization.media.previewTitle')}
            </h4>
          </div>
        </div>
      </Card>
    ),
  },
  {
    id: 'intelligence',
    key: 'intelligence',
    highlightKeys: ['domainGuidedPrompts', 'logosPosters', 'shareReady'],
    accent: 'emerald',
    renderMedia: (t) => (
      <Card className="relative overflow-hidden border-white/15 bg-white/[0.05] p-6 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-cyan-400/20 opacity-70" />
        <div className="relative space-y-4 text-start">
          <span className="block text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
            {t('story.intelligence.media.eyebrow')}
          </span>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
              <div>
                <p className="font-semibold text-white">
                  {t('story.intelligence.media.generateTitle')}
                </p>
                <p className="text-white/70">
                  {t('story.intelligence.media.generateDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <SearchIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
              <div>
                <p className="font-semibold text-white">
                  {t('story.intelligence.media.portfolioTitle')}
                </p>
                <p className="text-white/70">
                  {t('story.intelligence.media.portfolioDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <Send className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
              <div>
                <p className="font-semibold text-white">
                  {t('story.intelligence.media.shareTitle')}
                </p>
                <p className="text-white/70">
                  {t('story.intelligence.media.shareDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    ),
  },
  {
    id: 'operations',
    key: 'operations',
    highlightKeys: ['dnssecAutoEns', 'autoRenew', 'validatedZoneEditor'],
    accent: 'violet',
    renderMedia: (t) => (
      <Card className="relative overflow-hidden border-white/15 bg-white/[0.03] p-6 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-transparent to-sky-500/20 opacity-70" />
        <div className="relative space-y-5 text-start">
          <div className="space-y-3">
            <span className="block text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
              {t('story.operations.media.eyebrow')}
            </span>
            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-black/35 p-4">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  {t('story.operations.media.dnssecTitle')}
                </p>
                <p className="text-sm text-white/70">
                  {t('story.operations.media.dnssecDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-black/35 p-4">
              <CalendarCheck className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  {t('story.operations.media.autoRenewTitle')}
                </p>
                <p className="text-sm text-white/70">
                  {t('story.operations.media.autoRenewDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-black/35 p-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  {t('story.operations.media.dnsTitle')}
                </p>
                <p className="text-sm text-white/70">
                  {t('story.operations.media.dnsDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    ),
  },
];

const LogoGrid = ({
  items,
  columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: {
  items: LogoItem[];
  columns?: string;
}) => (
  <div className={cn('grid gap-4', columns)}>
    {items.map((item) => (
      <a
        key={item.name}
        href={item.href}
        target="_blank"
        rel={getExternalLinkRel(item.href)}
        className="group flex h-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 transition hover:border-white/40 hover:bg-white/10"
      >
        <span className="sr-only">{item.name}</span>
        <Image
          src={item.logo}
          alt={item.name}
          width={140}
          height={32}
          className="max-h-10 w-auto grayscale transition group-hover:grayscale-0"
        />
      </a>
    ))}
  </div>
);

const SectionHeading = ({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
}) => (
  <div className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
    {eyebrow ? (
      <span className="mx-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-primary">
        {eyebrow}
      </span>
    ) : null}
    <h2 className="text-3xl font-semibold md:text-4xl">{title}</h2>
    {description ? (
      <p className="text-lg text-muted-foreground">{description}</p>
    ) : null}
  </div>
);

const accentGradients: Record<StoryPanel['accent'], string> = {
  brand: 'from-brand-primary/40 via-transparent to-transparent',
  emerald: 'from-emerald-400/35 via-transparent to-transparent',
  violet: 'from-indigo-500/35 via-transparent to-transparent',
};

const StoryBlock = ({
  panel,
  onVisible,
}: {
  panel: StoryPanel;
  onVisible?: () => void;
}) => {
  const t = useTranslations('landingMarketing');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;
  const blockRef = useRef<HTMLElement>(null);
  const hasDispatchedRef = useRef(false);

  useEffect(() => {
    const node = blockRef.current;
    if (!node || !onVisible) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasDispatchedRef.current) {
            hasDispatchedRef.current = true;
            onVisible();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <section
      ref={blockRef}
      className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.02] px-6 py-12 shadow-[0_24px_90px_rgba(8,12,36,0.35)] backdrop-blur-xl md:px-12 md:py-16"
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br',
          accentGradients[panel.accent],
          'opacity-60',
        )}
      />
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5 text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/70">
            <span
              className="h-1.5 w-1.5 rounded-full bg-white/80"
              aria-hidden
            />
            {tDynamic(`story.${panel.key}.badge`)}
          </span>
          <h3 className="text-2xl font-semibold leading-snug md:text-3xl">
            {tDynamic(`story.${panel.key}.title`)}
          </h3>
          <p className="max-w-xl text-base text-white/70 md:text-lg">
            {tDynamic(`story.${panel.key}.description`)}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {panel.highlightKeys.map((highlightKey) => (
              <span
                key={highlightKey}
                className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/65"
              >
                {tDynamic(`story.${panel.key}.highlights.${highlightKey}`)}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex justify-end">
          <div className="w-full max-w-md">{panel.renderMedia(t)}</div>
        </div>
      </div>
    </section>
  );
};

const StorylineSection = ({
  onStorylineEnter,
}: {
  onStorylineEnter?: () => void;
}) => (
  <div className="flex flex-col gap-14 md:gap-16">
    {STORY_PANELS.map((panel, index) => (
      <StoryBlock
        key={panel.id}
        panel={panel}
        onVisible={index === 0 ? onStorylineEnter : undefined}
      />
    ))}
  </div>
);

const FeaturesSection = () => {
  const t = useTranslations('landingMarketing');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;

  return (
    <section className="space-y-10 pb-2">
      <SectionHeading
        title={t('features.heading')}
        eyebrow={t('features.eyebrow')}
      />
      <div className="grid gap-6 md:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">
              {tDynamic(`features.items.${key}.title`)}
            </h3>
            <p className="text-muted-foreground">
              {tDynamic(`features.items.${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const SupportingSection = () => {
  const t = useTranslations('landingMarketing');

  return (
    <section className="space-y-10">
      <SectionHeading
        title={t('supporting.heading')}
        description={t('supporting.description')}
      />
      <LogoGrid
        items={SUPPORTING_PLATFORMS}
        columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      />
    </section>
  );
};

const BackersSection = () => {
  const t = useTranslations('landingMarketing');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;
  const [activeFilter, setActiveFilter] = useState<BackerFilter>('all');

  const filteredBackers = useMemo(() => {
    if (activeFilter === 'all') {
      return BACKERS_AND_PARTNERS;
    }

    return BACKERS_AND_PARTNERS.filter((backer) =>
      backer.categories.includes(activeFilter),
    );
  }, [activeFilter]);

  return (
    <section className="space-y-10">
      <SectionHeading
        title={t('backers.heading')}
        description={t('backers.description')}
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {BACKER_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveFilter(value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              value === activeFilter
                ? 'border-white bg-white text-black shadow-[0_0_25px_rgba(94,255,220,0.35)]'
                : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white/90',
            )}
          >
            {tDynamic(`backers.filters.${value}`)}
          </button>
        ))}
      </div>
      <LogoGrid
        items={filteredBackers}
        columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      />
    </section>
  );
};

const CommunitySection = ({
  newsletterRef,
}: {
  newsletterRef: RefObject<HTMLDivElement | null>;
}) => {
  const t = useTranslations('landingMarketing');

  return (
    <section
      id="newsletter"
      ref={newsletterRef}
      className="scroll-mt-24 space-y-10"
    >
      <SectionHeading
        title={t('community.heading')}
        description={t('community.description')}
      />
      <div className="mx-auto w-full max-w-2xl">
        <NewsletterForm
          from="namefi-home"
          title={t('community.newsletter.title')}
          description={t('community.newsletter.description')}
          showNameField
          variant="default"
          className="h-full max-w-none rounded-3xl border-white/10 bg-white/[0.02] py-0 backdrop-blur sm:mx-0"
          headerClassName="px-8 pt-8"
          contentClassName="px-8 pb-8"
        />
      </div>
    </section>
  );
};

export type MarketingSectionsProps = {
  newsletterRef: RefObject<HTMLDivElement | null>;
  marketingRef?: RefObject<HTMLDivElement | null>;
  onStorylineEnter?: () => void;
};

export const MarketingSections = ({
  newsletterRef,
  marketingRef,
  onStorylineEnter,
}: MarketingSectionsProps) => {
  const t = useTranslations('landingMarketing');

  return (
    <div
      ref={marketingRef}
      className="mx-auto flex max-w-6xl flex-col gap-28 px-6 pb-32"
    >
      <div>
        <StorylineSection onStorylineEnter={onStorylineEnter} />
      </div>

      <div>
        <FeaturesSection />
      </div>

      <section className="space-y-10">
        <SectionHeading
          title={t('smartContracts.heading')}
          description={t('smartContracts.description')}
        />
        <Card className="flex flex-col gap-6 border-white/10 bg-white/[0.02] p-8 backdrop-blur">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{t('smartContracts.weLove')}</span>
            <span className="text-red-400">♥</span>
            <span>{t('smartContracts.opensource')}</span>
          </div>
          <div className="space-y-6">
            {CONTRACTS.map((contract) => (
              <div
                key={contract.address}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                  <span className="text-brand-primary font-semibold whitespace-nowrap">
                    {contract.name}
                  </span>
                  <span className="text-muted-foreground break-all font-mono text-sm">
                    {contract.address}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={contract.etherscanUrl}
                    target="_blank"
                    rel={getExternalLinkRel(contract.etherscanUrl)}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                  >
                    <EthNetwork className="h-4 w-4" />
                    <span>ETH</span>
                  </Link>
                  <Link
                    href={contract.basescanUrl}
                    target="_blank"
                    rel={getExternalLinkRel(contract.basescanUrl)}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                  >
                    <BaseNetwork className="h-4 w-4" />
                    <span>BASE</span>
                  </Link>
                  <Link
                    href={contract.githubUrl}
                    target="_blank"
                    rel={getExternalLinkRel(contract.githubUrl)}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                  >
                    <GitHubBrandIcon className="h-4 w-4" />
                    <span>GitHub</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-10">
        <SectionHeading
          title={t('poweredBy.heading')}
          description={t('poweredBy.description')}
        />
        <LogoGrid items={POWERED_BY} />
      </section>

      <div>
        <SupportingSection />
      </div>

      <div>
        <BackersSection />
      </div>

      <div>
        <CommunitySection newsletterRef={newsletterRef} />
      </div>
    </div>
  );
};
