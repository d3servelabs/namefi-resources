'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils';
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
import { DataTable } from '@/components/table/data-table';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NAMEFI_NFT_CONTRACT_ADDRESS, getChain } from '@namefi-astra/utils';
import { NetworkLogo } from '@/components/network-logo';

type UserRow = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  privyUserId: string;
  createdAt: Date;
  updatedAt: Date;
  isAdmin: boolean;
  nfts: Array<{
    chainId: number;
    normalizedDomainName: string;
    tokenId: string;
  }>;
  nftCount: number;
};

const getBlockExplorerUrl = (chainId: number, tokenId: string) => {
  const chain = getChain(chainId);
  if (!chain?.blockExplorers?.default?.url) return null;

  const contractAddress = NAMEFI_NFT_CONTRACT_ADDRESS;
  return `${chain.blockExplorers.default.url}/nft/${contractAddress}/${tokenId}`;
};

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <PermissionGate permissions={[Permission.READ_USERS]}>
        <UsersTable />
      </PermissionGate>
    </AdminGuard>
  );
}

function UsersTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [debouncedSearch] = useDebounceValue(searchTerm, 300);
  const [debouncedColumnFilters] = useDebounceValue(columnFilters, 500);

  // Transform column filters to backend format
  const backendColumnFilters = useMemo(() => {
    return debouncedColumnFilters.map((filter) => ({
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
        sorting: sorting.length > 0 ? sorting : undefined,
        columnFilters:
          backendColumnFilters.length > 0 ? backendColumnFilters : undefined,
      },
      {
        placeholderData: (prev) => prev,
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
        size: 50,
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
        header: 'Display',
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
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={20}
            minCharactersToDisplay={20}
          >
            {row.original.primaryEmail ?? '-'}
          </AutoTruncateTextV2>
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
          <PermissionGate permissions={[Permission.IMPERSONATE_USERS]}>
            <AsyncButton
              size="sm"
              variant="secondary"
              disabled={row.original.isAdmin === true}
              onClick={() => handleImpersonate(row.original.id)}
              loadingText="Impersonating..."
            >
              Impersonate
            </AsyncButton>
          </PermissionGate>
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
      isAdmin: u.isAdmin,
      nfts: u.nfts ?? [],
      nftCount: u.nftCount ?? 0,
    }));
  }, [users.data?.items]);

  const filterConfig = useMemo(
    () => ({
      id: 'text' as const,
      displayName: 'text' as const,
      primaryEmail: 'text' as const,
      privyUserId: 'text' as const,
      createdAt: 'date' as const,
      updatedAt: 'date' as const,
      nftCount: 'number' as const,
    }),
    [],
  );

  return (
    <Card className="border border-muted/60 m-6">
      <CardHeader>
        <CardTitle className="text-xl">All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <ServerDataTable
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
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setPage(1);
            setSearchTerm(term);
          }}
          searchPlaceholder="Search by email, name, wallet, id, or ENS..."
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={(filters) => {
            setPage(1);
            setColumnFilters(filters);
          }}
          filterConfig={filterConfig}
          renderSubRow={renderSubRow}
          getRowCanExpand={(row) => row.original.nftCount > 0}
          emptyMessage="No users found"
          loadingMessage="Loading users..."
        />
      </CardContent>
    </Card>
  );
}
function renderSubRow(row: Row<UserRow>) {
  return <UserNftsSubRow {...row} />;
}
const UserNftsSubRow = ({ original: user }: Row<UserRow>) => {
  type NftRow = UserRow['nfts'][number];

  const [nftPageSize, setNftPageSize] = useState(5);

  const nftColumns = useMemo<Array<ColumnDef<NftRow>>>(
    () => [
      {
        id: 'network',
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
        size: 100,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={30}
            minCharactersToDisplay={30}
          >
            {row.original.normalizedDomainName}
          </AutoTruncateTextV2>
        ),
        size: 200,
      },
      {
        id: 'token',
        header: 'Token',
        cell: ({ row }) => {
          const explorerUrl = getBlockExplorerUrl(
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
              #{row.original.tokenId}
            </a>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              #{row.original.tokenId}
            </span>
          );
        },
        size: 200,
      },
    ],
    [],
  );

  if (!user.nfts || user.nfts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        NFTs ({user.nftCount})
      </div>
      <DataTable<NftRow>
        columns={nftColumns}
        data={user.nfts}
        isLoading={false}
        pageSize={nftPageSize}
        onPageSizeChange={setNftPageSize}
      />
    </div>
  );
};
