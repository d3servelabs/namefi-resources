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
import { Check, ExternalLink, HandCoins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { getShortAddress } from '@/lib/string';
import { MARKETPLACE_ICONS } from '@/lib/marketplaces/factory';
import type { Offer } from '@/lib/marketplaces/types';
import { toSafeExternalUrl } from './safe-external-url';
import { useAcceptOffer, useOffers } from './use-listings';

interface Props {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  ownerAddress: Address;
}

export function OffersCard({
  chainId,
  tokenAddress,
  tokenId,
  ownerAddress,
}: Props) {
  const t = useTranslations('domains');
  const offersQuery = useOffers({ chainId, tokenAddress, tokenId });
  const acceptMutation = useAcceptOffer({
    chainId,
    tokenAddress,
    tokenId,
    ownerAddress,
    onSuccess: (offer) =>
      toast.success(
        t('marketplace.offers.accepted', {
          price: `${offer.price.decimal.toFixed(4)} ${offer.price.currency.symbol}`,
        }),
        {
          description: t('marketplace.offers.acceptedDescription'),
        },
      ),
  });

  const handleAccept = async (offer: Offer) => {
    try {
      await acceptMutation.mutateAsync({ offer });
    } catch (error) {
      toast.error(t('marketplace.offers.acceptFailed'), {
        description: errorToMessage(error),
      });
      throw error;
    }
  };

  return (
    <Card
      data-testid="domains.marketplace.offers.card"
      className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <HandCoins className="h-4 w-4 text-brand-primary" />
          {t('marketplace.offers.title')}
        </CardTitle>
        <CardDescription>{t('marketplace.offers.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {offersQuery.isLoading ? (
          <div
            data-testid="domains.marketplace.offers.loading"
            className="space-y-2"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : offersQuery.error ? (
          <p
            data-testid="domains.marketplace.offers.error"
            className="text-sm text-red-400"
          >
            {t('marketplace.offers.loadFailed', {
              error: errorToMessage(offersQuery.error),
            })}
          </p>
        ) : !offersQuery.data || offersQuery.data.length === 0 ? (
          <p
            data-testid="domains.marketplace.offers.empty"
            className="text-sm text-zinc-400"
          >
            {t('marketplace.offers.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('marketplace.offers.columnMarketplace')}
                </TableHead>
                <TableHead>{t('marketplace.offers.columnBidder')}</TableHead>
                <TableHead>{t('marketplace.offers.columnOffer')}</TableHead>
                <TableHead>{t('marketplace.offers.columnExpires')}</TableHead>
                <TableHead className="text-end">
                  {t('marketplace.offers.columnActions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offersQuery.data.map((offer) => (
                <TableRow
                  key={`${offer.marketplace}:${offer.id}`}
                  data-testid={`domains.marketplace.offers.row.${offer.id}`}
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="h-auto gap-1.5 px-3 py-1.5 text-zinc-200"
                    >
                      <Image
                        src={MARKETPLACE_ICONS[offer.marketplace]}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                      />
                      {offer.source}
                    </Badge>
                  </TableCell>
                  <TableCell
                    data-testid={`domains.marketplace.offers.row.${offer.id}.bidder`}
                    className="font-mono text-zinc-300"
                  >
                    {getShortAddress(offer.bidder)}
                  </TableCell>
                  <TableCell
                    data-testid={`domains.marketplace.offers.row.${offer.id}.amount`}
                    className="font-mono text-zinc-100"
                  >
                    {offer.price.decimal.toFixed(4)}{' '}
                    {offer.price.currency.symbol}
                  </TableCell>
                  <TableCell
                    data-testid={`domains.marketplace.offers.row.${offer.id}.expires`}
                    title={offer.expirationTime}
                  >
                    {formatExpiration(offer.expirationTime)}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      {(() => {
                        const safeUrl = toSafeExternalUrl(offer.externalUrl);
                        return safeUrl ? (
                          <a
                            data-testid={`domains.marketplace.offers.row.${offer.id}.view`}
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-zinc-100"
                          >
                            {t('marketplace.offers.view')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null;
                      })()}
                      <AsyncButton
                        data-testid={`domains.marketplace.offers.row.${offer.id}.accept`}
                        size="sm"
                        onClick={() => handleAccept(offer)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      >
                        <Check className="h-3 w-3 me-1" />
                        {t('marketplace.offers.accept')}
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
