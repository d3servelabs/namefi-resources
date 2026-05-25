'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
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
import { ExternalLink, Tag, X } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
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
}

export function CurrentListingsCard({
  domain,
  chainId,
  tokenAddress,
  tokenId,
}: Props) {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const listingsQuery = useListings({ chainId, tokenAddress, tokenId });
  const cancelMutation = useCancelListing({
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
      toast.success('Listing cancelled', {
        description: 'It will disappear from marketplaces within a moment.',
      });
    },
  });

  const handleCancel = async (listing: Listing) => {
    try {
      await cancelMutation.mutateAsync({ listing });
    } catch (error) {
      const message = errorToMessage(error);
      toast.error('Failed to cancel listing', { description: message });
      throw error;
    }
  };

  return (
    <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Tag className="h-4 w-4 text-brand-primary" />
              Current listings
            </CardTitle>
            <CardDescription>
              Active sale listings across supported marketplaces.
            </CardDescription>
          </div>
          <CreateListingModal
            domain={domain}
            chainId={chainId}
            tokenAddress={tokenAddress}
            tokenId={tokenId}
          />
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
            Couldn't load listings: {errorToMessage(listingsQuery.error)}
          </p>
        ) : !listingsQuery.data || listingsQuery.data.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No active listings. Use “Create listing” to put this domain up for
            sale.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marketplace</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
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
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null;
                      })()}
                      <AsyncButton
                        size="sm"
                        onClick={() => handleCancel(listing)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
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
