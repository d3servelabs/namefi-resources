import { formatDistanceToNowStrict } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { MlsReportListingDialog } from '@/components/mls/mls-report-listing-dialog';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { cn } from '@/lib/cn';
import type { MlsSaleListing } from '@/lib/mls/feed';
import { getMlsHandlePath, normalizeMlsHandle } from '@/lib/mls/handles';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});
const THREE_DAYS_IN_MS = 72 * 60 * 60 * 1000;
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
});

interface MlsSaleCardProps {
  listing: MlsSaleListing;
}

export function MlsSaleCard({ listing }: MlsSaleCardProps) {
  const sellerHandle = normalizeMlsHandle(listing.seller.username);
  const sellerLabel = sellerHandle ?? '@unknown';
  const sellerDetailsPath = getMlsHandlePath(sellerHandle);
  const domainUrl = getDomainUrl(listing.domain);
  const askingCurrency = normalizeCurrency(listing.askingCurrency);
  const askingPriceLabel = formatAskingPrice(
    listing.askingPrice,
    askingCurrency,
  );
  const postedLabel = formatPostedLabel(listing.postedAt);
  const excerpt = formatExcerpt(listing.messageText);
  const domainParts = splitDomainForDisplay(listing.domain);
  const otherDomainsCount = Math.max(0, listing.otherDomainsCount);

  return (
    <Card className="bg-transparent shadow-none !py-0 !ring-0 border-b border-white/10 rounded-none">
      <CardContent className="px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/35 sm:text-sm">
          {sellerDetailsPath ? (
            <Link
              href={sellerDetailsPath}
              className="truncate font-semibold text-white/50 transition-colors hover:text-white/70 hover:underline"
            >
              {sellerLabel}
            </Link>
          ) : (
            <p className="truncate font-semibold text-white/50">
              {sellerLabel}
            </p>
          )}
          <span aria-hidden={true}>•</span>
          <time className="shrink-0" dateTime={listing.postedAt}>
            {postedLabel}
          </time>
          {otherDomainsCount > 0 ? (
            <>
              <span aria-hidden={true}>•</span>
              <span>
                {otherDomainsCount.toLocaleString()} other{' '}
                {otherDomainsCount === 1 ? 'domain' : 'domains'}
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <Link
            href={domainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex flex-wrap items-baseline gap-1.5 no-underline"
            aria-label={`Open ${listing.domain}`}
          >
            <h2
              className={cn(
                playfairDisplay.className,
                'text-4xl leading-none text-white sm:text-[2.9rem]',
              )}
            >
              {domainParts.label}
            </h2>
            {domainParts.tld ? (
              <span className="font-sans text-[1.6rem] leading-none font-medium text-white/35 sm:text-[1.95rem]">
                .{domainParts.tld}
              </span>
            ) : null}
          </Link>

          {askingPriceLabel ? (
            <p className="shrink-0 text-right text-lg font-semibold text-emerald-400 sm:text-xl">
              {askingPriceLabel}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={listing.sourceTweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 max-w-full items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60 sm:max-w-[58%]"
            aria-label={`Open source post for ${listing.domain}`}
          >
            <span className="truncate">{excerpt}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </Link>

          <div className="flex w-full items-center justify-end gap-1 sm:w-auto sm:shrink-0">
            <MlsReportListingDialog
              listingId={listing.id}
              domain={listing.domain}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

function splitDomainForDisplay(domain: string) {
  const normalizedDomain = domain.trim();
  const splitIndex = normalizedDomain.indexOf('.');

  if (splitIndex <= 0 || splitIndex === normalizedDomain.length - 1) {
    return { label: normalizedDomain, tld: null };
  }

  return {
    label: normalizedDomain.slice(0, splitIndex),
    tld: normalizedDomain.slice(splitIndex + 1),
  };
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
