'use client';
import { HeaderActionButton } from '@/components/header-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Button } from '@/components/ui/shadcn/button';
import { useSidebar } from '@/components/ui/shadcn/sidebar';
import { useAuth, useLogin, useLogout } from '@/hooks/use-auth';
import { useUserWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import {
  useUserChainBalances,
  type ChainBalance,
} from '@/hooks/use-user-chain-balances';
import type { NavItem } from '@/lib/types/nav-item';
import { reportReactBoundaryError } from '@/lib/datadog-react-error';
import { formatAmountInUSD } from '@/lib/number';
import { getShortAddress, shortage } from '@/lib/string';
import { getUserDisplayName } from '@/lib/user';
import {
  Loader2Icon,
  LogOutIcon,
  MoreHorizontalIcon,
  UserIcon,
  WalletIcon,
  Settings as SettingsIcon,
  CoinsIcon,
  LayoutListIcon,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type ErrorInfo,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Permission } from '@namefi-astra/utils/permissions';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { useAdminFeatureFlagsSheet } from '@/components/admin/feature-flags/context';
import { AdminFeatureFlagsSheet } from '@/components/admin/feature-flags/sheet';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAdminFeatureFlag } from '../admin/feature-flags/use-flag';
import { useRegisterAdminFlags } from '../admin/feature-flags/register';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { ErrorBoundary } from '@suspensive/react';

import {
  flatten,
  compose,
  intersperse,
  filter,
  isNotEmpty,
  isNotNil,
  both,
} from 'ramda';

export type UserDropdownProps = HTMLAttributes<HTMLDivElement> & {
  forceExpanded?: boolean;
  disableBackdropBlur?: boolean;
};

const FEATURE_FLAGS_ITEMS: FeatureFlagDefinition[] = [
  {
    key: 'show_balance_in_user_dropdown',
    label: 'Show Balance in User Dropdown',
    scope: 'global',
    defaultValue: true,
  },
];

/**
 * To Add NavItems to the UserDropdown, go to @see {getUserDropdownItems}
 */

export const UserDropdown = ErrorBoundary.with(
  { fallback: <div>Error</div> },
  forwardRef<HTMLDivElement, UserDropdownProps>(function UserDropdown(
    {
      forceExpanded = true,
      disableBackdropBlur = false,
      className,
      ...rest
    }: UserDropdownProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    useRegisterAdminFlags(FEATURE_FLAGS_ITEMS);
    const [showBalanceInUserDropdown] = useAdminFeatureFlag(
      FEATURE_FLAGS_ITEMS[0],
    );

    const { state: sidebarState, isMobile } = useSidebar();
    const { isLoading, isAuthenticated, privyUser } = useAuth();
    const { login: handleConnect } = useLogin();

    // Resolves the display name based on user metadata/availability
    const name = getUserDisplayName(privyUser);

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

    const items: UserDropdownItemProps[] = useMemo(() => {
      return getUserDropdownItems({
        canViewAdminDashboard,
        isPbnOwner: pbnOwnerQuery.data?.isOwner ?? false,
        showBalanceInUserDropdown,
      });
    }, [
      canViewAdminDashboard,
      pbnOwnerQuery.data?.isOwner,
      showBalanceInUserDropdown,
    ]);

    const isExpanded = useMemo(() => {
      return forceExpanded || sidebarState !== 'collapsed' || isMobile;
    }, [forceExpanded, sidebarState, isMobile]);

    const shouldStretch = useMemo(
      () => !forceExpanded && sidebarState !== 'collapsed' && !isMobile,
      [forceExpanded, sidebarState, isMobile],
    );

    const actionVariant = isExpanded ? 'pill' : 'icon';
    const expandedPaddingClass = isExpanded ? 'pl-[3px] pr-4' : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          !isExpanded && !shouldStretch && 'flex justify-center',
          className,
        )}
        {...rest}
      >
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
              <HeaderActionButton
                actionVariant={actionVariant}
                disableBackdropBlur={disableBackdropBlur}
                stretch={shouldStretch}
                className={cn(
                  expandedPaddingClass,
                  !isExpanded && 'text-white/90',
                )}
                disabled={true}
              >
                <Loader2Icon className="animate-spin size-6" />
                {isExpanded && <span>Loading...</span>}
              </HeaderActionButton>
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
              <HeaderActionButton
                actionVariant={actionVariant}
                disableBackdropBlur={disableBackdropBlur}
                stretch={shouldStretch}
                className={expandedPaddingClass}
                onClick={handleConnect as any}
              >
                <WalletIcon className="size-6" />
                {isExpanded && <span>Sign In</span>}
              </HeaderActionButton>
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
                <DropdownMenuTrigger
                  render={
                    <HeaderActionButton
                      actionVariant={actionVariant}
                      disableBackdropBlur={disableBackdropBlur}
                      stretch={shouldStretch}
                      className={expandedPaddingClass}
                    />
                  }
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
                        className="hidden text-sm md:block"
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
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {items.map((item, index) =>
                    item ? (
                      <UserDropdownItem
                        key={`${item.type}-${'title' in item ? item.title : `unknown-${index}`}`}
                        item={item}
                      />
                    ) : (
                      <div>error</div>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }) as ForwardRefExoticComponent<UserDropdownProps>,
);
UserDropdown.displayName = 'UserDropdown';

type BalanceBreakdownDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chainBalances: ChainBalance[];
  totalBalanceInUsdCents: number;
  isLoadingBalances: boolean;
  walletAddresses: `0x${string}`[];
};

function BalanceBreakdownDialog({
  open,
  onOpenChange,
  chainBalances,
  totalBalanceInUsdCents,
  isLoadingBalances,
  walletAddresses,
}: BalanceBreakdownDialogProps) {
  const walletGroups = useMemo(() => {
    const addressMap = walletAddresses.map((walletAddress) => {
      const balances = chainBalances.filter(
        (balance) =>
          balance.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
      );
      return { walletAddress, balances };
    });

    return addressMap.filter((group) => group.balances.length > 0);
  }, [chainBalances, walletAddresses]);

  const hasWallets = walletAddresses.length > 0;
  const hasBalances = chainBalances.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>NFSC Balance</DialogTitle>
          <DialogDescription>
            Review your available $NFSC across linked wallets and supported
            chains.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Available
            </div>
            <div className="text-2xl font-semibold">
              {formatAmountInUSD(totalBalanceInUsdCents, true)} NFSC
            </div>
          </div>
          {isLoadingBalances ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Fetching balances...
            </div>
          ) : !hasWallets ? (
            <EmptyState message="Link or connect a wallet to view your $NFSC balances." />
          ) : !hasBalances ? (
            <EmptyState message="No $NFSC detected across your wallets yet." />
          ) : (
            <div className="space-y-3">
              {walletGroups.map(({ walletAddress, balances }) => {
                const walletTotal = balances.reduce(
                  (sum, balance) => sum + balance.balanceInUsdCents,
                  0,
                );
                return (
                  <div
                    key={walletAddress}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{getShortAddress(walletAddress)}</span>
                      <span>{formatAmountInUSD(walletTotal, true)} NFSC</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {balances.map((balance) => (
                        <div
                          key={`${walletAddress}-${balance.chainId}`}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <span>{balance.chainName}</span>
                          <span className="font-medium text-foreground">
                            {formatAmountInUSD(balance.balanceInUsdCents, true)}{' '}
                            NFSC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:flex-1"
            onClick={() => onOpenChange(false)}
            render={<Link href="/payment-methods" />}
            nativeButton={false}
          >
            Go to Payment Methods
          </Button>
          <Button
            className="w-full sm:flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EmptyStateProps = {
  message: string;
};

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuItem>;
type UserDropdownItemProps =
  | (NavItem & { type: 'link'; customProps?: DropdownMenuItemProps })
  | { custom: React.ReactNode; type: 'custom' }
  | { type: 'separator' }
  | (Omit<NavItem, 'href'> & {
      onClick?: (e: React.MouseEvent<any>) => void;
      type: 'button';
      customProps?: DropdownMenuItemProps;
    });

const joinNavItemGroups = compose<
  any[],
  UserDropdownItemProps[],
  UserDropdownItemProps[],
  UserDropdownItemProps[],
  UserDropdownItemProps[]
>(
  filter(both(isNotNil, Boolean)), // Remove nulls
  flatten, // Flatten the array of arrays into a single array
  intersperse({ type: 'separator' } as UserDropdownItemProps), // Add separators between groups
  filter(compose(isNotEmpty, filter(both(isNotNil, Boolean)))), // Remove nulls and empty arrays
);

const logUserDropdownItemError = (error: Error, info: ErrorInfo) => {
  reportReactBoundaryError('UserDropdownItem', error, info);
};

const UserDropdownItem = ({ item }: { item: UserDropdownItemProps }) => {
  return (
    <ErrorBoundary fallback={<></>} onError={logUserDropdownItemError}>
      <UserDropdownItemInner item={item} />
    </ErrorBoundary>
  );
};

const UserDropdownItemInner = ({ item }: { item: UserDropdownItemProps }) => {
  const Icon = 'icon' in item ? item.icon : undefined;
  switch (item.type) {
    case 'link':
      return (
        <DropdownMenuItem
          render={<Link href={item.href} />}
          {...item.customProps}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          <span>{item.title}</span>
        </DropdownMenuItem>
      );
    case 'custom':
      return item.custom;
    case 'separator':
      return <DropdownMenuSeparator />;
    case 'button':
      return (
        <DropdownMenuItem
          key={`${item.title}-${item.type}`}
          onClick={item.onClick}
          {...item.customProps}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          <span>{item.title}</span>
        </DropdownMenuItem>
      );
    default:
      return null;
  }
};

const BASE_ITEMS: UserDropdownItemProps[] = [
  { type: 'link', title: 'My Domains', href: '/my-domains', icon: Globe },
  { type: 'link', title: 'Profile', href: '/profile', icon: UserIcon },
];

function getUserDropdownItems(options: {
  canViewAdminDashboard: boolean;
  isPbnOwner: boolean;
  showBalanceInUserDropdown: boolean;
}): UserDropdownItemProps[] {
  const { canViewAdminDashboard, isPbnOwner, showBalanceInUserDropdown } =
    options;

  const items: (UserDropdownItemProps | boolean | undefined | null)[][] = [
    showBalanceInUserDropdown
      ? [
          {
            type: 'custom',
            custom: <UserBalanceDropdownItem key="user-balance" />,
          },
        ]
      : [],
    [
      canViewAdminDashboard && {
        type: 'link',
        title: 'Admin Dashboard',
        href: '/admin',
        icon: SettingsIcon,
      },
      canViewAdminDashboard && {
        type: 'custom',
        custom: <AdminFeatureFlagsDropdownItem key="admin-feature-flags" />,
      },
      isPbnOwner && {
        type: 'link',
        title: 'Powered Domains',
        href: '/powered-by-namefi/admin',
        icon: WalletIcon,
      },
    ],
    BASE_ITEMS,
    [
      {
        type: 'custom',
        custom: <LogoutDropdownItem key="logout" />,
      },
    ],
  ];
  return joinNavItemGroups(items) as UserDropdownItemProps[];
}

function UserBalanceDropdownItem() {
  const { userWalletAddresses } = useUserWalletAddresses();
  const nfscWalletAddresses = useMemo(
    () =>
      userWalletAddresses.filter(
        (address): address is `0x${string}` =>
          typeof address === 'string' && address.startsWith('0x'),
      ),
    [userWalletAddresses],
  );
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);

  const { chainBalances, totalBalanceInUsdCents, isLoadingBalance } =
    useUserChainBalances({
      enabled: nfscWalletAddresses.length > 0,
      walletAddresses: nfscWalletAddresses,
    });
  const formattedBalance = formatAmountInUSD(totalBalanceInUsdCents, true);

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsBalanceDialogOpen(true);
        }}
        className="cursor-pointer"
      >
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <CoinsIcon className="h-4 w-4" />
            <span>Balance</span>
          </div>
          <div className="flex flex-col items-end leading-tight font-mono">
            {isLoadingBalance ? (
              <Skeleton className="h-6 w-[10ch] bg-white/20" />
            ) : (
              <span className="text-sm font-semibold">
                {nfscWalletAddresses.length > 0
                  ? `${formattedBalance} NFSC`
                  : '0.00 NFSC'}
              </span>
            )}
          </div>
        </div>
      </DropdownMenuItem>
      <BalanceBreakdownDialog
        open={isBalanceDialogOpen}
        onOpenChange={setIsBalanceDialogOpen}
        chainBalances={chainBalances}
        totalBalanceInUsdCents={totalBalanceInUsdCents}
        isLoadingBalances={isLoadingBalance}
        walletAddresses={nfscWalletAddresses}
      />
    </>
  );
}

function LogoutDropdownItem() {
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const { logout } = useLogout();
  const handleSignOut = useCallback(async () => {
    await logout(); // Callbacks are already configured in the hook
    setIsSignOutDialogOpen(false);
  }, [logout]);

  return (
    <>
      <UserDropdownItem
        item={{
          type: 'button',
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSignOutDialogOpen(true);
          },
          title: 'Log Out',
          icon: LogOutIcon,
          customProps: {
            className: 'text-red-500',
            closeOnClick: false,
          },
        }}
      />
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
            <AlertDialogAction onClick={handleSignOut} className="text-red-500">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AdminFeatureFlagsDropdownItem() {
  const { setOpen: openFeatureFlags } = useAdminFeatureFlagsSheet();
  return (
    <>
      <UserDropdownItem
        item={{
          type: 'button',
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFeatureFlags(true);
          },
          title: 'Admin Feature Flags',
          icon: LayoutListIcon,
        }}
      />
      <AdminFeatureFlagsSheet />
    </>
  );
}
