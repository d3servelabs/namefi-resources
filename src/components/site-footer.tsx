'use client';

import {
  ArrowUpRight,
  Github,
  Linkedin,
  MessageCircle,
  Send,
  TwitterIcon,
  Youtube,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCookieConsent } from '@/components/providers/cookie-consent';

const SOCIAL_LINKS = [
  {
    name: 'Discord',
    href: 'https://discord.gg/PKW52TXS',
    icon: MessageCircle,
  },
  {
    name: 'Twitter / X',
    href: 'https://twitter.com/namefi_io',
    icon: TwitterIcon,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/d3servelabs',
    icon: Github,
  },
  {
    name: 'Telegram',
    href: 'https://t.me/namefidao',
    icon: Send,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/d3servelabs',
    icon: Linkedin,
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@Namefi_io',
    icon: Youtube,
  },
] as const;

const FOOTER_SECTIONS: Array<{
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    title: 'Explore',
    links: [
      { label: 'Discover Domains', href: 'https://namefi.io/' },
      {
        label: 'AI Brand Generator',
        href: 'https://namefi.io/ai-brand-generator',
      },
      { label: 'Domain Hunt', href: 'https://namefi.io/hunt' },
      { label: 'Newsletter', href: 'https://namefi.io/newsletter' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Domains', href: 'https://namefi.io/domains' },
      { label: 'My Wishlist', href: 'https://namefi.io/wishlist' },
      { label: 'My Orders', href: 'https://namefi.io/orders' },
      { label: 'Payment Methods', href: 'https://namefi.io/payment-methods' },
      { label: 'Manage DNS', href: 'https://namefi.io/manage' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Abuse Reporting', href: 'https://namefi.io/abuse' },
      { label: 'Education Hub', href: 'https://namefi.io/education' },
      {
        label: 'Registration Agreement',
        href: 'https://namefi.io/registration-agreement',
      },
      {
        label: 'Support',
        href: 'mailto:support@namefi.io',
        external: true,
      },
    ],
  },
];

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  const { openConsent } = useCookieConsent();

  return (
    <footer className="border-t border-white/10 bg-background/90 py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-6">
            <Image
              src="/r/logotype.svg"
              alt="Namefi"
              width={132}
              height={43}
              className="h-auto w-40"
              priority={false}
            />
            <p className="max-w-md text-sm text-muted-foreground">
              Namefi is an ICANN-accredited registrar bringing onchain security
              and AI tooling to modern domain operations. Explore insights,
              updates, and best practices from the Namefi team.
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
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {section.links.map(({ label, href, external }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer noopener' : undefined}
                      className="group inline-flex items-center gap-1 transition hover:text-foreground"
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

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <span>© {YEAR} D3SERVE LABS, Inc. All rights reserved.</span>
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
              href="https://namefi.io/tos"
              className="text-white/70 transition hover:text-white"
              target="_blank"
              rel="noreferrer noopener"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
