'use client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/cn';
import { abbreviation } from '@/lib/string';
import { generateAvatarURL } from '@cfx-kit/wallet-avatar';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ForwardedRef } from 'react';
import { forwardRef, useMemo } from 'react';
import { useIsClient } from 'usehooks-ts';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { Avatar, AvatarFallback, AvatarImage } from './ui/shadcn/avatar';

type UserWalletAvatarProps = ComponentProps<typeof Avatar> & {
  address?: string | null;
  fallback?: string;
};

export const UserWalletAvatar = forwardRef<
  HTMLDivElement,
  UserWalletAvatarProps
>(
  (
    { address, fallback, ...props }: UserWalletAvatarProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const isClient = useIsClient();
    const ensName = useEnsName({
      query: {
        enabled: !!address,
      },
      address: (address as any) || '',
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
      queryFn: () => generateAvatarURL(address as any),
      enabled: !!address,
      queryKey: [`metamask:avatar:${address}`],
    });
    if (!isClient) {
      return <></>;
    }

    return (
      <Avatar
        {...props}
        className={cn('size-8 rounded-lg', props.className)}
        ref={ref}
      >
        <AvatarImage
          src={ensAvatar.data || metamaskAvatar.data}
          className={cn('bg-[#f26202] rounded-full', props.className)}
          alt={'user-avatar'}
        />
        <AvatarFallback className="rounded-lg">{fallback ?? ''}</AvatarFallback>
      </Avatar>
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
      const name =
        privyUser?.wallet?.address ||
        privyUser?.email?.address ||
        privyUser?.google?.email ||
        privyUser?.id ||
        'ME';
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
