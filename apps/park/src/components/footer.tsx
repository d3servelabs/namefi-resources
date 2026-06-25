'use client';

import {
  DiscordBrandIcon,
  GitHubBrandIcon,
  LinkedInBrandIcon,
  TelegramBrandIcon,
  XBrandIcon,
  YouTubeBrandIcon,
} from '@namefi-astra/ui/components/namefi/brand-icons';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  type ForwardedRef,
  type ForwardRefExoticComponent,
  forwardRef,
  type HTMLAttributes,
} from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { useOrigin } from '@/hooks/use-origin';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getPoweredByNamefiApex } from '@/lib/theme';

export type FooterProps = HTMLAttributes<HTMLDivElement> & {
  frontendBaseUrl?: string;
  pbnApex?: string | null;
};

const YEAR = new Date().getFullYear();

// Build version stamp, inlined at build time via next.config `env`.
const BUILD_VERSION = process.env.BUILD_VERSION ?? 'unknown';
const BUILD_COMMIT_SHA = process.env.BUILD_COMMIT_SHA ?? 'unknown';
const BUILD_COMMIT_DATE = process.env.BUILD_COMMIT_DATE ?? 'unknown';
const BUILD_COMMIT_URL = process.env.BUILD_COMMIT_URL ?? '';

const LLMS_TXT_URL = 'https://namefi.io/llms.txt';
const BRAND_KIT_URL = 'https://namefi.io/brand-kit';
const NAMEFI_API_DOCS_URL = 'https://api.namefi.io/v-next/openapi/doc';

const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+\-.]*:/i;

// Hosts we own — outbound links to these keep SEO link equity (no `nofollow`).
const FIRST_PARTY_HOSTS = ['namefi.io', 'd3serve.xyz'];
const DEFAULT_PBN_LOGO = {
  src: '/powered-by-namefi.svg',
  alt: 'Powered by Namefi',
  width: 127,
  height: 24,
  className: 'w-36',
} as const;

const PBN_FOOTER_LOGOS = {
  '0x.city': {
    src: '/assets/pbn/powered-by-namefi-0xcity.svg',
    alt: 'Powered by Namefi x 0x.city',
    width: 104,
    height: 40,
    className: 'w-32',
  },
} as const;

function buildHrefFromBase(pathname: string, baseUrl: string): string {
  return new URL(pathname, baseUrl).toString();
}

/**
 * `rel` for an outbound `target="_blank"` link. Always at least `noopener`
 * (severs `window.opener`); adds `nofollow` for non-first-party http(s) hosts so
 * search engines don't treat our outbound citations as endorsements. Mirrors the
 * frontend footer's `getExternalLinkRel`. Intentionally omits `noreferrer` so
 * destinations still see namefi.io as the traffic source.
 */
function getExternalLinkRel(href: string): string {
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return 'noopener';
    const host = url.hostname.toLowerCase();
    const isFirstParty = FIRST_PARTY_HOSTS.some(
      (entry) => host === entry || host.endsWith(`.${entry}`),
    );
    return isFirstParty ? 'noopener' : 'noopener nofollow';
  } catch {
    return 'noopener';
  }
}

const SOCIAL_LINKS = [
  {
    name: 'Discord',
    href: 'https://discord.gg/PKW52TXS',
    icon: DiscordBrandIcon,
  },
  {
    name: 'Twitter / X',
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
] as const;

const FOOTER_SECTIONS: Array<{
  title: string;
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
    /** Shown only on first-party origins; hidden on parked third-party domains. */
    homepageOnly?: boolean;
  }>;
}> = [
  {
    title: 'Explore',
    links: [
      { label: 'Discover Domains', href: '/' },
      { label: 'Namefi Brand Studio', href: '/features/brand-studio' },
      { label: 'Namefi Feed', href: '/features/feed' },
      { label: 'Namefi Outbound', href: '/features/outbound' },
      { label: 'Domain Hunt', href: '/hunt' },
      { label: 'Newsletter', href: '/newsletter' },
    ],
  },
  {
    // Namefi Resources topic clusters (pillars) — evergreen hub pages.
    title: 'Topics',
    links: [
      {
        label: 'Domain Tokenization',
        href: '/r/en/topics/domain-tokenization',
      },
      { label: 'Domain Basics', href: '/r/en/topics/domain-basics' },
      {
        label: 'Domain Security & Recovery',
        href: '/r/en/topics/domain-security',
      },
      { label: 'Choosing a TLD', href: '/r/en/topics/choosing-a-tld' },
      {
        label: 'Domain Investing & Industry',
        href: '/r/en/topics/domain-investing',
      },
      {
        label: 'Web3 & Crypto Foundations',
        href: '/r/en/topics/web3-foundations',
      },
      { label: 'All Topics', href: '/r/en/topics' },
    ],
  },
  {
    // Namefi Resources editorial series — sequential, branded story arcs.
    title: 'Series',
    links: [
      { label: 'Domain Apocalypse', href: '/r/en/series/domain-apocalypse' },
      {
        label: 'Name Change, Game Change',
        href: '/r/en/series/name-change-game-change',
      },
      { label: 'Tokenize Your .com', href: '/r/en/series/tokenize-your-com' },
      {
        label: 'Best TLDs for Your Industry',
        href: '/r/en/series/best-tlds-by-industry',
      },
      {
        label: "Domain Investor's Field Guide",
        href: '/r/en/series/domain-investor-field-guide',
      },
      {
        label: 'Domain Flipping Skills',
        href: '/r/en/series/domain-flipping-skills',
      },
      { label: 'All Series', href: '/r/en/series' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/r/en/blog' },
      { label: 'Watch', href: '/r/en/watch' },
      { label: 'Careers', href: '/r/en/careers' },
      { label: 'TLDs', href: '/r/en/tld' },
      { label: 'Partners', href: '/r/en/partners', homepageOnly: true },
      { label: 'Glossary', href: '/r/en/glossary' },
      { label: 'How We Hire', href: '/r/en/careers/how-we-hire' },
      { label: 'Education Hub', href: '/education', homepageOnly: true },
      { label: 'Brand Kit', href: BRAND_KIT_URL },
      { label: 'Namefi API Docs', href: NAMEFI_API_DOCS_URL, external: true },
      { label: 'API for LLM AI Agents', href: LLMS_TXT_URL, external: true },
      { label: 'Support', href: 'mailto:support@namefi.io', external: true },
    ],
  },
  {
    title: 'FAQ',
    links: [
      { label: 'About Namefi', href: '/r/en' },
      { label: 'What is a Domain?', href: '/r/en/blog/what-is-domain' },
      {
        label: 'What are Tokenized Domains?',
        href: '/r/en/blog/what-are-tokenized-domains',
      },
      {
        label: 'Why Tokenize Domains?',
        href: '/r/en/blog/why-tokenize-domains',
      },
      {
        label: 'DNS on Tokenized Domains',
        href: '/r/en/blog/dns-on-tokenized-domains',
      },
      {
        label: 'DNS is the Control Plane',
        href: '/r/en/blog/dns-is-the-control-plane',
      },
      {
        label: 'How to Tokenize Your .com',
        href: '/r/en/blog/how-to-tokenize-your-com',
      },
      {
        label: 'Tokenized Domain vs Web3 Domain',
        href: '/r/en/blog/tokenized-domain-vs-web3-domain',
      },
    ],
  },
];

export const Footer: ForwardRefExoticComponent<FooterProps> = forwardRef<
  HTMLDivElement,
  FooterProps
>(function Footer(
  { className, frontendBaseUrl, pbnApex, ...rest }: FooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { openConsent } = useCookieConsent();
  const origin = useOrigin();
  const isAstra = origin?.isFirstPartyOrigin ?? false;
  // Park is a single landing page, so it is always the "homepage". Mirror the
  // frontend footer: only surface first-party/internal links (Partners,
  // Education Hub) on first-party origins, hiding them on parked third-party
  // domains.
  const showHomepageOnlyLinks = isAstra;
  const resolvedPbnApex =
    pbnApex ?? getPoweredByNamefiApex(origin?.hostname ?? null);
  const resolvedFrontendBaseUrl = frontendBaseUrl ?? 'https://namefi.io';
  const pbnLogo = resolvedPbnApex
    ? (PBN_FOOTER_LOGOS[resolvedPbnApex as keyof typeof PBN_FOOTER_LOGOS] ??
      null)
    : null;

  const logo = pbnLogo
    ? pbnLogo
    : resolvedPbnApex
      ? DEFAULT_PBN_LOGO
      : isAstra
        ? {
            src: '/logotype.svg',
            alt: 'Namefi Astra',
            width: 132,
            height: 43,
            className: 'w-40',
          }
        : DEFAULT_PBN_LOGO;

  return (
    <footer
      ref={ref}
      className={cn(
        'w-full border-t border-white/10 bg-background/90 py-16 md:py-24',
        className,
      )}
      {...rest}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] lg:gap-x-8">
          <div className="col-span-2 space-y-6 sm:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className={cn('h-auto', logo.className)}
                priority={false}
              />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Namefi is an ICANN Accredited Registrar tokenizing internet domain
              names for trading, DeFi and future of Internet.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel={getExternalLinkRel(href)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                  aria-label={name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => {
            const links = showHomepageOnlyLinks
              ? section.links
              : section.links.filter((link) => !link.homepageOnly);

            return (
              <div key={section.title} className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                  {section.title}
                </h3>
                <ul className="space-y-3 text-sm">
                  {links.map(({ label, href, external }) => {
                    const resolvedHref = URL_PROTOCOL_PATTERN.test(href)
                      ? href
                      : buildHrefFromBase(href, resolvedFrontendBaseUrl);
                    return (
                      <li key={label}>
                        {external ? (
                          <a
                            href={resolvedHref}
                            target="_blank"
                            rel={getExternalLinkRel(resolvedHref)}
                            className="group inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                          >
                            <span>{label}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                          </a>
                        ) : (
                          <Link
                            href={resolvedHref}
                            className="group inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                          >
                            <span>{label}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/60">
          <p className="text-white/70">
            Use{' '}
            <a
              href={LLMS_TXT_URL}
              target="_blank"
              rel={getExternalLinkRel(LLMS_TXT_URL)}
              className="font-medium text-white underline underline-offset-4 transition hover:text-white/80"
            >
              llms.txt
            </a>{' '}
            if you are an LLM agent such as Claude Code, Codex, OpenClaw,
            Hermes, Cursor, OpenCode and any other AI agent.
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <span>© {YEAR} D3SERVE LABS, Inc. All rights reserved.</span>
              {BUILD_COMMIT_URL ? (
                <a
                  href={BUILD_COMMIT_URL}
                  target="_blank"
                  rel={getExternalLinkRel(BUILD_COMMIT_URL)}
                  className="font-mono text-xs text-white/40 transition hover:text-white/70"
                >
                  v{BUILD_VERSION}-{BUILD_COMMIT_SHA}-{BUILD_COMMIT_DATE}
                </a>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="text-white/70 transition hover:text-white"
                aria-label="Open cookie settings dialog"
                onClick={openConsent}
              >
                Cookie Settings
              </button>
              <Link
                href={buildHrefFromBase('/tos', resolvedFrontendBaseUrl)}
                className="text-white/70 transition hover:text-white"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
