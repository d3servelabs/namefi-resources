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
import { Check, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { getShortAddress } from '@/lib/string';
import type { Offer } from '@/lib/marketplaces/types';
import { toSafeExternalUrl } from './safe-external-url';
import { useAcceptOffer, useOffers } from './use-listings';

interface Props {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
}

export function OffersCard({ chainId, tokenAddress, tokenId }: Props) {
  const offersQuery = useOffers({ chainId, tokenAddress, tokenId });
  const acceptMutation = useAcceptOffer({
    chainId,
    tokenAddress,
    tokenId,
    onSuccess: (offer) =>
      toast.success(
        `Accepted offer for ${offer.price.decimal.toFixed(4)} ${offer.price.currency.symbol}`,
        {
          description: 'NFT transferred to the bidder.',
        },
      ),
  });

  const handleAccept = async (offer: Offer) => {
    try {
      await acceptMutation.mutateAsync({ offer });
    } catch (error) {
      toast.error('Failed to accept offer', {
        description: errorToMessage(error),
      });
      throw error;
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Incoming offers</CardTitle>
        <CardDescription>
          Bids placed on this domain across supported marketplaces. Accepting an
          offer transfers the NFT to the bidder and credits you the bid amount.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {offersQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : offersQuery.error ? (
          <p className="text-sm text-red-400">
            Couldn't load offers: {errorToMessage(offersQuery.error)}
          </p>
        ) : !offersQuery.data || offersQuery.data.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No active offers. When a buyer places a bid it will appear here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marketplace</TableHead>
                <TableHead>Bidder</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offersQuery.data.map((offer) => (
                <TableRow key={`${offer.marketplace}:${offer.id}`}>
                  <TableCell>
                    <Badge variant="outline" className="text-zinc-200">
                      {offer.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300">
                    {getShortAddress(offer.bidder)}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-100">
                    {offer.price.decimal.toFixed(4)}{' '}
                    {offer.price.currency.symbol}
                  </TableCell>
                  <TableCell title={offer.expirationTime}>
                    {formatExpiration(offer.expirationTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(() => {
                        const safeUrl = toSafeExternalUrl(offer.externalUrl);
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
                        onClick={() => handleAccept(offer)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
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
