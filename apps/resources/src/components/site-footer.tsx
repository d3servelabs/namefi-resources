'use client';

import {
  DiscordBrandIcon,
  GitHubBrandIcon,
  LinkedInBrandIcon,
  TelegramBrandIcon,
  XBrandIcon,
  YouTubeBrandIcon,
} from '@namefi-astra/ui/components/namefi/brand-icons';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { OPEN_COOKIE_SETTINGS_EVENT } from './providers/cookie-consent-event';

// The resources app is a separate Next.js app served under namefi.io/r. It
// cannot use the main app's typed internal routes, so every footer link is an
// absolute namefi.io URL. The content mirrors the main site footer
// (apps/frontend/src/components/footer.tsx) for parity — keep the two in sync.
const NAMEFI_URL = 'https://namefi.io';
const LLMS_TXT_URL = `${NAMEFI_URL}/llms.txt`;
const NAMEFI_API_DOCS_URL = 'https://api.namefi.io/v-next/openapi/doc';

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
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    title: 'Explore',
    links: [
      { label: 'Discover Domains', href: `${NAMEFI_URL}/` },
      {
        label: 'Namefi Brand Studio',
        href: `${NAMEFI_URL}/features/brand-studio`,
      },
      { label: 'Namefi Feed', href: `${NAMEFI_URL}/features/feed` },
      { label: 'Namefi Outbound', href: `${NAMEFI_URL}/features/outbound` },
      { label: 'Domain Hunt', href: `${NAMEFI_URL}/hunt` },
      { label: 'Newsletter', href: `${NAMEFI_URL}/newsletter` },
      { label: 'Flush DNS', href: `${NAMEFI_URL}/dns-cache` },
      { label: 'NFSC Faucet (sandbox)', href: `${NAMEFI_URL}/faucet` },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Domains', href: `${NAMEFI_URL}/domains` },
      { label: 'My Wishlist', href: `${NAMEFI_URL}/wishlist` },
      { label: 'My Orders', href: `${NAMEFI_URL}/orders` },
      { label: 'Payment Methods', href: `${NAMEFI_URL}/payment-methods` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: `${NAMEFI_URL}/r/en/blog` },
      { label: 'Watch', href: `${NAMEFI_URL}/r/en/watch` },
      { label: 'Careers', href: `${NAMEFI_URL}/r/en/careers` },
      { label: 'TLDs', href: `${NAMEFI_URL}/r/en/tld` },
      { label: 'Partners', href: `${NAMEFI_URL}/r/en/partners` },
      { label: 'Glossary', href: `${NAMEFI_URL}/r/en/glossary` },
      { label: 'How We Hire', href: `${NAMEFI_URL}/r/en/careers/how-we-hire` },
      { label: 'Abuse Reporting', href: `${NAMEFI_URL}/abuse` },
      { label: 'Education Hub', href: `${NAMEFI_URL}/education` },
      {
        label: 'Registration Agreement',
        href: `${NAMEFI_URL}/registration-agreement`,
      },
      {
        label: 'Namefi API Docs',
        href: NAMEFI_API_DOCS_URL,
        external: true,
      },
      {
        label: 'API for LLM AI Agents',
        href: LLMS_TXT_URL,
        external: true,
      },
      {
        label: 'Support',
        href: 'mailto:support@namefi.io',
        external: true,
      },
    ],
  },
  {
    title: 'FAQ',
    links: [
      { label: 'About Namefi', href: `${NAMEFI_URL}/r/en` },
      {
        label: 'What is a Domain?',
        href: `${NAMEFI_URL}/r/en/blog/what-is-domain`,
      },
      {
        label: 'What are Tokenized Domains?',
        href: `${NAMEFI_URL}/r/en/blog/what-are-tokenized-domains`,
      },
      {
        label: 'Why Tokenize Domains?',
        href: `${NAMEFI_URL}/r/en/blog/why-tokenize-domains`,
      },
      {
        label: 'DNS on Tokenized Domains',
        href: `${NAMEFI_URL}/r/en/blog/dns-on-tokenized-domains`,
      },
      {
        label: 'DNS is the Control Plane',
        href: `${NAMEFI_URL}/r/en/blog/dns-is-the-control-plane`,
      },
      {
        label: 'How to Tokenize Your .com',
        href: `${NAMEFI_URL}/r/en/blog/how-to-tokenize-your-com`,
      },
      {
        label: 'Tokenized Domain vs Web3 Domain',
        href: `${NAMEFI_URL}/r/en/blog/tokenized-domain-vs-web3-domain`,
      },
    ],
  },
];

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-background/90 py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-12 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div className="col-span-2 space-y-6 sm:col-span-1">
            <Image
              src="/r/logotype.svg"
              alt="Namefi"
              width={132}
              height={43}
              className="h-auto w-40"
              priority={false}
            />
            <p className="max-w-md text-sm text-muted-foreground">
              Namefi is an ICANN Accredited Registrar tokenizing internet domain
              names for trading, DeFi and future of Internet.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                {section.title}
              </h3>
              <ul className="space-y-3 text-sm">
                {section.links.map(({ label, href, external }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer noopener' : undefined}
                      className="group inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                    >
                      <span>{label}</span>
                      {external && (
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/60">
          <p className="text-white/70">
            Use{' '}
            <Link
              href={LLMS_TXT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-white underline underline-offset-4 transition hover:text-white/80"
            >
              llms.txt
            </Link>{' '}
            if you are an LLM agent such as Claude Code, Codex, OpenClaw,
            Hermes, Cursor, OpenCode and any other AI agent.
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <span>© {YEAR} D3SERVE LABS, Inc. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="text-white/70 transition hover:text-white"
                aria-label="Open cookie settings dialog"
                onClick={() =>
                  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
                }
              >
                Cookie Settings
              </button>
              <Link
                href={`${NAMEFI_URL}/tos`}
                className="text-white/70 transition hover:text-white"
                target="_blank"
                rel="noreferrer noopener"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
