'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import type { LandingComponent } from '@/components/search/types';
import {
  IBM_Plex_Mono,
  Inter,
  Playfair_Display,
  Space_Grotesk,
} from 'next/font/google';
import type { CSSProperties } from 'react';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-aave-display',
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
});

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-aave-body',
  weight: ['300', '400', '500'],
  display: 'swap',
  preload: false,
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-aave-mono',
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
});

const accentFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-aave-accent',
  style: ['italic'],
  weight: ['600'],
  display: 'swap',
  preload: false,
});

const FEATURES = [
  {
    number: '01',
    title: 'DNS by DAO Governance',
    description:
      'Move DNS changes out of private, centralized registrar accounts and into transparent, reviewable governance. Every record update becomes a mathematically verifiable transaction.',
  },
  {
    number: '02',
    title: 'Onchain Identity',
    description:
      'Give delegates, service providers, and core contributors official, wallet-native identities that the DAO can verify entirely onchain without intermediary attestation.',
  },
  {
    number: '03',
    title: 'Governed Subdomains',
    description:
      'Programmatically manage namespaces like governance.aave.com, risk.aave.com, and ecosystem subdomains strictly under DAO-approved rules and execution parameters.',
  },
] as const;

const STEPS = [
  {
    numeral: 'I',
    title: 'Infrastructure Migration',
    description:
      'Put aave.com DNS under DAO-controlled, cryptographically secure onchain infrastructure, severing ties to legacy web2 vulnerabilities.',
  },
  {
    numeral: 'II',
    title: 'Define Governance Logic',
    description:
      'Let governance define exactly who can propose, approve, and execute structural changes to the top-level domain through smart contract parameters.',
  },
  {
    numeral: 'III',
    title: 'Distribute Access',
    description:
      'Give trusted contributors and ecosystem partners auditable, scoped namespace access based on verifiable onchain roles.',
  },
] as const;

const DELEGATE_VOTES = [
  {
    identity: 'aci.aave',
    kind: 'Aave ID',
    role: 'Recognized delegate',
    vote: 'For',
    votingPower: '2.6M power',
    avatar: 'AC',
    avatarTone: 'aave',
  },
  {
    identity: 'gauntlet.eth',
    kind: 'ENS',
    role: 'Risk delegate',
    vote: 'For',
    votingPower: '1.9M power',
    avatar: 'GE',
    avatarTone: 'ens',
  },
  {
    identity: '0x4f2e...91ac',
    kind: 'Wallet',
    role: 'Anonymous delegate',
    vote: 'Abstain',
    votingPower: '812K power',
    avatar: '0x',
    avatarTone: 'wallet',
  },
  {
    identity: 'risk.aave',
    kind: 'Aave ID',
    role: 'Service provider',
    vote: 'For',
    votingPower: '1.2M power',
    avatar: 'RK',
    avatarTone: 'aave',
  },
  {
    identity: 'tokenlogic.eth',
    kind: 'ENS',
    role: 'Treasury delegate',
    vote: 'For',
    votingPower: '1.1M power',
    avatar: 'TE',
    avatarTone: 'ens',
  },
  {
    identity: '0x8b71...c02d',
    kind: 'Wallet',
    role: 'Anonymous delegate',
    vote: 'Against',
    votingPower: '544K power',
    avatar: '0x',
    avatarTone: 'wallet',
  },
] as const;

const GOVERNANCE_METRICS = [
  { label: 'For', value: '6.8M' },
  { label: 'Against', value: '544K' },
  { label: 'Abstain', value: '812K' },
  { label: 'Quorum', value: 'Passed' },
] as const;

const noiseBackgroundStyle: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
};

const gridBackgroundStyle: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
  maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
  WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)',
};

const cardClipPath =
  'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)';
const cornerClipPath = 'polygon(100% 0, 0 100%, 100% 100%)';

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.14em] text-[#8A8A9B]',
        '[font-family:var(--font-aave-mono)]',
      )}
    >
      <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#E51E56,#7B22AB)]" />
      <span>{children}</span>
    </div>
  );
}

function FrameCorners() {
  return (
    <>
      <span
        aria-hidden={true}
        className="absolute -left-2 -top-2 h-4 w-4 border-l border-t border-[#8A8A9B]/40"
      />
      <span
        aria-hidden={true}
        className="absolute -bottom-2 -right-2 h-4 w-4 border-b border-r border-[#8A8A9B]/40"
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
    kind === 'Aave ID'
      ? 'border-[#E51E56]/30 bg-[#E51E56]/10 text-[#FF8AB0]'
      : kind === 'ENS'
        ? 'border-[#7B22AB]/35 bg-[#7B22AB]/10 text-[#D6A9F1]'
        : 'border-white/10 bg-white/5 text-white/65';

  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em]',
        '[font-family:var(--font-aave-mono)]',
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
        '[font-family:var(--font-aave-mono)]',
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
    avatarTone === 'aave'
      ? 'from-[#E51E56] to-[#7B22AB]'
      : avatarTone === 'ens'
        ? 'from-[#7B22AB] to-[#3B82F6]'
        : 'from-white/35 to-white/10';

  const statusTone =
    avatarTone === 'aave'
      ? 'bg-[#FF5D93]'
      : avatarTone === 'ens'
        ? 'bg-[#8B5CF6]'
        : 'bg-white/70';

  return (
    <div
      className={cn(
        'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]',
        '[font-family:var(--font-aave-mono)]',
        tone,
      )}
    >
      <span className="absolute inset-[1px] rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_38%),rgba(3,3,5,0.12)]" />
      <span className="absolute inset-[7px] rounded-full border border-white/10" />
      <span className="relative z-10 text-[0.82rem]">{avatar}</span>
      <span
        className={cn(
          'absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0f]',
          statusTone,
        )}
      />
    </div>
  );
}

export const Landing: LandingComponent = ({ origin: _origin }) => {
  return (
    <div
      className={cn(
        displayFont.variable,
        bodyFont.variable,
        monoFont.variable,
        accentFont.variable,
        'relative overflow-hidden bg-[#030305] text-white [font-family:var(--font-aave-body)]',
      )}
    >
      <style>{`
        @keyframes aave-pbn-float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50px, 50px); }
        }
      `}</style>

      <div aria-hidden={true} className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={noiseBackgroundStyle}
        />
        <div className="absolute inset-0" style={gridBackgroundStyle} />
        <div
          className="absolute -right-24 -top-52 h-[36rem] w-[36rem] rounded-full bg-[#7B22AB] opacity-40 blur-[120px]"
          style={{
            animation: 'aave-pbn-float 20s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute -bottom-52 -left-52 h-[32rem] w-[32rem] rounded-full bg-[#E51E56] opacity-20 blur-[120px]"
          style={{
            animation:
              'aave-pbn-float 25s ease-in-out infinite alternate-reverse',
          }}
        />
      </div>

      <div className="relative z-10">
        <section className="relative border-b border-white/[0.06] px-5 pb-20 pt-28 sm:px-8 md:pb-28 md:pt-36 xl:px-10 xl:pt-44">
          <div className="mx-auto max-w-[1400px]">
            <div className="relative max-w-[1040px] pl-6 md:pl-10">
              <div className="absolute bottom-0 left-0 top-0 w-px bg-[linear-gradient(180deg,#E51E56,#7B22AB)] opacity-50" />
              <FrameCorners />
              <h1
                className={cn(
                  'mt-8 max-w-[980px] text-[3rem] leading-[0.96] tracking-[-0.02em] text-balance md:text-[4.4rem] xl:text-[5.5rem]',
                  '[font-family:var(--font-aave-display)]',
                )}
              >
                If Aave is governed{' '}
                <span className="bg-[linear-gradient(135deg,#E51E56,#7B22AB)] bg-clip-text text-transparent">
                  onchain
                </span>
                ,
                <br className="hidden md:block" />
                its domain should{' '}
                <span
                  className={cn(
                    'italic tracking-normal',
                    '[font-family:var(--font-aave-accent)]',
                  )}
                >
                  be too.
                </span>
              </h1>

              <p className="mt-10 max-w-[640px] border-l border-white/15 pl-6 text-lg leading-8 text-[#8A8A9B] md:ml-auto md:text-xl">
                Aave already governs deployments, upgrades, treasury decisions,
                and risk onchain. Namefi brings that same sovereignty to
                aave.com, so DNS, subdomains, and official web entry points are
                controlled by DAO governance instead of an offchain gatekeeper.
              </p>
            </div>
          </div>
        </section>

        <section className="relative border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(10,10,15,0)_0%,rgba(10,10,15,0.8)_100%)] px-5 py-20 sm:px-8 md:py-28 xl:px-10">
          <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2
                className={cn(
                  'max-w-[520px] text-[2.25rem] leading-[1.04] tracking-[-0.02em] md:text-[3.5rem]',
                  '[font-family:var(--font-aave-display)]',
                )}
              >
                The protocol is decentralized.
                <br />
                <span className="text-[#8A8A9B]">
                  The gateway still is not.
                </span>
              </h2>
            </div>

            <div className="max-w-[760px] pt-1 text-[1.125rem] leading-8 text-[#8A8A9B] md:text-[1.5rem] md:leading-[1.65]">
              <p>
                In DeFi, smart contracts can be mathematically secure while the
                domain layer remains fundamentally vulnerable. Relying on
                traditional DNS registrars creates a single point of failure and
                requires trusting individuals with private credentials.
              </p>
              <p className="mt-8">
                If Aave demands{' '}
                <strong className="font-medium text-white">
                  credible neutrality
                </strong>{' '}
                end-to-end, the web layer must mathematically match the security
                guarantees of the protocol itself.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] px-5 py-20 sm:px-8 md:py-28 xl:px-10">
          <div className="mx-auto max-w-[1400px]">
            <SectionLabel>GOVERNANCE SURFACE</SectionLabel>

            <div className="mt-10 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[rgba(11,11,16,0.78)] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="border-b border-white/[0.06] p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-white/70',
                      '[font-family:var(--font-aave-mono)]',
                    )}
                  >
                    Illustrative Proposal
                  </span>
                  <span
                    className={cn(
                      'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-emerald-300',
                      '[font-family:var(--font-aave-mono)]',
                    )}
                  >
                    Voting Live
                  </span>
                </div>

                <h3
                  className={cn(
                    'mt-8 max-w-[520px] text-[1.8rem] leading-tight tracking-[-0.02em] md:text-[2.4rem]',
                    '[font-family:var(--font-aave-display)]',
                  )}
                >
                  AIP: Update supply caps for wstETH and weETH on Aave V3
                  Arbitrum.
                </h3>

                <p className="mt-5 max-w-[640px] text-[0.98rem] leading-7 text-[#8A8A9B] md:text-[1.05rem]">
                  The proposal itself stays routine and governance-native. What
                  changes is the voting surface: delegates can appear as ENS
                  names, wallet-only voters, or verified Aave identities in the
                  same ledger.
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
                          '[font-family:var(--font-aave-mono)]',
                        )}
                      >
                        {metric.label}
                      </div>
                      <div
                        className={cn(
                          'mt-2 text-2xl tracking-[-0.02em] text-white',
                          '[font-family:var(--font-aave-display)]',
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
                    '[font-family:var(--font-aave-mono)]',
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
                            <span className="text-[0.92rem] text-[#8A8A9B]">
                              {delegate.role}
                            </span>
                            <span
                              className={cn(
                                'text-[0.72rem] uppercase tracking-[0.14em] text-white/45',
                                '[font-family:var(--font-aave-mono)]',
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

        <section className="px-5 py-20 sm:px-8 md:py-28 xl:px-10">
          <div className="mx-auto max-w-[1400px]">
            <SectionLabel>SYSTEM CAPABILITIES</SectionLabel>

            <div className="mt-14 grid gap-6 xl:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.number}
                  className="group relative overflow-hidden border border-white/[0.06] bg-[rgba(15,15,20,0.6)] p-8 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1.5 hover:border-[#E51E56]/40 md:p-10"
                  style={{ clipPath: cardClipPath }}
                >
                  <span
                    aria-hidden={true}
                    className="absolute right-0 top-0 h-5 w-5 bg-white/15 transition-colors duration-300 group-hover:bg-[#E51E56]"
                    style={{ clipPath: cornerClipPath }}
                  />
                  <span
                    className={cn(
                      'block text-2xl text-white/20 transition-colors duration-300 group-hover:text-[#E51E56]',
                      '[font-family:var(--font-aave-mono)]',
                    )}
                  >
                    {feature.number}
                  </span>
                  <h3
                    className={cn(
                      'mt-6 text-[1.65rem] leading-tight tracking-[-0.02em]',
                      '[font-family:var(--font-aave-display)]',
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-[0.98rem] leading-7 text-[#8A8A9B]">
                    {feature.title === 'Governed Subdomains' ? (
                      <>
                        Programmatically manage namespaces like{' '}
                        <em className="text-white">governance.aave.com</em>,{' '}
                        <em className="text-white">risk.aave.com</em>, and
                        ecosystem subdomains strictly under DAO-approved rules
                        and execution parameters.
                      </>
                    ) : (
                      feature.description
                    )}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-5 py-20 sm:px-8 md:py-28 xl:px-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-16 md:mb-20">
              <SectionLabel>EXECUTION PATH</SectionLabel>
              <h2
                className={cn(
                  'mt-6 text-[2.3rem] tracking-[-0.02em] md:text-[3.5rem]',
                  '[font-family:var(--font-aave-display)]',
                )}
              >
                How It Works
              </h2>
            </div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-white/15 md:hidden" />
              <div className="absolute left-0 right-0 top-6 hidden h-px bg-white/15 md:block" />

              <div className="grid gap-14 md:grid-cols-3 md:gap-8">
                {STEPS.map((step) => (
                  <article
                    key={step.numeral}
                    className="relative pl-[4.5rem] md:pl-0 md:pr-10"
                  >
                    <div
                      className={cn(
                        'absolute left-0 top-0 flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-white/15 bg-[#0a0a0f] text-sm transition-all duration-300 hover:border-[#E51E56] hover:text-[#E51E56] hover:shadow-[0_0_20px_rgba(229,30,86,0.4)] md:relative md:mb-8 md:left-auto md:top-auto',
                        '[font-family:var(--font-aave-mono)]',
                      )}
                    >
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-white/15" />
                      <span className="relative z-10">{step.numeral}</span>
                    </div>

                    <h3
                      className={cn(
                        'text-[0.9rem] uppercase tracking-[0.08em] text-white',
                        '[font-family:var(--font-aave-mono)]',
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[0.98rem] leading-7 text-[#8A8A9B]">
                      {step.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.06] px-5 py-28 text-center sm:px-8 md:py-40 xl:px-10">
          <div
            aria-hidden={true}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(123,34,171,0.15)_0%,transparent_70%)]"
          />

          <div className="relative mx-auto flex max-w-[1400px] flex-col items-center">
            <div className="relative">
              <FrameCorners />
              <h2
                className={cn(
                  'max-w-[820px] text-[3rem] leading-[1.02] tracking-[-0.02em] text-balance md:text-[4.5rem]',
                  '[font-family:var(--font-aave-display)]',
                )}
              >
                Make aave.com as decentralized as Aave.
              </h2>
            </div>

            <a
              href="mailto:support@namefi.io?subject=Bring%20Aave%20DNS%20Onchain"
              className={cn(
                'group relative mt-12 inline-flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#E51E56,#7B22AB)] px-8 py-5 text-sm uppercase tracking-[0.14em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(229,30,86,0.3)]',
                '[font-family:var(--font-aave-mono)]',
              )}
            >
              <span className="relative z-10">Bring Aave DNS Onchain</span>
            </a>
          </div>

          <div
            className={cn(
              'pointer-events-none absolute bottom-5 left-5 text-left text-[0.65rem] uppercase tracking-[0.14em] text-white/25 sm:left-10',
              '[font-family:var(--font-aave-mono)]',
            )}
          >
            <div>{'// END OF TRANSMISSION'}</div>
            <div>{'// ENSURE SECURE CONNECTION'}</div>
          </div>
        </section>
      </div>
    </div>
  );
};

Landing.displayName = 'AaveLanding';
