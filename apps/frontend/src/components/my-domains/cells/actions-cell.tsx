'use client';

import { differenceInDays } from 'date-fns';
import { BadgeDollarSign, Compass, MoreVertical } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getNftExplorerUrl } from '@namefi-astra/utils/nft-hash';
import { ActionTooltip } from '../action-tooltip';

const ACTION_BUTTON_BASE_CLASSES =
  'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5 !text-white border-0 bg-transparent shadow-none hover:bg-muted/30 xl:border xl:bg-background xl:shadow-xs';

interface ActionsCellProps {
  domainName: string;
  expirationDate: Date | string | null | undefined;
  chainId: number | null;
  tokenId: bigint | number | null | undefined;
  isMobile: boolean;
  onListForSaleClick: (domainName: string) => void;
}

export function ActionsCell({
  domainName,
  expirationDate,
  chainId,
  tokenId,
  isMobile,
  onListForSaleClick,
}: ActionsCellProps) {
  const expiry = expirationDate ? new Date(expirationDate) : null;
  const isExpired =
    expiry !== null ? differenceInDays(expiry, new Date()) < 0 : false;
  const explorerUrl = getNftExplorerUrl(
    chainId ?? null,
    tokenId?.toString() ?? null,
  );

  const listForSaleButton = (
    <Button
      variant="outline"
      size="sm"
      className={cn(ACTION_BUTTON_BASE_CLASSES, 'hover:!text-orange-400')}
      onClick={() => onListForSaleClick(domainName)}
      aria-label={`List ${domainName} for sale`}
    >
      <BadgeDollarSign className="w-4 h-4" />
    </Button>
  );

  const explorerButton =
    !isExpired && explorerUrl ? (
      <Button
        variant="outline"
        size="sm"
        className={cn(ACTION_BUTTON_BASE_CLASSES, 'hover:!text-blue-400')}
        render={(props) => (
          <a
            {...props}
            href={explorerUrl}
            aria-label={`View NFT for ${domainName}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('flex justify-start items-center', props.className)}
          >
            {props.children}
          </a>
        )}
        nativeButton={false}
      >
        <Compass className="w-4 h-4" />
      </Button>
    ) : null;

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="!text-white border-0 bg-transparent shadow-none hover:bg-muted/30"
              aria-label={`Actions for ${domainName}`}
            />
          }
        >
          <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>{listForSaleButton}</DropdownMenuItem>
          {explorerButton && (
            <DropdownMenuItem>{explorerButton}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex gap-2">
      <ActionTooltip label="List for sale">{listForSaleButton}</ActionTooltip>
      {explorerButton ? (
        <ActionTooltip label="View NFT">{explorerButton}</ActionTooltip>
      ) : null}
    </div>
  );
}
