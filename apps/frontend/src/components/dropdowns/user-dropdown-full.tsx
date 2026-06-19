'use client';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { LanguageMenuSub } from '@/components/i18n/language-menu-sub';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { useAuth } from '@/hooks/use-auth';
import { useLogout } from '@/hooks/use-logout';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import { useUserChainBalances } from '@/hooks/use-user-chain-balances';
import type { NavItem } from '@/lib/types/nav-item';
import { reportReactBoundaryError } from '@/lib/datadog-react-error';
import { formatAmountInUSD } from '@/lib/number';
import { getShortAddress } from '@/lib/string';
import type { LucideIcon } from 'lucide-react';
import {
  Loader2Icon,
  LogOutIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  Settings as SettingsIcon,
  ShieldIcon,
  CoinsIcon,
  ClipboardListIcon,
  FileTextIcon,
  BarChart3Icon,
  SparklesIcon,
  LayoutListIcon,
  Globe,
  RefreshCwIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Route } from 'next';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ErrorInfo,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Permission } from '@namefi-astra/utils/permissions';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { useAdminFeatureFlagsSheet } from '@/components/admin/feature-flags/context';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { ErrorBoundary } from '@suspensive/react';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import type { AdminUserLookupReference } from '@/components/admin/user-details';
import { useDebounceValue } from 'usehooks-ts';
import { SHOW_BALANCE_IN_USER_DROPDOWN_FLAG } from '@/lib/openfeature-flags';

import {
  flatten,
  intersperse,
  filter,
  isNotEmpty,
  isNotNil,
  both,
} from 'ramda';

type BalanceBreakdownDialogComponent =
  typeof import('@/components/payment-method/nfsc-balance-dialog').BalanceBreakdownDialogRuntime;

let balanceBreakdownDialogPromise: Promise<BalanceBreakdownDialogComponent> | null =
  null;

function loadBalanceBreakdownDialog(): Promise<BalanceBreakdownDialogComponent> {
  balanceBreakdownDialogPromise ??= import(
    '@/components/payment-method/nfsc-balance-dialog'
  )
    .then((mod) => mod.BalanceBreakdownDialogRuntime)
    .catch((error) => {
      balanceBreakdownDialogPromise = null;
      throw error;
    });
  return balanceBreakdownDialogPromise;
}

type AdminUserLookupDialogComponent =
  typeof import('@/components/admin/user-details').AdminUserLookupDialog;

let adminUserLookupDialogPromise: Promise<AdminUserLookupDialogComponent> | null =
  null;

function loadAdminUserLookupDialog(): Promise<AdminUserLookupDialogComponent> {
  adminUserLookupDialogPromise ??= import('@/components/admin/user-details')
    .then((mod) => mod.AdminUserLookupDialog)
    .catch((error) => {
      adminUserLookupDialogPromise = null;
      throw error;
    });
  return adminUserLookupDialogPromise;
}

/**
 * To Add NavItems to the UserDropdown, go to @see {getUserDropdownItems}
 */

export const UserDropdownMenu = ErrorBoundary.with(
  {
    fallback: (
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled>Unable to load menu.</DropdownMenuItem>
      </DropdownMenuContent>
    ),
  },
  function UserDropdownMenu() {
    const t = useTranslations('common');
    const [showBalanceInUserDropdown] = useAdminFeatureFlag(
      SHOW_BALANCE_IN_USER_DROPDOWN_FLAG,
    );

    const { isAuthenticated } = useAuth();

    const trpc = useTRPC();
    const pbnOwnerQuery = useQuery(
      trpc.pbnOwner.isUserAPoweredByNamefiOwner.queryOptions(undefined, {
        enabled: isAuthenticated,
      }),
    );
    const { hasPermissions: canReadUsers } = useHasPermissions(
      [Permission.READ_USERS],
      'every',
    );
    const { hasPermissions: canViewAdminDashboard } = useHasPermissions(
      [Permission.VIEW_ADMIN_DASHBOARD],
      'every',
    );
    const [isFindUserDialogOpen, setIsFindUserDialogOpen] = useState(false);
    const [isAdminQuickAccessOpen, setIsAdminQuickAccessOpen] = useState(false);
    const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
    // Balance dialog state lives here (not inside the dropdown item) so the
    // dialog survives the dropdown closing on item-click. Otherwise the menu
    // item unmounts and takes the dialog down with it.
    const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
    const [hasOpenedBalanceDialog, setHasOpenedBalanceDialog] = useState(false);
    const [BalanceBreakdownDialog, setBalanceBreakdownDialog] =
      useState<BalanceBreakdownDialogComponent | null>(null);
    const [isBalanceDialogLoading, setIsBalanceDialogLoading] = useState(false);
    const [balanceDialogError, setBalanceDialogError] = useState<string | null>(
      null,
    );

    const requestBalanceBreakdownDialog = useCallback(() => {
      if (BalanceBreakdownDialog) return;
      setIsBalanceDialogLoading(true);
      setBalanceDialogError(null);
      void loadBalanceBreakdownDialog()
        .then((Component) => {
          setBalanceBreakdownDialog(() => Component);
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : t('account.balanceLoadFailedDescription');
          setBalanceDialogError(message);
          toast.error(t('account.balanceLoadFailed'), {
            description: message,
          });
        })
        .finally(() => {
          setIsBalanceDialogLoading(false);
        });
    }, [BalanceBreakdownDialog, t]);

    // Data fetched once at the parent and shared between the dropdown preview
    // and the dialog content; react-query dedupes the underlying request.
    const { linkedWallets } = useLinkedWallets();
    const nfscWalletAddresses = useMemo(
      () =>
        linkedWallets
          .map(({ address }) => address)
          .filter(
            (address): address is `0x${string}` =>
              typeof address === 'string' && address.startsWith('0x'),
          ),
      [linkedWallets],
    );
    const { chainBalances, totalBalanceInUsdCents, isLoadingBalance } =
      useUserChainBalances({
        enabled:
          isAuthenticated &&
          showBalanceInUserDropdown &&
          nfscWalletAddresses.length > 0,
        walletAddresses: nfscWalletAddresses,
      });

    const items: UserDropdownItemProps[] = useMemo(() => {
      return getUserDropdownItems({
        showBalanceInUserDropdown,
        balanceItem: {
          onOpen: () => {
            setHasOpenedBalanceDialog(true);
            setIsBalanceDialogOpen(true);
            requestBalanceBreakdownDialog();
          },
          totalBalanceInUsdCents,
          isLoadingBalance,
          hasWallets: nfscWalletAddresses.length > 0,
        },
        onOpenLogout: () => setIsSignOutDialogOpen(true),
      });
    }, [
      showBalanceInUserDropdown,
      totalBalanceInUsdCents,
      isLoadingBalance,
      nfscWalletAddresses.length,
      requestBalanceBreakdownDialog,
    ]);

    return (
      <>
        <DropdownMenuContent align="end" className="w-56">
          {(canReadUsers ||
            canViewAdminDashboard ||
            pbnOwnerQuery.data?.isOwner) && (
            <AdminDropdownSection
              canReadUsers={canReadUsers}
              canViewAdminDashboard={canViewAdminDashboard}
              isPbnOwner={pbnOwnerQuery.data?.isOwner ?? false}
              onOpenFindUser={() => setIsFindUserDialogOpen(true)}
              onOpenAdminQuickAccess={() => setIsAdminQuickAccessOpen(true)}
            />
          )}

          {items.map((item, index) => (
            <UserDropdownItem
              key={`${item.type}-${'title' in item ? item.title : `unknown-${index}`}`}
              item={item}
            />
          ))}

          <DropdownMenuSeparator />
          <LanguageMenuSub />
        </DropdownMenuContent>
        <FindUserDialog
          open={isFindUserDialogOpen}
          onOpenChange={setIsFindUserDialogOpen}
        />
        <AdminQuickAccessDialog
          open={isAdminQuickAccessOpen}
          onOpenChange={setIsAdminQuickAccessOpen}
        />
        <SignOutDialog
          open={isSignOutDialogOpen}
          onOpenChange={setIsSignOutDialogOpen}
        />
        {hasOpenedBalanceDialog && BalanceBreakdownDialog ? (
          <BalanceBreakdownDialog
            open={isBalanceDialogOpen}
            onOpenChange={setIsBalanceDialogOpen}
            chainBalances={chainBalances}
            totalBalanceInUsdCents={totalBalanceInUsdCents}
            isLoadingBalances={isLoadingBalance}
            walletAddresses={nfscWalletAddresses}
          />
        ) : null}
        {hasOpenedBalanceDialog && !BalanceBreakdownDialog ? (
          <LazyDialogStatus
            open={isBalanceDialogOpen}
            onOpenChange={setIsBalanceDialogOpen}
            title={t('account.balance')}
            loadingLabel={t('account.loadingBalanceDetails')}
            errorMessage={balanceDialogError}
            isLoading={isBalanceDialogLoading}
            onRetry={requestBalanceBreakdownDialog}
          />
        ) : null}
      </>
    );
  },
);
UserDropdownMenu.displayName = 'UserDropdownMenu';

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
  | { custom: ReactNode; type: 'custom' }
  | { type: 'separator' }
  | (Omit<NavItem, 'href'> & {
      onClick?: (e: MouseEvent<HTMLElement>) => void;
      type: 'button';
      customProps?: DropdownMenuItemProps;
    });

const joinNavItemGroups = (
  groups: (UserDropdownItemProps | boolean | undefined | null)[][],
) => {
  const filteredGroups = groups
    .map(
      (group) =>
        filter(both(isNotNil, Boolean), group) as UserDropdownItemProps[],
    )
    .filter((group) => isNotEmpty(group));

  return flatten(
    intersperse(
      [{ type: 'separator' } as UserDropdownItemProps],
      filteredGroups,
    ),
  ) as UserDropdownItemProps[];
};

const logUserDropdownItemError = (error: Error, info: ErrorInfo) => {
  reportReactBoundaryError('UserDropdownItem', error, info);
};

const UserDropdownItem = ({ item }: { item: UserDropdownItemProps }) => {
  return (
    <ErrorBoundary fallback={null} onError={logUserDropdownItemError}>
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
          nativeButton={false}
          render={<Link href={item.href as Route} />}
          {...item.customProps}
        >
          {Icon && <Icon className="me-2 h-4 w-4" />}
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
          {Icon && <Icon className="me-2 h-4 w-4" />}
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

type BalanceDropdownItemProps = {
  onOpen: () => void;
  totalBalanceInUsdCents: number;
  isLoadingBalance: boolean;
  hasWallets: boolean;
};

function getUserDropdownItems(options: {
  showBalanceInUserDropdown: boolean;
  balanceItem: BalanceDropdownItemProps;
  onOpenLogout: () => void;
}): UserDropdownItemProps[] {
  const { showBalanceInUserDropdown, balanceItem, onOpenLogout } = options;

  const items: (UserDropdownItemProps | boolean | undefined | null)[][] = [
    showBalanceInUserDropdown
      ? [
          {
            type: 'custom',
            custom: (
              <UserBalanceDropdownItem key="user-balance" {...balanceItem} />
            ),
          },
        ]
      : [],
    BASE_ITEMS,
    [
      {
        type: 'custom',
        custom: <LogoutDropdownItem key="logout" onOpen={onOpenLogout} />,
      },
    ],
  ];
  return joinNavItemGroups(items) as UserDropdownItemProps[];
}

function AdminDropdownSection({
  canReadUsers,
  canViewAdminDashboard,
  isPbnOwner,
  onOpenFindUser,
  onOpenAdminQuickAccess,
}: {
  canReadUsers: boolean;
  canViewAdminDashboard: boolean;
  isPbnOwner: boolean;
  onOpenFindUser: () => void;
  onOpenAdminQuickAccess: () => void;
}) {
  return (
    <>
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        Admin
      </div>
      {canReadUsers ? <FindUserDropdownItem onOpen={onOpenFindUser} /> : null}
      {canViewAdminDashboard ? (
        <AdminQuickAccessDropdownItem onOpen={onOpenAdminQuickAccess} />
      ) : null}
      {canViewAdminDashboard ? (
        <DropdownMenuItem
          nativeButton={false}
          render={<Link href="/dev-tools" />}
        >
          <SettingsIcon className="me-2 h-4 w-4" />
          <span>Dev Tools</span>
        </DropdownMenuItem>
      ) : null}
      {canViewAdminDashboard ? (
        <DropdownMenuItem
          nativeButton={false}
          render={<Link href="/customer-support" />}
        >
          <SettingsIcon className="me-2 h-4 w-4" />
          <span>Customer Support</span>
        </DropdownMenuItem>
      ) : null}
      {canViewAdminDashboard ? <AdminFeatureFlagsDropdownItem /> : null}
      {isPbnOwner ? (
        <DropdownMenuItem
          nativeButton={false}
          render={<Link href="/powered-by-namefi/admin" />}
        >
          <WalletIcon className="me-2 h-4 w-4" />
          <span>Powered Domains</span>
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuSeparator />
    </>
  );
}

type AdminQuickAccessItem = {
  title: string;
  description: string;
  href: Route;
  icon: LucideIcon;
  permissions?: Permission[];
  permissionsMode?: 'some' | 'every';
};

const ADMIN_QUICK_ACCESS_ITEMS: AdminQuickAccessItem[] = [
  {
    title: 'Users',
    description: 'Jump into users, balances, wallets, and account details.',
    href: '/admin/users',
    icon: UsersIcon,
    permissions: [Permission.READ_USERS],
  },
  {
    title: 'Orders',
    description: 'Review orders, payments, and fulfillment issues fast.',
    href: '/admin/orders',
    icon: ClipboardListIcon,
    permissions: [Permission.READ_ORDERS, Permission.READ_USERS],
    permissionsMode: 'every',
  },
  {
    title: 'Free Claims',
    description: 'Manage campaigns, claim inventory, and redemption flow.',
    href: '/admin/free-claims',
    icon: Globe,
    permissions: [Permission.READ_FREE_CLAIMS, Permission.WRITE_FREE_CLAIMS],
    permissionsMode: 'some',
  },
  {
    title: 'Permissions',
    description: 'Adjust admin access, reviewers, and internal tooling rights.',
    href: '/admin/permissions',
    icon: ShieldIcon,
    permissions: [Permission.READ_PERMISSIONS, Permission.WRITE_PERMISSIONS],
    permissionsMode: 'some',
  },
  {
    title: 'Audit Logs',
    description: 'Inspect sensitive actions and recent admin activity.',
    href: '/admin/audit-logs',
    icon: FileTextIcon,
    permissions: [Permission.READ_AUDIT_LOGS],
  },
  {
    title: 'Analytics',
    description: 'Check operational metrics, traffic, and platform trends.',
    href: '/admin/analytics',
    icon: BarChart3Icon,
    permissions: [Permission.READ_ANALYTICS],
  },
];

const FIND_USER_SKELETON_KEYS = [
  'find-user-skeleton-1',
  'find-user-skeleton-2',
  'find-user-skeleton-3',
] as const;

function FindUserDropdownItem({ onOpen }: { onOpen: () => void }) {
  return (
    <DropdownMenuItem
      closeOnClick={false}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }}
      className="cursor-pointer"
    >
      <SearchIcon className="me-2 h-4 w-4" />
      <span>Find User</span>
    </DropdownMenuItem>
  );
}

function AdminQuickAccessDropdownItem({ onOpen }: { onOpen: () => void }) {
  return (
    <DropdownMenuItem
      closeOnClick={false}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }}
      className="cursor-pointer"
    >
      <SparklesIcon className="me-2 h-4 w-4" />
      <span>Admin Quick Access</span>
    </DropdownMenuItem>
  );
}

function LazyDialogStatus({
  open,
  onOpenChange,
  title,
  loadingLabel,
  errorMessage,
  isLoading,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  loadingLabel: string;
  errorMessage: string | null;
  isLoading: boolean;
  onRetry: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{errorMessage ?? loadingLabel}</DialogDescription>
        </DialogHeader>
        {errorMessage ? (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>{isLoading ? loadingLabel : 'Preparing...'}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FindUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedReference, setSelectedReference] =
    useState<AdminUserLookupReference | null>(null);
  const [AdminUserLookupDialog, setAdminUserLookupDialog] =
    useState<AdminUserLookupDialogComponent | null>(null);
  const [isAdminLookupDialogLoading, setIsAdminLookupDialogLoading] =
    useState(false);
  const [adminLookupDialogError, setAdminLookupDialogError] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 250);
  const normalizedSearchTerm = debouncedSearchTerm.trim();
  const shouldSearch = open && normalizedSearchTerm.length > 1;
  const trpc = useTRPC();
  const searchUsers = useQuery({
    ...trpc.admin.users.searchUsers.queryOptions({
      searchTerm: shouldSearch ? normalizedSearchTerm : 'idle',
      limit: 8,
    }),
    enabled: shouldSearch,
  });
  const requestAdminUserLookupDialog = useCallback(() => {
    if (AdminUserLookupDialog) return;
    setIsAdminLookupDialogLoading(true);
    setAdminLookupDialogError(null);
    void loadAdminUserLookupDialog()
      .then((Component) => {
        setAdminUserLookupDialog(() => Component);
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : 'The account details failed to load.';
        setAdminLookupDialogError(message);
        toast.error('Failed to load account details', {
          description: message,
        });
      })
      .finally(() => {
        setIsAdminLookupDialogLoading(false);
      });
  }, [AdminUserLookupDialog]);

  useEffect(() => {
    if (!open || AdminUserLookupDialog) return;

    void loadAdminUserLookupDialog()
      .then((Component) => {
        setAdminUserLookupDialog(() => Component);
      })
      .catch(() => {
        // Selection-time loading still reports errors. This preload is only
        // a post-intent warmup so search result clicks avoid a cold chunk.
      });
  }, [open, AdminUserLookupDialog]);

  const openSelectedReference = useCallback(
    (reference: AdminUserLookupReference) => {
      setSelectedReference(reference);
      requestAdminUserLookupDialog();
    },
    [requestAdminUserLookupDialog],
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            setSearchTerm('');
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Find User</DialogTitle>
            <DialogDescription>
              Search by user ID, Privy ID, email, wallet, display name, Twitter
              handle, or domain name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              autoFocus={true}
              placeholder="Search users, wallets, emails, handles, or domains"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className="max-h-[24rem] space-y-3 overflow-y-auto pe-1">
              {normalizedSearchTerm.length <= 1 ? (
                <EmptyState message="Type at least 2 characters to search for an account." />
              ) : searchUsers.isLoading ? (
                FIND_USER_SKELETON_KEYS.map((key) => (
                  <Skeleton key={key} className="h-24 w-full" />
                ))
              ) : searchUsers.data && searchUsers.data.length > 0 ? (
                searchUsers.data.map((user) => {
                  const label =
                    user.displayName ?? user.primaryEmail ?? user.privyUserId;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full rounded-xl border border-border/60 p-4 text-start transition-colors hover:bg-muted/40"
                      onClick={() => {
                        onOpenChange(false);
                        openSelectedReference({ userId: user.id });
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold">{label}</div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>{user.primaryEmail ?? 'No primary email'}</div>
                            <div className="font-mono">{user.id}</div>
                            <div className="font-mono">{user.privyUserId}</div>
                          </div>
                        </div>

                        <div className="max-w-[14rem] space-y-1 text-end text-xs text-muted-foreground">
                          {user.twitterUsername ? (
                            <div>@{user.twitterUsername}</div>
                          ) : null}
                          {user.walletAddresses
                            .slice(0, 2)
                            .map((walletAddress) => (
                              <div key={walletAddress} className="font-mono">
                                {getShortAddress(walletAddress)}
                              </div>
                            ))}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyState message="No users matched that search." />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedReference ? (
        AdminUserLookupDialog ? (
          <AdminUserLookupDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedReference(null);
              }
            }}
            reference={selectedReference}
          />
        ) : (
          <LazyDialogStatus
            open={true}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setSelectedReference(null);
              }
            }}
            title="Account details"
            loadingLabel="Loading account details..."
            errorMessage={adminLookupDialogError}
            isLoading={isAdminLookupDialogLoading}
            onRetry={requestAdminUserLookupDialog}
          />
        )
      ) : null}
    </>
  );
}

function AdminQuickAccessDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Admin Quick Access</DialogTitle>
          <DialogDescription>
            Jump into the admin areas you use most often.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {ADMIN_QUICK_ACCESS_ITEMS.map((item) => (
            <AdminQuickAccessCard
              key={item.title}
              item={item}
              onNavigate={() => onOpenChange(false)}
            />
          ))}
          <SyncPonderIndexQuickAccessCard onDone={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminQuickAccessCard({
  item,
  onNavigate,
}: {
  item: AdminQuickAccessItem;
  onNavigate: () => void;
}) {
  const { hasPermissions } = useHasPermissions(
    item.permissions ?? [],
    item.permissionsMode,
  );

  if (item.permissions && item.permissions.length > 0 && !hasPermissions) {
    return null;
  }

  const Icon = item.icon;

  return (
    <Link href={item.href} className="group" onClick={onNavigate}>
      <Card className="h-full border-border/60 transition-colors group-hover:bg-muted/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">{item.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{item.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

const SYNC_PONDER_INDEX_SCHEDULE_ID = 'sync-ponder-index-schedule';

function SyncPonderIndexQuickAccessCard({ onDone }: { onDone: () => void }) {
  const trpc = useTRPC();
  const { hasPermissions } = useHasPermissions(
    [Permission.WRITE_SCHEDULES],
    'every',
  );

  const submitScheduleMutation = useMutation(
    trpc.admin.schedules.submitSchedule.mutationOptions(),
  );
  const triggerScheduleMutation = useMutation(
    trpc.admin.schedules.triggerSchedule.mutationOptions(),
  );

  const isPending =
    submitScheduleMutation.isPending || triggerScheduleMutation.isPending;

  if (!hasPermissions) {
    return null;
  }

  const handleClick = async () => {
    const input = { scheduleId: SYNC_PONDER_INDEX_SCHEDULE_ID };
    try {
      await triggerScheduleMutation.mutateAsync(input);
      toast.success('Ponder index sync triggered');
      onDone();
    } catch {
      // Schedule may not be registered in Temporal yet; set it up then retry.
      try {
        await submitScheduleMutation.mutateAsync(input);
        await triggerScheduleMutation.mutateAsync(input);
        toast.success('Ponder index sync schedule created and triggered');
        onDone();
      } catch (error) {
        toast.error('Failed to trigger Ponder index sync', {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    }
  };

  return (
    <button
      type="button"
      className="group text-start disabled:opacity-60 disabled:cursor-not-allowed"
      onClick={handleClick}
      disabled={isPending}
    >
      <Card className="h-full border-border/60 transition-colors group-hover:bg-muted/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
              {isPending ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCwIcon className="h-5 w-5" />
              )}
            </div>
            <CardTitle className="text-base">Sync Ponder Index</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Trigger the Ponder indexer sync now. Creates the schedule
            automatically if it is not yet set up.
          </CardDescription>
        </CardContent>
      </Card>
    </button>
  );
}

function UserBalanceDropdownItem({
  onOpen,
  totalBalanceInUsdCents,
  isLoadingBalance,
  hasWallets,
}: BalanceDropdownItemProps) {
  const t = useTranslations('common');
  const formattedBalance = formatAmountInUSD(totalBalanceInUsdCents, true);

  return (
    <DropdownMenuItem
      // Dropdown closes on click as normal — the dialog state lives in the
      // parent so the dialog survives the dropdown unmounting.
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
      className="cursor-pointer"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CoinsIcon className="h-4 w-4" />
          <span>{t('account.balance')}</span>
        </div>
        <div className="flex flex-col items-end leading-tight font-mono">
          {isLoadingBalance ? (
            <Skeleton className="h-6 w-[10ch] bg-white/20" />
          ) : (
            <span className="text-sm font-semibold">
              {hasWallets ? `${formattedBalance} NFSC` : '0.00 NFSC'}
            </span>
          )}
        </div>
      </div>
    </DropdownMenuItem>
  );
}

function LogoutDropdownItem({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('common');
  const handleOpen = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onOpen();
    },
    [onOpen],
  );

  return (
    <DropdownMenuItem
      closeOnClick={false}
      className="cursor-pointer text-red-500"
      onClick={handleOpen}
    >
      <LogOutIcon className="me-2 h-4 w-4" />
      <span>{t('actions.signOut')}</span>
    </DropdownMenuItem>
  );
}

function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { logout } = useLogout();
  const handleSignOut = useCallback(async () => {
    try {
      await logout(); // Callbacks are already configured in the hook
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to sign out', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }, [logout, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to sign out?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdminFeatureFlagsDropdownItem() {
  const { setOpen: openFeatureFlags } = useAdminFeatureFlagsSheet();
  return (
    <UserDropdownItem
      item={{
        type: 'button',
        onClick: (e) => {
          e.stopPropagation();
          window.setTimeout(() => openFeatureFlags(true), 0);
        },
        title: 'Admin Feature Flags',
        icon: LayoutListIcon,
      }}
    />
  );
}
