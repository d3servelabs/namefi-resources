'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { ExternalLink, Tag, UserRoundSearch, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { getLeadgenStartHref } from '@/lib/leadgen-url';
import { MARKETPLACE_ICONS } from '@/lib/marketplaces/factory';
import type { Listing } from '@/lib/marketplaces/types';
import { CreateListingModal } from './create-listing-modal';
import { toSafeExternalUrl } from './safe-external-url';
import { useCancelListing, useListings } from './use-listings';

interface Props {
  domain: string;
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  ownerAddress: Address;
}

export function CurrentListingsCard({
  domain,
  chainId,
  tokenAddress,
  tokenId,
  ownerAddress,
}: Props) {
  const t = useTranslations('domains');
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const listingsQuery = useListings({ chainId, tokenAddress, tokenId });
  const cancelMutation = useCancelListing({
    domain,
    chainId,
    tokenAddress,
    tokenId,
    onSuccess: (listing) => {
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.MarketplaceListingCancelled,
        properties: {
          domainName: domain,
          marketplaceId: listing.marketplace,
          chainId,
        },
      });
      toast.success(t('marketplace.listings.cancelled'), {
        description: t('marketplace.listings.cancelledDescription'),
      });
    },
  });

  const handleCancel = async (listing: Listing) => {
    try {
      await cancelMutation.mutateAsync({ listing });
    } catch (error) {
      const message = errorToMessage(error);
      toast.error(t('marketplace.listings.cancelFailed'), {
        description: message,
      });
      throw error;
    }
  };

  return (
    <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Tag className="h-4 w-4 text-brand-primary" />
              {t('marketplace.listings.title')}
            </CardTitle>
            <CardDescription>
              {t('marketplace.listings.description')}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
              render={
                <Link
                  href={getLeadgenStartHref(domain)}
                  aria-label={t('marketplace.listings.findBuyersAria', {
                    domain,
                  })}
                />
              }
              nativeButton={false}
            >
              <UserRoundSearch className="h-4 w-4" />
              {t('marketplace.listings.findBuyers')}
            </Button>
            <CreateListingModal
              domain={domain}
              chainId={chainId}
              tokenAddress={tokenAddress}
              tokenId={tokenId}
              ownerAddress={ownerAddress}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {listingsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : listingsQuery.error ? (
          <p className="text-sm text-red-400">
            {t('marketplace.listings.loadFailed', {
              error: errorToMessage(listingsQuery.error),
            })}
          </p>
        ) : !listingsQuery.data || listingsQuery.data.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {t('marketplace.listings.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('marketplace.listings.columnMarketplace')}
                </TableHead>
                <TableHead>{t('marketplace.listings.columnPrice')}</TableHead>
                <TableHead>{t('marketplace.listings.columnExpires')}</TableHead>
                <TableHead className="text-end">
                  {t('marketplace.listings.columnActions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listingsQuery.data.map((listing) => (
                <TableRow key={`${listing.marketplace}:${listing.id}`}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="h-auto gap-1.5 px-3 py-1.5 text-zinc-200"
                    >
                      <Image
                        src={MARKETPLACE_ICONS[listing.marketplace]}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                      />
                      {listing.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-100">
                    {listing.price.decimal.toFixed(4)}{' '}
                    {listing.price.currency.symbol}
                  </TableCell>
                  <TableCell title={listing.expirationTime}>
                    {formatExpiration(listing.expirationTime)}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      {(() => {
                        const safeUrl = toSafeExternalUrl(listing.externalUrl);
                        return safeUrl ? (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-zinc-100"
                          >
                            {t('marketplace.listings.view')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null;
                      })()}
                      <AsyncButton
                        size="sm"
                        onClick={() => handleCancel(listing)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30"
                      >
                        <X className="h-3 w-3 me-1" />
                        {t('marketplace.listings.cancel')}
                      </AsyncButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function formatExpiration(iso: string): string {
  try {
    return format(new Date(iso), 'yyyy-MM-dd HH:mm');
  } catch {
    return iso;
  }
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
