'use client';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/shadcn/sidebar';
import { useConfirm } from '@/contexts';
import { useCart } from '@/hooks/landing/use-cart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { LocalStorageKeys } from '@/utils/localStorageKeys';
import { shortage } from '@/utils/string';
import { useTRPC } from '@/utils/trpc';
import { type User, useLogin, useLogout } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import { addDays, isAfter } from 'date-fns';
import {
  Loader2Icon,
  LogOutIcon,
  MoreHorizontalIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
import { CurrentUserAvatar } from '../UserAvatar';

const ITEMS: NavItem[] = [
  { title: 'Profile', href: '/profile', icon: UserIcon },
];

export type UserDropdownProps = HTMLAttributes<HTMLDivElement> & {
  collapsed?: boolean;
};

export const UserDropdown: ForwardRefExoticComponent<UserDropdownProps> =
  forwardRef<HTMLDivElement, UserDropdownProps>(function UserDropdown(
    { collapsed, className, ...rest }: UserDropdownProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const confirm = useConfirm();
    const { clearLocalCart } = useCart();

    const {
      isLoading,
      isAuthenticated,
      privyUser,
      user: namefiUser,
    } = useAuth();

    const trpc = useTRPC();
    const { mutate: updateUser } = useMutation(
      trpc.users.updateUser.mutationOptions({}),
    );

    const [
      missingEmailToastLastDismissedDate,
      setMissingEmailToastLastDismissedDate,
    ] = useLocalStorage<string | null>(
      LocalStorageKeys.MISSING_EMAIL_TOAST_LAST_SHOWN_DATE,
      null,
    );

    const missingEmailToastDismissalExpired = useCallback(
      (currentDate: Date) => {
        if (!missingEmailToastLastDismissedDate) {
          return true;
        }

        const lastShownDate = new Date(missingEmailToastLastDismissedDate);
        if (isAfter(currentDate, addDays(lastShownDate, 3))) {
          return true;
        }

        return false;
      },
      [missingEmailToastLastDismissedDate],
    );

    // keep Privy email address and Namefi email address in sync
    useEffect(() => {
      if (isLoading || !isAuthenticated) {
        return;
      }

      if (!(privyUser && namefiUser)) {
        return;
      }

      // add email to db if missing but connected to PrivyUser
      if (!namefiUser.primaryEmail && privyUser.email?.address) {
        updateUser({ data: { primaryEmail: privyUser.email.address } });
        return;
      }

      // remove email from db if no longer connected to PrivyUser
      if (namefiUser.primaryEmail && !privyUser.email?.address) {
        updateUser({ data: { primaryEmail: null } });
        return;
      }
    }, [isAuthenticated, isLoading, namefiUser, privyUser, updateUser]);

    const name =
      privyUser?.wallet?.address ||
      privyUser?.email?.address ||
      privyUser?.google?.email ||
      privyUser?.id ||
      'ME';

    const { login } = useLogin({
      onComplete: ({ user }: { user: User }) => {
        const now = new Date();
        // Show warning if user is logged in but has no email associated with their account
        if (!user.email?.address && missingEmailToastDismissalExpired(now)) {
          toast.info('Consider Adding Your Email', {
            id: 'missing-email-warning-on-login',
            description:
              'We send important notifications via email (including order status updates)',
            action: (
              <Button asChild={true} size={'sm'}>
                <Link href={'/profile'}>Visit Profile</Link>
              </Button>
            ),
            closeButton: true,

            onDismiss: () => {
              setMissingEmailToastLastDismissedDate(now.toString());
            },
          });
        }
      },
      onError: () => {},
    });

    const { logout } = useLogout({
      onSuccess: () => {
        // Clear the local cart when the user logs out
        clearLocalCart();
      },
    });

    const handleConnect = useCallback(() => {
      login({
        loginMethods: ['email', 'wallet'],
      });
    }, [login]);

    const handleDisconnect = useCallback(async () => {
      confirm({
        title: 'Are you sure you want to sign out?',
        description:
          'Are you sure you want to sign out? Any unsaved changes will be lost.',
        cancelText: 'Cancel',
        confirmText: 'Sign Out',
        onConfirm: async () => {
          await logout();
        },
        onCancel: () => {},
      });
    }, [logout, confirm]);

    return (
      <div ref={ref} className={cn('', className)} {...rest}>
        {!isAuthenticated && (
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleConnect}
          >
            {isLoading ? (
              <Loader2Icon className="animate-spin size-6" />
            ) : (
              <WalletIcon className="size-6" />
            )}
            {!collapsed && <span>{isLoading ? 'Loading...' : 'Sign In'}</span>}
          </Button>
        )}

        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent w-full data-[state=open]:text-sidebar-accent-foreground"
              >
                <CurrentUserAvatar />
                {!collapsed && (
                  <span className="text-sm hidden md:block">
                    {shortage(name, 11)}
                  </span>
                )}
                {!collapsed && (
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon className="h-5 w-5" />
                  </Button>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ITEMS.map((item) => {
                const Icon = item.icon;

                return (
                  <DropdownMenuItem key={item.href} asChild={true}>
                    <Link href={item.href}>
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDisconnect}
                className="text-red-500"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  });

UserDropdown.displayName = 'UserDropdown';
