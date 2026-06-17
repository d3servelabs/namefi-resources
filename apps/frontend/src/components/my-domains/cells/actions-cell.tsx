'use client';

import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import {
  BadgeDollarSign,
  Compass,
  ExternalLinkIcon,
  MoreVertical,
  MoreHorizontal,
  ReceiptText,
  UserRoundSearch,
  Wallet,
} from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  getNftExplorerData,
  getNftExplorerUrl,
} from '@namefi-astra/utils/nft-hash';
import { useWatchAssets } from '@/hooks/use-watch-assets';
import { getLeadgenStartHref } from '@/lib/leadgen-url';
import { ActionTooltip } from '../action-tooltip';

const ACTION_BUTTON_BASE_CLASSES =
  'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5 !text-white border-0 bg-transparent shadow-none hover:bg-muted/30 xl:border xl:bg-background xl:shadow-xs';

export interface ActionsCellProps {
  domainName: string;
  expirationDate: Date | string | null | undefined;
  chainId: number | null;
  tokenId: bigint | number | null | undefined;
  ownerAddress: string | null;
  /** ID of the earliest SUCCEEDED order item; null when there isn't one. */
  orderId: string | null;
  isMobile: boolean;
  onListForSaleClick: (domainName: string) => void;
}

export function ActionsCell({
  domainName,
  expirationDate,
  chainId,
  tokenId,
  ownerAddress,
  orderId,
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

  const orderButton = orderId ? (
    <Button
      variant="outline"
      size="sm"
      className={cn(ACTION_BUTTON_BASE_CLASSES, 'hover:!text-emerald-400')}
      render={
        <Link
          href={`/orders/${orderId}/details`}
          aria-label={`View order for ${domainName}`}
          className="flex justify-start items-center"
        />
      }
      nativeButton={false}
    >
      <ReceiptText className="w-4 h-4" />
    </Button>
  ) : null;

  const leadgenButton = (
    <Button
      variant="outline"
      size="sm"
      className={cn(ACTION_BUTTON_BASE_CLASSES, 'hover:!text-emerald-400')}
      render={
        <Link
          href={getLeadgenStartHref(domainName)}
          aria-label={`Find buyers for ${domainName}`}
          className="flex justify-start items-center"
        />
      }
      nativeButton={false}
    >
      <UserRoundSearch className="w-4 h-4" />
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
          <DropdownMenuItem>{leadgenButton}</DropdownMenuItem>
          {orderButton && <DropdownMenuItem>{orderButton}</DropdownMenuItem>}
          {explorerButton && (
            <DropdownMenuItem>{explorerButton}</DropdownMenuItem>
          )}
          <WatchNftButton
            domainName={domainName}
            tokenId={tokenId}
            chainId={chainId}
            ownerAddress={ownerAddress}
            isExpired={isExpired}
            isMobile
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex gap-2">
      <ActionTooltip label="List for sale">{listForSaleButton}</ActionTooltip>
      <ActionTooltip label="Find buyers">{leadgenButton}</ActionTooltip>
      {orderButton ? (
        <ActionTooltip label="View order">{orderButton}</ActionTooltip>
      ) : null}
      {explorerButton ? (
        <ActionTooltip label="View NFT">{explorerButton}</ActionTooltip>
      ) : null}
      <WatchNftButton
        domainName={domainName}
        tokenId={tokenId}
        chainId={chainId}
        ownerAddress={ownerAddress}
        isExpired={isExpired}
        isMobile={false}
      />
    </div>
  );
}

interface WatchNftButtonProps {
  domainName: string;
  tokenId: bigint | number | null | undefined;
  chainId: number | null;
  ownerAddress: string | null;
  isExpired: boolean;
  isMobile: boolean;
}

/**
 * Adds the domain's Namefi NFT to the user's connected wallet via
 * `wallet_watchAsset`. Renders nothing when the domain is expired, has no
 * token id, chain id, owner address, or no wallet is connected.
 */
function WatchNftButton({
  domainName,
  tokenId,
  chainId,
  ownerAddress,
  isExpired,
  isMobile,
}: WatchNftButtonProps) {
  const { watchNamefiNftInWallet, isAnyWalletConnected } = useWatchAssets();

  const handleWatchNft = useCallback(async () => {
    if (tokenId == null || chainId == null || !ownerAddress) {
      return;
    }
    try {
      const added = await watchNamefiNftInWallet(
        tokenId.toString(),
        chainId,
        ownerAddress,
      );
      if (added) {
        toast.success(`${domainName} added to your wallet`);
      } else {
        toast.error(`Couldn't add ${domainName} to your wallet`);
      }
    } catch (error) {
      toast.error('Failed to add NFT to wallet', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [tokenId, chainId, ownerAddress, domainName, watchNamefiNftInWallet]);

  if (
    isExpired ||
    tokenId == null ||
    chainId == null ||
    !ownerAddress ||
    !isAnyWalletConnected
  ) {
    return null;
  }

  const button = (
    <Button
      variant="outline"
      size="sm"
      className={cn(ACTION_BUTTON_BASE_CLASSES, 'hover:!text-violet-400')}
      onClick={handleWatchNft}
      aria-label={`Show ${domainName} NFT in wallet`}
    >
      <Wallet className="w-4 h-4" />
    </Button>
  );

  if (isMobile) {
    return (
      <DropdownMenuItem
        onClick={handleWatchNft}
        aria-label={`Show ${domainName} NFT in wallet`}
        className={'hover:!text-violet-400'}
      >
        <Wallet className="w-4 h-4" /> Show NFT in wallet
      </DropdownMenuItem>
    );
  }

  return <ActionTooltip label="Show NFT in wallet">{button}</ActionTooltip>;
}

export function DropdownDomainActionsMenu({
  domainName,
  expirationDate,
  chainId,
  tokenId,
  ownerAddress,
  orderId,
  onListForSaleClick,
}: ActionsCellProps) {
  const expiry = expirationDate ? new Date(expirationDate) : null;
  const isExpired =
    expiry !== null ? differenceInDays(expiry, new Date()) < 0 : false;
  const { nftUrl, explorerName } = getNftExplorerData(
    chainId ?? null,
    tokenId?.toString() ?? null,
  ) ?? { nftUrl: null, explorerName: null };

  const listForSaleButton = (
    <DropdownMenuItem
      className={cn('hover:!text-orange-400')}
      onClick={() => onListForSaleClick(domainName)}
      aria-label={`List ${domainName} for sale`}
    >
      <BadgeDollarSign className="w-4 h-4" /> List for sale
    </DropdownMenuItem>
  );

  const orderButton = orderId ? (
    <DropdownMenuItem
      className={cn('hover:!text-emerald-400')}
      render={(props) => (
        <Link
          {...props}
          href={`/orders/${orderId}/details`}
          aria-label={`View order for ${domainName}`}
          className={cn('flex justify-start items-center', props.className)}
        />
      )}
    >
      <ReceiptText className="w-4 h-4" /> View Order
    </DropdownMenuItem>
  ) : null;

  const leadgenButton = (
    <DropdownMenuItem
      className={cn('hover:!text-emerald-400')}
      render={(props) => (
        <Link
          {...props}
          href={getLeadgenStartHref(domainName)}
          aria-label={`Find buyers for ${domainName}`}
          className={cn('flex justify-start items-center', props.className)}
        />
      )}
    >
      <UserRoundSearch className="w-4 h-4" /> Find buyers
    </DropdownMenuItem>
  );

  const explorerButton =
    !isExpired && nftUrl ? (
      <DropdownMenuItem
        className={cn('hover:!text-blue-400')}
        render={(props) => (
          <a
            {...props}
            href={nftUrl}
            aria-label={`View NFT for ${domainName}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('flex justify-start items-center', props.className)}
          >
            {props.children}
          </a>
        )}
      >
        <Compass className="w-4 h-4" /> View NFT on {explorerName ?? 'Scan'}
      </DropdownMenuItem>
    ) : null;

  const visitDomain = (
    <DropdownMenuItem
      className={cn('hover:!text-blue-400')}
      render={(props) => (
        <a
          {...props}
          href={`https://${domainName}`}
          aria-label={`Visit ${domainName}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('flex justify-start items-center', props.className)}
        >
          {props.children}
        </a>
      )}
    >
      <ExternalLinkIcon className="w-4 h-4" /> Visit Domain
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="!text-white border-0 bg-transparent shadow-none hover:bg-muted/30"
            aria-label={`Actions for ${domainName}`}
          />
        }
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className={'min-w-fit !max-w-lg'} align={'start'}>
        {visitDomain}
        {listForSaleButton}
        {leadgenButton}
        {orderButton}
        {explorerButton}
        <WatchNftButton
          domainName={domainName}
          tokenId={tokenId}
          chainId={chainId}
          ownerAddress={ownerAddress}
          isExpired={isExpired}
          isMobile
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
