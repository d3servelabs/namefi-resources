'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
} from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/config';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { useOrigin } from '@/components/providers/origin';
import { useConsentManager } from '@c15t/nextjs';
import {
  DiscordBrandIcon,
  GitHubBrandIcon,
  LinkedInBrandIcon,
  TelegramBrandIcon,
  XBrandIcon,
  YouTubeBrandIcon,
} from '@namefi-astra/ui/components/namefi/brand-icons';

export type FooterProps = HTMLAttributes<HTMLDivElement>;

const YEAR = new Date().getFullYear();
const LLMS_TXT_URL = 'https://namefi.io/llms.txt';

/**
 * Maps an app locale to the resources app's locale (`/r/<lang>/…`). The
 * resources site supports `en, es, de, fr, zh, ar, hi`; locales without a
 * resources translation fall back to English so links never 404.
 */
const RESOURCES_LOCALE: Record<Locale, string> = {
  en: 'en',
  zh: 'zh',
  ta: 'en',
  'ar-EG': 'ar',
};

/**
 * Point a resources **blog** link at the reader's language. Only `/r/en/blog…`
 * links are localized (blog content is translated per-language in the resources
 * app); other resource pages stay on `/r/en` to avoid 404s on untranslated
 * routes. A no-op for non-blog hrefs.
 */
function localizeBlogHref(href: string, locale: Locale): string {
  if (!href.startsWith('/r/en/blog')) return href;
  const resourcesLocale = RESOURCES_LOCALE[locale] ?? 'en';
  return `/r/${resourcesLocale}${href.slice('/r/en'.length)}`;
}
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

/**
 * Footer navigation structure. Routes/hrefs and external/description hints stay
 * here as stable data; user-visible section titles and link labels are resolved
 * at render time via `t('sections.<sectionKey>.title' | '...links.<labelKey>')`
 * so they can be localized. `sectionKey`/`labelKey` are i18n keys, not copy.
 */
const FOOTER_SECTIONS: Array<{
  sectionKey: string;
  links: Array<{
    labelKey: string;
    href: Route | string;
    external?: boolean;
    description?: string;
  }>;
}> = [
  {
    sectionKey: 'explore',
    links: [
      { labelKey: 'discoverDomains', href: '/' },
      { labelKey: 'brandStudio', href: '/features/brand-studio' },
      { labelKey: 'feed', href: '/features/feed' },
      { labelKey: 'outbound', href: '/features/outbound' },
      { labelKey: 'domainHunt', href: '/hunt' },
      { labelKey: 'newsletter', href: '/newsletter' },
      { labelKey: 'flushDns', href: '/dns-cache' },
      { labelKey: 'faucet', href: '/faucet' },
    ],
  },
  {
    sectionKey: 'account',
    links: [
      { labelKey: 'myDomains', href: '/domains' },
      { labelKey: 'myWishlist', href: '/wishlist' },
      { labelKey: 'myOrders', href: '/orders' },
      { labelKey: 'paymentMethods', href: '/payment-methods' },
    ],
  },
  {
    sectionKey: 'resources',
    links: [
      { labelKey: 'blog', href: '/r/en/blog' },
      { labelKey: 'watch', href: '/r/en/watch' },
      { labelKey: 'careers', href: '/r/en/careers' },
      { labelKey: 'tlds', href: '/r/en/tld' },
      { labelKey: 'partners', href: '/r/en/partners' },
      { labelKey: 'glossary', href: '/r/en/glossary' },
      { labelKey: 'howWeHire', href: '/r/en/careers/how-we-hire' },
      { labelKey: 'abuseReporting', href: '/abuse' },
      { labelKey: 'educationHub', href: '/education' },
      { labelKey: 'registrationAgreement', href: '/registration-agreement' },
      {
        labelKey: 'apiDocs',
        href: NAMEFI_API_DOCS_URL,
        external: true,
        description: `Namefi API reference ${NAMEFI_API_DOCS_URL}`,
      },
      {
        labelKey: 'llmApi',
        href: LLMS_TXT_URL,
        external: true,
        description: `For LLM AI agents visit ${LLMS_TXT_URL}`,
      },
      {
        labelKey: 'support',
        href: 'mailto:support@namefi.io',
        external: true,
      },
    ],
  },
  {
    sectionKey: 'faq',
    links: [
      { labelKey: 'aboutNamefi', href: '/r/en' },
      { labelKey: 'whatIsDomain', href: '/r/en/blog/what-is-domain' },
      {
        labelKey: 'whatAreTokenizedDomains',
        href: '/r/en/blog/what-are-tokenized-domains',
      },
      {
        labelKey: 'whyTokenizeDomains',
        href: '/r/en/blog/why-tokenize-domains',
      },
      {
        labelKey: 'dnsOnTokenizedDomains',
        href: '/r/en/blog/dns-on-tokenized-domains',
      },
      {
        labelKey: 'dnsIsControlPlane',
        href: '/r/en/blog/dns-is-the-control-plane',
      },
      {
        labelKey: 'howToTokenizeCom',
        href: '/r/en/blog/how-to-tokenize-your-com',
      },
      {
        labelKey: 'tokenizedVsWeb3',
        href: '/r/en/blog/tokenized-domain-vs-web3-domain',
      },
    ],
  },
];

export const Footer: ForwardRefExoticComponent<FooterProps> = forwardRef<
  HTMLDivElement,
  FooterProps
>(function Footer(
  { className, ...rest }: FooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const t = useTranslations('footer');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;
  const locale = useLocale();
  const { setActiveUI } = useConsentManager();
  const origin = useOrigin();
  const isAstra = origin?.isFirstPartyOrigin ?? false;

  const logo = isAstra
    ? {
        src: '/logotype.svg',
        alt: 'Namefi Astra',
        width: 132,
        height: 43,
        className: 'w-40',
      }
    : {
        src: '/powered-by-namefi.svg',
        alt: 'Powered by Namefi',
        width: 127,
        height: 24,
        className: 'w-36',
      };

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
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className={cn('h-auto', logo.className)}
              />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              {t('disclaimer')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                  aria-label={name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.sectionKey} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                {tDynamic(`sections.${section.sectionKey}.title`)}
              </h3>
              <ul className="space-y-3 text-sm">
                {section.links.map(
                  ({ labelKey, href, external, description }) => {
                    const label = tDynamic(
                      `sections.${section.sectionKey}.links.${labelKey}`,
                    );
                    return (
                      <li key={labelKey}>
                        {external ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="group inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                            {...(description
                              ? { 'aria-description': description }
                              : {})}
                          >
                            <span>{label}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                          </a>
                        ) : (
                          <Link
                            href={localizeBlogHref(href, locale) as Route}
                            className="group inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                          >
                            <span>{label}</span>
                          </Link>
                        )}
                      </li>
                    );
                  },
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/60">
          <p className="text-white/70">
            {t.rich('llmsTxt', {
              link: (chunks) => (
                <a
                  href={LLMS_TXT_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-white underline underline-offset-4 transition hover:text-white/80"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <span>{t('copyright', { year: YEAR })}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <LanguageSelector />
              <button
                type="button"
                className="text-white/70 transition hover:text-white"
                aria-label={t('cookieSettingsAriaLabel')}
                onClick={() => setActiveUI('dialog', { force: true })}
              >
                {t('cookieSettings')}
              </button>
              <Link
                href="/tos"
                className="text-white/70 transition hover:text-white"
              >
                {t('termsAndConditions')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
