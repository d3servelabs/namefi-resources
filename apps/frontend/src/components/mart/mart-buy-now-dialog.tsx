'use client';

import { ExternalLink, Info } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { toSafeExternalUrl } from '@/components/domain-and-dns-managment/panels/marketplace/safe-external-url';
import { shortToken } from '@/components/my-domains/marketplace-orders/format';
import type { DomainDetails } from '@/components/my-domains/marketplace-orders/use-domain-details';
import { NetworkLogo } from '@/components/network-logo';
import type { CollectionListingRow } from './use-collection-listings';
import type { useFulfillListing } from './use-fulfill-listing';

interface Props {
  /**
   * The buy mutation, owned by the parent so a purchase in flight can't be
   * re-pointed at a different listing.
   */
  buy: ReturnType<typeof useFulfillListing>;
  /** The listing the user is buying, or null when the dialog is closed. */
  row: CollectionListingRow | null;
  onOpenChange: (open: boolean) => void;
  /** Resolved domain details for the row (name/image), if available. */
  details?: DomainDetails;
  /** Current ETH→USD price for the fiat estimate. */
  ethUsdPrice?: number | null;
}

/**
 * Confirm-and-pay dialog for the `/mart` "Buy Now" flow. Shows what the buyer
 * is purchasing (domain, price, network) and fires the in-app fulfillment:
 * connect wallet → switch chain → send the Seaport tx. The exact total
 * (price + marketplace/network fees) is shown by the wallet at signing — we
 * say so rather than guessing a number here.
 */
export function MartBuyNowDialog({
  buy,
  row,
  onOpenChange,
  details,
  ethUsdPrice,
}: Props) {
  const t = useTranslations('mart');
  const format = useFormatter();

  const open = row !== null;

  // Keep the dialog mounted through the close animation but render nothing until
  // we have a row to describe.
  const displayName = row
    ? (details?.normalizedDomainName ??
      shortToken(row.listing.tokenAddress, row.listing.tokenId))
    : '';

  const priceLabel = row ? formatPrice(row, ethUsdPrice, format) : null;
  const safeUrl = row ? toSafeExternalUrl(row.listing.externalUrl) : null;

  return (
    <Dialog
      open={open}
      // Always dismissible — the toast lifecycle (submitting / success / error)
      // tracks the purchase independently, so closing the sheet (e.g. while
      // still connecting or switching chains, before any tx exists) never
      // strands the user. The confirm button is disabled while pending to
      // prevent a double-submit.
      onOpenChange={onOpenChange}
    >
      <DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle>
            {t('buyDialogTitle', { domain: displayName })}
          </DialogTitle>
          {/* Kept for screen readers; the title + price say enough on screen. */}
          <DialogDescription className="sr-only">
            {t('buyDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="space-y-3 py-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                {t('buyDialogPriceLabel')}
                <Tooltip>
                  <TooltipTrigger
                    render={(props) => (
                      <button
                        type="button"
                        {...props}
                        aria-label={t('buyDialogFeeNote')}
                        className="cursor-help text-muted-foreground/70 transition-colors hover:text-foreground"
                      >
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  />
                  <TooltipContent>{t('buyDialogFeeNote')}</TooltipContent>
                </Tooltip>
              </span>
              <span className="text-right font-mono">
                <span className="text-lg font-semibold">{priceLabel?.eth}</span>
                {priceLabel?.usd ? (
                  <span className="ms-2 text-sm text-muted-foreground">
                    {t('approxUsd', { amount: priceLabel.usd })}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {t('buyDialogNetworkLabel')}
              </span>
              <NetworkLogo network={row.chainId} className="h-5 w-5" />
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full bg-brand-primary font-semibold text-primary-foreground hover:bg-brand-primary/90"
            disabled={buy.isPending}
            onClick={() => {
              if (row) buy.mutate(row);
            }}
          >
            {buy.isPending ? t('buyDialogPending') : t('buyDialogConfirm')}
          </Button>
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {t('viewOnMarketplace', {
                marketplace: row?.listing.source ?? '',
              })}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Format the row's price into an `Ξ`-prefixed amount and an optional USD estimate. */
function formatPrice(
  row: CollectionListingRow,
  ethUsdPrice: number | null | undefined,
  format: ReturnType<typeof useFormatter>,
): { eth: string; usd: string | null } {
  const { isNative, symbol } = row.listing.price.currency;
  const isEther = isNative || symbol === 'ETH' || symbol === 'WETH';
  const decimal = row.listing.price.decimal;
  const eth = isEther
    ? `Ξ${decimal.toFixed(4)}`
    : `${decimal.toFixed(4)} ${symbol}`;
  const usdValue =
    isEther && ethUsdPrice != null ? ethUsdPrice * decimal : null;
  const usd =
    usdValue != null
      ? format.number(usdValue, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: usdValue >= 1000 ? 0 : 2,
        })
      : null;
  return { eth, usd };
}
