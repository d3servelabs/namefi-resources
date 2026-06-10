'use client';
import { Permission } from '@namefi-astra/utils/permissions';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { Button } from '@namefi-astra/ui/components/shadcn/button';
import { abbreviation } from '@/lib/string';
import { getUserDisplayName } from '@/lib/user';
import { Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import type {
  ComponentProps,
  ForwardedRef,
  MouseEvent,
  MouseEventHandler,
  PointerEvent,
  ReactNode,
} from 'react';
import { forwardRef, useMemo } from 'react';
import { useIsClient } from 'usehooks-ts';
import { useHasPermissions } from './access/PermissionGate';
import type { AdminUserLookupReference } from './admin/user-details';
import {
  Avatar,
  AvatarFallback,
} from '@namefi-astra/ui/components/shadcn/avatar';

type UserWalletAvatarProps = ComponentProps<typeof Avatar> & {
  address?: string | null;
  fallback?: string;
  adminOpenTarget?: 'user' | 'wallet';
  userId?: string;
  enableAdminLookupButtons?: boolean;
};

type AdminLookupButtonBaseProps = {
  className?: string;
  title?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: ComponentProps<typeof Button>['onPointerDown'];
  onPointerUp?: ComponentProps<typeof Button>['onPointerUp'];
};

type LazyAdminUserLookupButtonProps = AdminLookupButtonBaseProps & {
  reference: AdminUserLookupReference;
};

type LazyAdminWalletDetailsButtonProps = AdminLookupButtonBaseProps & {
  walletAddress: string;
};

const LazyAdminUserLookupButton = dynamic<LazyAdminUserLookupButtonProps>(
  () => import('./admin/user-details').then((mod) => mod.AdminUserLookupButton),
  { ssr: false },
);

const LazyAdminWalletDetailsButton = dynamic<LazyAdminWalletDetailsButtonProps>(
  () =>
    import('./admin/user-details').then((mod) => mod.AdminWalletDetailsButton),
  { ssr: false },
);

const LazyWalletAvatarImage = dynamic(
  () => import('./wallet-avatar-image').then((mod) => mod.WalletAvatarImage),
  { ssr: false },
);

export const UserWalletAvatar = forwardRef<
  HTMLDivElement,
  UserWalletAvatarProps
>((props: UserWalletAvatarProps, ref: ForwardedRef<HTMLDivElement>) => {
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return <UserWalletAvatarInner {...props} ref={ref} />;
});

UserWalletAvatar.displayName = 'UserWalletAvatar';

const UserWalletAvatarInner = forwardRef<HTMLDivElement, UserWalletAvatarProps>(
  function UserWalletAvatarInner(
    {
      address,
      fallback,
      adminOpenTarget = 'user',
      userId,
      enableAdminLookupButtons = true,
      ...props
    }: UserWalletAvatarProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    if (enableAdminLookupButtons && address) {
      return (
        <AdminEnabledUserWalletAvatar
          address={address}
          fallback={fallback}
          adminOpenTarget={adminOpenTarget}
          userId={userId}
          {...props}
          ref={ref}
        />
      );
    }

    return (
      <UserWalletAvatarFrame
        address={address}
        fallback={fallback}
        adminOpenTarget={adminOpenTarget}
        userId={userId}
        canReadUsers={false}
        {...props}
        ref={ref}
      />
    );
  },
);
UserWalletAvatarInner.displayName = 'UserWalletAvatarInner';

const AdminEnabledUserWalletAvatar = forwardRef<
  HTMLDivElement,
  Omit<UserWalletAvatarProps, 'enableAdminLookupButtons'>
>(function AdminEnabledUserWalletAvatar(
  props: Omit<UserWalletAvatarProps, 'enableAdminLookupButtons'>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { hasPermissions: canReadUsers } = useHasPermissions([
    Permission.READ_USERS,
  ]);

  return (
    <UserWalletAvatarFrame {...props} canReadUsers={canReadUsers} ref={ref} />
  );
});
AdminEnabledUserWalletAvatar.displayName = 'AdminEnabledUserWalletAvatar';

const UserWalletAvatarFrame = forwardRef<
  HTMLDivElement,
  Omit<UserWalletAvatarProps, 'enableAdminLookupButtons'> & {
    canReadUsers: boolean;
  }
>(function UserWalletAvatarFrame(
  {
    address,
    fallback,
    adminOpenTarget = 'user',
    userId,
    canReadUsers,
    ...props
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const stopInfoIconPropagation = (
    event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="group/user-wallet-avatar relative flex shrink-0 overflow-visible">
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
        {address ? (
          <LazyWalletAvatarImage
            address={address}
            className={cn('bg-[#f26202] rounded-full', props.className)}
          />
        ) : null}
        <AvatarFallback className="rounded-lg">{fallback ?? ''}</AvatarFallback>
      </Avatar>
      {canReadUsers && address ? (
        adminOpenTarget === 'wallet' ? (
          <LazyAdminWalletDetailsButton
            walletAddress={address}
            variant="outline"
            size="icon-xs"
            title="Open wallet details"
            onMouseDown={stopInfoIconPropagation}
            onMouseUp={stopInfoIconPropagation}
            onPointerDown={stopInfoIconPropagation}
            onPointerUp={stopInfoIconPropagation}
            onClick={stopInfoIconPropagation}
            className="pointer-events-none absolute inset-0 z-10 m-auto rounded-full border bg-background/95 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 group-hover/user-wallet-avatar:pointer-events-auto group-hover/user-wallet-avatar:opacity-100 group-focus-within/user-wallet-avatar:pointer-events-auto group-focus-within/user-wallet-avatar:opacity-100"
          >
            <Info className="h-3.5 w-3.5" />
          </LazyAdminWalletDetailsButton>
        ) : (
          <LazyAdminUserLookupButton
            reference={userId ? { userId } : { walletAddress: address }}
            variant="outline"
            size="icon-xs"
            title="Open account details"
            onMouseDown={stopInfoIconPropagation}
            onMouseUp={stopInfoIconPropagation}
            onPointerDown={stopInfoIconPropagation}
            onPointerUp={stopInfoIconPropagation}
            onClick={stopInfoIconPropagation}
            className="pointer-events-none absolute inset-0 z-10 m-auto rounded-full border bg-background/95 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 group-hover/user-wallet-avatar:pointer-events-auto group-hover/user-wallet-avatar:opacity-100 group-focus-within/user-wallet-avatar:pointer-events-auto group-focus-within/user-wallet-avatar:opacity-100"
          >
            <Info className="h-3.5 w-3.5" />
          </LazyAdminUserLookupButton>
        )
      ) : null}
    </div>
  );
});
UserWalletAvatarFrame.displayName = 'UserWalletAvatarFrame';

type CurrentUserAvatarProps = ComponentProps<typeof Avatar> & {
  enableAdminLookupButtons?: boolean;
};

export const CurrentUserAvatar = forwardRef<
  HTMLDivElement,
  CurrentUserAvatarProps
>(
  (
    { enableAdminLookupButtons = true, ...props }: CurrentUserAvatarProps,
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
        enableAdminLookupButtons={enableAdminLookupButtons}
        {...props}
        ref={ref}
      />
    );
  },
);

CurrentUserAvatar.displayName = 'CurrentUserAvatar';
