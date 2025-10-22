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
import { usePagination } from '@/hooks/use-pagination';
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
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw,
  Clock,
  Mail,
} from 'lucide-react';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  getChain,
  CHAINS,
  checksumWalletAddressSchema,
} from '@namefi-astra/utils';
import { NetworkLogo } from '@/components/network-logo';
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  formatDate,
} from 'date-fns';
import { applyFilterOperator } from '@/components/table/data-table';
import { UserWalletAvatar } from '@/components/user-avatar';
import Link from 'next/link';
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
  isAdmin: boolean;
  wallets: string[];
  nfts: Array<{
    chainId: number;
    normalizedDomainName: string;
    tokenId: string;
    expirationTime: Date | string;
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
    isAdmin: false,
    nftCount: true,
    actions: true,
  });
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
          <div className="flex items-center w-full">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={20}
              minCharactersToDisplay={20}
            >
              {row.original.primaryEmail ?? '-'}
            </AutoTruncateTextV2>
            {!!row.original.primaryEmail && (
              <div className="ml-2 flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="rounded-full"
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <a
                          href={`mailto:${row.original.primaryEmail}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Send email"
                        >
                          <Mail className="h-3 w-3" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send email to {row.original.primaryEmail}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CopyIconButton
                  text={row.original.primaryEmail}
                  classNames={{ icon: 'h-3 w-3' }}
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
          <div className="flex items-center gap-2">
            {!row.original.isAdmin && (
              <PermissionGate permissions={[Permission.IMPERSONATE_USERS]}>
                <AsyncButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleImpersonate(row.original.id)}
                  loadingText="Impersonating..."
                >
                  Impersonate
                </AsyncButton>
              </PermissionGate>
            )}
            {!!row.original.primaryEmail && (
              <Button size="sm" variant="secondary" asChild>
                <a
                  href={`mailto:${row.original.primaryEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Send email"
                >
                  <Mail className="h-4 w-4" /> Send Email
                </a>
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
      nftCount: { type: 'number' as const, label: 'Asset Count' },
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
          getRowCanExpand={(row) => row.original.nftCount > 0}
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
  type NftRow = UserRow['nfts'][number];

  const [globalFilter, setGlobalFilter] = useState('');
  const { pageSize: nftPageSize, handlePageSizeChange } = usePagination({
    defaultPageSize: 5,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    tokenId: false,
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
          const explorerUrl = getBlockExplorerUrl(
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
            size="sm"
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
