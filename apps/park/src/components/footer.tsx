'use client';

import type { SVGProps } from 'react';
import { ArrowUpRight, MessageCircle, Send } from 'lucide-react';
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
import { cn } from '@/lib/cn';
import { getPoweredByNamefiApex } from '@/lib/theme';

type BrandIconProps = SVGProps<SVGSVGElement>;

function XBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26L23 21.75h-6.74l-5.28-6.79-5.94 6.79H1.73l7.73-8.835L1 2.25h6.91l4.77 6.231zm-1.161 17.52h1.833L6.915 4.126H4.949z" />
    </svg>
  );
}

function GitHubBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .297C5.373.297 0 5.67 0 12.297c0 5.302 3.438 9.8 8.205 11.387.6.111.82-.258.82-.577 0-.285-.01-1.04-.016-2.042-3.338.726-4.042-1.61-4.042-1.61-.547-1.387-1.334-1.757-1.334-1.757-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.107-.775.418-1.305.761-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.311.469-2.382 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.49 11.49 0 0 1 3.006-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.839 1.234 1.91 1.234 3.221 0 4.61-2.804 5.624-5.474 5.921.43.37.814 1.096.814 2.21 0 1.595-.014 2.881-.014 3.273 0 .321.216.694.824.576C20.565 22.092 24 17.594 24 12.297 24 5.67 18.627.297 12 .297Z" />
    </svg>
  );
}

function LinkedInBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452H16.89V14.87c0-1.332-.024-3.045-1.857-3.045-1.859 0-2.143 1.45-2.143 2.95v5.677H9.333V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  );
}

function YouTubeBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.5 6.186a2.996 2.996 0 0 0-2.11-2.12C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.389.566A2.997 2.997 0 0 0 .5 6.186 31.09 31.09 0 0 0 0 12c0 1.966.168 3.906.5 5.814a2.997 2.997 0 0 0 2.111 2.12C4.47 20.5 12 20.5 12 20.5s7.53 0 9.389-.566a2.996 2.996 0 0 0 2.11-2.12c.332-1.908.5-3.848.5-5.814 0-1.966-.168-3.906-.5-5.814ZM9.75 15.568V8.432L15.818 12z" />
    </svg>
  );
}

export type FooterProps = HTMLAttributes<HTMLDivElement> & {
  frontendBaseUrl?: string;
  pbnApex?: string | null;
};

const YEAR = new Date().getFullYear();
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
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

const SOCIAL_LINKS = [
  {
    name: 'Discord',
    href: 'https://discord.gg/PKW52TXS',
    icon: MessageCircle,
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
    icon: Send,
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
      { label: 'Discover Domains', href: '/' },
      { label: 'AI Brand Generator', href: '/ai-brand-generator' },
      { label: 'Domain Hunt', href: '/hunt' },
      {
        label: 'Newsletter',
        href: '/newsletter',
        external: true,
      },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Domains', href: '/domains' },
      { label: 'My Wishlist', href: '/wishlist' },
      { label: 'My Orders', href: '/orders' },
      { label: 'Payment Methods', href: '/payment-methods' },
      { label: 'Manage DNS', href: '/manage' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Abuse Reporting', href: '/abuse' },
      { label: 'Education Hub', href: '/education' },
      { label: 'Registration Agreement', href: '/registration-agreement' },
      {
        label: 'Support',
        href: 'mailto:support@namefi.io',
        external: true,
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
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-6">
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
              Namefi is an ICANN-accredited registrar that tokenizes DNS
              ownership so you can register, trade, and build with AI tooling
              and onchain security.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                  aria-label={name}
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
                    {(() => {
                      const resolvedHref = URL_PROTOCOL_PATTERN.test(href)
                        ? href
                        : buildHrefFromBase(href, resolvedFrontendBaseUrl);
                      return (
                        <Link
                          href={resolvedHref}
                          target={external ? '_blank' : undefined}
                          rel={external ? 'noreferrer noopener' : undefined}
                          className="group inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                        >
                          <span>{label}</span>
                          {external && (
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                          )}
                        </Link>
                      );
                    })()}
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
              href={buildHrefFromBase('/tos', resolvedFrontendBaseUrl)}
              className="text-white/70 transition hover:text-white"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
