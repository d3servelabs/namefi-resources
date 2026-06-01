import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  ExternalLink,
  Eye,
  Link2,
  Palette,
  Rss,
  Search,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';
import { MLS_FEED_RSS_PATH } from '@/lib/mls/feed';
import { cn } from '@namefi-astra/ui/lib/cn';

export type FeatureKey = 'brand-studio' | 'feed';

type FeatureTone = 'studio' | 'feed';

type FeatureBeat = {
  title: string;
  body: string;
  icon: LucideIcon;
};

type FeatureFaq = {
  question: string;
  answer: string;
};

type FeaturePageContent = {
  key: FeatureKey;
  tone: FeatureTone;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: {
    label: string;
    href: Route;
  };
  secondaryCta?: {
    label: string;
    href: Route | string;
    external?: boolean;
  };
  beats: FeatureBeat[];
  useCases: string[];
  workflow: Array<{
    label: string;
    body: string;
  }>;
  faq: FeatureFaq[];
  metadata: {
    title: string;
    description: string;
    image?: string;
    imageAlt?: string;
  };
};

export const FEATURE_PAGES = {
  feed: {
    key: 'feed',
    tone: 'feed',
    eyebrow: 'For market watchers',
    title: 'Follow domain sale posts in one feed.',
    description:
      'Namefi Feed brings public domain sale posts indexed from X into a searchable view, with seller handles, source links, TLD filters, and asking prices when available.',
    primaryCta: {
      label: 'Open the feed',
      href: '/feed',
    },
    secondaryCta: {
      label: 'Subscribe by RSS',
      href: MLS_FEED_RSS_PATH,
      external: true,
    },
    beats: [
      {
        title: 'Search by name or TLD',
        body: 'Follow the parts of the market you care about.',
        icon: Search,
      },
      {
        title: 'Check the source',
        body: 'Open the original post before you act.',
        icon: Link2,
      },
      {
        title: 'Review seller pages',
        body: 'See other indexed listings tied to a seller handle.',
        icon: AtSign,
      },
      {
        title: 'Watch quietly',
        body: 'Use RSS when you want updates without another tab.',
        icon: Rss,
      },
    ],
    useCases: [
      'Tracking public sale posts by TLD',
      'Checking asking prices when available',
      'Opening source posts before taking action',
      'Following indexed listings by seller handle',
    ],
    workflow: [
      {
        label: 'Scan',
        body: 'Start with a searchable feed of public sale posts indexed by Namefi.',
      },
      {
        label: 'Filter',
        body: 'Narrow the view by domain text or TLD so the feed matches what you follow.',
      },
      {
        label: 'Verify',
        body: 'Open the source post, review the seller handle, and decide what is worth your attention.',
      },
    ],
    faq: [
      {
        question: 'Where do Feed listings come from?',
        answer:
          'Namefi Feed shows public sale posts indexed by Namefi from X. Open the source link before you act on a listing.',
      },
      {
        question: 'Are asking prices always available?',
        answer:
          'No. Feed shows asking prices when they are available in the indexed post or listing data.',
      },
      {
        question: 'Is this every domain for sale?',
        answer:
          'No. Feed is a searchable view of public sale posts indexed by Namefi, not a complete view of every listing online.',
      },
      {
        question: 'Can I follow updates without opening the page?',
        answer:
          'Yes. You can subscribe by RSS when you want a quieter way to keep an eye on new indexed posts.',
      },
    ],
    metadata: {
      title: 'Namefi Feed | Public Domain Sale Posts',
      description:
        'Search public domain sale posts indexed by Namefi, with seller handles, source links, TLD filters, and asking prices when available.',
      image: '/assets/mls/opengraph-image.png',
      imageAlt: 'Namefi Feed feature page',
    },
  },
  'brand-studio': {
    key: 'brand-studio',
    tone: 'studio',
    eyebrow: 'For brandable names',
    title: 'Turn your domain into a brand concept.',
    description:
      'Brand Studio creates draft logo, poster, and motion directions from a domain, so you can make a brandable name easier to present in landers, outreach, and buyer previews.',
    primaryCta: {
      label: 'Create a brand concept',
      href: '/studio',
    },
    beats: [
      {
        title: 'Start from the domain',
        body: 'Keep the name at the center of each concept.',
        icon: Sparkles,
      },
      {
        title: 'Explore visual directions',
        body: 'Try logo styles, poster ideas, and animations.',
        icon: Palette,
      },
      {
        title: 'Make the name easier to explain',
        body: 'Show one possible direction for what the domain could become.',
        icon: Eye,
      },
      {
        title: 'Save and share',
        body: 'Revisit generated assets or share a detail page when useful.',
        icon: Send,
      },
    ],
    useCases: [
      'Adding context to a sales lander',
      'Testing a brandable direction',
      'Preparing outbound visuals',
      'Sharing a buyer preview',
    ],
    workflow: [
      {
        label: 'Choose',
        body: 'Start with a domain and keep the name visible while you shape the first visual direction.',
      },
      {
        label: 'Explore',
        body: 'Review logo, poster, and motion concepts as options, then keep the direction that makes the name clearer.',
      },
      {
        label: 'Share',
        body: 'Use a saved concept for a lander, outreach note, social post, or buyer preview when it helps.',
      },
    ],
    faq: [
      {
        question: 'Are these final brand identities?',
        answer:
          'Treat generated assets as concepts. They can help you explore direction, but you should review quality, fit, and usage before relying on them.',
      },
      {
        question: 'Do I need to own the domain?',
        answer:
          'Use domains you own or represent. Brand Studio is most useful when the visual concept supports a real domain opportunity.',
      },
      {
        question: 'Can I use assets on a lander or in outreach?',
        answer:
          'They can help you present an idea in those contexts. Review the generated result and your own requirements before publishing.',
      },
      {
        question: 'Does this replace a designer?',
        answer:
          'No. Brand Studio helps you explore possible directions quickly. A designer can still refine the work when the opportunity calls for it.',
      },
    ],
    metadata: {
      title: 'Namefi Brand Studio | Domain Brand Concepts',
      description:
        'Create draft logo, poster, and motion concepts that may make a brandable domain easier to present in landers, outreach, and buyer previews.',
      image: '/og-image-simple.jpg',
      imageAlt: 'Namefi Brand Studio feature page',
    },
  },
} satisfies Record<FeatureKey, FeaturePageContent>;

const toneClasses: Record<
  FeatureTone,
  {
    accent: string;
    accentSoft: string;
    accentBorder: string;
    accentStrongBorder: string;
    line: string;
    button: string;
    buttonGhost: string;
    glow: string;
    panelTint: string;
  }
> = {
  feed: {
    accent: 'text-brand-primary',
    accentSoft: 'bg-brand-primary/10',
    accentBorder: 'border-brand-primary/25',
    accentStrongBorder: 'border-brand-primary/55',
    line: 'from-cyan-100 via-brand-primary to-emerald-200',
    button:
      'bg-brand-primary text-black hover:bg-brand-primary/90 focus-visible:ring-brand-primary/50',
    buttonGhost:
      'border-brand-primary/30 text-brand-primary hover:border-brand-primary/70 hover:bg-brand-primary/10',
    glow: 'shadow-[0_0_80px_rgba(72,229,155,0.13)]',
    panelTint: 'bg-brand-primary/8',
  },
  studio: {
    accent: 'text-brand-primary',
    accentSoft: 'bg-brand-primary/10',
    accentBorder: 'border-brand-primary/25',
    accentStrongBorder: 'border-brand-primary/55',
    line: 'from-brand-primary via-emerald-300 to-lime-100',
    button:
      'bg-brand-primary text-black hover:bg-brand-primary/90 focus-visible:ring-brand-primary/50',
    buttonGhost:
      'border-brand-primary/30 text-brand-primary hover:border-brand-primary/70 hover:bg-brand-primary/10',
    glow: 'shadow-[0_0_80px_rgba(72,229,155,0.13)]',
    panelTint: 'bg-brand-primary/8',
  },
};

const linkButtonClassName =
  'inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 border border-transparent bg-clip-padding px-4 font-mono text-xs font-semibold uppercase whitespace-nowrap outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4';

const outlineLinkButtonClassName =
  'inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 border border-white/16 bg-white/[0.025] bg-clip-padding px-4 font-mono text-xs font-semibold uppercase text-white whitespace-nowrap outline-none transition-all hover:bg-white/[0.07] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4';

export function getFeatureMetadata(feature: FeaturePageContent): Metadata {
  const canonicalPath = `/features/${feature.key}`;
  const image = feature.metadata.image
    ? [
        {
          url: feature.metadata.image,
          width: 1200,
          height: 630,
          alt: feature.metadata.imageAlt ?? feature.metadata.title,
        },
      ]
    : undefined;

  return {
    title: feature.metadata.title,
    description: feature.metadata.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: feature.metadata.title,
      description: feature.metadata.description,
      url: canonicalPath,
      type: 'website',
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: feature.metadata.title,
      description: feature.metadata.description,
      site: '@namefi_io',
      creator: '@namefi_io',
      images: image,
    },
  };
}

export function FeatureLandingPage({
  feature,
}: {
  feature: FeaturePageContent;
}) {
  const tone = toneClasses[feature.tone];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: feature.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main className="relative mx-auto max-w-[1600px] overflow-x-clip border-[#333333] border-x bg-[#050505] text-[#f3f3f3]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 [mask-image:linear-gradient(to_bottom,black_0%,transparent_78%)]"
        aria-hidden={true}
      />
      <Hero feature={feature} tone={tone} />
      <FeatureWorkflow feature={feature} tone={tone} />
      <FeatureBeats feature={feature} tone={tone} />
      <FeatureFaqs feature={feature} tone={tone} />
      <ClosingCta feature={feature} tone={tone} />
      <style>{`
        .feed-signal {
          --feed-signal-accent: var(--brand-primary, #00e676);
          --feed-signal-accent-soft: color-mix(in srgb, var(--feed-signal-accent) 14%, transparent);
          --feed-signal-accent-faint: color-mix(in srgb, var(--feed-signal-accent) 6%, transparent);
          --feed-signal-accent-border: color-mix(in srgb, var(--feed-signal-accent) 42%, transparent);
        }

        .feed-signal__stage {
          background:
            radial-gradient(ellipse at 20% 18%, color-mix(in srgb, #ffffff 5%, transparent), transparent 34%),
            radial-gradient(ellipse at 82% 18%, var(--feed-signal-accent-soft), transparent 38%),
            linear-gradient(180deg, #0e0e0e 0%, #070707 100%);
          box-shadow:
            0 34px 90px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.02) inset;
        }

        .feed-signal__source::before,
        .feed-signal__feed::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 36%);
        }

        .feed-signal__timeline {
          animation: feed-signal-timeline 13s linear infinite;
        }

        .feed-signal__post {
          animation: feed-signal-post 7.2s ease-in-out infinite;
        }

        .feed-signal__post:nth-child(2n) {
          animation-delay: 0.4s;
        }

        .feed-signal__post:nth-child(3n) {
          animation-delay: 0.8s;
        }

        .feed-signal__pipe-line {
          background: linear-gradient(90deg, transparent, #2a2a2a 18%, var(--feed-signal-accent-border) 50%, #2a2a2a 82%, transparent);
        }

        .feed-signal__packet {
          animation: feed-signal-packet 3.2s ease-in-out infinite;
          background: var(--feed-signal-accent);
          box-shadow: 0 0 14px var(--feed-signal-accent);
        }

        .feed-signal__packet:nth-child(3) {
          animation-delay: 0.55s;
        }

        .feed-signal__packet:nth-child(4) {
          animation-delay: 1.1s;
        }

        .feed-signal__search-sweep {
          animation: feed-signal-search-sweep 4.4s linear infinite;
          background: linear-gradient(90deg, transparent 0%, var(--feed-signal-accent) 50%, transparent 100%);
        }

        .feed-signal__result {
          animation: feed-signal-result 6.8s ease-in-out infinite;
        }

        .feed-signal__result:nth-child(2) {
          animation-delay: 0.28s;
        }

        .feed-signal__result:nth-child(3) {
          animation-delay: 0.56s;
        }

        .feed-signal__pulse {
          animation: feed-signal-pulse 2.2s ease-in-out infinite;
          background: var(--feed-signal-accent);
          box-shadow: 0 0 14px var(--feed-signal-accent);
        }

        @keyframes feed-signal-timeline {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }

        @keyframes feed-signal-post {
          0%, 100% { border-color: #242424; opacity: 0.72; transform: translateX(0); }
          38%, 56% { border-color: var(--feed-signal-accent-border); opacity: 1; transform: translateX(0.25rem); }
        }

        @keyframes feed-signal-packet {
          0% { left: 0; opacity: 0; transform: translateY(-50%) scale(0.65); }
          12% { opacity: 1; }
          70% { opacity: 1; }
          100% { left: calc(100% - 0.5rem); opacity: 0; transform: translateY(-50%) scale(1); }
        }

        @keyframes feed-signal-search-sweep {
          0% { transform: translateX(-115%); opacity: 0; }
          15% { opacity: 0.72; }
          84% { opacity: 0.72; }
          100% { transform: translateX(115%); opacity: 0; }
        }

        @keyframes feed-signal-result {
          0%, 100% { border-color: #242424; background: #101010; }
          44%, 62% { border-color: var(--feed-signal-accent-border); background: color-mix(in srgb, var(--feed-signal-accent) 8%, #101010); }
        }

        @keyframes feed-signal-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.34; transform: scale(0.74); }
        }

        .brand-generator {
          --brand-generator-accent: var(--brand-primary, #00e676);
          --brand-generator-accent-soft: color-mix(in srgb, var(--brand-generator-accent) 18%, transparent);
          --brand-generator-accent-faint: color-mix(in srgb, var(--brand-generator-accent) 7%, transparent);
          --brand-generator-accent-border: color-mix(in srgb, var(--brand-generator-accent) 40%, transparent);
          --brand-generator-cycle: 10s;
        }

        .brand-generator__stage {
          position: relative;
          overflow: hidden;
          border: 1px solid #252525;
          background:
            radial-gradient(ellipse at 20% 22%, var(--brand-generator-accent-faint), transparent 45%),
            linear-gradient(180deg, #0d0d0d 0%, #090909 100%);
          box-shadow:
            0 34px 90px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.02) inset;
        }

        .brand-generator__corner {
          position: absolute;
          z-index: 2;
          width: 0.75rem;
          height: 0.75rem;
          border-color: var(--brand-generator-accent);
          opacity: 0.55;
          pointer-events: none;
        }

        .brand-generator__corner--tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
        .brand-generator__corner--tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
        .brand-generator__corner--bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
        .brand-generator__corner--br { right: -1px; bottom: -1px; border-right-width: 1px; border-bottom-width: 1px; }

        .brand-generator__status span {
          grid-area: 1 / 1;
          opacity: 0;
        }

        .brand-generator__status-input {
          animation: brand-generator-status-input var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__status-logo {
          animation: brand-generator-status-logo var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__status-assets {
          animation: brand-generator-status-assets var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__status-dot {
          animation: brand-generator-blink 1.4s ease-in-out infinite;
          background: var(--brand-generator-accent);
          box-shadow: 0 0 8px var(--brand-generator-accent);
        }

        .brand-generator__step--one {
          animation: brand-generator-step-one var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__step--two {
          animation: brand-generator-step-two var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__step--three {
          animation: brand-generator-step-three var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__typed {
          display: inline-block;
          max-width: max-content;
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: brand-generator-type var(--brand-generator-cycle) steps(8, end) infinite;
        }

        .brand-generator__cursor {
          animation:
            brand-generator-cursor var(--brand-generator-cycle) linear infinite,
            brand-generator-blink 0.8s steps(1) infinite;
          background: var(--brand-generator-accent);
        }

        .brand-generator__connector-label {
          animation: brand-generator-connector-label var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__connector-ready {
          animation: brand-generator-connector-ready var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__shimmer {
          background: linear-gradient(90deg, transparent 0%, var(--brand-generator-accent-faint) 50%, transparent 100%);
          background-size: 200% 100%;
          animation:
            brand-generator-shimmer 1.2s linear infinite,
            brand-generator-shimmer-window var(--brand-generator-cycle) linear infinite;
        }

        .brand-generator__logo-mark {
          animation: brand-generator-reveal var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__logo-name {
          animation: brand-generator-text-reveal var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__tags {
          animation: brand-generator-tags var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__bar-fill {
          background: var(--brand-generator-accent);
          box-shadow: 0 0 8px var(--brand-generator-accent);
          animation: brand-generator-progress var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__split {
          animation: brand-generator-split var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__split-dot {
          animation: brand-generator-split-dot var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__outputs {
          animation: brand-generator-outputs var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__poster {
          animation: brand-generator-output-card var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__poster-bg {
          background:
            linear-gradient(
              135deg,
              var(--brand-generator-accent-faint) 0%,
              #090909 58%,
              color-mix(in srgb, var(--brand-generator-accent) 5%, transparent) 100%
            );
        }

        .brand-generator__poster-mark {
          animation: brand-generator-output-inner var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__poster-copy {
          animation: brand-generator-output-copy var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__poster-line {
          background: var(--brand-generator-accent);
          animation: brand-generator-output-line var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__badge {
          animation: brand-generator-badge var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__motion-stage {
          animation: brand-generator-motion-stage var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__motion-center {
          animation: brand-generator-motion-center var(--brand-generator-cycle) ease infinite;
        }

        .brand-generator__ring {
          border-color: transparent;
          border-style: solid;
        }

        .brand-generator__ring--one {
          animation: brand-generator-spin 3s linear infinite;
          border-top-color: var(--brand-generator-accent-border);
        }

        .brand-generator__ring--two {
          animation: brand-generator-spin 2s linear infinite reverse;
          border-right-color: color-mix(in srgb, var(--brand-generator-accent) 24%, transparent);
        }

        .brand-generator__ring--three {
          animation: brand-generator-spin 4s linear infinite;
          border-bottom-color: color-mix(in srgb, var(--brand-generator-accent) 18%, transparent);
        }

        .brand-generator__scan {
          animation: brand-generator-scan 5s linear infinite;
          background: linear-gradient(180deg, transparent 0%, var(--brand-generator-accent-faint) 50%, transparent 100%);
        }

        @keyframes brand-generator-status-input {
          0%, 20% { opacity: 1; }
          21%, 100% { opacity: 0; }
        }

        @keyframes brand-generator-status-logo {
          0%, 20%, 48%, 100% { opacity: 0; }
          21%, 47% { opacity: 1; }
        }

        @keyframes brand-generator-status-assets {
          0%, 48%, 94%, 100% { opacity: 0; }
          49%, 93% { opacity: 1; }
        }

        @keyframes brand-generator-step-one {
          0%, 21% { color: var(--brand-generator-accent); }
          22%, 100% { color: #363636; }
        }

        @keyframes brand-generator-step-two {
          0%, 21%, 49%, 100% { color: #363636; }
          22%, 48% { color: var(--brand-generator-accent); }
        }

        @keyframes brand-generator-step-three {
          0%, 49%, 94%, 100% { color: #363636; }
          50%, 93% { color: var(--brand-generator-accent); }
        }

        @keyframes brand-generator-type {
          0%, 5% { width: 0; }
          20%, 94% { width: 8ch; }
          100% { width: 0; }
        }

        @keyframes brand-generator-cursor {
          0%, 20% { opacity: 1; }
          21%, 94% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes brand-generator-connector-label {
          0%, 20%, 39%, 100% { opacity: 0; }
          21%, 38% { opacity: 1; }
        }

        @keyframes brand-generator-connector-ready {
          0%, 38%, 94%, 100% { opacity: 0; }
          39%, 93% { opacity: 1; }
        }

        @keyframes brand-generator-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes brand-generator-shimmer-window {
          0%, 19%, 38%, 100% { opacity: 0; }
          20%, 37% { opacity: 1; }
        }

        @keyframes brand-generator-reveal {
          0%, 35%, 96%, 100% { opacity: 0; transform: scale(0.7); }
          40%, 94% { opacity: 1; transform: scale(1); }
        }

        @keyframes brand-generator-text-reveal {
          0%, 37%, 96%, 100% { opacity: 0; transform: translateY(0.25rem); }
          42%, 94% { opacity: 1; transform: translateY(0); }
        }

        @keyframes brand-generator-tags {
          0%, 40%, 96%, 100% { opacity: 0; }
          45%, 94% { opacity: 1; }
        }

        @keyframes brand-generator-progress {
          0%, 20% { width: 0%; }
          38%, 94% { width: 100%; }
          100% { width: 0%; }
        }

        @keyframes brand-generator-split {
          0%, 47%, 96%, 100% { opacity: 0; }
          52%, 94% { opacity: 1; }
        }

        @keyframes brand-generator-split-dot {
          0%, 48% { opacity: 0; transform: translate(0, 0); }
          49% { opacity: 1; transform: translate(0, 0); }
          56% { opacity: 1; transform: translate(-98px, 14px); }
          63%, 94% { opacity: 1; transform: translate(98px, 14px); }
          96%, 100% { opacity: 0; transform: translate(98px, 14px); }
        }

        @keyframes brand-generator-outputs {
          0%, 53%, 96%, 100% { opacity: 0; transform: translateY(0.625rem); }
          58%, 94% { opacity: 1; transform: translateY(0); }
        }

        @keyframes brand-generator-output-card {
          0%, 57%, 96%, 100% { opacity: 0; transform: translateY(0.5rem); }
          62%, 94% { opacity: 1; transform: translateY(0); }
        }

        @keyframes brand-generator-output-inner {
          0%, 60%, 96%, 100% { opacity: 0; transform: scale(0.8); }
          66%, 94% { opacity: 1; transform: scale(1); }
        }

        @keyframes brand-generator-output-copy {
          0%, 64%, 96%, 100% { opacity: 0; }
          70%, 94% { opacity: 1; }
        }

        @keyframes brand-generator-output-line {
          0%, 66%, 96%, 100% { transform: scaleX(0); }
          72%, 94% { transform: scaleX(1); }
        }

        @keyframes brand-generator-badge {
          0%, 61%, 96%, 100% { opacity: 0; }
          67%, 94% { opacity: 1; }
        }

        @keyframes brand-generator-motion-stage {
          0%, 58%, 96%, 100% { opacity: 0; }
          63%, 94% { opacity: 1; }
        }

        @keyframes brand-generator-motion-center {
          0%, 65%, 96%, 100% { opacity: 0; transform: scale(0.55); }
          72%, 94% { opacity: 1; transform: scale(1); }
        }

        @keyframes brand-generator-scan {
          0% { top: -5rem; }
          100% { top: 100%; }
        }

        @keyframes brand-generator-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes brand-generator-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }

        @keyframes namefi-feature-scan {
          0% { transform: translateY(-1rem); opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { transform: translateY(24rem); opacity: 0; }
        }

        @media (max-width: 480px) {
          .brand-generator__flow {
            padding: 1rem;
          }

          .brand-generator__steps {
            gap: 0.5rem;
            overflow: hidden;
          }

          .brand-generator__logo-panel {
            align-items: stretch;
            gap: 0.75rem;
          }

          .brand-generator__logo-display {
            width: 4.75rem;
            height: 4.75rem;
          }

          .brand-generator__outputs {
            grid-template-columns: 1fr;
          }

          .brand-generator__split {
            height: 1.25rem;
          }

          .brand-generator__split svg {
            transform: scaleX(0.72);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-generator *,
          .brand-generator *::before,
          .brand-generator *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }

          .brand-generator__typed {
            width: 8ch;
          }

          .brand-generator__status-assets,
          .brand-generator__step--three,
          .brand-generator__logo-mark,
          .brand-generator__logo-name,
          .brand-generator__tags,
          .brand-generator__split,
          .brand-generator__outputs,
          .brand-generator__poster,
          .brand-generator__poster-mark,
          .brand-generator__poster-copy,
          .brand-generator__badge,
          .brand-generator__motion-stage,
          .brand-generator__motion-center {
            opacity: 1 !important;
            transform: none !important;
          }

          .brand-generator__bar-fill {
            width: 100% !important;
          }

          .feed-signal *,
          .feed-signal *::before,
          .feed-signal *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }

        }
      `}</style>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static FAQ content is defined in this module.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}

function Hero({
  feature,
  tone,
}: {
  feature: FeaturePageContent;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  return (
    <section className="relative border-[#333333] border-b px-5 py-20 sm:px-8 sm:py-24 lg:grid lg:min-h-[44rem] lg:grid-cols-2 lg:items-stretch lg:gap-16 lg:px-8 lg:py-32 xl:px-12">
      <div className="relative z-10 flex min-w-0 flex-col items-start justify-center">
        <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] text-[#f3f3f3] [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl xl:text-8xl">
          {feature.title}
        </h1>
        <p className="mt-7 max-w-[32rem] text-lg leading-8 text-[#777777] sm:text-xl">
          {feature.description}
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href={feature.primaryCta.href}
            className={cn(
              'w-full px-5 sm:w-auto',
              linkButtonClassName,
              tone.button,
            )}
          >
            <span>{feature.primaryCta.label}</span>
            <ArrowRight data-icon="inline-end" />
          </Link>
          {feature.secondaryCta ? (
            <FeatureCtaLink
              label={feature.secondaryCta.label}
              href={feature.secondaryCta.href}
              external={feature.secondaryCta.external}
            />
          ) : null}
        </div>
      </div>

      <div className="relative z-10 mt-12 min-w-0 lg:mt-0">
        {feature.tone === 'feed' ? <FeedSignalVisual /> : null}
        {feature.tone === 'studio' ? <BrandAssetGeneratorVisual /> : null}
      </div>
    </section>
  );
}

function FeatureCtaLink({
  label,
  href,
  external,
}: {
  label: string;
  href: Route | string;
  external?: boolean;
}) {
  const className = cn(outlineLinkButtonClassName, 'w-full sm:w-auto');

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        <span>{label}</span>
        <ExternalLink data-icon="inline-end" />
      </a>
    );
  }

  return (
    <Link href={href as Route} className={className}>
      <span>{label}</span>
      <ArrowRight data-icon="inline-end" />
    </Link>
  );
}

function SystemLabel({
  children,
  tone,
}: {
  children: ReactNode;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  return (
    <p className="flex items-center gap-2 font-mono text-xs uppercase text-[#777777]">
      <span className={cn('text-sm leading-none', tone.accent)}>-&gt;</span>
      <span>{children}</span>
    </p>
  );
}

const feedTimelinePosts = [
  {
    domain: 'atlas.ai',
    seller: '@domaindesk',
    ask: '$4,800 ask',
    tld: '.ai',
    copy: 'Atlas.ai is available. Asking price in the public post.',
  },
  {
    domain: 'northstar.io',
    seller: '@nameseller',
    ask: 'price in post',
    tld: '.io',
    copy: 'Northstar.io posted with seller handle and source link.',
  },
  {
    domain: 'signal.xyz',
    seller: '@brandnames',
    ask: '$1,950 ask',
    tld: '.xyz',
    copy: 'Signal.xyz public sale post indexed for review.',
  },
  {
    domain: 'rivet.app',
    seller: '@marketnames',
    ask: '$2,200 ask',
    tld: '.app',
    copy: 'Rivet.app shared publicly with domain and asking price.',
  },
] as const;

function FeedSignalVisual() {
  const timelinePosts = [...feedTimelinePosts, ...feedTimelinePosts];
  const searchRows = feedTimelinePosts.slice(0, 3);

  return (
    <figure
      aria-label="Animated example showing public posts from X indexed into Namefi Feed and used for search"
      className="feed-signal relative mx-auto w-full max-w-[42.5rem] font-mono text-[#f3f3f3]"
    >
      <div className="feed-signal__stage relative overflow-hidden border border-[#252525] p-3 sm:p-4">
        <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1.08fr)]">
          <section className="feed-signal__source relative min-h-[20rem] overflow-hidden border border-[#242424] bg-[#0b0b0b] p-3 sm:p-4">
            <div className="relative z-10 flex min-w-0 items-center justify-between gap-3 border-[#242424] border-b pb-3">
              <div className="min-w-0">
                <p className="truncate text-[0.625rem] uppercase tracking-[0.14em] text-[#777777]">
                  Public posts on X
                </p>
                <p className="mt-1 truncate text-xs text-[#444444]">
                  sale posts as they appear
                </p>
              </div>
              <span className="shrink-0 border border-[#333333] px-2 py-1 text-[0.5625rem] uppercase tracking-[0.12em] text-[#666666]">
                Timeline
              </span>
            </div>

            <div className="relative z-10 mt-4 h-64 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] sm:h-72">
              <div className="feed-signal__timeline grid gap-3">
                {timelinePosts.map((post, index) => (
                  <article
                    key={`${post.domain}-${index}`}
                    className="feed-signal__post border border-[#242424] bg-[#101010] p-3"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3 text-[0.5625rem] uppercase tracking-[0.12em]">
                      <span className="min-w-0 truncate text-[#777777]">
                        {post.seller}
                      </span>
                      <span className="shrink-0 text-[#555555]">
                        Public post
                      </span>
                    </div>
                    <p className="mt-3 truncate text-base text-white">
                      {post.domain}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#777777]">
                      {post.copy}
                    </p>
                    <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-[#222222] border-t pt-3 text-[0.5625rem] uppercase tracking-[0.1em]">
                      <span className="truncate text-[#666666]">
                        {post.ask}
                      </span>
                      <span className="shrink-0 text-brand-primary">
                        {post.tld}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <div
            className="relative min-h-16 overflow-hidden border border-[#242424] bg-[#090909] lg:min-h-0"
            aria-hidden={true}
          >
            <div className="feed-signal__pipe-line absolute inset-x-3 top-1/2 h-px" />
            <span className="feed-signal__packet absolute top-1/2 size-2" />
            <span className="feed-signal__packet absolute top-1/2 size-2" />
            <span className="feed-signal__packet absolute top-1/2 size-2" />
            <div className="relative flex h-full min-h-16 items-center justify-center lg:min-h-full">
              <div className="grid gap-1 text-center">
                <span className="text-[0.5625rem] uppercase tracking-[0.16em] text-brand-primary">
                  Ingest
                </span>
                <span className="text-[0.5rem] uppercase tracking-[0.14em] text-[#444444]">
                  Index
                </span>
              </div>
            </div>
          </div>

          <section className="feed-signal__feed relative overflow-hidden border border-brand-primary/35 bg-[#0b0f0d] p-3 sm:p-4">
            <div className="relative z-10 flex min-w-0 items-center justify-between gap-3 border-brand-primary/20 border-b pb-3">
              <div className="min-w-0">
                <p className="truncate text-[0.625rem] uppercase tracking-[0.14em] text-brand-primary">
                  Namefi Feed
                </p>
                <p className="mt-1 truncate text-xs text-[#777777]">
                  indexed posts power search
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-2 text-[0.5625rem] uppercase tracking-[0.12em] text-brand-primary">
                <span className="feed-signal__pulse size-1.5" />
                Search
              </span>
            </div>

            <div className="relative z-10 mt-4 overflow-hidden border border-[#202020] bg-[#070707] px-3 py-2.5">
              <div
                className="feed-signal__search-sweep absolute inset-y-0 left-0 w-24"
                aria-hidden={true}
              />
              <div className="relative flex min-w-0 items-center gap-3">
                <Search className="size-4 shrink-0 text-brand-primary" />
                <span className="min-w-0 flex-1 truncate text-sm text-[#eeeeee]">
                  .ai
                </span>
                <span className="shrink-0 text-[0.5625rem] uppercase tracking-[0.12em] text-[#666666]">
                  Filter TLD
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-3 grid gap-2">
              {searchRows.map((row) => (
                <article
                  key={row.domain}
                  className="feed-signal__result border border-[#242424] bg-[#101010] p-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base text-white">
                        {row.domain}
                      </p>
                      <p className="mt-1 truncate text-[0.625rem] uppercase tracking-[0.12em] text-[#666666]">
                        {row.seller}
                      </p>
                    </div>
                    <span className="shrink-0 border border-brand-primary/45 px-2 py-1 text-[0.5625rem] uppercase tracking-[0.1em] text-brand-primary">
                      {row.tld}
                    </span>
                  </div>
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-[0.5625rem] uppercase tracking-[0.1em]">
                    <span className="truncate text-[#777777]">{row.ask}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-brand-primary">
                      <Link2 className="size-3" />
                      Source
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="relative z-10 mt-3 grid grid-cols-2 gap-2 text-[0.5625rem] uppercase tracking-[0.1em]">
              <div className="border border-[#242424] bg-[#090909] p-2 text-[#777777]">
                seller pages
              </div>
              <div className="border border-[#242424] bg-[#090909] p-2 text-[#777777]">
                RSS updates
              </div>
            </div>
          </section>
        </div>

        <div className="relative mt-3 grid gap-2 border border-[#242424] bg-[#090909] p-3 text-[0.5625rem] uppercase tracking-[0.12em] text-[#666666] sm:grid-cols-3">
          <span>1. public posts</span>
          <span className="text-brand-primary">2. indexed by Namefi</span>
          <span>3. searchable feed</span>
        </div>
      </div>
    </figure>
  );
}

function BrandAssetGeneratorVisual() {
  return (
    <figure
      aria-label="Example animation showing a domain becoming logo, poster, and motion concepts"
      className="brand-generator relative mx-auto w-full max-w-[42.5rem] font-mono text-[#f3f3f3]"
    >
      <span className="brand-generator__corner brand-generator__corner--tl" />
      <span className="brand-generator__corner brand-generator__corner--tr" />
      <span className="brand-generator__corner brand-generator__corner--bl" />
      <span className="brand-generator__corner brand-generator__corner--br" />

      <div className="brand-generator__stage">
        <figcaption className="flex h-9 min-w-0 items-center justify-between gap-3 border-[#242424] border-b bg-[#101010] px-3 text-[0.625rem] uppercase tracking-[0.14em] text-[#454545] sm:px-4">
          <span className="min-w-0 truncate">{'// example flow'}</span>
          <span className="flex shrink-0 items-center gap-2 text-[0.5625rem] text-brand-primary">
            <span className="brand-generator__status-dot size-1.5" />
            <span className="brand-generator__status grid min-w-[7.75rem] justify-items-end">
              <span className="brand-generator__status-input">
                Input active
              </span>
              <span className="brand-generator__status-logo">
                Generating logo
              </span>
              <span className="brand-generator__status-assets">
                Assets ready
              </span>
            </span>
          </span>
        </figcaption>

        <div className="brand-generator__flow relative flex flex-col items-center px-4 py-5 sm:px-8 sm:py-8">
          <div className="brand-generator__steps mb-3 flex w-full items-center justify-between text-[0.5rem] uppercase tracking-[0.12em] text-[#363636]">
            <span className="brand-generator__step--one">01 - Domain</span>
            <span className="brand-generator__step--two">02 - Logo</span>
            <span className="brand-generator__step--three">03 - Assets</span>
          </div>

          <div className="w-full border border-[#242424] bg-[#111111] p-4">
            <div className="mb-2 text-[0.5rem] uppercase tracking-[0.15em] text-[#454545]">
              {'// enter your domain'}
            </div>
            <div className="flex min-w-0 items-center overflow-hidden border border-[#222222] bg-[#090909] px-3 py-2.5">
              <span className="shrink-0 text-[0.8125rem] tracking-[0.02em] text-[#444444]">
                https://
              </span>
              <span className="brand-generator__typed text-[0.8125rem] tracking-[0.04em] text-[#eeeeee]">
                orbit.io
              </span>
              <span className="brand-generator__cursor ml-0.5 h-3.5 w-1.5 shrink-0" />
            </div>
          </div>

          <div className="relative flex flex-col items-center py-2">
            <div className="h-6 w-px bg-gradient-to-b from-[#242424] to-brand-primary" />
            <div className="size-1.5 bg-brand-primary shadow-[0_0_8px_var(--brand-generator-accent)]" />
            <div className="relative mt-1 h-3 min-w-[5.75rem] text-center text-[0.5rem] uppercase tracking-[0.12em] text-brand-primary">
              <span className="brand-generator__connector-label absolute inset-0">
                Generating...
              </span>
              <span className="brand-generator__connector-ready absolute inset-0">
                Logo ready
              </span>
            </div>
          </div>

          <div className="brand-generator__logo-panel relative flex w-full items-center gap-4 overflow-hidden border border-[#242424] bg-[#111111] p-4 sm:gap-5 sm:p-5">
            <div className="brand-generator__shimmer pointer-events-none absolute inset-0" />
            <div className="brand-generator__logo-display relative flex size-20 shrink-0 items-center justify-center overflow-hidden border border-[#222222] bg-[#090909] sm:size-24">
              <div className="brand-generator__logo-mark text-brand-primary">
                <OrbitLogo size={52} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="brand-generator__logo-name text-lg tracking-[0.02em] text-white">
                orbit<span className="text-brand-primary">.io</span>
              </div>
              <div className="brand-generator__tags mt-2 flex flex-wrap gap-1.5">
                <span className="border border-[#272727] px-2 py-1 text-[0.5rem] uppercase tracking-[0.1em] text-[#555555]">
                  geometric
                </span>
                <span className="border border-brand-primary px-2 py-1 text-[0.5rem] uppercase tracking-[0.1em] text-brand-primary">
                  minimal
                </span>
                <span className="border border-[#272727] px-2 py-1 text-[0.5rem] uppercase tracking-[0.1em] text-[#555555]">
                  tech
                </span>
                <span className="border border-brand-primary px-2 py-1 text-[0.5rem] uppercase tracking-[0.1em] text-brand-primary">
                  generated
                </span>
              </div>
              <div className="mt-3 h-1 overflow-hidden bg-[#1a1a1a]">
                <div className="brand-generator__bar-fill h-full" />
              </div>
            </div>
          </div>

          <div className="brand-generator__split flex h-9 w-full items-start justify-center">
            <svg
              width="340"
              height="36"
              viewBox="0 0 340 36"
              aria-hidden={true}
              className="overflow-visible"
            >
              <path
                d="M170 0V14H72V36M170 14H268V36"
                fill="none"
                stroke="#242424"
                strokeWidth="1"
              />
              <circle
                className="brand-generator__split-dot"
                cx="170"
                cy="0"
                r="2.5"
                fill="var(--brand-generator-accent)"
              />
            </svg>
          </div>

          <div className="brand-generator__outputs grid w-full grid-cols-2 gap-3">
            <BrandOutputPanel
              label="Poster export"
              badge="PNG - SVG"
              visual={<PosterPreview />}
            />
            <BrandOutputPanel
              label="Logo motion"
              badge="MP4 - GIF"
              visual={<MotionPreview />}
            />
          </div>
        </div>

        <div
          className="brand-generator__scan pointer-events-none absolute inset-x-0 h-20"
          aria-hidden={true}
        />
      </div>
    </figure>
  );
}

function BrandOutputPanel({
  label,
  badge,
  visual,
}: {
  label: string;
  badge: string;
  visual: ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-[#242424] bg-[#111111]">
      <div className="flex items-center justify-between gap-2 border-[#222222] border-b bg-[#0d0d0d] px-3 py-2 text-[0.5rem] uppercase tracking-[0.12em] text-[#454545]">
        <span className="truncate">{label}</span>
        <span className="brand-generator__badge shrink-0 border border-brand-primary px-1.5 py-0.5 text-[0.4375rem] text-brand-primary">
          {badge}
        </span>
      </div>
      {visual}
    </div>
  );
}

function PosterPreview() {
  return (
    <div className="flex min-h-36 items-center justify-center p-3">
      <div className="brand-generator__poster relative flex h-32 w-24 flex-col items-center justify-center gap-2 overflow-hidden border border-[#222222] bg-[#090909]">
        <div className="brand-generator__poster-bg absolute inset-0" />
        <div className="brand-generator__poster-mark relative z-10 text-brand-primary">
          <OrbitLogo size={30} />
        </div>
        <div className="brand-generator__poster-copy relative z-10 flex flex-col items-center gap-1">
          <div className="text-[0.5625rem] uppercase tracking-[0.06em] text-[#eeeeee]">
            Orbit.io
          </div>
          <div className="text-[0.375rem] uppercase tracking-[0.08em] text-[#555555]">
            brand in motion
          </div>
        </div>
        <div className="brand-generator__poster-line absolute inset-x-0 bottom-0 h-0.5 origin-left" />
      </div>
    </div>
  );
}

function MotionPreview() {
  return (
    <div className="flex min-h-36 items-center justify-center p-3">
      <div className="brand-generator__motion-stage relative flex size-28 items-center justify-center overflow-hidden border border-[#222222] bg-[#090909]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="brand-generator__ring brand-generator__ring--one absolute size-[4.5rem] rounded-full border" />
          <div className="brand-generator__ring brand-generator__ring--two absolute size-14 rounded-full border" />
          <div className="brand-generator__ring brand-generator__ring--three absolute size-10 rounded-full border" />
        </div>
        <div className="brand-generator__motion-center relative z-10 text-brand-primary">
          <OrbitLogo centerOnly={true} size={22} />
        </div>
        <div className="absolute right-2 bottom-1.5 text-[0.4375rem] tracking-[0.08em] text-brand-primary">
          240
        </div>
      </div>
    </div>
  );
}

function OrbitLogo({
  size,
  centerOnly = false,
}: {
  size: number;
  centerOnly?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden={true}
    >
      {centerOnly ? null : (
        <>
          <circle
            cx="26"
            cy="26"
            r="22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="69 69"
            strokeDashoffset="34"
            strokeLinecap="round"
          />
          <circle
            cx="26"
            cy="26"
            r="14"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="26"
            y1="12"
            x2="26"
            y2="16"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
          <line
            x1="36"
            y1="26"
            x2="40"
            y2="26"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
        </>
      )}
      <circle cx="26" cy="26" r="4" fill="currentColor" />
      <circle cx="26" cy="4" r="3" fill="currentColor" />
    </svg>
  );
}

function FeatureWorkflow({
  feature,
  tone,
}: {
  feature: FeaturePageContent;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  return (
    <section id="how" className="relative border-[#333333] border-b">
      <div className="grid md:grid-cols-3">
        {feature.workflow.map((step, index) => (
          <article
            key={step.label}
            className="group relative min-h-64 cursor-default overflow-hidden border-[#333333] border-b px-5 py-12 md:border-b-0 md:border-r md:last:border-r-0 sm:px-8 lg:px-8 lg:py-16"
          >
            <div
              className={cn(
                'absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100',
                tone.line,
              )}
              aria-hidden={true}
            />
            <span className="block font-mono text-5xl uppercase leading-none text-[#333333]">
              0{index + 1}
            </span>
            <div className="mt-10 flex min-w-0 flex-wrap items-center gap-3">
              <h2 className="text-2xl font-medium text-[#f3f3f3]">
                {step.label}
              </h2>
            </div>
            <p className="mt-5 max-w-sm text-base leading-7 text-[#777777]">
              {step.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeatureBeats({
  feature,
  tone,
}: {
  feature: FeaturePageContent;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  const panes = capabilityPaneContent[feature.tone];

  return (
    <section
      id="features"
      className="relative border-[#333333] border-b pt-20 lg:pt-32"
    >
      <div className="px-5 pb-12 sm:px-8 lg:px-8 xl:px-12">
        <div className="max-w-4xl">
          <SystemLabel tone={tone}>Capabilities</SystemLabel>
          <h2 className="mt-5 text-4xl font-medium leading-tight text-[#f3f3f3] sm:text-5xl">
            {panes.heading}
          </h2>
        </div>
      </div>

      <div className="grid border-[#333333] border-t lg:grid-cols-2">
        <CapabilityPane
          title={panes.primary.title}
          description={panes.primary.description}
          visual={
            <MockInput
              buttonLabel={panes.primary.buttonLabel}
              value={panes.primary.value}
              prefix={panes.primary.prefix}
              tone={tone}
            />
          }
          scanLine={true}
          tone={tone}
        />
        <CapabilityPane
          title={panes.secondary.title}
          description={panes.secondary.description}
          visual={
            feature.tone === 'feed' ? (
              <FeedSourceStack tone={tone} />
            ) : (
              <CascadeCards feature={feature} tone={tone} />
            )
          }
          isLast={true}
        />
      </div>

      <div className="grid border-[#333333] border-t sm:grid-cols-2 lg:grid-cols-4">
        {feature.useCases.map((useCase) => (
          <div
            key={useCase}
            className="grid min-h-24 grid-cols-[1rem_minmax(0,1fr)] items-start gap-3 border-[#333333] border-b bg-[#050505] px-5 py-6 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-r lg:last:border-r-0 lg:[&:nth-last-child(-n+4)]:border-b-0"
          >
            <CheckCircle2
              className={cn('mt-0.5 size-4 shrink-0', tone.accent)}
            />
            <span className="min-w-0 text-sm leading-6 text-[#b7b7b7]">
              {useCase}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CapabilityPane({
  title,
  description,
  visual,
  scanLine,
  tone,
  isLast,
}: {
  title: string;
  description: string;
  visual: ReactNode;
  scanLine?: boolean;
  tone?: (typeof toneClasses)[FeatureTone];
  isLast?: boolean;
}) {
  return (
    <article
      className={cn(
        'grid min-h-[42rem] grid-rows-[auto_1fr] border-[#333333] border-b lg:border-b-0 lg:border-r',
        isLast ? 'lg:border-r-0' : '',
      )}
    >
      <div className="border-[#333333] border-b px-5 py-12 sm:px-8 lg:px-8 lg:py-16">
        <h3 className="text-3xl font-medium leading-tight text-[#f3f3f3]">
          {title}
        </h3>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#777777]">
          {description}
        </p>
      </div>
      <div className="relative flex min-h-[24rem] items-center justify-center overflow-hidden bg-[#0a0a0a] p-5 sm:p-8">
        {scanLine && tone ? (
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-gradient-to-r',
              tone.line,
            )}
            style={{ animation: 'namefi-feature-scan 3s linear infinite' }}
            aria-hidden={true}
          />
        ) : null}
        {visual}
      </div>
    </article>
  );
}

function MockInput({
  value,
  buttonLabel,
  prefix = 'https://',
  tone,
}: {
  value: string;
  buttonLabel: string;
  prefix?: string;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  return (
    <div className="relative z-10 flex w-full max-w-md items-center overflow-hidden border border-[#333333] bg-[#050505] p-2 shadow-2xl shadow-black/35">
      <span className="shrink-0 px-3 font-mono text-xs uppercase text-[#777777] sm:px-4">
        {prefix}
      </span>
      <span className="min-w-0 flex-1 truncate px-1 text-base text-[#f3f3f3]">
        {value}
      </span>
      <span
        className={cn(
          'shrink-0 px-4 py-3 font-mono text-xs font-semibold uppercase text-[#050505]',
          tone.button,
        )}
      >
        {buttonLabel}
      </span>
    </div>
  );
}

function FeedSourceStack({
  tone,
}: {
  tone: (typeof toneClasses)[FeatureTone];
}) {
  return (
    <div className="relative z-10 grid w-full max-w-md gap-3">
      {[
        {
          title: 'Source post',
          body: 'Open the original public post before you act.',
          meta: 'source link',
        },
        {
          title: 'Seller handle',
          body: 'Review other indexed listings tied to the same handle.',
          meta: '@nameseller',
        },
        {
          title: 'RSS watch',
          body: 'Follow updates quietly from your reader.',
          meta: 'feed/rss.xml',
        },
      ].map((item, index) => (
        <div
          key={item.title}
          className={cn(
            'border bg-[#0b0b0b] p-4 shadow-2xl shadow-black/25',
            index === 1 ? tone.accentStrongBorder : 'border-[#333333]',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-medium text-[#f3f3f3]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#777777]">
                {item.body}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.12em]',
                index === 1 ? tone.accent : 'text-[#555555]',
              )}
            >
              0{index + 1}
            </span>
          </div>
          <p className="mt-5 truncate border-[#242424] border-t pt-3 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-[#666666]">
            {item.meta}
          </p>
        </div>
      ))}
    </div>
  );
}

function CascadeCards({
  feature,
  tone,
}: {
  feature: FeaturePageContent;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  const labels = feature.beats.slice(1, 4).map((beat) => beat.title);

  return (
    <div className="group relative z-10 flex h-full min-h-[22rem] w-full items-center justify-center">
      {labels.map((label, index) => {
        const isCenter = index === 1;
        const transform = [
          '-translate-x-8 -rotate-[10deg] group-hover:-translate-x-10 group-hover:-rotate-[15deg] sm:-translate-x-14 sm:group-hover:-translate-x-20',
          'translate-x-0 rotate-0',
          'translate-x-8 rotate-[10deg] group-hover:translate-x-10 group-hover:rotate-[15deg] sm:translate-x-14 sm:group-hover:translate-x-20',
        ][index];

        return (
          <div
            key={label}
            className={cn(
              'absolute flex h-64 w-44 flex-col justify-between border p-5 transition-transform duration-300 sm:h-72 sm:w-52 sm:p-6',
              isCenter
                ? 'z-20 border-[#777777] bg-[#0a0a0a]'
                : 'z-10 border-[#333333] bg-[#111111]',
              transform,
            )}
          >
            <div
              className={cn(
                'size-10',
                isCenter ? tone.accentSoft : 'bg-[#333333]',
                isCenter ? 'border border-[#333333]' : '',
              )}
            >
              {isCenter ? (
                <div className={cn('size-full', 'bg-brand-primary')} />
              ) : null}
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-[#777777]">
                0{index + 1}
              </p>
              <p className="mt-3 text-lg font-medium leading-6 text-[#f3f3f3]">
                {label}
              </p>
              <div className="mt-6 space-y-2">
                {[100, 62, 86].map((width) => (
                  <div
                    key={width}
                    className="h-1 bg-[#333333]"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const capabilityPaneContent: Record<
  FeatureTone,
  {
    heading: string;
    primary: {
      title: string;
      description: string;
      value: string;
      buttonLabel: string;
      prefix?: string;
    };
    secondary: {
      title: string;
      description: string;
    };
  }
> = {
  feed: {
    heading: 'Built for focused market watching.',
    primary: {
      title: 'Search the parts of the feed you care about.',
      description:
        'Filter public sale posts by name or TLD, then keep source links close when something looks relevant.',
      value: '.ai',
      prefix: 'TLD',
      buttonLabel: 'Filter',
    },
    secondary: {
      title: 'Keep the original post in reach.',
      description:
        'Feed is designed for scanning, but the source post stays one step away so you can review context before acting.',
    },
  },
  studio: {
    heading: 'Built for visual exploration.',
    primary: {
      title: 'Start from the domain.',
      description:
        'Keep the name at the center while you explore logo, poster, and motion concepts around it.',
      value: 'luma.market',
      buttonLabel: 'Create',
    },
    secondary: {
      title: 'Explore visual directions.',
      description:
        'Try a few possible directions so the domain is easier to picture, explain, and share.',
    },
  },
};

function FeatureFaqs({
  feature,
  tone,
}: {
  feature: FeaturePageContent;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  return (
    <section
      id="faq"
      className="grid gap-12 border-[#333333] border-b px-5 py-20 sm:px-8 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:px-8 lg:py-32 xl:px-12"
    >
      <div>
        <SystemLabel tone={tone}>Questions</SystemLabel>
        <h2 className="mt-5 max-w-md text-4xl font-medium leading-tight text-[#f3f3f3] sm:text-5xl">
          Common questions
        </h2>
      </div>
      <div className="border-[#333333] border-t">
        {feature.faq.map((item, index) => (
          <details
            key={item.question}
            className="group border-[#333333] border-b"
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-7 text-xl font-medium text-[#f3f3f3] marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span className={cn('font-mono text-2xl', tone.accent)}>
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">-</span>
              </span>
            </summary>
            <p className="max-w-3xl pb-8 text-base leading-7 text-[#777777] lg:max-w-[80%]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ClosingCta({
  feature,
  tone,
}: {
  feature: FeaturePageContent;
  tone: (typeof toneClasses)[FeatureTone];
}) {
  const copy = closingCtaContent[feature.tone];

  return (
    <section className="relative flex flex-col items-center overflow-hidden px-5 py-24 text-center sm:px-8 lg:px-12 lg:py-32">
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t opacity-15',
          tone.line,
        )}
        aria-hidden={true}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.12)_0%,#050505_62%)]"
        aria-hidden={true}
      />
      <div className="relative z-10 flex max-w-4xl flex-col items-center">
        <SystemLabel tone={tone}>{copy.label}</SystemLabel>
        <h2 className="mt-5 max-w-3xl text-5xl font-medium leading-tight text-[#f3f3f3] sm:text-6xl">
          {copy.title}
        </h2>
        <p className="mt-6 max-w-xl text-base leading-7 text-[#777777]">
          {copy.description}
        </p>
        <Link
          href={feature.primaryCta.href}
          className={cn('mt-10 px-6', linkButtonClassName, tone.button)}
        >
          <span>{feature.primaryCta.label}</span>
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>
    </section>
  );
}

const closingCtaContent: Record<
  FeatureTone,
  {
    label: string;
    title: string;
    description: string;
  }
> = {
  feed: {
    label: 'Next step',
    title: 'Open the feed when you want a clearer market view.',
    description:
      'Search indexed public sale posts, check source links, and keep an eye on new posts by RSS when that fits your workflow.',
  },
  studio: {
    label: 'Next step',
    title: 'Present your domains with a clearer visual direction.',
    description:
      'Review logo, poster, and motion concepts, then use a direction when it makes the opportunity easier to show.',
  },
};
