'use client';
import { Permission } from '@namefi-astra/utils/permissions';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/cn';
import { abbreviation } from '@/lib/string';
import { getUserDisplayName } from '@/lib/user';
import { generateAvatarURL } from '@cfx-kit/wallet-avatar';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import type {
  ComponentProps,
  ForwardedRef,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
} from 'react';
import { forwardRef, useMemo } from 'react';
import { useIsClient } from 'usehooks-ts';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { useHasPermissions } from './access/PermissionGate';
import {
  AdminUserLookupButton,
  AdminWalletDetailsButton,
} from './admin/user-details';
import { Avatar, AvatarFallback, AvatarImage } from './ui/shadcn/avatar';

type UserWalletAvatarProps = ComponentProps<typeof Avatar> & {
  address?: string | null;
  fallback?: string;
  adminOpenTarget?: 'user' | 'wallet';
};

export const UserWalletAvatar = forwardRef<
  HTMLDivElement,
  UserWalletAvatarProps
>(
  (
    {
      address,
      fallback,
      adminOpenTarget = 'user',
      ...props
    }: UserWalletAvatarProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const { hasPermissions: canReadUsers } = useHasPermissions([
      Permission.READ_USERS,
    ]);
    const isClient = useIsClient();
    const ensName = useEnsName({
      query: {
        enabled: !!address,
      },
      address: address as `0x${string}` | undefined,
      chainId: 1,
    });
    const ensAvatar = useEnsAvatar({
      name: ensName.data ?? '',
      query: {
        enabled: !!ensName.data,
      },
      chainId: 1,
    });
    const metamaskAvatar = useQuery({
      queryFn: () => generateAvatarURL(address ?? ''),
      enabled: !!address,
      queryKey: [`metamask:avatar:${address}`],
    });
    if (!isClient) {
      return null;
    }

    const stopInfoIconPropagation = (
      event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const stopInfoIconKeyboardPropagation = (
      event: KeyboardEvent<HTMLButtonElement>,
    ) => {
      event.stopPropagation();
    };

    return (
      <div className="group/user-wallet-avatar relative inline-grid shrink-0 place-items-center align-middle leading-none overflow-visible">
        <Avatar
          {...props}
          className={cn(
            'size-8 rounded-lg',
            canReadUsers &&
              address &&
              'transition-opacity duration-150 group-hover/user-wallet-avatar:opacity-35 group-focus-within/user-wallet-avatar:opacity-35',
            props.className,
          )}
          ref={ref}
        >
          <AvatarImage
            src={ensAvatar.data || metamaskAvatar.data}
            className={cn('bg-[#f26202] rounded-full', props.className)}
            alt={'user-avatar'}
          />
          <AvatarFallback className="rounded-lg">
            {fallback ?? ''}
          </AvatarFallback>
        </Avatar>
        {canReadUsers && address ? (
          adminOpenTarget === 'wallet' ? (
            <AdminWalletDetailsButton
              walletAddress={address}
              variant="outline"
              size="icon-xs"
              title="Open wallet details"
              onMouseDown={stopInfoIconPropagation}
              onMouseUp={stopInfoIconPropagation}
              onPointerDown={stopInfoIconPropagation}
              onPointerUp={stopInfoIconPropagation}
              onClick={stopInfoIconPropagation}
              // onKeyDown={stopInfoIconKeyboardPropagation}
              className="pointer-events-none absolute inset-0 z-10 m-auto rounded-full border bg-background/95 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 group-hover/user-wallet-avatar:pointer-events-auto group-hover/user-wallet-avatar:opacity-100 group-focus-within/user-wallet-avatar:pointer-events-auto group-focus-within/user-wallet-avatar:opacity-100"
            >
              <Info className="h-3.5 w-3.5" />
            </AdminWalletDetailsButton>
          ) : (
            <AdminUserLookupButton
              reference={{ walletAddress: address }}
              variant="outline"
              size="icon-xs"
              title="Open account details"
              onMouseDown={stopInfoIconPropagation}
              onMouseUp={stopInfoIconPropagation}
              onPointerDown={stopInfoIconPropagation}
              onPointerUp={stopInfoIconPropagation}
              onClick={stopInfoIconPropagation}
              // onKeyDown={stopInfoIconKeyboardPropagation}
              className="pointer-events-none absolute inset-0 z-10 m-auto rounded-full border bg-background/95 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 group-hover/user-wallet-avatar:pointer-events-auto group-hover/user-wallet-avatar:opacity-100 group-focus-within/user-wallet-avatar:pointer-events-auto group-focus-within/user-wallet-avatar:opacity-100"
            >
              <Info className="h-3.5 w-3.5" />
            </AdminUserLookupButton>
          )
        ) : null}
      </div>
    );
  },
);

UserWalletAvatar.displayName = 'UserWalletAvatar';

export const CurrentUserAvatar = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Avatar>
>(
  (
    { ...props }: ComponentProps<typeof Avatar>,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const { privyUser } = useAuth();
    const fallback = useMemo(() => {
      const name = getUserDisplayName(privyUser);
      return abbreviation(name.replace('0x', ''), true);
    }, [privyUser]);
    return (
      <UserWalletAvatar
        address={privyUser?.wallet?.address}
        fallback={fallback}
        {...props}
        ref={ref}
      />
    );
  },
);

CurrentUserAvatar.displayName = 'CurrentUserAvatar';
