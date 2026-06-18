'use client';

import type { AppRouterOutput } from '@/lib/trpc';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { NetworkLogo } from '@/components/network-logo';
import { StatusBadge } from '@/components/status-badge';
import { getChain } from '@namefi-astra/utils';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type NfscOrderRow = AppRouterOutput['orders']['getMyNfscOrders'][number];

const DISPLAY_DECIMALS = 2;

interface NfscOrdersListProps {
  orders: NfscOrderRow[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function NfscOrdersList({
  orders,
  isLoading,
  emptyMessage,
}: NfscOrdersListProps) {
  const t = useTranslations('payment');
  const resolvedEmptyMessage = emptyMessage ?? t('nfscOrdersList.emptyMessage');
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (!orders || orders.length === 0) {
    return <p className="text-sm text-gray-400">{resolvedEmptyMessage}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {orders.map((order) => (
        <NfscOrderItem key={order.id} order={order} />
      ))}
    </ul>
  );
}

function NfscOrderItem({ order }: { order: NfscOrderRow }) {
  const t = useTranslations('payment');
  const chain = getChain(order.chainId);
  // amountInUsdCents is USD cents; 1 USD = 1 NFSC.
  const amountInNfsc = (order.amountInUSDCents / 100).toFixed(DISPLAY_DECIMALS);
  return (
    <li>
      <Link
        href={`/orders/${order.orderId}`}
        className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 transition-colors px-3 py-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <NetworkLogo network={order.chainId} className="w-5 h-5 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">
              {amountInNfsc} NFSC
            </span>
            <span className="text-xs text-gray-500">
              {chain?.name ??
                t('nfscOrdersList.chainFallback', {
                  chainId: order.chainId,
                })}{' '}
              · {format(new Date(order.orderCreatedAt), 'yyyy-MM-dd HH:mm')}
            </span>
          </div>
        </div>
        <StatusBadge status={order.orderStatus} type="order" />
      </Link>
    </li>
  );
}
