'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import type { LandingComponent } from '@/components/search/types';
import Image from 'next/image';
import { Fraunces, IBM_Plex_Mono, Manrope, Sora } from 'next/font/google';
import { ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';

const displayFont = Sora({
  subsets: ['latin'],
  variable: '--font-uniswap-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-uniswap-body',
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-uniswap-mono',
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
});

const accentFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-uniswap-accent',
  weight: ['400', '600'],
  style: ['italic'],
  display: 'swap',
  preload: false,
});

const HERO_TILES = [
  { label: 'Domains', value: 'Official surfaces' },
  { label: 'Identity', value: 'Verified ownership' },
] as const;

const GOVERNANCE_CONTROLS = [
  'Canonical deployments and official interfaces',
  'Treasury, incentives, and proposal execution',
  'Protocol upgrades, hooks, and rollout policy',
  'Cross-chain and Unichain governance pathways',
] as const;

const OFFCHAIN_SURFACES = [
  'DNS record modifications',
  'Top-level domain ownership operations',
  'Subdomain issuance and revocation',
  'Emergency recovery at the registrar layer',
] as const;

const WHY_NOW_PILLS = [
  'v4 architecture',
  'Hooks ecosystem',
  'Unichain surfaces',
  'Canonical deploy pages',
  'Verified interfaces',
  'Cross-chain routing',
] as const;

const GOVERNANCE_METRICS = [
  { label: 'For', value: '35.4M UNI' },
  { label: 'Against', value: '3.1M UNI' },
  { label: 'Abstain', value: '4.2M UNI' },
  { label: 'Quorum', value: 'Passed' },
] as const;

const DELEGATE_VOTES = [
  {
    identity: 'gov.uniswap',
    kind: 'Verified ID',
    role: 'Governance steward',
    vote: 'For',
    votingPower: '15.2M UNI',
    avatar: 'GV',
    avatarTone: 'verified',
  },
  {
    identity: 'gauntlet.eth',
    kind: 'ENS',
    role: 'Risk delegate',
    vote: 'For',
    votingPower: '8.7M UNI',
    avatar: 'GE',
    avatarTone: 'ens',
  },
  {
    identity: '0x3b12...7ca1',
    kind: 'Wallet',
    role: 'Independent delegate',
    vote: 'Abstain',
    votingPower: '4.2M UNI',
    avatar: '0x',
    avatarTone: 'wallet',
  },
  {
    identity: 'research.uniswap',
    kind: 'Verified ID',
    role: 'Research contributor',
    vote: 'For',
    votingPower: '6.1M UNI',
    avatar: 'RS',
    avatarTone: 'verified',
  },
  {
    identity: 'stablelab.eth',
    kind: 'ENS',
    role: 'Treasury delegate',
    vote: 'For',
    votingPower: '5.4M UNI',
    avatar: 'SE',
    avatarTone: 'ens',
  },
  {
    identity: '0x91d4...ac44',
    kind: 'Wallet',
    role: 'Independent delegate',
    vote: 'Against',
    votingPower: '3.1M UNI',
    avatar: '0x',
    avatarTone: 'wallet',
  },
] as const;

const PRECEDENTS = [
  {
    number: '01',
    title: 'Seatbelt',
    description:
      'Uniswap already simulates and reviews execution paths before governance actions reach production.',
  },
  {
    number: '02',
    title: 'Accountability',
    description:
      'Major surfaces and deployments rely on clearly scoped actors, committees, and review flows.',
  },
  {
    number: '03',
    title: 'Cross-chain',
    description:
      'Governance already thinks in terms of routing, message integrity, and canonical endpoints across chains.',
  },
  {
    number: '04',
    title: 'Delegation',
    description:
      'Delegates are expected to evaluate risk and define what counts as official protocol infrastructure.',
  },
] as const;

const PRINCIPLES = [
  {
    label: 'Policy enforcement',
    description:
      'Official subdomains are issued automatically under DAO-approved policy instead of ad hoc registrar access.',
  },
  {
    label: 'Access control',
    description:
      'Smart contracts can scope who updates what, rather than relying on shared Web2 credentials.',
  },
  {
    label: 'Transparency',
    description:
      'Ownership and DNS history become auditable events instead of opaque registrar actions.',
  },
  {
    label: 'Canonical identity',
    description:
      'Users get a cryptographic answer for which surfaces are officially sanctioned by governance.',
  },
  {
    label: 'Incident response',
    description:
      'Emergency recovery can be predefined, reviewable, and executable under clear authority.',
  },
] as const;

type IncidentCard = {
  tag: string;
  title: string;
  description: string;
  className?: string;
};

const INCIDENTS: readonly IncidentCard[] = [
  {
    tag: 'Vector 01',
    title: 'Impersonation and phishing',
    description:
      'Lookalike domains siphon user attention before traffic ever reaches the intended contracts.',
  },
  {
    tag: 'Vector 02',
    title: 'DNS hijacking',
    description:
      'Registrar-level compromise can reroute legitimate traffic to a malicious interface in a single step.',
  },
  {
    tag: 'Systemic risk',
    title: 'The attack surface has moved up the stack',
    description:
      'As smart contracts harden, attackers increasingly target the centralized infrastructure that decides where users land. If the domain signals what is official, governance should control it.',
    className: 'md:col-span-2',
  },
];

const CAPABILITIES = [
  {
    title: 'DAO-controlled DNS',
    description:
      'Critical routing records anchor to contracts, so changes move through governance instead of registrar dashboards.',
    className: 'xl:col-span-4',
  },
  {
    title: 'Governed subdomains',
    description:
      'Issue surfaces like app.uniswap, docs.uniswap, and governance.uniswap under policy rather than discretion.',
    className: 'xl:col-span-2',
  },
  {
    title: 'Verified surfaces',
    description:
      'Users can verify that a URL maps to a DAO-approved interface or operator.',
    className: 'md:col-span-1 xl:col-span-3',
  },
  {
    title: 'Scoped operator access',
    description:
      'Teams can handle low-risk records while governance retains approval over routing-critical changes.',
    className: 'md:col-span-1 xl:col-span-3',
  },
] as const;

const STEPS = [
  {
    numeral: 'I',
    title: 'Migrate control',
    description:
      'Transfer domain control to Namefi contracts controlled by Uniswap governance.',
  },
  {
    numeral: 'II',
    title: 'Define policy',
    description:
      'Establish rules for which subdomains map to which surfaces and who can propose changes.',
  },
  {
    numeral: 'III',
    title: 'Assign scoped rights',
    description:
      'Delegate limited DNS operations to verified operators without exposing top-level control.',
  },
  {
    numeral: 'IV',
    title: 'Audit and recover',
    description:
      'Continuously monitor the domain and execute pre-approved recovery playbooks when needed.',
  },
] as const;

const NOISE_BACKGROUND_STYLE: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
};

const GRID_BACKGROUND_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(circle at center, black, transparent 78%)',
  WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 78%)',
};

const CARD_CLIP_PATH =
  'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)';
const CORNER_CLIP_PATH = 'polygon(100% 0, 0 100%, 100% 100%)';

function SectionEyebrow({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#9d90b2]',
        '[font-family:var(--font-uniswap-mono)]',
        className,
      )}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(135deg,#F50DB4,#FF8DDA)] shadow-[0_0_20px_rgba(245,13,180,0.5)]" />
      <span>{children}</span>
    </div>
  );
}

function FrameCorners() {
  return (
    <>
      <span
        aria-hidden={true}
        className="absolute -left-2 -top-2 h-4 w-4 border-s border-t border-[#F7BEDF]/35"
      />
      <span
        aria-hidden={true}
        className="absolute -bottom-2 -right-2 h-4 w-4 border-b border-e border-[#F7BEDF]/35"
      />
    </>
  );
}

function IdentityKindBadge({
  kind,
}: {
  kind: (typeof DELEGATE_VOTES)[number]['kind'];
}) {
  const tone =
    kind === 'Verified ID'
      ? 'border-[#F50DB4]/30 bg-[#F50DB4]/12 text-[#FF9DDB]'
      : kind === 'ENS'
        ? 'border-[#7C6CFF]/30 bg-[#7C6CFF]/10 text-[#C8C2FF]'
        : 'border-white/10 bg-white/5 text-white/65';

  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em]',
        '[font-family:var(--font-uniswap-mono)]',
        tone,
      )}
    >
      {kind}
    </span>
  );
}

function VoteBadge({
  vote,
}: {
  vote: (typeof DELEGATE_VOTES)[number]['vote'];
}) {
  const tone =
    vote === 'For'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : vote === 'Against'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

  return (
    <span
      className={cn(
        'rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em]',
        '[font-family:var(--font-uniswap-mono)]',
        tone,
      )}
    >
      {vote}
    </span>
  );
}

function DelegateAvatar({
  avatar,
  avatarTone,
}: {
  avatar: string;
  avatarTone: (typeof DELEGATE_VOTES)[number]['avatarTone'];
}) {
  const tone =
    avatarTone === 'verified'
      ? 'from-[#F50DB4] to-[#FF7BCF]'
      : avatarTone === 'ens'
        ? 'from-[#7C6CFF] to-[#4B9CFF]'
        : 'from-white/35 to-white/10';

  const statusTone =
    avatarTone === 'verified'
      ? 'bg-[#FF6CC9]'
      : avatarTone === 'ens'
        ? 'bg-[#7C6CFF]'
        : 'bg-white/70';

  return (
    <div
      className={cn(
        'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]',
        '[font-family:var(--font-uniswap-mono)]',
        tone,
      )}
    >
      <span className="absolute inset-[1px] rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_38%),rgba(5,5,10,0.18)]" />
      <span className="absolute inset-[7px] rounded-full border border-white/10" />
      <span className="relative z-10 text-[0.82rem]">{avatar}</span>
      <span
        className={cn(
          'absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#09070d]',
          statusTone,
        )}
      />
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-4 text-[0.98rem] leading-7 text-[#a8a1b7]">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[0.72rem] text-[#FF8DD8]',
              '[font-family:var(--font-uniswap-mono)]',
            )}
          >
            +
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HeroDiagram() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,14,29,0.94)_0%,rgba(8,8,14,0.92)_100%)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <SectionEyebrow>Official surfaces</SectionEyebrow>
        <Image
          src="/assets/uniswap/logos/uniswap-icon-pink.svg"
          alt="Uniswap icon"
          width={40}
          height={40}
          className="h-10 w-10"
          unoptimized={true}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(245,13,180,0.12),transparent_36%),rgba(0,0,0,0.18)] p-2 sm:p-3">
        <svg viewBox="0 0 560 460" className="h-auto w-full" aria-hidden={true}>
          <defs>
            <radialGradient id="uniswap-hero-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F50DB4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#09070d" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="280" cy="230" r="168" fill="url(#uniswap-hero-glow)" />

          <path
            d="M280 230 L130 110 M280 230 L430 96 M280 230 L126 350 M280 230 L426 340 M280 230 L280 84"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            fill="none"
          />

          <path
            d="M130 110 L280 230 L426 340"
            className="uniswap-pbn-flow-animated"
            stroke="#F50DB4"
            strokeOpacity="0.42"
            strokeWidth="2"
            strokeDasharray="8 10"
            fill="none"
            style={{ animation: 'uniswap-pbn-flow 18s linear infinite' }}
          />
          <path
            d="M280 84 L280 230 L430 96"
            className="uniswap-pbn-flow-animated"
            stroke="#7C6CFF"
            strokeOpacity="0.42"
            strokeWidth="2"
            strokeDasharray="8 10"
            fill="none"
            style={{
              animation: 'uniswap-pbn-flow 20s linear infinite reverse',
            }}
          />

          <rect
            x="168"
            y="126"
            width="224"
            height="208"
            rx="24"
            fill="none"
            stroke="#F50DB4"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="7 8"
          />
          <text
            x="188"
            y="150"
            fill="#FF8DD8"
            fontSize="11"
            letterSpacing="2.4"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            OFFICIAL DOMAINS
          </text>

          <circle cx="280" cy="230" r="18" fill="#F50DB4" />
          <circle
            cx="280"
            cy="230"
            r="34"
            fill="none"
            stroke="#F50DB4"
            strokeOpacity="0.22"
          />
          <circle
            cx="280"
            cy="84"
            r="10"
            fill="#0D0C14"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
          />
          <circle
            cx="130"
            cy="110"
            r="10"
            fill="#0D0C14"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
          />
          <circle
            cx="430"
            cy="96"
            r="10"
            fill="#0D0C14"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
          />
          <circle
            cx="126"
            cy="350"
            r="10"
            fill="#0D0C14"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
          />
          <circle
            cx="426"
            cy="340"
            r="10"
            fill="#0D0C14"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
          />

          <text
            x="302"
            y="232"
            fill="#FFFFFF"
            fontSize="10"
            letterSpacing="1.6"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            DOMAIN ROOT
          </text>
          <text
            x="144"
            y="102"
            fill="rgba(255,255,255,0.62)"
            fontSize="11"
            letterSpacing="1.2"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            app.uniswap
          </text>
          <text
            x="444"
            y="88"
            fill="rgba(255,255,255,0.62)"
            fontSize="11"
            letterSpacing="1.2"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            docs.uniswap
          </text>
          <text
            x="140"
            y="376"
            fill="rgba(255,255,255,0.62)"
            fontSize="11"
            letterSpacing="1.2"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            vote.uniswap
          </text>
          <text
            x="354"
            y="366"
            fill="rgba(255,255,255,0.62)"
            fontSize="11"
            letterSpacing="1.2"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            unichain.uniswap
          </text>
          <text
            x="244"
            y="66"
            fill="rgba(255,255,255,0.62)"
            fontSize="11"
            letterSpacing="1.2"
            style={{ fontFamily: 'var(--font-uniswap-mono)' }}
          >
            hooks.uniswap
          </text>
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {HERO_TILES.map((tile) => (
          <div
            key={tile.label}
            className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-3"
          >
            <div
              className={cn(
                'text-[0.65rem] uppercase tracking-[0.14em] text-white/45',
                '[font-family:var(--font-uniswap-mono)]',
              )}
            >
              {tile.label}
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              {tile.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardCorner() {
  return (
    <span
      aria-hidden={true}
      className="absolute right-0 top-0 h-5 w-5 bg-white/15 transition-colors duration-300 group-hover:bg-[#F50DB4]"
      style={{ clipPath: CORNER_CLIP_PATH }}
    />
  );
}

// `origin` is part of the landing contract and reserved for future hostname-specific behavior.
export const Landing: LandingComponent = ({ origin: _origin }) => {
  return (
    <div
      className={cn(
        displayFont.variable,
        bodyFont.variable,
        monoFont.variable,
        accentFont.variable,
        'relative overflow-hidden bg-[#05050a] text-[#f7f4fb] selection:bg-[#F50DB4]/30 selection:text-white [font-family:var(--font-uniswap-body)]',
      )}
    >
      <style>{`
        @keyframes uniswap-pbn-float {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-48px, 48px, 0); }
        }

        @keyframes uniswap-pbn-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -180; }
        }

        @media (prefers-reduced-motion: reduce) {
          .uniswap-pbn-animated,
          .uniswap-pbn-flow-animated {
            animation: none !important;
          }
        }
      `}</style>

      <div aria-hidden={true} className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={NOISE_BACKGROUND_STYLE}
        />
        <div className="absolute inset-0" style={GRID_BACKGROUND_STYLE} />
        <div
          className="uniswap-pbn-animated absolute -right-32 top-0 h-[34rem] w-[34rem] rounded-full bg-[#F50DB4] opacity-[0.16] blur-[140px]"
          style={{
            animation: 'uniswap-pbn-float 20s ease-in-out infinite alternate',
          }}
        />
        <div
          className="uniswap-pbn-animated absolute left-[-12rem] top-[40%] h-[28rem] w-[28rem] rounded-full bg-[#7C6CFF] opacity-[0.14] blur-[140px]"
          style={{
            animation:
              'uniswap-pbn-float 24s ease-in-out infinite alternate-reverse',
          }}
        />
        <div
          className="uniswap-pbn-animated absolute bottom-[-10rem] right-[15%] h-[24rem] w-[24rem] rounded-full bg-[#FF7BCF] opacity-[0.12] blur-[120px]"
          style={{
            animation: 'uniswap-pbn-float 18s ease-in-out infinite alternate',
          }}
        />
      </div>

      <div className="relative z-10">
        <section className="border-b border-white/[0.06] px-5 pb-20 pt-24 sm:px-8 md:pb-24 md:pt-32 xl:px-10 xl:pt-40">
          <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,0.96fr)] lg:items-center lg:gap-16">
            <div className="relative max-w-[700px] ps-6 md:ps-10">
              <div className="absolute bottom-0 left-0 top-0 w-px bg-[linear-gradient(180deg,#F50DB4,#FF8DD8)] opacity-65" />
              <FrameCorners />

              <SectionEyebrow>Governance-native domain</SectionEyebrow>

              <Image
                src="/assets/uniswap/logos/uniswap-horizontal-white.svg"
                alt="Uniswap"
                width={256}
                height={70}
                className="mt-7 h-auto w-[170px] sm:w-[210px]"
                preload
                unoptimized={true}
              />

              <h1
                className={cn(
                  'mt-8 max-w-[680px] text-[3rem] leading-[0.94] tracking-[-0.03em] text-balance sm:text-[3.4rem] md:text-[4.5rem] xl:text-[5.1rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                Uniswap governs the protocol.
                <br className="hidden md:block" /> It should govern the{' '}
                <span
                  className={cn(
                    'bg-[linear-gradient(135deg,#F50DB4,#FFA0E0)] bg-clip-text italic text-transparent',
                    '[font-family:var(--font-uniswap-accent)]',
                  )}
                >
                  domain
                </span>{' '}
                too.
              </h1>

              <p className="mt-8 max-w-[600px] border-s border-white/12 ps-5 text-lg leading-8 text-[#a8a1b7] md:text-xl">
                Bring DNS, subdomains, and official web surfaces under the same
                onchain controls that already protect upgrades, incentives, and
                deployments.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href="#proposal"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF5AC8,#F50DB4)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(245,13,180,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(245,13,180,0.45)]',
                    '[font-family:var(--font-uniswap-display)]',
                  )}
                >
                  <span>Bring DNS onchain</span>
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </a>
                <a
                  href="#execution-path"
                  className={cn(
                    'inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-white/25 hover:bg-white/[0.06]',
                    '[font-family:var(--font-uniswap-display)]',
                  )}
                >
                  View the governance model
                </a>
              </div>
            </div>

            <HeroDiagram />
          </div>
        </section>

        <section
          id="gap"
          className="scroll-mt-24 border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-[860px]">
              <SectionEyebrow>Index 01 / Surface Gap</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 text-[2.3rem] leading-[1.02] tracking-[-0.03em] text-white md:text-[3.6rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                The protocol is decentralized.
                <span className="block text-[#a8a1b7]">
                  The domain still is not.
                </span>
              </h2>
              <p className="mt-5 max-w-[760px] text-lg leading-8 text-[#a8a1b7]">
                Governance already secures critical execution paths. The web
                layer users rely on to find Uniswap still depends on offchain
                control points.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-8">
                <div
                  className={cn(
                    'mb-5 text-[0.78rem] uppercase tracking-[0.16em] text-white',
                    '[font-family:var(--font-uniswap-mono)]',
                  )}
                >
                  Governance controls today
                </div>
                <BulletList items={GOVERNANCE_CONTROLS} />
              </div>

              <div className="rounded-[30px] border border-[#F7BEDF]/18 bg-[linear-gradient(180deg,rgba(245,13,180,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-8">
                <div
                  className={cn(
                    'mb-5 text-[0.78rem] uppercase tracking-[0.16em] text-[#FF9DDB]',
                    '[font-family:var(--font-uniswap-mono)]',
                  )}
                >
                  Still offchain
                </div>
                <BulletList items={OFFCHAIN_SURFACES} />
              </div>
            </div>
          </div>
        </section>

        <section
          id="why-now"
          className="scroll-mt-24 border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10"
        >
          <div className="mx-auto max-w-[1400px] rounded-[34px] border border-[#f3bfdc]/40 bg-[linear-gradient(135deg,rgba(255,248,252,0.98),rgba(255,238,247,0.88))] px-6 py-8 text-[#1f1825] shadow-[0_24px_70px_rgba(245,13,180,0.12)] sm:px-8 md:px-10 md:py-10">
            <SectionEyebrow className="text-[#94608a]">
              Index 02 / Why Now
            </SectionEyebrow>

            <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <h2
                  className={cn(
                    'text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.4rem]',
                    '[font-family:var(--font-uniswap-display)]',
                  )}
                >
                  Uniswap keeps adding official surfaces.
                </h2>
                <p className="mt-5 max-w-[760px] text-lg leading-8 text-[#635567]">
                  With v4, hooks, and Unichain, more users are trusting more
                  endpoints. Governance should own the routing layer that tells
                  them what is canonical.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                {WHY_NOW_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className={cn(
                      'rounded-full border border-black/8 bg-white/90 px-4 py-2 text-[0.76rem] uppercase tracking-[0.14em] text-[#3a2b40] shadow-[0_6px_18px_rgba(0,0,0,0.04)]',
                      '[font-family:var(--font-uniswap-mono)]',
                    )}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="proposal"
          className="scroll-mt-24 border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-[860px]">
              <SectionEyebrow>Index 03 / Governance Surface</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.5rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                Delegates should know which identities are official.
              </h2>
              <p className="mt-5 max-w-[720px] text-lg leading-8 text-[#a8a1b7]">
                Proposal pages should make verified Uniswap domains obvious
                alongside ENS names and wallets, so delegates can assess
                provenance at a glance.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-[30px] border border-white/[0.08] bg-[rgba(11,10,18,0.78)] shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
              <div className="border-b border-white/[0.06] p-6 sm:p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-white/70',
                      '[font-family:var(--font-uniswap-mono)]',
                    )}
                  >
                    Illustrative proposal
                  </span>
                  <span
                    className={cn(
                      'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-emerald-300',
                      '[font-family:var(--font-uniswap-mono)]',
                    )}
                  >
                    Voting live
                  </span>
                </div>

                <h3
                  className={cn(
                    'mt-8 max-w-[720px] text-[1.9rem] leading-tight tracking-[-0.03em] md:text-[2.5rem]',
                    '[font-family:var(--font-uniswap-display)]',
                  )}
                >
                  Proposal: Canonical domain policy for app.uniswap,
                  docs.uniswap, and Unichain entry points.
                </h3>

                <p className="mt-5 max-w-[700px] text-[0.98rem] leading-7 text-[#a8a1b7] md:text-[1.04rem]">
                  The proposal itself is simple: route official web surfaces
                  through a governance-defined domain policy. What changes is
                  the context around it. Delegates can appear under verified
                  Uniswap domains, ENS names, or wallets without losing
                  auditability.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {GOVERNANCE_METRICS.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-[18px] border border-white/[0.06] bg-white/[0.03] p-4"
                    >
                      <div
                        className={cn(
                          'text-[0.68rem] uppercase tracking-[0.14em] text-white/50',
                          '[font-family:var(--font-uniswap-mono)]',
                        )}
                      >
                        {metric.label}
                      </div>
                      <div
                        className={cn(
                          'mt-2 text-2xl tracking-[-0.03em] text-white',
                          '[font-family:var(--font-uniswap-display)]',
                        )}
                      >
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-5">
                <div
                  className={cn(
                    'px-4 pb-3 pt-2 text-[0.68rem] uppercase tracking-[0.14em] text-white/45',
                    '[font-family:var(--font-uniswap-mono)]',
                  )}
                >
                  Delegate votes
                </div>

                <div className="space-y-3">
                  {DELEGATE_VOTES.map((delegate) => (
                    <div
                      key={`${delegate.identity}-${delegate.vote}`}
                      className="grid gap-4 rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.045] md:grid-cols-[1fr_auto]"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <DelegateAvatar
                          avatar={delegate.avatar}
                          avatarTone={delegate.avatarTone}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[1.05rem] text-white md:text-[1.1rem]">
                              {delegate.identity}
                            </span>
                            <IdentityKindBadge kind={delegate.kind} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span className="text-[0.92rem] text-[#a8a1b7]">
                              {delegate.role}
                            </span>
                            <span
                              className={cn(
                                'text-[0.72rem] uppercase tracking-[0.14em] text-white/45',
                                '[font-family:var(--font-uniswap-mono)]',
                              )}
                            >
                              {delegate.votingPower}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-start md:justify-end">
                        <VoteBadge vote={delegate.vote} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-[860px]">
              <SectionEyebrow>Index 04 / Precedent</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.4rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                This already matches how Uniswap handles risk.
              </h2>
              <p className="mt-5 max-w-[720px] text-lg leading-8 text-[#a8a1b7]">
                The domain is not a branding layer. It is an extension of the
                same governance logic already applied to deployment, routing,
                and execution risk.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {PRECEDENTS.map((precedent) => (
                <article
                  key={precedent.number}
                  className="group relative overflow-hidden border border-white/[0.06] bg-[rgba(15,15,20,0.62)] p-7 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1.5 hover:border-[#F50DB4]/40 md:p-8"
                  style={{ clipPath: CARD_CLIP_PATH }}
                >
                  <CardCorner />
                  <span
                    className={cn(
                      'block text-2xl text-white/20 transition-colors duration-300 group-hover:text-[#F50DB4]',
                      '[font-family:var(--font-uniswap-mono)]',
                    )}
                  >
                    {precedent.number}
                  </span>
                  <h3
                    className={cn(
                      'mt-6 text-[1.55rem] leading-tight tracking-[-0.02em]',
                      '[font-family:var(--font-uniswap-display)]',
                    )}
                  >
                    {precedent.title}
                  </h3>
                  <p className="mt-4 text-[0.98rem] leading-7 text-[#a8a1b7]">
                    {precedent.description}
                  </p>
                </article>
              ))}
            </div>

            <div
              className={cn(
                'mt-10 flex items-center gap-4 text-[0.74rem] uppercase tracking-[0.16em] text-white/60',
                '[font-family:var(--font-uniswap-mono)]',
              )}
            >
              <span className="h-px flex-1 bg-white/12" />
              <span>Namefi extends that logic to the domain layer.</span>
              <span className="h-px flex-1 bg-white/12" />
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10">
          <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-[4.5rem]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionEyebrow>Index 05 / Delegate Case</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 max-w-[620px] text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.4rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                This is governance infrastructure, not brand polish.
              </h2>
              <p className="mt-5 max-w-[560px] text-lg leading-8 text-[#a8a1b7]">
                When users connect through a URL, the domain is part of the
                trust model. That makes it governance scope.
              </p>
            </div>

            <div className="space-y-5">
              {PRINCIPLES.map((principle) => (
                <div
                  key={principle.label}
                  className="flex items-start gap-4 rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-5 sm:p-6"
                >
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F50DB4]/25 bg-[#F50DB4]/10 text-[#FF9DDB]',
                      '[font-family:var(--font-uniswap-mono)]',
                    )}
                  >
                    +
                  </span>
                  <div>
                    <div
                      className={cn(
                        'text-[0.72rem] uppercase tracking-[0.16em] text-[#FF9DDB]',
                        '[font-family:var(--font-uniswap-mono)]',
                      )}
                    >
                      {principle.label}
                    </div>
                    <p className="mt-3 text-[0.98rem] leading-7 text-[#a8a1b7]">
                      {principle.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-[860px]">
              <SectionEyebrow>Index 06 / Incident Surface</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.4rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                The risk is not hypothetical.
              </h2>
              <p className="mt-5 max-w-[760px] text-lg leading-8 text-[#a8a1b7]">
                When smart contracts become harder to exploit, attackers pivot
                to the centralized systems that decide where users click first.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {INCIDENTS.map((incident) => (
                <div
                  key={incident.title}
                  className={cn(
                    'rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]',
                    'border-s-2 border-s-[#F50DB4]',
                    incident.className,
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex rounded-md bg-[#F50DB4]/10 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-[#FF9DDB]',
                      '[font-family:var(--font-uniswap-mono)]',
                    )}
                  >
                    {incident.tag}
                  </span>
                  <h3
                    className={cn(
                      'mt-5 text-[1.45rem] leading-tight tracking-[-0.02em]',
                      '[font-family:var(--font-uniswap-display)]',
                    )}
                  >
                    {incident.title}
                  </h3>
                  <p className="mt-4 text-[0.98rem] leading-7 text-[#a8a1b7]">
                    {incident.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="scroll-mt-24 border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-24 xl:px-10"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-[760px]">
              <SectionEyebrow>Index 07 / Capabilities</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.4rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                Governance for the domain layer.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-6">
              {CAPABILITIES.map((capability) => (
                <article
                  key={capability.title}
                  className={cn(
                    'group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-[28px] border border-white/[0.06] bg-[rgba(15,15,20,0.62)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition duration-300 hover:border-[#F50DB4]/35 hover:bg-[rgba(18,15,28,0.78)] sm:p-8',
                    capability.className,
                  )}
                >
                  <div
                    aria-hidden={true}
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,13,180,0.14),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <h3
                    className={cn(
                      'relative text-[1.5rem] leading-tight tracking-[-0.02em] text-white',
                      '[font-family:var(--font-uniswap-display)]',
                    )}
                  >
                    {capability.title}
                  </h3>
                  <p className="relative mt-4 text-[0.98rem] leading-7 text-[#a8a1b7]">
                    {capability.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="execution-path"
          className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-24 xl:px-10"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-14 max-w-[760px] md:mb-16">
              <SectionEyebrow>Index 08 / Execution Path</SectionEyebrow>
              <h2
                className={cn(
                  'mt-6 text-[2.2rem] leading-[1.02] tracking-[-0.03em] md:text-[3.4rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                A governance-native operating model.
              </h2>
            </div>

            <div className="relative">
              <div className="absolute bottom-0 left-6 top-0 w-px bg-white/12 md:hidden" />
              <div className="absolute left-0 right-0 top-6 hidden h-px bg-white/12 md:block" />

              <div className="grid gap-14 md:grid-cols-4 md:gap-6">
                {STEPS.map((step) => (
                  <article
                    key={step.numeral}
                    className="relative ps-[4.5rem] md:ps-0 md:pe-4"
                  >
                    <div
                      className={cn(
                        'absolute left-0 top-0 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-white/15 bg-[#09070d] text-sm text-white transition-all duration-300 hover:border-[#F50DB4] hover:text-[#FF9DDB] hover:shadow-[0_0_25px_rgba(245,13,180,0.35)] md:relative md:mb-8 md:left-auto md:top-auto',
                        '[font-family:var(--font-uniswap-mono)]',
                      )}
                    >
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-white/18" />
                      <span className="relative z-10">{step.numeral}</span>
                    </div>

                    <h3
                      className={cn(
                        'text-[0.82rem] uppercase tracking-[0.12em] text-white',
                        '[font-family:var(--font-uniswap-mono)]',
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[0.98rem] leading-7 text-[#a8a1b7]">
                      {step.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.06] px-5 py-24 text-center sm:px-8 md:py-32 xl:px-10">
          <div
            aria-hidden={true}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(245,13,180,0.16)_0%,transparent_70%)]"
          />

          <div className="relative mx-auto flex max-w-[920px] flex-col items-center">
            <div className="relative px-3">
              <FrameCorners />
              <h2
                className={cn(
                  'max-w-[760px] text-[2.8rem] leading-[0.98] tracking-[-0.03em] text-balance md:text-[4.4rem]',
                  '[font-family:var(--font-uniswap-display)]',
                )}
              >
                Make the domain match the standard of the protocol.
              </h2>
            </div>

            <p className="mt-6 max-w-[640px] text-lg leading-8 text-[#a8a1b7]">
              If governance defines what is official in Uniswap, it should
              define the domain users trust.
            </p>

            <a
              href="mailto:support@namefi.io?subject=Bring%20Uniswap%20DNS%20Onchain"
              className={cn(
                'group relative mt-10 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(135deg,#FF5AC8,#F50DB4)] px-8 py-4 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(245,13,180,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(245,13,180,0.45)]',
                '[font-family:var(--font-uniswap-display)]',
              )}
            >
              <span>Bring Uniswap DNS onchain</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </a>

            <div
              className={cn(
                'pointer-events-none mt-12 text-[0.65rem] uppercase tracking-[0.14em] text-white/25',
                '[font-family:var(--font-uniswap-mono)]',
              )}
            >
              <div>{'// OFFICIAL SURFACES SHOULD BE DAO-SIGNED'}</div>
              <div>{'// GOVERNANCE SHOULD OWN THE GATEWAY'}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

Landing.displayName = 'UniswapLanding';
