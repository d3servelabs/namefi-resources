'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import type { Route } from 'next';
import NextImage from 'next/image';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { type CSSProperties, useEffect, useState } from 'react';
import {
  getMlsDomainDisplayParts,
  getMlsDomainMark,
} from '@/components/mls/mls-domain-display';
import { MlsReportListingDialog } from '@/components/mls/mls-report-listing-dialog';
import {
  buildMlsSaleCardFallbackTheme,
  buildMlsSaleCardThemeFromRgb,
  extractDominantColorFromImage,
  type MlsSaleCardTheme,
} from '@/components/mls/mls-sale-card-theme';
import { MlsSellerTierBadge } from '@/components/mls/mls-seller-tier-badge';
import {
  getMlsListingSellerDomainCount,
  getMlsSellerTier,
  type MlsSellerTier,
  getMlsSellerTierDomainCount,
} from '@namefi-astra/common/mls-seller-tiers';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import { resolveMlsListingSource, type MlsSaleListing } from '@/lib/mls/feed';
import { getMlsHandlePath, normalizeMlsHandle } from '@/lib/mls/handles';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});
const THREE_DAYS_IN_MS = 72 * 60 * 60 * 1000;
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
});
const mlsSaleCardThemeCache = new Map<string, MlsSaleCardTheme>();

interface MlsSaleCardProps {
  listing: MlsSaleListing;
  showOtherDomainsCount?: boolean;
  showSellerTierBadge?: boolean;
}

export function MlsSaleCard({
  listing,
  showOtherDomainsCount = true,
  showSellerTierBadge = true,
}: MlsSaleCardProps) {
  const sellerHandle = normalizeMlsHandle(listing.seller.username);
  const sellerDisplayName = listing.seller.displayName?.trim() || null;
  const sellerLabel = sellerHandle ?? sellerDisplayName ?? '@unknown';
  const source = resolveMlsListingSource(listing);
  const sellerDetailsPath = sellerHandle
    ? getMlsHandlePath(source.id, sellerHandle)
    : null;
  const domainUrl = getDomainUrl(listing.domain);
  const logoUrl = normalizeExternalUrl(listing.logoUrl);
  const askingCurrency = normalizeCurrency(listing.askingCurrency);
  const askingPriceLabel = formatAskingPrice(
    listing.askingPrice,
    askingCurrency,
  );
  const postedLabel = formatPostedLabel(listing.postedAt);
  const excerpt = formatExcerpt(listing.messageText);
  const domainParts = getMlsDomainDisplayParts(listing.domain);
  const otherDomainsCount = Math.max(0, listing.otherDomainsCount);
  const sellerTier = getListingSellerTier({
    listing,
    sellerHandle,
    showSellerTierBadge,
  });
  const theme = useMlsSaleCardTheme(
    logoUrl,
    `${listing.domain}:${sellerLabel}`,
  );
  const cardStyle = {
    '--mls-accent': theme.accent,
    '--mls-accent-muted': theme.accentMuted,
    '--mls-accent-soft': theme.accentSoft,
    '--mls-accent-glow': theme.accentGlow,
    '--mls-accent-line': theme.accentLine,
    '--mls-accent-shadow': theme.shadow,
  } as CSSProperties;

  return (
    <Card
      className="group relative overflow-hidden rounded-none border-b border-white/10 bg-transparent shadow-none !py-0 !ring-0"
      style={cardStyle}
    >
      <div
        aria-hidden={true}
        className="pointer-events-none absolute left-2 top-1/2 size-28 -translate-y-1/2 rounded-full opacity-70 blur-3xl transition-opacity duration-300 group-hover:opacity-90"
        style={{
          background:
            'radial-gradient(circle, var(--mls-accent-glow) 0%, transparent 72%)',
        }}
      />

      <CardContent className="relative px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/35 sm:text-sm">
          {sellerDetailsPath ? (
            <Link
              href={sellerDetailsPath as Route}
              className="truncate font-semibold text-white/52 transition-colors hover:text-[var(--mls-accent-muted)] hover:underline"
            >
              {sellerLabel}
            </Link>
          ) : (
            <p className="truncate font-semibold text-white/52">
              {sellerLabel}
            </p>
          )}
          <MlsSaleCardSellerTierBadge tier={sellerTier} />
          <span aria-hidden={true}>•</span>
          <time className="shrink-0" dateTime={listing.postedAt}>
            {postedLabel}
          </time>
          {showOtherDomainsCount && otherDomainsCount > 0 ? (
            <>
              <span aria-hidden={true}>•</span>
              {sellerDetailsPath ? (
                <Link
                  href={sellerDetailsPath as Route}
                  className="transition-colors hover:text-white/55 hover:underline"
                >
                  {otherDomainsCount.toLocaleString()} other{' '}
                  {otherDomainsCount === 1 ? 'domain' : 'domains'}
                </Link>
              ) : (
                <span>
                  {otherDomainsCount.toLocaleString()} other{' '}
                  {otherDomainsCount === 1 ? 'domain' : 'domains'}
                </span>
              )}
            </>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-4">
            <MlsSaleCardLogo
              domain={listing.domain}
              label={domainParts.label}
              logoUrl={logoUrl}
              theme={theme}
            />

            <a
              href={domainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex flex-wrap items-baseline gap-1.5 no-underline"
              aria-label={`Open ${domainParts.full}`}
              title={domainParts.full}
            >
              <h2
                className={cn(
                  playfairDisplay.className,
                  'min-w-0 break-all text-4xl leading-none text-white sm:text-[2.9rem]',
                )}
              >
                {domainParts.label}
              </h2>
              {domainParts.tld ? (
                <span
                  className="font-sans text-[1.6rem] leading-none font-medium sm:text-[1.95rem]"
                  style={{ color: theme.accentMuted }}
                >
                  .{domainParts.tld}
                </span>
              ) : null}
            </a>
          </div>

          {askingPriceLabel ? (
            <div className="shrink-0 text-left sm:text-right">
              <p
                className="text-lg font-semibold tracking-tight sm:text-xl"
                style={{ color: theme.accent }}
              >
                {askingPriceLabel}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 max-w-full items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60 sm:max-w-[58%]"
            aria-label={`Open ${source.label} source for ${domainParts.full}`}
          >
            <span className="shrink-0 text-white/55">{source.label}</span>
            <span className="truncate">{excerpt}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </a>

          <div className="flex w-full items-center justify-end gap-1 sm:w-auto sm:shrink-0">
            <MlsReportListingDialog
              listingId={listing.id}
              domain={domainParts.full}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MlsSaleCardLogoProps {
  domain: string;
  label: string;
  logoUrl: string | null;
  theme: MlsSaleCardTheme;
}

function MlsSaleCardLogo({
  domain,
  label,
  logoUrl,
  theme,
}: MlsSaleCardLogoProps) {
  const domainMark = getMlsDomainMark(label);

  if (logoUrl) {
    return (
      <div className="relative flex size-14 shrink-0 items-center justify-center sm:size-16">
        <div
          aria-hidden={true}
          className="pointer-events-none absolute inset-1 rounded-full opacity-90 blur-2xl"
          style={{
            background:
              'radial-gradient(circle, var(--mls-accent-glow) 0%, transparent 74%)',
          }}
        />
        <span className="relative z-10 block size-12 sm:size-14">
          <NextImage
            src={logoUrl}
            alt={`${label || domain} logo`}
            fill
            sizes="56px"
            className="object-contain"
            style={{
              filter: 'drop-shadow(0 8px 18px var(--mls-accent-shadow))',
            }}
            referrerPolicy="no-referrer"
            unoptimized
          />
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 sm:size-16"
      style={{
        backgroundImage: [
          'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
          'radial-gradient(circle at 30% 25%, var(--mls-accent-soft) 0%, transparent 72%)',
          'linear-gradient(160deg, rgba(14,17,24,0.96), rgba(8,10,14,0.98))',
        ].join(', '),
        boxShadow: '0 8px 24px var(--mls-accent-shadow)',
      }}
    >
      <span
        className={cn(playfairDisplay.className, 'text-xl sm:text-2xl')}
        style={{ color: theme.accentMuted }}
      >
        {domainMark}
      </span>
    </div>
  );
}

function MlsSaleCardSellerTierBadge({ tier }: { tier: MlsSellerTier | null }) {
  return tier ? <MlsSellerTierBadge tier={tier} /> : null;
}

function getListingSellerTier({
  listing,
  sellerHandle,
  showSellerTierBadge,
}: {
  listing: MlsSaleListing;
  sellerHandle: string | null;
  showSellerTierBadge: boolean;
}) {
  if (!showSellerTierBadge || !sellerHandle) {
    return null;
  }

  const feedDomainsCount = getMlsListingSellerDomainCount(
    listing.otherDomainsCount,
  );
  const tierDomainCount =
    listing.seller.tierDomainCount ||
    getMlsSellerTierDomainCount({
      feedDomainsCount,
      namefiDomainsCount: listing.seller.namefiDomainsCount,
    });

  return getMlsSellerTier(tierDomainCount);
}

function useMlsSaleCardTheme(logoUrl: string | null, seed: string) {
  const [theme, setTheme] = useState(() => buildMlsSaleCardFallbackTheme(seed));

  useEffect(() => {
    const fallbackTheme = buildMlsSaleCardFallbackTheme(seed);
    setTheme(fallbackTheme);

    if (!logoUrl) {
      return;
    }

    const cachedTheme = mlsSaleCardThemeCache.get(logoUrl);
    if (cachedTheme) {
      setTheme(cachedTheme);
      return;
    }

    let disposed = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';

    image.onload = () => {
      if (disposed) {
        return;
      }

      const dominantColor = extractDominantColorFromImage(image);
      const nextTheme = dominantColor
        ? buildMlsSaleCardThemeFromRgb(dominantColor)
        : fallbackTheme;

      mlsSaleCardThemeCache.set(logoUrl, nextTheme);
      setTheme(nextTheme);
    };

    image.onerror = () => {
      if (disposed) {
        return;
      }

      mlsSaleCardThemeCache.set(logoUrl, fallbackTheme);
      setTheme(fallbackTheme);
    };

    image.src = logoUrl;

    return () => {
      disposed = true;
    };
  }, [logoUrl, seed]);

  return theme;
}

function getDomainUrl(domain: string) {
  return normalizeExternalUrl(domain) ?? `https://${domain.trim()}`;
}

function normalizeExternalUrl(value: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `https://${normalized}`;
}

function normalizeCurrency(value: string | null) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return 'USD';
  }
  return normalized;
}

function formatAskingPrice(
  price: string | null,
  currency: string,
): string | null {
  const normalizedPrice = price?.trim();
  if (!normalizedPrice) {
    return null;
  }

  const numericPrice = Number(
    normalizedPrice.replaceAll(',', '').replace('$', ''),
  );
  if (!Number.isFinite(numericPrice)) {
    return normalizedPrice;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: Number.isInteger(numericPrice) ? 0 : 2,
      minimumFractionDigits: Number.isInteger(numericPrice) ? 0 : 2,
    }).format(numericPrice);
  } catch {
    return normalizedPrice;
  }
}

function formatPostedLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 0) {
    return dateFormatter.format(parsed);
  }

  if (diffMs < 60 * 1000) {
    return 'just now';
  }

  if (diffMs <= THREE_DAYS_IN_MS) {
    return formatDistanceToNowStrict(parsed, {
      addSuffix: true,
      roundingMethod: 'floor',
    });
  }

  return dateFormatter.format(parsed);
}

function formatExcerpt(value: string | null) {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'No excerpt available';
  }
  return normalized;
}
