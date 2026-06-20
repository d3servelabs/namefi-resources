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
} from '@namefi-astra/ui/components/shadcn/card';
import { useCallback, useMemo, useState } from 'react';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { AdminUserExpandedDetails } from '@/components/admin/user-details';
import { PageShell } from '@/components/page-shell';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'next/navigation';
import { useDebounceValue } from 'usehooks-ts';
import type { ColumnDef, Row, VisibilityState } from '@tanstack/react-table';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { OPERATORS_BY_TYPE } from '@/components/table/filters/components/drizzler-filter-field';
import { DrizzlerCard } from './drizzler-card';
import {
  AllWalletsCell,
  AssetCountCell,
  DisplayNameCell,
  EmailCell,
  formatTimestamp,
  LastSignInCell,
  PrimaryWalletCell,
  PrivyIdCell,
  TwitterCell,
  UserActionsCell,
  UserIdCell,
  type UserRow,
} from './drizzler-cells';

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
                <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
              )}
            </button>
          );
        },
        size: 20,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <UserIdCell id={row.original.id} />,
        size: 150,
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: ({ row }) => (
          <DisplayNameCell displayName={row.original.displayName} />
        ),
        size: 150,
      },
      {
        accessorKey: 'primaryEmail',
        header: 'Email',
        cell: ({ row }) => <EmailCell row={row.original} />,
        size: 150,
      },
      {
        accessorKey: 'privyUserId',
        header: 'Privy ID',
        cell: ({ row }) => (
          <PrivyIdCell privyUserId={row.original.privyUserId} />
        ),
        size: 150,
      },
      {
        accessorKey: 'primaryWallet',
        header: 'Primary Wallet',
        cell: ({ row }) => <PrimaryWalletCell row={row.original} />,
        size: 150,
      },
      {
        accessorKey: 'allWallets',
        header: 'All Wallets',
        cell: ({ row }) => <AllWalletsCell row={row.original} />,
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
        cell: ({ row }) => formatTimestamp(row.original.createdAt),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => formatTimestamp(row.original.updatedAt),
      },
      {
        accessorKey: 'lastSignInAt',
        header: 'Last Sign In',
        cell: ({ row }) => (
          <LastSignInCell lastSignInAt={row.original.lastSignInAt} />
        ),
        size: 120,
      },
      {
        accessorKey: 'twitterUsername',
        header: 'Twitter',
        cell: ({ row }) => (
          <TwitterCell username={row.original.twitterUsername} />
        ),
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
        cell: ({ row }) => <AssetCountCell nftCount={row.original.nftCount} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <UserActionsCell
            row={row.original}
            onImpersonate={handleImpersonate}
          />
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
    trpc.admin.users.listUsersV2.queryOptions(
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
      const generalSearchFilter = newFilterState.customFilters.generalSearch;
      if (generalSearchFilter && generalSearchFilter.conditions.length > 0) {
        setSearchTerm(String(generalSearchFilter.conditions[0].value || ''));
      } else {
        setSearchTerm('');
      }

      const domainSearchFilter = newFilterState.customFilters.domainSearch;
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

  const _handleCopyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  }, []);

  // Mobile card renderer. Composes the SAME shared cell components as the desktop
  // columns and reuses the table's own row-expansion state, so behavior stays
  // identical — only the layout switches from a wide table row to a stacked card.
  const renderMobileCard = useCallback(
    (row: Row<UserRow>) => (
      <DrizzlerCard
        row={row.original}
        isExpanded={row.getIsExpanded()}
        onToggleExpanded={() => row.toggleExpanded()}
        onImpersonate={handleImpersonate}
      />
    ),
    [handleImpersonate],
  );

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
            getRowCanExpand={(row) =>
              row.original.nftCount > 0 || row.original.wallets.length > 0
            }
            emptyMessage="No users found"
            loadingMessage="Loading users..."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            renderMobileCard={renderMobileCard}
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
  return <AdminUserExpandedDetails userId={user.id} />;
};
