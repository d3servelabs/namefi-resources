'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { getShortAddress } from '@/lib/string';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { CopyIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { toast } from 'sonner';

export type AddressWithChainProps = Omit<ComponentProps<'div'>, 'children'> & {
  address?: string | null;
  chainId?: number | null;
  showChainBadge?: boolean;
  /**
   * Always render the condensed `0x1234…5678` address, even on small screens.
   * Default keeps the responsive behavior (address hidden below `md`, where the
   * avatar alone has to stand in). Card layouts have room for the short address.
   */
  showShortAddress?: boolean;
};

function formatMobileAddress(address: string) {
  if (address.startsWith('0x') && address.length >= 6) {
    return `0x${address.slice(2, 6)}..`;
  }
  return `${address.slice(0, 6)}..`;
}

export function AddressWithChain({
  address,
  chainId,
  showChainBadge = true,
  showShortAddress = false,
  className,
  ...props
}: AddressWithChainProps) {
  const t = useTranslations('common');
  const safeAddress = address ?? '';
  const short = getShortAddress(safeAddress);
  const mobileShort = formatMobileAddress(safeAddress);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(safeAddress);
      toast.success('Copied address');
    } catch {
      toast.error('Failed to copy address');
    }
  }, [safeAddress]);

  if (!address) {
    return (
      <div className={cn('flex items-center gap-2', className)} {...props}>
        <span className="text-muted-foreground">-</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <Tooltip>
        <TooltipTrigger
          render={<span className="inline-flex items-center gap-2" />}
        >
          <span className="relative shrink-0">
            <UserWalletAvatar
              address={address}
              className="size-6 rounded-full"
            />
            {showChainBadge && chainId ? (
              <span className="absolute -bottom-1 -right-1 rounded-full border border-background bg-background">
                <NetworkLogo network={chainId} className="w-3.5 h-3.5" />
              </span>
            ) : null}
          </span>
          {showShortAddress ? (
            <span className="font-mono text-sm">{short}</span>
          ) : (
            <>
              <span className="hidden lg:inline font-mono text-sm">
                {short}
              </span>
              <span className="hidden md:inline lg:hidden font-mono text-sm">
                {mobileShort}
              </span>
            </>
          )}
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          <span className="font-mono">{address}</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <button
              {...props}
              type="button"
              onClick={(event) => {
                props.onClick?.(event);
                if (event.defaultPrevented) return;
                handleCopy();
              }}
              className={cn('rounded-full p-1 hover:bg-muted', props.className)}
              aria-label={t('actions.copyAddress')}
            >
              <CopyIcon className="h-3 w-3" />
            </button>
          )}
        />
        <TooltipContent sideOffset={6}>{t('actions.copy')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
