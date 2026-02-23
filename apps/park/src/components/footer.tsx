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
