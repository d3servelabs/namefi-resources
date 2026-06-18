'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AddressWithChain } from '@/components/address-with-chain';
import type { AppRouterOutput } from '@/lib/trpc';
import { safeToUnicode } from './utils';

type OtherWalletOrderItem = AppRouterOutput['orders']['getOrderItems'][number];

export const OtherWalletOrdersTable: FC<{ items: OtherWalletOrderItem[] }> = ({
  items,
}) => {
  const t = useTranslations('domains');
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t('otherWallets.domain', { count: items.length })}
            </TableHead>
            <TableHead>{t('otherWallets.nftWallet')}</TableHead>
            <TableHead className="w-[160px]">
              {t('otherWallets.order')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div>
                  {safeToUnicode(item.normalizedDomainName)}
                  {safeToUnicode(item.normalizedDomainName) !==
                    item.normalizedDomainName && (
                    <span className="block text-xs text-muted-foreground font-normal">
                      {item.normalizedDomainName}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <AddressWithChain
                  address={item.nftWalletAddress}
                  chainId={item.nftChainId}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/orders/${item.orderId}/details`} />}
                  nativeButton={false}
                >
                  <ExternalLink className="h-4 w-4 me-1" />
                  {t('otherWallets.viewOrder')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
