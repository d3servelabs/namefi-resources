'use client';

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type RefObject,
  type ReactNode,
  type ErrorInfo,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, useInView } from 'motion/react';
import { ErrorBoundary } from '@suspensive/react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { reportReactBoundaryError } from '@/lib/datadog-react-error';
import { cn } from '@namefi-astra/ui/lib/cn';
import EthNetwork from '@/components/chains/eth-network';
import BaseNetwork from '@/components/chains/base-network';
import {
  DiscordBrandIcon,
  GitHubBrandIcon,
  LinkedInBrandIcon,
  TelegramBrandIcon,
  XBrandIcon,
  YouTubeBrandIcon,
} from '@namefi-astra/ui/components/namefi/brand-icons';
import {
  ArrowRight,
  BrainCircuit,
  Coins,
  ShieldCheck,
  Send,
  Sparkles,
  CalendarCheck,
  Newspaper,
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
  {
    title: 'Faster, safer ownership',
    description:
      'Tokenize traditional DNS names into NFTs so transfers settle in seconds with clear, onchain provenance.',
    icon: ShieldCheck,
  },
  {
    title: 'AI potential on tap',
    description:
      'Namefi AI uncovers naming insights, brand hooks, and design inspirations so every registration starts smarter.',
    icon: BrainCircuit,
  },
  {
    title: 'Marketplace-ready assets',
    description:
      'Move your domains directly into NFT marketplaces and trade them with onchain security.',
    icon: Coins,
  },
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

const BACKER_FILTERS: Array<{ label: string; value: BackerFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Investors', value: 'investor' },
  { label: 'Partners', value: 'partner' },
  { label: 'Grants', value: 'grant' },
];

const FAQS: Array<{ question: string; answer: ReactNode }> = [
  {
    question: 'What can I use Namefi for?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          Register or import more than 800 TLDs, tokenize them into NFTs, and
          take them to any NFT marketplace.
        </p>
        <p>
          AutoENS lets you route crypto payments to your DNS names via gasless
          DNSSEC.{' '}
          <Link
            href="https://namefi.medium.com/dnssec-a-good-security-protocol-to-domain-name-service-system-028c1dc6a700"
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary underline-offset-4 hover:underline"
          >
            Learn more
          </Link>{' '}
          or read the{' '}
          <Link
            href="https://blog.ens.domains/post/gasless-dnssec"
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary underline-offset-4 hover:underline"
          >
            ENS announcement
          </Link>
          .
        </p>
        <p>
          Namefi AI surfaces naming insights so you can register with
          data-backed conviction.
        </p>
      </div>
    ),
  },
  {
    question: 'What TLDs does Namefi support?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          We currently support over 800 TLDs. Some premium or
          registry-restricted names may require extra time while we expand
          coverage.
        </p>
      </div>
    ),
  },
  {
    question: 'Does Namefi support ENS, Handshake, or other web3 names?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          For now we focus on tokenizing web2 domains. We do not issue ENS,
          Handshake, or Unstoppable names, but we integrate features like
          AutoENS so your DNS domains work seamlessly onchain.
        </p>
      </div>
    ),
  },
  {
    question: 'Why choose Namefi?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          We operate the first and largest domain tokenization protocol on
          Ethereum, making transfers 100× faster, safer, and more liquid than
          legacy escrow.
        </p>
        <p>
          We are led by one of the few Ethereum Improvement Proposal editors and
          backed by OrangeDAO plus 14 other funds.
        </p>
        <p>
          Our smart contract is open source:
          0x0000000000cf80E7Cf8Fa4480907f692177f8e06.
        </p>
      </div>
    ),
  },
  {
    question: 'How can I get $NFSC service credits?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          $NFSC is currently available to eligible airdrop recipients. We will
          open wider distribution soon—stay tuned.
        </p>
      </div>
    ),
  },
  {
    question: 'How do I qualify for future airdrops?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          Tell us how you plan to use Namefi via our{' '}
          <Link
            href="https://tally.so/r/w5xl1M?utm_campaign=www.namefi.io"
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary underline-offset-4 hover:underline"
          >
            signup form
          </Link>
          , engage with the community, and share feedback. Contributors and
          ecosystem partners receive priority.
        </p>
      </div>
    ),
  },
  {
    question: 'Will Namefi open to more users soon?',
    answer: (
      <div className="space-y-3 text-muted-foreground">
        <p>
          We are gradually expanding the beta. Early testers with $NFSC credits
          gain first access before general availability.
        </p>
      </div>
    ),
  },
];

const COMMUNITY_LINKS = [
  {
    name: 'Discord',
    href: 'https://discord.gg/PKW52TXS',
    icon: DiscordBrandIcon,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/namefi_io',
    icon: XBrandIcon,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/d3servelabs',
    icon: GitHubBrandIcon,
  },
  {
    name: 'Telegram',
    href: 'https://t.me/namefidao',
    icon: TelegramBrandIcon,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/d3servelabs',
    icon: LinkedInBrandIcon,
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@Namefi_io',
    icon: YouTubeBrandIcon,
  },
  {
    name: 'Namefi Resources',
    href: '/r',
    icon: Newspaper,
  },
  {
    name: 'Namefi Events',
    href: 'https://lu.ma/namefi',
    icon: CalendarCheck,
  },
] as const;

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

type StoryPanel = {
  id: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  accent: 'brand' | 'emerald' | 'violet';
  renderMedia: () => ReactNode;
};

const STORY_PANELS: StoryPanel[] = [
  {
    id: 'tokenization',
    badge: 'Namefi NFTs',
    title: 'Namefi NFTs secure DNS ownership onchain.',
    description:
      'Minted when you import and burned when you export, each NFT is verifiable proof of control over your domain.',
    highlights: ['Minted on import', 'AutoENS support', 'Marketplace ready'],
    accent: 'brand',
    renderMedia: () => (
      <Card className="relative overflow-hidden border-white/20 bg-white/[0.04] p-6 backdrop-blur sm:min-h-[360px]">
        <div className="absolute inset-4 rounded-[32px] bg-brand-primary/15 blur-3xl" />
        <div className="relative space-y-6 text-center">
          <div className="relative mx-auto flex w-full max-w-[260px] items-center justify-center">
            <div className="absolute inset-6 rounded-[36px] bg-brand-primary/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-4">
              <Image
                src="/assets/astra/NFTAssetPreview.png"
                alt="Namefi NFT preview"
                width={280}
                height={280}
                className="mx-auto w-full drop-shadow-[0_10px_40px_rgba(44,116,255,0.35)]"
              />
            </div>
          </div>
          <div className="space-y-3">
            <span className="block text-xs uppercase tracking-[0.2em] text-white/60">
              Namefi NFT preview
            </span>
            <h4 className="text-lg font-semibold text-white/70">
              Ownership that travels with your domain
            </h4>
          </div>
        </div>
      </Card>
    ),
  },
  {
    id: 'intelligence',
    badge: 'Namefi Brand Studio',
    title: 'Spin up brand directions and domain ideas in minutes.',
    description:
      'Namefi AI pairs availability data with creative outputs so you can validate a concept, preview posters, and move straight into registration.',
    highlights: [
      'Domain-guided prompts',
      'Logos & posters',
      'Share-ready assets',
    ],
    accent: 'emerald',
    renderMedia: () => (
      <Card className="relative overflow-hidden border-white/15 bg-white/[0.05] p-6 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-cyan-400/20 opacity-70" />
        <div className="relative space-y-4 text-left">
          <span className="block text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
            AI workflow
          </span>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
              <div>
                <p className="font-semibold text-white">Generate brand kits</p>
                <p className="text-white/70">
                  Logos, posters, and copy tuned to your domain and audience.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <SearchIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
              <div>
                <p className="font-semibold text-white">
                  Work from your portfolio
                </p>
                <p className="text-white/70">
                  Select the Namefi domain you own and tailor creative direction
                  around it.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <Send className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
              <div>
                <p className="font-semibold text-white">Share instantly</p>
                <p className="text-white/70">
                  Export assets for teammates or socials with a single link.
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
    badge: 'DNS & Renewal Control',
    title: 'Keep domains resolvable, signed, and renewed on autopilot.',
    description:
      'Manage DNS zones, schedule renewals, and maintain DNSSEC + ENS links without juggling registrars or scripts.',
    highlights: [
      'DNSSEC + AutoENS',
      'Auto-renew protection',
      'Validated zone editor',
    ],
    accent: 'violet',
    renderMedia: () => (
      <Card className="relative overflow-hidden border-white/15 bg-white/[0.03] p-6 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-transparent to-sky-500/20 opacity-70" />
        <div className="relative space-y-5 text-left">
          <div className="space-y-3">
            <span className="block text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
              Operations overview
            </span>
            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-black/35 p-4">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />
              <div className="space-y-1">
                <p className="font-semibold text-white">DNSSEC & AutoENS</p>
                <p className="text-sm text-white/70">
                  Enable signing workflows and gasless DNSSEC so your DNS names
                  resolve onchain through ENS automatically.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-black/35 p-4">
              <CalendarCheck className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  Auto-renew guardrails
                </p>
                <p className="text-sm text-white/70">
                  Save payment preferences once and let Namefi retry renewals so
                  critical domains never lapse unexpectedly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-black/35 p-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />
              <div className="space-y-1">
                <p className="font-semibold text-white">Point-and-click DNS</p>
                <p className="text-sm text-white/70">
                  Edit records in an interface that validates every change
                  before it ships, no registrar dashboards required.
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
        rel="noreferrer"
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
  const blockRef = useRef<HTMLDivElement>(null);
  const hasDispatchedRef = useRef(false);
  const isInView = useInView(blockRef, { amount: 0.3 });

  useEffect(() => {
    if (!hasDispatchedRef.current && isInView) {
      hasDispatchedRef.current = true;
      onVisible?.();
    }
  }, [isInView, onVisible]);

  return (
    <motion.section
      ref={blockRef}
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
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
        <div className="space-y-5 text-left">
          <motion.span
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/70"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-white/80"
              aria-hidden
            />
            {panel.badge}
          </motion.span>
          <motion.h3
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
            className="text-2xl font-semibold leading-snug md:text-3xl"
          >
            {panel.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
            className="max-w-xl text-base text-white/70 md:text-lg"
          >
            {panel.description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{
              duration: 0.55,
              ease: [0.215, 0.61, 0.355, 1],
              delay: 0.05,
            }}
            className="flex flex-wrap gap-2.5"
          >
            {panel.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/65"
              >
                {highlight}
              </span>
            ))}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{
            duration: 0.65,
            ease: [0.215, 0.61, 0.355, 1],
            delay: 0.05,
          }}
          className="relative flex justify-end"
        >
          <div className="w-full max-w-md">{panel.renderMedia()}</div>
        </motion.div>
      </div>
    </motion.section>
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

const FeaturesSection = () => (
  <section className="space-y-10 pb-2">
    <SectionHeading title="Namefi features" eyebrow="Built for the future" />
    <div className="grid gap-6 md:grid-cols-3">
      {FEATURES.map(({ title, description, icon: Icon }) => (
        <div
          key={title}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      ))}
    </div>
  </section>
);

const SupportingSection = () => (
  <section className="space-y-10">
    <SectionHeading
      title="Proudly supporting"
      description="Trade and finance Namefi NFTs across the ecosystem."
    />
    <LogoGrid
      items={SUPPORTING_PLATFORMS}
      columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
    />
  </section>
);

const BackersSection = () => {
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
        title="Backed by partners, investors, and grant programs"
        description="Namefi is supported by leading funds, accelerators, and infrastructure providers across web3."
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {BACKER_FILTERS.map(({ label, value }) => (
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
            {label}
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

const logFaqError = (error: Error, info: ErrorInfo) => {
  reportReactBoundaryError('LandingMarketing:FaqSection', error, info);
};

const FaqSection = () => (
  <section className="space-y-10">
    <SectionHeading
      title="FAQs"
      description="Answers to the most common questions about Namefi."
    />
    <Accordion multiple className="space-y-4">
      {FAQS.map((faq, index) => (
        <ErrorBoundary
          key={faq.question}
          fallback={<></>}
          onError={logFaqError}
        >
          <AccordionItem
            value={`faq-${index}`}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur"
          >
            <AccordionTrigger className="px-6 py-5 text-left text-lg font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        </ErrorBoundary>
      ))}
    </Accordion>
  </section>
);

const CommunitySection = ({
  newsletterRef,
}: {
  newsletterRef: RefObject<HTMLDivElement | null>;
}) => (
  <section ref={newsletterRef} className="space-y-10">
    <SectionHeading
      title="Join the Namefi community"
      description="A global network of domainers, builders, contributors, and onchain enthusiasts."
    />
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <NewsletterForm
        from="namefi-home"
        title="Get our newsletter"
        description="Subscribe for new releases, integrations, and community highlights."
        showNameField
        variant="default"
        className="h-full max-w-none rounded-3xl border-white/10 bg-white/[0.02] py-0 backdrop-blur sm:mx-0"
        headerClassName="px-8 pt-8"
        contentClassName="px-8 pb-8"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {COMMUNITY_LINKS.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm font-medium text-white transition duration-300 hover:border-brand-primary/40 hover:bg-brand-primary/10"
          >
            <span className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
              <span className="absolute inset-0 bg-gradient-to-r from-brand-primary/30 via-transparent to-emerald-400/30" />
            </span>
            <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-brand-primary transition group-hover:border-transparent group-hover:bg-white group-hover:text-black">
              <Icon className="h-4 w-4" />
            </span>
            <span className="relative z-10 flex-1 text-base font-semibold tracking-tight">
              {name}
            </span>
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition group-hover:border-transparent group-hover:bg-white group-hover:text-black">
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export type MarketingSectionsProps = {
  newsletterRef: RefObject<HTMLDivElement | null>;
  marketingRef?: RefObject<HTMLDivElement | null>;
  onStorylineEnter?: () => void;
};

export const MarketingSections = ({
  newsletterRef,
  marketingRef,
  onStorylineEnter,
}: MarketingSectionsProps) => (
  <div
    ref={marketingRef}
    className="mx-auto flex max-w-6xl flex-col gap-28 px-6 pb-32"
  >
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <StorylineSection onStorylineEnter={onStorylineEnter} />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <FeaturesSection />
    </motion.div>

    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      <SectionHeading
        title="Namefi smart contracts"
        description="Open source on Ethereum and Base so anyone can verify every function."
      />
      <Card className="flex flex-col gap-6 border-white/10 bg-white/[0.02] p-8 backdrop-blur">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>We</span>
          <span className="text-red-400">♥</span>
          <span>opensource</span>
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
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  <EthNetwork className="h-4 w-4" />
                  <span>ETH</span>
                </Link>
                <Link
                  href={contract.basescanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  <BaseNetwork className="h-4 w-4" />
                  <span>BASE</span>
                </Link>
                <Link
                  href={contract.githubUrl}
                  target="_blank"
                  rel="noreferrer"
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
    </motion.section>

    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      <SectionHeading
        title="Powered by"
        description="Infrastructure we rely on every day."
      />
      <LogoGrid items={POWERED_BY} />
    </motion.section>

    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <SupportingSection />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <BackersSection />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <FaqSection />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <CommunitySection newsletterRef={newsletterRef} />
    </motion.div>
  </div>
);
