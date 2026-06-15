'use client';

import { getAuthDisplayProfileSafeIdentifier } from '@/components/providers/auth-display-profile';
import { useAuth } from '@/hooks/use-auth';
import { abbreviation } from '@/lib/string';
import { getUserDisplaySafeIdentifier } from '@/lib/user';
import {
  UserWalletAvatar,
  type UserWalletAvatarProps,
} from '@/components/user-avatar';
import type { ForwardedRef } from 'react';
import { forwardRef, useMemo } from 'react';

type CurrentUserAvatarProps = Omit<
  UserWalletAvatarProps,
  'address' | 'fallback' | 'isLoading'
>;

export const CurrentUserAvatar = forwardRef<
  HTMLDivElement,
  CurrentUserAvatarProps
>(function CurrentUserAvatar(
  { enableWalletImage = true, ...props }: CurrentUserAvatarProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    isAuthenticated,
    isPrivyUserLoading,
    privyUser,
    unsafeDisplayProfile,
  } = useAuth();
  const fallback = useMemo(() => {
    const name =
      getUserDisplaySafeIdentifier(privyUser) ??
      getAuthDisplayProfileSafeIdentifier(unsafeDisplayProfile);
    if (!name) return undefined;
    return abbreviation(name.replace('0x', ''), true);
  }, [privyUser, unsafeDisplayProfile]);

  return (
    <UserWalletAvatar
      address={
        privyUser?.wallet?.address ?? unsafeDisplayProfile?.walletAddress
      }
      fallback={fallback}
      enableWalletImage={enableWalletImage}
      isLoading={
        enableWalletImage &&
        isAuthenticated &&
        isPrivyUserLoading &&
        !privyUser?.wallet?.address &&
        !unsafeDisplayProfile?.walletAddress
      }
      {...props}
      ref={ref}
    />
  );
});

CurrentUserAvatar.displayName = 'CurrentUserAvatar';
