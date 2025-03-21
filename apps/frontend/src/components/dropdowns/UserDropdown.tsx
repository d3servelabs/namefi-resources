'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/shadcn/avatar';
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
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { abbreviation, shortage } from '@/utils/string';
import { useLogin, useLogout } from '@privy-io/react-auth';
import {
  Loader2Icon,
  LogOutIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useCallback,
} from 'react';

export type UserDropdownProps = HTMLAttributes<HTMLDivElement> & {
  collapsed?: boolean;
};

export const UserDropdown: ForwardRefExoticComponent<UserDropdownProps> =
  forwardRef<HTMLDivElement, UserDropdownProps>(function UserDropdown(
    { collapsed, className, ...rest }: UserDropdownProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { isLoading, isAuthenticated, privyUser } = useAuth();

    const name =
      privyUser?.wallet?.address ||
      privyUser?.email?.address ||
      privyUser?.id ||
      'ME';

    const { login } = useLogin({
      onComplete: () => {},
      onError: () => {},
    });

    const { logout } = useLogout({
      onSuccess: () => {},
    });

    const handleConnect = useCallback(() => {
      login();
    }, [login]);

    const handleDisconnect = useCallback(async () => {
      await logout();
    }, [logout]);

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
            {!collapsed && (
              <span>{isLoading ? 'Loading...' : 'Connect Wallet'}</span>
            )}
          </Button>
        )}

        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent w-full data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage alt={name} />
                  <AvatarFallback className="rounded-lg">
                    {abbreviation(name.replace('0x', ''), true)}
                  </AvatarFallback>
                </Avatar>
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
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild={true}>
                  <DropdownMenuItem className="text-red-500">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to sign out?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out? Any unsaved changes
                      will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect}>
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  });

UserDropdown.displayName = 'UserDropdown';
