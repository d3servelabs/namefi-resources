'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { useTRPC } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useCallback, useMemo, useState } from 'react';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { Button } from '@/components/ui/shadcn/button';
import { PageShell } from '@/components/page-shell';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePagination } from '@/hooks/use-pagination';
import { useRouter } from 'next/navigation';
import { AsyncButton } from '@/components/buttons/async-button';
import { useDebounceValue } from 'usehooks-ts';
import { ServerDataTable } from '@/components/table/server-data-table-v2';
import { DataTable } from '@/components/table/data-table';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  Row,
  VisibilityState,
} from '@tanstack/react-table';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw,
  Clock,
  Mail,
  VenetianMask,
} from 'lucide-react';
import { getChain, CHAINS } from '@namefi-astra/utils/chains';
import { getNftExplorerUrl } from '@namefi-astra/utils/nft-hash';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { NetworkLogo } from '@/components/network-logo';
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  formatDate,
} from 'date-fns';
import { applyFilterOperator } from '@/components/table/data-table';
import { UserWalletAvatar } from '@/components/user-avatar';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/cn';
import { OPERATORS_BY_TYPE } from '@/components/table/filters/components/drizzler-filter-field';

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

export default function AdminUsersV2Page() {
  return (
    <AdminGuard>
      <PermissionGate permissions={[Permission.READ_USERS]}>
        <UsersTableV2 />
      </PermissionGate>
    </AdminGuard>
  );
}

function UsersTableV2() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainSearchTerm, setDomainSearchTerm] = useState('');
  const [ensSearchTerm, setEnsSearchTerm] = useState('');

  const defaultColumnVisibility: VisibilityState = {
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
  };

  const {
    preferences: { columnVisibility, sorting, pageSize },
    setColumnVisibility,
    setSorting,
    setPageSize,
  } = useTablePreferences({
    tableId: 'admin-users',
    defaultPreferences: {
      columnVisibility: defaultColumnVisibility,
      sorting: [{ id: 'nftCount', desc: true }],
      pageSize: 20,
    },
  });

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
      } catch (error: any) {
        toast('Failed to impersonate', {
          description: error?.message ?? 'Unknown error',
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
          const canExpand = row.original.nftCount > 0;
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
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={16}
            minCharactersToDisplay={16}
            className="font-mono text-xs"
          >
            {row.original.id}
          </AutoTruncateTextV2>
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
                    <TooltipTrigger asChild>
                      <a
                        href={`mailto:${row.original.primaryEmail}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Send email to ${row.original.primaryEmail}`}
                      >
                        <Mail className="h-[14px] w-[14px]" />
                      </a>
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
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={16}
            minCharactersToDisplay={16}
            className="font-mono text-xs"
          >
            {row.original.privyUserId}
          </AutoTruncateTextV2>
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
            } catch (error) {
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
            } catch (error) {
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
                <TooltipTrigger asChild>
                  <span className={cn('font-medium cursor-help', colorClass)}>
                    {relativeTime}
                  </span>
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
              <Button className="group" size="sm" variant="secondary" asChild>
                <a
                  href={`mailto:${row.original.primaryEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Send email"
                  className="flex"
                >
                  <Mail className="h-4 w-4" />{' '}
                  <span
                    className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
                    style={{ transition: 'all 0.8s allow-discrete' }}
                  >
                    Send Email
                  </span>
                </a>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleImpersonate],
  );

  // Debounced search terms
  const [debouncedSearch] = useDebounceValue(searchTerm, 300);
  const [debouncedDomainSearch] = useDebounceValue(domainSearchTerm, 300);
  const [debouncedEnsSearch] = useDebounceValue(ensSearchTerm, 300);

  // Drizzler filter state
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({
      columnFilters: {},
      customFilters: {},
    });
  const [debouncedDrizzlerFilterState] = useDebounceValue(
    drizzlerFilterState,
    500,
  );

  // Convert drizzler filter state to FilterOptions for backend
  const backendFilters = useMemo(() => {
    return convertToDrizzlerFilterOptions(
      debouncedDrizzlerFilterState.columnFilters,
    );
  }, [debouncedDrizzlerFilterState]);

  // Convert sorting state to SortOptions for backend
  const backendSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;
    return sorting.map((s) => ({
      column: s.id,
      order: s.desc ? ('desc' as const) : ('asc' as const),
    }));
  }, [sorting]);

  const users = useQuery(
    trpc.admin.listUsersV2.queryOptions(
      {
        page,
        pageSize,
        searchTerm: debouncedSearch || undefined,
        domainSearchTerm: debouncedDomainSearch || undefined,
        ensSearchTerm: debouncedEnsSearch || undefined,
        filters: backendFilters,
        sorting: backendSorting,
      },
      {
        placeholderData: (prev) => prev,
        trpc: { context: { skipBatch: true } },
      },
    ),
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

  // Setup drizzler filter strategy with comprehensive operator support
  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      id: {
        id: 'id',
        label: 'User ID',
        type: 'text',
        columnId: 'id',
      },
      displayName: {
        id: 'displayName',
        label: 'Display Name',
        type: 'text',
        columnId: 'displayName',
      },
      primaryEmail: {
        id: 'primaryEmail',
        label: 'Email',
        type: 'text',
        columnId: 'primaryEmail',
      },
      privyUserId: {
        id: 'privyUserId',
        label: 'Privy User ID',
        type: 'text',
        columnId: 'privyUserId',
      },
      twitterUsername: {
        id: 'twitterUsername',
        label: 'Twitter Username',
        type: 'text',
        columnId: 'twitterUsername',
      },
      nftCount: {
        id: 'nftCount',
        label: 'NFT Count',
        type: 'number',
        columnId: 'nftCount',
      },
      createdAt: {
        id: 'createdAt',
        label: 'Created At',
        type: 'date',
        columnId: 'createdAt',
      },
      updatedAt: {
        id: 'updatedAt',
        label: 'Updated At',
        type: 'date',
        columnId: 'updatedAt',
      },
      lastSignInAt: {
        id: 'lastSignInAt',
        label: 'Last Sign In',
        type: 'date',
        columnId: 'lastSignInAt',
      },
      wallets: {
        id: 'allWallets',
        label: 'All Wallets',
        type: 'array',
        columnId: 'wallets',
        allowedOperators: OPERATORS_BY_TYPE.array
          .map((op) => op.value)
          .filter(
            (op) =>
              op !== 'array_all_i_like' &&
              op !== 'not_array_all_i_like' &&
              op !== 'not_array_any_i_like',
          ),
        typeSpecificOptions: {
          array: {
            elementName: {
              singular: 'Wallet',
              plural: 'Wallets',
            },
          },
        },
      },
      primaryWallet: {
        id: 'primaryWallet',
        label: 'Primary Wallet',
        type: 'text',
        columnId: 'primaryWallet',
      },
      walletCount: {
        id: 'walletCount',
        label: 'Linked Wallets Count',
        type: 'number',
        columnId: 'walletCount',
      },
    },
    customFilters: {
      domainSearch: {
        id: 'domainSearch',
        label: 'Domain Search',
        type: 'text',
        columnId: 'domainSearch',
      },
      ensSearch: {
        id: 'ensSearch',
        label: 'ENS Search',
        type: 'text',
        columnId: 'ensSearch',
      },
    },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);

      // Handle custom filters - map to search term state
      const generalSearchFilter = newFilterState.customFilters['generalSearch'];
      if (generalSearchFilter && generalSearchFilter.conditions.length > 0) {
        setSearchTerm(String(generalSearchFilter.conditions[0].value || ''));
      } else {
        setSearchTerm('');
      }

      const domainSearchFilter = newFilterState.customFilters['domainSearch'];
      if (domainSearchFilter && domainSearchFilter.conditions.length > 0) {
        setDomainSearchTerm(
          String(domainSearchFilter.conditions[0].value || ''),
        );
      } else {
        setDomainSearchTerm('');
      }

      const ensSearchFilter = newFilterState.customFilters.ensSearch;
      if (ensSearchFilter && ensSearchFilter.conditions.length > 0) {
        setEnsSearchTerm(String(ensSearchFilter.conditions[0].value || ''));
      } else {
        setEnsSearchTerm('');
      }
    },
  });

  const handleCopyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  }, []);

  return (
    <PageShell padding="admin">
      <Card>
        <CardHeader>
          <CardTitle>
            Users V2 - Full Drizzler Filter Strategy Implementation
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Testing comprehensive drizzler filters with all operators and column
            types
          </div>
        </CardHeader>
        <CardContent>
          <ExtensibleDataTable<UserRow, typeof filterStrategy>
            filterStrategy={filterStrategy}
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
            renderSubRow={renderSubRow}
            getRowCanExpand={(row) => row.original.nftCount > 0}
            emptyMessage="No users found"
            loadingMessage="Loading users..."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}

function renderSubRow(row: Row<UserRow>) {
  return <UserNftsSubRow {...row} />;
}

const UserNftsSubRow = ({ original: user }: Row<UserRow>) => {
  type NftRow = UserRow['nfts'][number];

  const [globalFilter, setGlobalFilter] = useState('');
  const { pageSize: nftPageSize, handlePageSizeChange } = usePagination({
    defaultPageSize: 5,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    tokenId: false,
    ownerAddress: true,
  });

  const nftColumns = useMemo<Array<ColumnDef<NftRow>>>(
    () => [
      {
        accessorKey: 'chainId',
        id: 'chainId',
        header: 'Network',
        cell: ({ row }) => {
          const chain = getChain(row.original.chainId);
          return (
            <div className="flex items-center gap-2">
              <NetworkLogo network={row.original.chainId} className="w-5 h-5" />
              <span className="text-xs text-muted-foreground">
                {chain?.name ?? `Chain ${row.original.chainId}`}
              </span>
            </div>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          const chainId = row.getValue(columnId) as number;
          // Handle simple value (from inline filter or select)
          if (
            typeof filterValue === 'string' ||
            typeof filterValue === 'number'
          ) {
            return String(chainId) === String(filterValue);
          }
          // Handle operator/value object (from filter panel)
          if (
            filterValue &&
            typeof filterValue === 'object' &&
            'operator' in filterValue
          ) {
            return applyFilterOperator(
              chainId,
              filterValue.operator,
              Number(filterValue.value),
            );
          }
          return true;
        },
        size: 100,
      },
      {
        accessorKey: 'normalizedDomainName',
        id: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={30}
            minCharactersToDisplay={30}
          >
            {row.original.normalizedDomainName}
          </AutoTruncateTextV2>
        ),
        filterFn: (row, columnId, filterValue) => {
          const cellValue = String(row.getValue(columnId) || '');
          // Handle simple value (from inline filter)
          if (typeof filterValue === 'string') {
            return cellValue.toLowerCase().includes(filterValue.toLowerCase());
          }
          // Handle operator/value object (from filter panel)
          if (
            filterValue &&
            typeof filterValue === 'object' &&
            'operator' in filterValue
          ) {
            return applyFilterOperator(
              cellValue,
              filterValue.operator,
              String(filterValue.value),
            );
          }
          return true;
        },
        size: 200,
      },
      {
        accessorKey: 'ownerAddress',
        id: 'ownerAddress',
        header: 'Holding Wallet',
        cell: ({ row }) => {
          const ownerAddress = attemptGetChecksummedAddress(
            row.original.ownerAddress,
          );
          const handleCopyWallet = async () => {
            try {
              await navigator.clipboard.writeText(ownerAddress);
              toast.success('Copied address successfully');
            } catch (error) {
              toast.error('Failed to copy address');
            }
          };

          return (
            <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
              <UserWalletAvatar address={ownerAddress} className="size-6" />
              <div className="flex-1 min-w-0">
                <AutoTruncateTextV2
                  initialCharactersCountToDisplay={16}
                  minCharactersToDisplay={16}
                  className="font-mono text-xs"
                >
                  {ownerAddress}
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
        filterFn: (row, columnId, filterValue) => {
          const cellValue = String(row.getValue(columnId) || '').toLowerCase();
          // Handle simple value (from inline filter)
          if (typeof filterValue === 'string') {
            return cellValue.includes(filterValue.toLowerCase());
          }
          // Handle operator/value object (from filter panel)
          if (
            filterValue &&
            typeof filterValue === 'object' &&
            'operator' in filterValue
          ) {
            return applyFilterOperator(
              cellValue,
              filterValue.operator,
              String(filterValue.value).toLowerCase(),
            );
          }
          return true;
        },
        size: 200,
      },
      {
        id: 'expiration',
        header: 'Expiration',
        accessorKey: 'expirationTime',
        cell: ({ row }) => {
          const expirationTime = row.original.expirationTime;
          if (!expirationTime)
            return <span className="text-xs text-muted-foreground">-</span>;

          const expirationDate = new Date(expirationTime);
          const now = new Date();

          // Calculate differences
          const years = differenceInYears(expirationDate, now);
          const months = differenceInMonths(expirationDate, now) % 12;
          const days = differenceInDays(expirationDate, now) % 30;

          // Build duration string
          const durationParts: string[] = [];
          if (years > 0) durationParts.push(`${years}y`);
          if (months > 0) durationParts.push(`${months}mo`);
          if (days > 0 || durationParts.length === 0)
            durationParts.push(`${days}d`);
          const durationText = durationParts.join(' ');

          // Calculate total months for color coding
          const totalMonths = differenceInMonths(expirationDate, now);

          // Color coding: < 4 months = red, 4-12 months = orange, > 12 months = green
          let textColor = 'text-muted-foreground';
          if (totalMonths < 4) {
            textColor = 'text-red-500 dark:text-red-400';
          } else if (totalMonths < 12) {
            textColor = 'text-orange-500 dark:text-orange-400';
          } else {
            textColor = 'text-green-500 dark:text-green-400';
          }

          // Format date as "19 Feb 2025"
          const formattedDate = expirationDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <span className={`text-xs font-medium ${textColor}`}>
              {formattedDate}
              {totalMonths >= 0 && (
                <span className="text-xs ml-1">({durationText})</span>
              )}
            </span>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'tokenId',
        id: 'tokenId',
        header: 'Token',
        cell: ({ row }) => {
          const explorerUrl = getNftExplorerUrl(
            row.original.chainId,
            row.original.tokenId,
          );
          return explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary hover:underline"
            >
              {row.original.tokenId}
            </a>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.tokenId}
            </span>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          const cellValue = String(row.getValue(columnId) || '');
          // Handle simple value (from inline filter)
          if (typeof filterValue === 'string') {
            return cellValue.toLowerCase().includes(filterValue.toLowerCase());
          }
          // Handle operator/value object (from filter panel)
          if (
            filterValue &&
            typeof filterValue === 'object' &&
            'operator' in filterValue
          ) {
            return applyFilterOperator(
              cellValue,
              filterValue.operator,
              String(filterValue.value),
            );
          }
          return true;
        },
        size: 200,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const explorerUrl = getNftExplorerUrl(
            row.original.chainId,
            row.original.tokenId,
          );
          if (!explorerUrl) return null;
          return (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Visit Scan
            </a>
          );
        },
        size: 100,
      },
    ],
    [],
  );

  // Filter NFTs based on global filter
  const filteredNfts = useMemo(() => {
    if (!globalFilter) return user.nfts;
    const lowerFilter = globalFilter.toLowerCase();
    return user.nfts.filter((nft) => {
      const domainName = nft.normalizedDomainName.toLowerCase();
      const tokenId = nft.tokenId.toLowerCase();
      const chainName = getChain(nft.chainId)?.name?.toLowerCase() ?? '';
      return (
        domainName.includes(lowerFilter) ||
        tokenId.includes(lowerFilter) ||
        chainName.includes(lowerFilter)
      );
    });
  }, [user.nfts, globalFilter]);

  // Sort NFTs by expiration date (ascending - soonest first)
  const sortedNfts = useMemo(() => {
    return [...filteredNfts].sort((a, b) => {
      const dateA = new Date(a.expirationTime).getTime();
      const dateB = new Date(b.expirationTime).getTime();
      return dateA - dateB; // Ascending order
    });
  }, [filteredNfts]);

  const nftFilterConfig = useMemo(
    () => ({
      normalizedDomainName: { type: 'text' as const, label: 'Domain Name' },
      ownerAddress: { type: 'text' as const, label: 'Holding Wallet' },
      chainId: {
        type: 'select' as const,
        label: 'Network',
        options: [
          { value: String(CHAINS.base.id), label: CHAINS.base.name },
          { value: String(CHAINS.mainnet.id), label: CHAINS.mainnet.name },
          { value: String(CHAINS.sepolia.id), label: CHAINS.sepolia.name },
        ],
      },
      tokenId: { type: 'text' as const, label: 'Token ID' },
    }),
    [],
  );

  const customNftFilters = useMemo(
    () => [
      {
        id: 'globalSearch',
        label: 'Search NFTs',
        type: 'text' as const,
        placeholder: 'Search by domain, token ID, or network...',
        value: globalFilter,
        onChange: (value: string | number | undefined) => {
          setGlobalFilter(value ? String(value) : '');
        },
        onClear: () => {
          setGlobalFilter('');
        },
      },
    ],
    [globalFilter],
  );

  if (!user.nfts || user.nfts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        Domains ({user.nftCount})
      </div>
      <DataTable<NftRow>
        columns={nftColumns}
        data={sortedNfts}
        isLoading={false}
        pageSize={nftPageSize}
        onPageSizeChange={handlePageSizeChange}
        enableColumnFilters={true}
        filterConfig={nftFilterConfig}
        customFilters={customNftFilters}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        filterDisplayOptions={{ showInHeader: false }}
      />
    </div>
  );
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
        <TooltipTrigger asChild>
          <Button
            className={cn('rounded-full', classNames?.button)}
            size="icon"
            variant="ghost"
            aria-label="Copy to clipboard"
            onClick={handleCopy}
          >
            <Copy className={cn('h-4 w-4', classNames?.icon)} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className={cn(classNames?.tooltipContent)}>
          <p>Copy To Clipboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
