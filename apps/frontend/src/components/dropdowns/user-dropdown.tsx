'use client';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { SidebarMenuButton, useSidebar } from '@/components/ui/shadcn/sidebar';
import { useAuth, useLogin, useLogout } from '@/hooks/use-auth';
import type { NavItem } from '@/lib/types/nav-item';
import { shortage } from '@/lib/string';
import {
  Loader2Icon,
  LogOutIcon,
  MoreHorizontalIcon,
  UserIcon,
  WalletIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import { CurrentUserAvatar } from '../user-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Permission } from '@namefi-astra/utils';
import { useHasPermissions } from '@/components/access/PermissionGate';

const BASE_ITEMS: NavItem[] = [
  { title: 'Profile', href: '/profile', icon: UserIcon },
];

export type UserDropdownProps = HTMLAttributes<HTMLDivElement> & {
  forceExpanded?: boolean;
  disableBackdropBlur?: boolean;
};

export const UserDropdown: ForwardRefExoticComponent<UserDropdownProps> =
  forwardRef<HTMLDivElement, UserDropdownProps>(function UserDropdown(
    {
      forceExpanded = true,
      disableBackdropBlur = false,
      ...rest
    }: UserDropdownProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
    const { state: sidebarState, isMobile } = useSidebar();
    const { isLoading, isAuthenticated, privyUser } = useAuth();
    const { login } = useLogin();
    const { logout } = useLogout();

    const name =
      privyUser?.wallet?.address ||
      privyUser?.email?.address ||
      privyUser?.google?.email ||
      privyUser?.id ||
      'ME';

    const handleConnect = useCallback(() => {
      login(); // Uses default loginMethods from centralized hook
    }, [login]);

    const handleSignOut = useCallback(async () => {
      await logout(); // Callbacks are already configured in the hook
      setIsSignOutDialogOpen(false);
    }, [logout]);
    const trpc = useTRPC();
    const pbnOwnerQuery = useQuery(
      trpc.pbnOwner.isUserAPoweredByNamefiOwner.queryOptions(undefined, {
        enabled: isAuthenticated,
      }),
    );
    const { hasPermissions: canViewAdminDashboard } = useHasPermissions(
      [Permission.VIEW_ADMIN_DASHBOARD],
      'every',
    );

    const items: NavItem[] = useMemo(() => {
      const out: NavItem[] = [...BASE_ITEMS];
      if (canViewAdminDashboard) {
        out.unshift({
          title: 'Admin Dashboard',
          href: '/admin',
          icon: SettingsIcon,
        });
      }
      if (pbnOwnerQuery.data?.isOwner) {
        out.unshift({
          title: 'Powered Domains',
          href: '/powered-by-namefi/admin',
          icon: WalletIcon,
        });
      }
      return out;
    }, [canViewAdminDashboard, pbnOwnerQuery.data?.isOwner]);

    const isExpanded = useMemo(() => {
      return forceExpanded || sidebarState !== 'collapsed' || isMobile;
    }, [forceExpanded, sidebarState, isMobile]);

    return (
      <div ref={ref} {...rest}>
        {/* Sign Out Confirmation Dialog */}
        <AlertDialog
          open={isSignOutDialogOpen}
          onOpenChange={setIsSignOutDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to sign out?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? Any unsaved changes will be
                lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                className="text-red-500"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AnimatePresence initial={false} mode="popLayout">
          {isLoading && (
            <motion.div
              key="user-loading"
              initial={{ opacity: 0, y: -12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.28, ease: 'easeOut' },
              }}
              exit={{
                opacity: 0,
                y: -12,
                transition: { duration: 0.2, ease: 'easeIn' },
              }}
              layout
            >
              <Button className="w-full" disabled={true}>
                <Loader2Icon className="animate-spin size-6" />
                {isExpanded && <span>Loading...</span>}
              </Button>
            </motion.div>
          )}

          {!isLoading && !isAuthenticated && (
            <motion.div
              key="user-signedout"
              initial={{ opacity: 0, y: -12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
              exit={{
                opacity: 0,
                y: -12,
                transition: { duration: 0.22, ease: 'easeIn' },
              }}
              layout
            >
              <Button className="w-full" onClick={handleConnect}>
                <WalletIcon className="size-6" />
                {isExpanded && <span>Sign In</span>}
              </Button>
            </motion.div>
          )}

          {!isLoading && isAuthenticated && (
            <motion.div
              key="user-authed"
              initial={{ opacity: 0, y: -12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.32, ease: 'easeOut' },
              }}
              exit={{
                opacity: 0,
                y: -12,
                transition: { duration: 0.22, ease: 'easeIn' },
              }}
              layout
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild={true}>
                  <SidebarMenuButton
                    size="lg"
                    className={cn(
                      'w-full bg-transparent hover:bg-sidebar-accent hover:backdrop-blur-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                      !disableBackdropBlur && 'backdrop-blur-xl',
                    )}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.28, ease: 'easeOut' },
                      }}
                      className="shrink-0"
                      layout
                    >
                      <CurrentUserAvatar />
                    </motion.div>
                    {isExpanded && (
                      <>
                        <motion.span
                          className="text-sm hidden md:block"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.24,
                              ease: 'easeOut',
                              delay: 0.03,
                            },
                          }}
                          layout
                        >
                          {shortage(name, 11)}
                        </motion.span>
                        <motion.span
                          className="ml-auto"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.24,
                              ease: 'easeOut',
                              delay: 0.05,
                            },
                          }}
                          layout
                        >
                          <MoreHorizontalIcon className="h-5 w-5" />
                        </motion.span>
                      </>
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {items.map((item) => {
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
                    onClick={() => setIsSignOutDialogOpen(true)}
                    className="text-red-500"
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

UserDropdown.displayName = 'UserDropdown';
