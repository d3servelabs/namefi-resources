'use client';

import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { AddressWithChain } from '@/components/address-with-chain';
import { StatusBadge } from '@/components/status-badge';
import {
  MobileTableItem,
  MobileTableItemActions,
  MobileTableItemContent,
  MobileTableItemField,
  MobileTableItemHeader,
  MobileTableItemTitle,
} from '@/components/ui/mobile-table';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import type { AppRouterOutput } from '@/lib/trpc';
import { GradientCard } from '@namefi-astra/ui/components/namefi/gradient-card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { getSubDomainAndParentDomainFromNormalizedDomainName } from '@namefi-astra/utils/domain-names';
import { format } from 'date-fns';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  EyeOff,
  Globe,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

export type OrderCardOrder =
  AppRouterOutput['orders']['getMyOrders']['orders'][number];

type OrderCardItem = OrderCardOrder['items'][number];

const ITEMS_BEFORE_COLLAPSE = 2;

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatUsdCents(cents: number) {
  return USD_FORMATTER.format(cents / 100);
}

function isItemUnderParent(
  normalizedDomainName: string,
  parentDomain: string,
): boolean {
  const { parentDomain: derived } =
    getSubDomainAndParentDomainFromNormalizedDomainName(normalizedDomainName);
  return derived === parentDomain;
}

interface OrderCardProps {
  order: OrderCardOrder;
  currentPbnDomain: string | null;
  showAllParents: boolean;
}

export function OrderCard({
  order,
  currentPbnDomain,
  showAllParents,
}: OrderCardProps) {
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const [expanded, setExpanded] = useState(false);
  const [revealOtherParents, setRevealOtherParents] = useState(false);

  const { pbnItems, nonPbnItems } = useMemo(() => {
    if (!currentPbnDomain) {
      return {
        pbnItems: order.items,
        nonPbnItems: [] as OrderCardItem[],
      };
    }
    const pbn: OrderCardItem[] = [];
    const nonPbn: OrderCardItem[] = [];
    for (const item of order.items) {
      if (isItemUnderParent(item.normalizedDomainName, currentPbnDomain)) {
        pbn.push(item);
      } else {
        nonPbn.push(item);
      }
    }
    return { pbnItems: pbn, nonPbnItems: nonPbn };
  }, [order.items, currentPbnDomain]);

  const includeAllItems = !currentPbnDomain || showAllParents;
  const baseVisible = includeAllItems ? order.items : pbnItems;
  const visibleItems = includeAllItems
    ? baseVisible
    : revealOtherParents
      ? [...pbnItems, ...nonPbnItems]
      : baseVisible;

  const collapsedItems = expanded
    ? visibleItems
    : visibleItems.slice(0, ITEMS_BEFORE_COLLAPSE);
  const hiddenByCollapseCount = visibleItems.length - collapsedItems.length;

  const isWalletLinked = useCallback(
    (walletAddress: string | null) => {
      if (!walletAddress) return true;
      if (!linkedWalletsReady) return true;
      const normalized = walletAddress.toLowerCase();
      return linkedWalletAddresses.some(
        (address) => address.toLowerCase() === normalized,
      );
    },
    [linkedWalletAddresses, linkedWalletsReady],
  );

  const showWalletWarning =
    linkedWalletsReady &&
    order.nftWalletAddress !== null &&
    !isWalletLinked(order.nftWalletAddress);

  return (
    <GradientCard
      gradient="minimal-horizontal"
      className={'border-none ring-1 ring-zinc-800 p-4 gap-1'}
    >
      <MobileTableItemHeader>
        <MobileTableItemTitle className="flex gap-x-2">
          <Link
            href={
              ['CREATED', 'PROCESSING'].includes(order.status)
                ? `/orders/${order.id}`
                : `/orders/${order.id}/details`
            }
            className="hover:underline text-foreground"
          >
            Order #{order.rowNum}
          </Link>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}</span>
          </span>
        </MobileTableItemTitle>
        <div className="flex flex-row-reverse sm:flex-row flex-wrap gap-x-2">
          <span className="flex items-center gap-2">
            {order.nftWalletAddress ? (
              <>
                <AddressWithChain
                  address={order.nftWalletAddress}
                  chainId={order.nftChainId}
                />
                {showWalletWarning && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={<span className="inline-flex cursor-help" />}
                      >
                        <Info className="h-3.5 w-3.5 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          This wallet is not linked to the current account, so
                          you won&apos;t be able to see the domain in account
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            ) : (
              false
            )}
          </span>
          <div className={'flex flex-row justify-end min-w-[8.5rem]'}>
            <StatusBadge
              status={order.status === 'CREATED' ? 'PROCESSING' : order.status}
              type="order"
            />
          </div>
        </div>
      </MobileTableItemHeader>

      <MobileTableItemContent>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex justify-between px-5">
            <span>
              Items ({visibleItems.length}
              {!includeAllItems && nonPbnItems.length > 0
                ? ` of ${order.items.length}`
                : ''}
              )
            </span>
            <span className="font-medium text-sm">
              <span className="text-muted-foreground text-xs">Total: </span>
              {formatUsdCents(order.amountInUSDCents)}
            </span>
          </div>
          {collapsedItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No items match the current view.
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {collapsedItems.map((item, index) => (
                <>
                  <OrderItemRow
                    key={item.id}
                    item={item}
                    showStatus={
                      !['CANCELLED', 'CREATED', 'FAILED', 'SUCCEEDED'].includes(
                        order.status,
                      )
                    }
                  />
                  {collapsedItems.length > 1 &&
                    collapsedItems.length - 1 !== index && <hr />}
                </>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            {hiddenByCollapseCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {hiddenByCollapseCount} more item
                {hiddenByCollapseCount === 1 ? '' : 's'}
              </Button>
            )}
            {expanded && visibleItems.length > ITEMS_BEFORE_COLLAPSE && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </Button>
            )}
            {!includeAllItems && nonPbnItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevealOtherParents((prev) => !prev)}
              >
                {revealOtherParents ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide {nonPbnItems.length} item
                    {nonPbnItems.length === 1 ? '' : 's'} from other parents
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-1" />
                    Show {nonPbnItems.length} item
                    {nonPbnItems.length === 1 ? '' : 's'} from other parents
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </MobileTableItemContent>
    </GradientCard>
  );
}

interface OrderItemRowProps {
  item: OrderCardItem;
  showStatus?: boolean;
}

function OrderItemRow({ item, showStatus }: OrderItemRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm px-5 hover:border-l-2 border-white/50 py-0.5">
      <div className="min-w-0 flex-1 flex flex-row gap-2">
        <div className="font-medium truncate min-w-[18ch] max-w-[18ch]">
          {item.normalizedDomainName}
        </div>
        <div className="text-xs text-muted-foreground gap-2 flex">
          <span className="font-mono min-w-[calc(8ch+10px)] text-xs text-center px-2 py-0.5 rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-300">
            {humanizeItemType(item.type)}
          </span>
          {showStatus && item.status && (
            <StatusBadge
              status={item.status === 'CREATED' ? 'PROCESSING' : item.status}
              type="order"
            />
          )}
        </div>
      </div>
      <div className="flex flex-row justify-end gap-1 shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-lg border border-secondary/30 text-muted-foreground">
          {item.durationInYears} yr
          {item.durationInYears === 1 ? '' : 's'}
        </span>
        <span className="font-medium">
          {formatUsdCents(item.amountInUSDCents)}
        </span>
      </div>
    </li>
  );
}
function humanizeItemType(t: string | null | undefined): string {
  switch (t) {
    case itemTypeSchema.enum.REGISTER:
      return 'Register';
    case itemTypeSchema.enum.IMPORT:
      return 'Import';
    case itemTypeSchema.enum.RENEW:
      return 'Renew';
    default:
      return t ?? '-';
  }
}
