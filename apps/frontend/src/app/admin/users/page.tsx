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
import { Button } from '@/components/ui/shadcn/button';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AsyncButton } from '@/components/buttons/async-button';
import { Input } from '@/components/ui/shadcn/input';
import { useDebounceValue } from 'usehooks-ts';
import { ServerDataTable } from '@/components/table/server-data-table';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
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
  const [pageSize, setPageSize] = useState(25);
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
            minCharactersToDisplay={20}
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
          <AutoTruncateTextV2 minCharactersToDisplay={15}>
            {row.original.displayName ?? '-'}
          </AutoTruncateTextV2>
        ),
        size: 150,
      },
      {
        accessorKey: 'primaryEmail',
        header: 'Email',
        cell: ({ row }) => (
          <AutoTruncateTextV2 minCharactersToDisplay={20}>
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
            minCharactersToDisplay={20}
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

  const getBlockExplorerUrl = useCallback(
    (chainId: number, tokenId: string) => {
      const chain = getChain(chainId);
      if (!chain?.blockExplorers?.default?.url) return null;

      const contractAddress = NAMEFI_NFT_CONTRACT_ADDRESS;
      return `${chain.blockExplorers.default.url}/nft/${contractAddress}/${tokenId}`;
    },
    [],
  );

  const renderSubRow = useCallback(
    (row: any) => {
      const user = row.original as UserRow;
      if (!user.nfts || user.nfts.length === 0) return null;

      return (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-muted-foreground mb-2">
            NFTs ({user.nftCount})
          </div>
          <div className="grid gap-2">
            {user.nfts.map((nft) => {
              const chain = getChain(nft.chainId);
              const explorerUrl = getBlockExplorerUrl(nft.chainId, nft.tokenId);

              return (
                <div
                  key={`${nft.chainId}-${nft.tokenId}`}
                  className="flex items-center gap-4 text-sm bg-background/50 rounded p-2"
                >
                  <div className="flex items-center gap-2 w-32">
                    <NetworkLogo network={nft.chainId} className="w-6 h-6" />
                    <span className="text-xs text-muted-foreground">
                      {chain?.name ?? `Chain ${nft.chainId}`}
                    </span>
                  </div>
                  <AutoTruncateTextV2
                    minCharactersToDisplay={30}
                    className="flex-1"
                  >
                    {nft.normalizedDomainName}
                  </AutoTruncateTextV2>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      #{nft.tokenId}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      #{nft.tokenId}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [getBlockExplorerUrl],
  );

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
