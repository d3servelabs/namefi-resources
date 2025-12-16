'use client';

import { cn } from '@/lib/cn';
import { getShortAddress } from '@/lib/string';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import type { ComponentProps } from 'react';

export type AddressWithChainProps = Omit<ComponentProps<'div'>, 'children'> & {
  address?: string | null;
  chainId?: number | null;
  showChainBadge?: boolean;
};

export function AddressWithChain({
  address,
  chainId,
  showChainBadge = true,
  className,
  ...props
}: AddressWithChainProps) {
  if (!address) {
    return (
      <div className={cn('flex items-center gap-2', className)} {...props}>
        <span className="text-muted-foreground">-</span>
      </div>
    );
  }

  const short = getShortAddress(address);

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div className="relative shrink-0">
        <UserWalletAvatar address={address} className="size-6 rounded-full" />
        {showChainBadge && chainId ? (
          <div className="absolute -bottom-1 -right-1 rounded-full border border-background bg-background">
            <NetworkLogo network={chainId} className="w-3.5 h-3.5" />
          </div>
        ) : null}
      </div>

      <Tooltip>
        <TooltipTrigger asChild={true}>
          <span className="font-mono text-sm">{short}</span>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          <span className="font-mono">{address}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
