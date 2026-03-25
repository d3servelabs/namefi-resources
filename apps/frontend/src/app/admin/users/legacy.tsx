'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AsyncButton } from '@/components/buttons/async-button';
import { useDebounceValue } from 'usehooks-ts';
import { ServerDataTable } from '@/components/table/server-data-table';
import { ServerDataTable as ServerDataTableV2 } from '@/components/table/server-data-table-v2';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import {
  AdminUserExpandedDetails,
  AdminUserLookupButton,
} from '@/components/admin/user-details';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  Row,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw,
  Clock,
  Mail,
  VenetianMask,
} from 'lucide-react';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  formatDate,
} from 'date-fns';
import { UserWalletAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/shadcn/button';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/cn';

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

type UserRow = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  privyUserId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date | null;
  twitterUsername: string | null;
  twitterDetails: {
    username?: string;
    name?: string;
    subject?: string;
    profilePictureUrl?: string;
  } | null;
  isAdmin: boolean;
  wallets: string[];
  nfts: Array<{
    chainId: number;
    normalizedDomainName: string;
    tokenId: string;
    expirationTime: Date | string;
    ownerAddress: string;
  }>;
  nftCount: number;
};

export default function AdminUsersPage({
  useNewTableComponent,
}: {
  useNewTableComponent: boolean;
}) {
  return (
    <AdminGuard>
      <PermissionGate permissions={[Permission.READ_USERS]}>
        <UsersTable useNewTableComponent={useNewTableComponent} />
      </PermissionGate>
    </AdminGuard>
  );
}

function UsersTable({
  useNewTableComponent,
}: {
  useNewTableComponent: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, _setSearchTerm] = useState('');
  const [domainSearchTerm, setDomainSearchTerm] = useState('');
  const [ensSearchTerm, setEnsSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'nftCount', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [debouncedSearch] = useDebounceValue(searchTerm, 300);
  const [debouncedDomainSearch] = useDebounceValue(domainSearchTerm, 300);
  const [debouncedEnsSearch] = useDebounceValue(ensSearchTerm, 300);
  const [debouncedColumnFilters] = useDebounceValue(columnFilters, 500);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    expander: true,
    updatedAt: true,
    id: false,
    displayName: true,
    primaryEmail: true,
    privyUserId: false,
    createdAt: false,
    lastSignInAt: true,
    twitterUsername: true,
    isAdmin: false,
    nftCount: true,
    actions: true,
    walletCount: false,
    primaryWallet: false,
  });
  // Transform column filters to backend format
  const backendColumnFilters = useMemo(() => {
    return (debouncedColumnFilters ?? []).map((filter) => ({
      id: filter.id,
      value: filter.value as {
        operator: 'like' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
        value: string | number | Date;
      },
    }));
  }, [debouncedColumnFilters]);

  const users = useQuery(
    trpc.admin.listUsers.queryOptions(
      {
        page,
        pageSize,
        searchTerm: debouncedSearch || undefined,
        domainSearchTerm: debouncedDomainSearch || undefined,
        ensSearchTerm: debouncedEnsSearch || undefined,
        sorting: sorting.length > 0 ? sorting : undefined,
        columnFilters:
          backendColumnFilters.length > 0 ? backendColumnFilters : undefined,
      },
      {
        placeholderData: (prev) => prev,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );
  const impersonate = useMutation(trpc.users.impersonateUser.mutationOptions());

  const router = useRouter();
  const handleImpersonate = useCallback(
    async (userId: string) => {
      try {
        await impersonate.mutateAsync({ targetUserId: userId });
        await queryClient.invalidateQueries();

        await router.replace('/');
        toast('Impersonation enabled', {
          description: `Now impersonating ${userId}`,
        });
      } catch (error) {
        toast('Failed to impersonate', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [impersonate.mutateAsync, queryClient, router],
  );

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          const canExpand =
            row.original.nftCount > 0 || row.original.wallets.length > 0;
          if (!canExpand) return null;

          return (
            <button
              type="button"
              onClick={() => row.toggleExpanded()}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          );
        },
        size: 20,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={16}
              minCharactersToDisplay={16}
              className="font-mono text-xs"
            >
              {row.original.id}
            </AutoTruncateTextV2>
            <AdminUserLookupButton
              reference={{ userId: row.original.id }}
              title="Open user details by user ID"
            />
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={15}
            minCharactersToDisplay={15}
          >
            {row.original.displayName ?? '-'}
          </AutoTruncateTextV2>
        ),
        size: 150,
      },
      {
        accessorKey: 'primaryEmail',
        header: 'Email',
        cell: ({ row }) => (
          <div
            className={cn(
              'flex items-center justify-between w-full px-3 py-1 rounded-2xl',
              row.original.primaryEmail ? 'bg-muted' : '',
            )}
          >
            <AutoTruncateTextV2
              className="w-full"
              initialCharactersCountToDisplay={20}
              minCharactersToDisplay={5}
            >
              {row.original.primaryEmail ?? '-'}
            </AutoTruncateTextV2>
            {!!row.original.primaryEmail && (
              <div className="ml-1 flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <a
                          {...props}
                          href={`mailto:${row.original.primaryEmail}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Send email to ${row.original.primaryEmail}`}
                        >
                          {props.children}
                        </a>
                      )}
                    >
                      <Mail className="h-[14px] w-[14px]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send email to {row.original.primaryEmail}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CopyIconButton
                  text={row.original.primaryEmail}
                  classNames={{
                    icon: '!h-[14px] !w-[14px]',
                    button: '!p-[1px]',
                  }}
                />
              </div>
            )}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'privyUserId',
        header: 'Privy ID',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={16}
              minCharactersToDisplay={16}
              className="font-mono text-xs"
            >
              {row.original.privyUserId}
            </AutoTruncateTextV2>
            <AdminUserLookupButton
              reference={{ privyUserId: row.original.privyUserId }}
              title="Open user details by Privy ID"
            />
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'primaryWallet',
        header: 'Primary Wallet',
        cell: ({ row }) => {
          let primaryWallet = row.original.wallets?.[0];
          if (!primaryWallet) return '-';
          primaryWallet = attemptGetChecksummedAddress(primaryWallet);

          const handleCopyWallet = async () => {
            try {
              await navigator.clipboard.writeText(primaryWallet);
              toast.success('Copied address successfully');
            } catch (_error) {
              toast.error('Failed to copy address');
            }
          };

          return (
            <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
              <UserWalletAvatar address={primaryWallet} className="size-6" />
              <div className="flex-1 min-w-0">
                <AutoTruncateTextV2
                  initialCharactersCountToDisplay={16}
                  minCharactersToDisplay={16}
                  className="font-mono text-xs"
                >
                  {primaryWallet}
                </AutoTruncateTextV2>
              </div>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
                title="Copy address"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'allWallets',
        header: 'All Wallets',
        cell: ({ row }) => {
          let wallets = row.original.wallets ?? [];
          if (wallets.length === 0) return '-';

          wallets = wallets
            .map((wallet) => attemptGetChecksummedAddress(wallet))
            .filter((wallet) => wallet !== null);
          const handleCopyWallet = async (wallet: string) => {
            try {
              await navigator.clipboard.writeText(wallet);
              toast.success('Copied address successfully');
            } catch (_error) {
              toast.error('Failed to copy address');
            }
          };

          return (
            <div className="flex flex-col gap-1">
              {wallets.map((wallet) => (
                <div
                  key={wallet}
                  className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl w-fit"
                >
                  <UserWalletAvatar address={wallet} className="size-6" />
                  <span className="text-xs font-mono">
                    <AutoTruncateTextV2
                      initialCharactersCountToDisplay={16}
                      minCharactersToDisplay={16}
                    >
                      {wallet}
                    </AutoTruncateTextV2>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyWallet(wallet)}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'walletCount',
        header: 'Linked Wallets Count',
        cell: ({ row }) => {
          return row.original.wallets?.length ?? 0;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleString()
            : '-',
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) =>
          row.original.updatedAt
            ? new Date(row.original.updatedAt).toLocaleString()
            : '-',
      },
      {
        accessorKey: 'lastSignInAt',
        header: 'Last Sign In',
        cell: ({ row }) => {
          if (!row.original.lastSignInAt) return '-';

          const lastSignIn = new Date(row.original.lastSignInAt);
          const now = new Date();

          // Calculate time difference
          const years = differenceInYears(now, lastSignIn);
          const months = differenceInMonths(now, lastSignIn);
          const days = differenceInDays(now, lastSignIn);

          let relativeTime = '';
          let colorClass = 'text-green-600'; // Recent

          if (years > 0) {
            relativeTime = `${years}y ago`;
            colorClass = 'text-red-600'; // Very old
          } else if (months > 0) {
            relativeTime = `${months}mo ago`;
            colorClass = months > 1 ? 'text-red-600' : 'text-orange-600';
          } else if (days > 0) {
            relativeTime = `${days}d ago`;
            colorClass = days > 7 ? 'text-orange-600' : 'text-green-600';
          } else {
            relativeTime = 'Today';
            colorClass = 'text-green-600';
          }

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      className={cn('font-medium cursor-help', colorClass)}
                    />
                  }
                >
                  {relativeTime}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{lastSignIn.toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'twitterUsername',
        header: 'Twitter',
        cell: ({ row }) => {
          const username = row.original.twitterUsername;
          if (!username) return '-';

          return (
            <a
              href={`https://x.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>@{username}</span>
            </a>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'isAdmin',
        header: 'Admin',
        cell: ({ row }) => (row.original.isAdmin ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'nftCount',
        header: 'Assets',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.nftCount}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {!row.original.isAdmin && (
              <PermissionGate permissions={[Permission.IMPERSONATE_USERS]}>
                <AsyncButton
                  className="group"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleImpersonate(row.original.id)}
                  loadingText="Impersonating..."
                >
                  <VenetianMask className="h-4 w-4" />
                  <span
                    className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
                    style={{ transition: 'all 0.4s ease-in-out' }}
                  >
                    Impersonate
                  </span>
                </AsyncButton>
              </PermissionGate>
            )}
            {!!row.original.primaryEmail && (
              <Button
                className="group"
                size="sm"
                variant="secondary"
                render={(props) => (
                  <a
                    {...props}
                    href={`mailto:${row.original.primaryEmail}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Send email"
                    className={cn('flex', props.className)}
                  >
                    {props.children}
                  </a>
                )}
                nativeButton={false}
              >
                <Mail className="h-4 w-4" />{' '}
                <span
                  className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
                  style={{ transition: 'all 0.8s allow-discrete' }}
                >
                  Send Email
                </span>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleImpersonate],
  );

  const rows = useMemo(() => {
    return (users.data?.items ?? []).map((u) => ({
      id: u.id,
      displayName: u.displayName,
      primaryEmail: u.primaryEmail,
      privyUserId: u.privyUserId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastSignInAt: u.lastSignInAt ?? null,
      twitterUsername: u.twitterUsername ?? null,
      twitterDetails: u.twitterDetails ?? null,
      isAdmin: u.isAdmin,
      wallets: u.wallets ?? [],
      nfts: u.nfts ?? [],
      nftCount: u.nftCount ?? 0,
    }));
  }, [users.data?.items]);

  const filterConfig = useMemo(
    () => ({
      id: { type: 'text' as const, label: 'User ID' },
      displayName: { type: 'text' as const, label: 'Display Name' },
      primaryEmail: { type: 'text' as const, label: 'Email' },
      privyUserId: { type: 'text' as const, label: 'Privy ID' },
      primaryWallet: { type: 'text' as const, label: 'Primary Wallet' },
      allWallets: { type: 'text' as const, label: 'All Wallets' },
      createdAt: { type: 'date' as const, label: 'Created At' },
      updatedAt: { type: 'date' as const, label: 'Updated At' },
      lastSignInAt: { type: 'date' as const, label: 'Last Sign In' },
      twitterUsername: { type: 'text' as const, label: 'Twitter Username' },
      nftCount: { type: 'number' as const, label: 'Asset Count' },
      walletCount: { type: 'number' as const, label: 'Linked Wallets Count' },
    }),
    [],
  );

  const customFilters = useMemo(
    () => [
      // {
      //   id: 'search',
      //   label: 'General Search',
      //   type: 'text' as const,
      //   placeholder: 'Search by email, name, wallet, id...',
      //   value: searchTerm,
      //   onChange: (value: string | number | undefined) => {
      //     setPage(1);
      //     setSearchTerm(value ? String(value) : '');
      //   },
      //   onClear: () => {
      //     setPage(1);
      //     setSearchTerm('');
      //   },
      // },
      {
        id: 'domainSearch',
        label: 'Domain Search',
        type: 'text' as const,
        placeholder: 'Search by domain name...',
        value: domainSearchTerm,
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setDomainSearchTerm(value ? String(value) : '');
        },
        onClear: () => {
          setPage(1);
          setDomainSearchTerm('');
        },
      },
      {
        id: 'ensSearch',
        label: 'ENS Search',
        type: 'text' as const,
        placeholder: 'Search by ENS name...',
        value: ensSearchTerm,
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setEnsSearchTerm(value ? String(value) : '');
        },
        onClear: () => {
          setPage(1);
          setEnsSearchTerm('');
        },
      },
    ],
    [domainSearchTerm, ensSearchTerm],
  );

  const forceRefreshCache = useMutation(
    trpc.admin.forceRefreshPrivyCache.mutationOptions(),
  );

  const handleForceRefresh = useCallback(async () => {
    try {
      await forceRefreshCache.mutateAsync();
      await users.refetch();
      toast.success('Cache refreshed successfully');
    } catch (_error) {
      toast.error('Failed to refresh cache');
    }
  }, [forceRefreshCache.mutateAsync, users]);

  const TableComponent = useNewTableComponent
    ? ServerDataTableV2
    : ServerDataTable;
  return (
    <Card className="border border-muted/60 m-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            All Users {useNewTableComponent ? '(new)' : ''}
          </CardTitle>
          <div className="flex items-center gap-4">
            {users.data?.cacheLastRefresh && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Last refreshed:{' '}
                  {formatDate(
                    users.data.cacheLastRefresh,
                    'MMM d, yyyy HH:mm:ss',
                  )}
                </span>
              </div>
            )}
            <AsyncButton
              size="sm"
              variant="outline"
              onClick={handleForceRefresh}
              loadingText="Refreshing..."
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Privy Index
            </AsyncButton>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TableComponent
          key={'admin-users-table'}
          columns={columns}
          data={rows}
          isLoading={users.isLoading}
          isFetching={users.isFetching}
          page={page}
          pageSize={pageSize}
          totalPages={users.data?.totalPages ?? 1}
          totalCount={users.data?.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={(filters) => {
            setPage(1);
            setColumnFilters(filters);
          }}
          filterConfig={filterConfig}
          customFilters={customFilters}
          renderSubRow={renderSubRow}
          getRowCanExpand={(row) =>
            row.original.nftCount > 0 || row.original.wallets.length > 0
          }
          emptyMessage="No users found"
          loadingMessage="Loading users..."
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          filterDisplayOptions={{ showInHeader: false }}
        />
      </CardContent>
    </Card>
  );
}
function renderSubRow(row: Row<UserRow>) {
  return <UserNftsSubRow {...row} />;
}

const UserNftsSubRow = ({ original: user }: Row<UserRow>) => {
  return <AdminUserExpandedDetails userId={user.id} />;
};

const CopyIconButton = ({
  text,
  classNames,
}: {
  text: string;
  classNames?: { button?: string; icon?: string; tooltipContent?: string };
}) => {
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, [text]);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className={cn('rounded-full', classNames?.button)}
              size="icon"
              variant="ghost"
              aria-label="Copy to clipboard"
              onClick={handleCopy}
            />
          }
        >
          <Copy className={cn('h-4 w-4', classNames?.icon)} />
        </TooltipTrigger>
        <TooltipContent className={cn(classNames?.tooltipContent)}>
          <p>Copy To Clipboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
