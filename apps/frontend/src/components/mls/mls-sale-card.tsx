'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Route } from 'next';
import NextImage from 'next/image';
import Link from 'next/link';
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
  type MlsSellerTierId,
  getMlsSellerTierDomainCount,
} from '@namefi-astra/common/mls-seller-tiers';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  resolveMlsListingSource,
  type MlsSaleListing,
  type MlsSaleListingSource,
} from '@/lib/mls/feed';
import { getMlsHandlePath, normalizeMlsHandle } from '@/lib/mls/handles';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});
const mlsSaleCardThemeCache = new Map<string, MlsSaleCardTheme>();
const MLS_SOURCE_VISUALS = {
  x: {
    logoSrc: '/assets/social/x-logo.svg',
    logoClassName: 'bg-[#0f1419] p-[0.2rem] ring-1 ring-white/15',
    linkClassName: 'hover:text-zinc-100',
    symbol: 'X',
  },
  dnforum: {
    logoSrc: 'https://www.dnforum.com/favicon.ico',
    logoClassName: 'bg-cyan-950 ring-1 ring-cyan-300/20',
    linkClassName: 'hover:text-cyan-100',
    symbol: 'DN',
  },
  namepros: {
    logoSrc: 'https://www.namepros.com/favicon.ico',
    logoClassName: 'bg-white ring-1 ring-amber-300/20',
    linkClassName: 'hover:text-amber-100',
    symbol: 'NP',
  },
  namefi_marketplace: {
    logoSrc: '/favicon.ico',
    logoClassName: 'bg-emerald-300/15 ring-1 ring-emerald-300/20',
    linkClassName: 'hover:text-emerald-100',
    symbol: 'Nf',
  },
} as const;
const MLS_SELLER_BADGE_CLASS_NAMES: Record<
  MlsSellerTierId | 'default',
  string
> = {
  default: 'border-white/[0.13] bg-white/[0.045] text-white/76',
  'portfolio-builder':
    'border-emerald-300/22 bg-emerald-300/[0.07] text-emerald-100',
  'market-maker': 'border-sky-300/22 bg-sky-300/[0.07] text-sky-100',
  'domain-whale': 'border-violet-300/24 bg-violet-300/[0.08] text-violet-100',
};

interface MlsSaleCardProps {
  listing: MlsSaleListing;
  showOtherDomainsCount?: boolean;
  showSellerTierBadge?: boolean;
  showReportAction?: boolean;
  priorityImage?: boolean;
}

export function MlsSaleCard({
  listing,
  showOtherDomainsCount = true,
  showSellerTierBadge = true,
  showReportAction = true,
  priorityImage = false,
}: MlsSaleCardProps) {
  const t = useTranslations('feed');
  const sellerHandle = normalizeMlsHandle(listing.seller.username);
  const sellerDisplayName = listing.seller.displayName?.trim() || null;
  const sellerLabel =
    sellerHandle ?? sellerDisplayName ?? t('card.unknownSeller');
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
  const postedLabel = formatPostedLabel(listing.postedAt, {
    justNow: t('card.justNow'),
    unknown: t('card.unknownDate'),
  });
  const domainParts = getMlsDomainDisplayParts(listing.domain);
  const otherDomainsCount = Math.max(0, listing.otherDomainsCount);
  const sellerFeedDomainCount =
    getMlsListingSellerDomainCount(otherDomainsCount);
  const sellerPlatformDomainCountLabel = t('card.sellerPlatformDomainCount', {
    count: sellerFeedDomainCount,
    platform: source.label,
  });
  const sellerTotalDomainCount =
    listing.seller.tierDomainCount ||
    getMlsSellerTierDomainCount({
      feedDomainsCount: sellerFeedDomainCount,
      namefiDomainsCount: listing.seller.namefiDomainsCount,
    });
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
      className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#111214] shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-[background-color,border-color] duration-200 !py-0 hover:border-white/[0.16] hover:bg-[#131416]"
      style={cardStyle}
      data-testid="feed.sale-card"
    >
      <CardContent className="grid gap-0 p-0 md:min-h-[12rem] md:grid-cols-[13rem_minmax(0,1fr)]">
        <MlsSaleCardArtwork
          domain={listing.domain}
          label={domainParts.label}
          logoUrl={logoUrl}
          theme={theme}
          priorityImage={priorityImage}
        />

        <div className="grid min-w-0 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(9.5rem,12rem)] md:grid-rows-[auto_minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <a
              href={domainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="-m-1 block min-w-0 rounded-md p-1 no-underline outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label={t('card.openDomainAriaLabel', {
                domain: domainParts.full,
              })}
              title={domainParts.full}
            >
              <h2 className="min-w-0 max-w-full break-words text-[2.1rem] leading-[0.94] font-semibold tracking-tight text-white text-wrap sm:text-[2.45rem] md:text-[2.25rem] xl:text-[2.5rem]">
                <span>{domainParts.label}</span>
                {domainParts.tld ? (
                  <span className="text-[0.58em] font-semibold text-white/58">
                    .{domainParts.tld}
                  </span>
                ) : null}
              </h2>
            </a>
          </div>

          {askingPriceLabel ? (
            <MlsSaleCardPrice
              label={askingPriceLabel}
              currency={askingCurrency}
            />
          ) : null}

          <div className="min-w-0 self-end md:col-span-2 md:col-start-1 md:row-start-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <MlsSaleSellerBadge
                sellerLabel={sellerLabel}
                sellerDetailsPath={sellerDetailsPath}
                tier={sellerTier}
                domainCount={sellerTotalDomainCount}
              />
              {showOtherDomainsCount ? (
                <MlsSellerPlatformDomainCount
                  label={sellerPlatformDomainCountLabel}
                  href={sellerDetailsPath}
                />
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-white/[0.07] border-t pt-3 md:col-span-2 md:row-start-3">
            <MlsSaleCardMeta
              source={source}
              domain={domainParts.full}
              postedAt={listing.postedAt}
              postedLabel={postedLabel}
              className="flex-1"
            />

            {showReportAction ? (
              <MlsReportListingDialog
                listingId={listing.id}
                domain={domainParts.full}
                triggerClassName="h-7 border border-white/[0.08] bg-white/[0.02] px-2 text-[0.72rem] text-white/42 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/72"
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MlsSaleCardArtworkProps {
  domain: string;
  label: string;
  logoUrl: string | null;
  theme: MlsSaleCardTheme;
  priorityImage: boolean;
}

function MlsSaleCardArtwork({
  domain,
  label,
  logoUrl,
  theme,
  priorityImage,
}: MlsSaleCardArtworkProps) {
  const t = useTranslations('feed');
  const domainMark = getMlsDomainMark(label);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogoImage = Boolean(logoUrl && failedLogoUrl !== logoUrl);

  return (
    <div
      className="relative min-h-40 overflow-hidden border-white/[0.08] border-b bg-[#17191d] md:min-h-full md:border-r md:border-b-0"
      style={{
        backgroundImage: [
          'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          'radial-gradient(circle at 35% 25%, var(--mls-accent-soft), transparent 56%)',
          'linear-gradient(160deg, rgba(22,24,28,0.98), rgba(8,9,11,0.98))',
        ].join(', '),
      }}
    >
      {showLogoImage ? (
        <NextImage
          src={logoUrl ?? ''}
          alt={t('card.logoAlt', { name: label || domain })}
          fill
          sizes="(max-width: 767px) calc(100vw - 44px), 208px"
          className="object-cover"
          priority={priorityImage}
          style={{
            filter: 'drop-shadow(0 18px 28px var(--mls-accent-shadow))',
          }}
          referrerPolicy="no-referrer"
          unoptimized
          onError={() => setFailedLogoUrl(logoUrl)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-7xl font-semibold tracking-tight opacity-90 lg:text-8xl"
            style={{
              color: theme.accentMuted,
              textShadow: '0 18px 30px var(--mls-accent-shadow)',
            }}
          >
            {domainMark}
          </span>
        </div>
      )}
      <div
        aria-hidden={true}
        className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.04] ring-inset"
      />
    </div>
  );
}

function MlsSaleCardPrice({
  label,
  currency,
}: {
  label: string;
  currency: string;
}) {
  return (
    <div className="min-w-0 md:justify-self-end md:pt-1 md:text-right">
      <p className="max-w-full break-words text-[1.35rem] leading-[1.05] font-semibold tracking-tight text-white [overflow-wrap:anywhere] md:text-[1.22rem]">
        {label}
      </p>
      <p className="mt-1 text-[0.68rem] font-medium tracking-wide text-white/40 uppercase">
        {currency}
      </p>
    </div>
  );
}

function MlsSaleSellerBadge({
  sellerLabel,
  sellerDetailsPath,
  tier,
  domainCount,
}: {
  sellerLabel: string;
  sellerDetailsPath: string | null;
  tier: MlsSellerTier | null;
  domainCount: number;
}) {
  const t = useTranslations('feed');
  const badgeTone = tier
    ? MLS_SELLER_BADGE_CLASS_NAMES[tier.id]
    : MLS_SELLER_BADGE_CLASS_NAMES.default;
  const badge = (
    <>
      <MlsSaleCardSellerTierBadge tier={tier} />
      <span className="min-w-0 truncate">{sellerLabel}</span>
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          sellerDetailsPath ? (
            <Link href={sellerDetailsPath as Route} />
          ) : (
            <span />
          )
        }
        className={cn(
          'inline-flex h-7 max-w-full items-center gap-2 rounded-full border py-1 pe-2.5 ps-1 text-[0.72rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition-[border-color,background-color,color,opacity] duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/35',
          badgeTone,
        )}
      >
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('card.sellerDomainCountTooltip', { count: domainCount })}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function MlsSellerPlatformDomainCount({
  label,
  href,
}: {
  label: string;
  href: string | null;
}) {
  const className =
    'inline-flex h-7 max-w-full items-center rounded-full border border-white/[0.09] bg-white/[0.025] px-2.5 text-[0.72rem] font-medium text-white/44 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,background-color,color] duration-200';

  if (href) {
    return (
      <Link
        href={href as Route}
        className={cn(
          className,
          'hover:border-white/[0.15] hover:bg-white/[0.055] hover:text-white/68 focus-visible:ring-2 focus-visible:ring-white/35',
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    );
  }

  return (
    <span className={className}>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function MlsSaleCardMeta({
  source,
  domain,
  postedAt,
  postedLabel,
  className,
}: {
  source: MlsSaleListingSource;
  domain: string;
  postedAt: string;
  postedLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/42',
        className,
      )}
    >
      <MlsSaleSourceLink source={source} domain={domain} />
      <span className="text-white/24" aria-hidden={true}>
        /
      </span>
      <time className="shrink-0 font-medium tabular-nums" dateTime={postedAt}>
        {postedLabel}
      </time>
    </div>
  );
}

function MlsSaleSourceLink({
  source,
  domain,
}: {
  source: MlsSaleListingSource;
  domain: string;
}) {
  const t = useTranslations('feed');
  const visual = getMlsSourceVisual(source.id);
  const [failedLogoSrc, setFailedLogoSrc] = useState<string | null>(null);
  const showLogo = Boolean(visual.logoSrc && failedLogoSrc !== visual.logoSrc);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex min-w-0 max-w-[12rem] items-center gap-1.5 rounded-sm font-medium text-white/52 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/35',
        visual.linkClassName,
      )}
      aria-label={t('card.openSourceAriaLabel', {
        source: source.label,
        domain,
      })}
    >
      <span
        aria-hidden={true}
        className={cn(
          'relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.48rem] font-bold tracking-tight',
          showLogo ? visual.logoClassName : 'bg-white/82 text-slate-950',
        )}
      >
        {showLogo ? (
          <NextImage
            src={visual.logoSrc}
            alt=""
            width={16}
            height={16}
            unoptimized
            loading="lazy"
            className="size-full object-contain"
            onError={() => setFailedLogoSrc(visual.logoSrc)}
          />
        ) : (
          <>
            <span className="absolute inset-x-0 top-0 h-1/2 bg-white/28" />
            <span className="relative">{visual.symbol}</span>
          </>
        )}
      </span>
      <span className="min-w-0 truncate">{source.label}</span>
      <ExternalLink className="size-3 shrink-0 opacity-55" aria-hidden={true} />
    </a>
  );
}

function getMlsSourceVisual(sourceId: string) {
  const normalized = sourceId.trim().toLowerCase();
  if (normalized in MLS_SOURCE_VISUALS) {
    return MLS_SOURCE_VISUALS[normalized as keyof typeof MLS_SOURCE_VISUALS];
  }

  return {
    logoSrc: '',
    logoClassName: '',
    linkClassName: 'hover:text-white/80',
    symbol: '↗',
  };
}

function MlsSaleCardSellerTierBadge({ tier }: { tier: MlsSellerTier | null }) {
  return tier ? <MlsSellerTierBadge tier={tier} showLabel={false} /> : null;
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

function formatPostedLabel(
  value: string,
  labels: { justNow: string; unknown: string },
) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return labels.unknown;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 0) {
    return dateFormatter.format(parsed);
  }

  if (diffMs < 60 * 1000) {
    return labels.justNow;
  }

  return formatDistanceToNowStrict(parsed, {
    addSuffix: true,
    roundingMethod: 'floor',
  });
}
