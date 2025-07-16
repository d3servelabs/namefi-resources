'use client';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/shadcn/sidebar';
import { useConfirm } from '@/contexts';
import { useCartContext } from '@/providers/cart';
import { useAuth } from '@/hooks/use-auth';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { shortage } from '@/utils/string';
import { type User, useLogin, useLogout } from '@privy-io/react-auth';
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
} from 'react';
import { CurrentUserAvatar } from '../user-avatar';

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
    const { clearLocalCart } = useCartContext();

    const { isLoading, isAuthenticated, privyUser } = useAuth();

    const { showEmailPrompt } = useEmailPrompt();

    const name =
      privyUser?.wallet?.address ||
      privyUser?.email?.address ||
      privyUser?.google?.email ||
      privyUser?.id ||
      'ME';

    const { login } = useLogin({
      onComplete: ({ user }: { user: User }) => {
        // Show warning if user is logged in but has no email associated with their account
        if (!user.email?.address) {
          showEmailPrompt();
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
                  <MoreHorizontalIcon className="h-5 w-5 ml-auto" />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  });

UserDropdown.displayName = 'UserDropdown';
