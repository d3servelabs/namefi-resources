'use client';

import type { ComponentProps } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';

export const walletAvatarFallbackBackgroundImage =
  'linear-gradient(135deg,#f26202 0%,#f7b538 48%,#118a7e 100%)';
export const walletAvatarFallbackClassName =
  'bg-[linear-gradient(135deg,#f26202_0%,#f7b538_48%,#118a7e_100%)]';

export function WalletAvatarFallback({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden={true}
      data-slot="wallet-avatar-fallback"
      className={cn(
        'block size-full rounded-[inherit]',
        walletAvatarFallbackClassName,
        className,
      )}
      {...props}
    />
  );
}
