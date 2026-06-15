'use client';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { ComponentProps, ForwardedRef } from 'react';
import { forwardRef } from 'react';
import {
  Avatar,
  AvatarFallback,
} from '@namefi-astra/ui/components/shadcn/avatar';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { walletAvatarFallbackClassName } from '@namefi-astra/ui/components/namefi/wallet-avatar-fallback';
import { WalletAvatarImage } from './wallet-avatar-image';

export type UserWalletAvatarProps = ComponentProps<typeof Avatar> & {
  address?: string | null;
  fallback?: string;
  adminOpenTarget?: 'user' | 'wallet';
  userId?: string;
  enableAdminLookupButtons?: boolean;
  enableWalletImage?: boolean;
  eager?: boolean;
  imageSizes?: string;
  isLoading?: boolean;
};

export const UserWalletAvatar = forwardRef<
  HTMLDivElement,
  UserWalletAvatarProps
>(function UserWalletAvatar(
  {
    address,
    fallback,
    adminOpenTarget: _adminOpenTarget,
    userId: _userId,
    enableAdminLookupButtons: _enableAdminLookupButtons,
    enableWalletImage = true,
    eager = false,
    imageSizes = '32px',
    isLoading = false,
    ...props
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <Avatar
      {...props}
      className={cn('size-8 overflow-hidden rounded-full', props.className)}
      ref={ref}
    >
      {isLoading ? (
        <Skeleton className="size-full rounded-full bg-muted-foreground/25 ring-1 ring-border/70 shadow-inner dark:bg-white/15 dark:ring-white/10" />
      ) : address && enableWalletImage ? (
        <WalletAvatarImage
          address={address}
          className="rounded-full"
          eager={eager}
          sizes={imageSizes}
        />
      ) : (
        <AvatarFallback
          className={cn('rounded-full', walletAvatarFallbackClassName)}
        >
          {fallback}
        </AvatarFallback>
      )}
    </Avatar>
  );
});

UserWalletAvatar.displayName = 'UserWalletAvatar';
