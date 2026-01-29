'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import { ServerDataTable } from '@/components/table/server-data-table';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Copy, ExternalLink } from 'lucide-react';
import { getChain, CHAINS } from '@namefi-astra/utils/chains';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { NetworkLogo } from '@/components/network-logo';
import { formatDate, formatDistanceToNow } from 'date-fns';
import { UserWalletAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/shadcn/button';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/shadcn/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/shadcn/input';

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

type OrderRow = {
  id: string;
  status: string | null;
  amountInUsdCents: number;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
};

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <PermissionGate
        permissions={[Permission.READ_ORDERS, Permission.READ_USERS]}
        permissionsMode="every"
      >
        <OrdersTable />
      </PermissionGate>
    </AdminGuard>
  );
}

function OrdersTable() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    userId: false,
    userPrivyUserId: false,
    updatedAt: false,
  });

  const ordersQuery = useQuery(
    trpc.admin.listOrders.queryOptions(
      {
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        userId: userIdFilter || undefined,
        sorting: sorting.length > 0 ? sorting : undefined,
        columnFilters:
          columnFilters.length > 0
            ? columnFilters.map((filter) => ({
                id: filter.id,
                value: filter.value as {
                  operator: 'like' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
                  value: string | number | Date;
                },
              }))
            : undefined,
      },
      {
        placeholderData: (prev) => prev,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  const handleCopyValue = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, []);

  const columns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Order ID',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/orders/${row.original.id}`}
              className="hover:underline"
            >
              <AutoTruncateTextV2
                initialCharactersCountToDisplay={12}
                minCharactersToDisplay={12}
                className="font-mono text-xs"
              >
                {row.original.id}
              </AutoTruncateTextV2>
            </Link>
            <button
              type="button"
              onClick={() => handleCopyValue(row.original.id)}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Copy Order ID"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'nftChainId',
        header: 'Chain',
        cell: ({ row }) => {
          const chainId = row.original.nftChainId;
          if (!chainId) return <span className="text-muted-foreground">-</span>;
          const chain = getChain(chainId);
          return (
            <div className="flex items-center gap-2">
              <NetworkLogo network={chainId} className="w-5 h-5" />
              <span className="text-sm">
                {chain?.name ?? `Chain ${chainId}`}
              </span>
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'userEmail',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.userEmail ? (
              <>
                <AutoTruncateTextV2
                  initialCharactersCountToDisplay={20}
                  minCharactersToDisplay={15}
                  className="text-sm"
                >
                  {row.original.userEmail}
                </AutoTruncateTextV2>
                <button
                  type="button"
                  onClick={() => handleCopyValue(row.original.userEmail!)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Copy email"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'nftWalletAddress',
        header: 'Receiving Wallet',
        cell: ({ row }) => {
          const address = row.original.nftWalletAddress;
          if (!address) return <span className="text-muted-foreground">-</span>;

          const checksummedAddress = attemptGetChecksummedAddress(address);
          return (
            <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
              <UserWalletAvatar
                address={checksummedAddress}
                className="size-6"
              />
              <div className="flex-1 min-w-0">
                <AutoTruncateTextV2
                  initialCharactersCountToDisplay={16}
                  minCharactersToDisplay={16}
                  className="font-mono text-xs"
                >
                  {checksummedAddress}
                </AutoTruncateTextV2>
              </div>
              <button
                type="button"
                onClick={() => handleCopyValue(checksummedAddress)}
                className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
                title="Copy address"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (!status) return <span className="text-muted-foreground">-</span>;
          return (
            <Badge
              variant="outline"
              className={cn('w-fit', getStatusColor(status))}
            >
              {status}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<span className="text-sm cursor-help" />}>
                {formatDistanceToNow(new Date(row.original.createdAt), {
                  addSuffix: true,
                })}
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatDate(new Date(row.original.createdAt), 'PPpp')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 120,
      },
      {
        accessorKey: 'amountInUsdCents',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium">
            ${(row.original.amountInUsdCents / 100).toFixed(2)}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'userId',
        header: 'User ID',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={8}
            minCharactersToDisplay={8}
            className="font-mono text-xs"
          >
            {row.original.userId}
          </AutoTruncateTextV2>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            render={<Link href={`/orders/${row.original.id}`} />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
        ),
        size: 100,
      },
    ],
    [handleCopyValue],
  );

  const rows = useMemo(() => {
    return (ordersQuery.data?.items ?? []).map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  }, [ordersQuery.data?.items]);

  const filterConfig = useMemo(
    () => ({
      userEmail: { type: 'text' as const, label: 'User Email' },
      nftWalletAddress: { type: 'text' as const, label: 'Receiving Wallet' },
      status: { type: 'text' as const, label: 'Status' },
      nftChainId: {
        type: 'select' as const,
        label: 'Chain',
        options: [
          { value: String(CHAINS.base.id), label: CHAINS.base.name },
          { value: String(CHAINS.mainnet.id), label: CHAINS.mainnet.name },
          { value: String(CHAINS.sepolia.id), label: CHAINS.sepolia.name },
        ],
      },
      amountInUsdCents: { type: 'number' as const, label: 'Amount (cents)' },
      createdAt: { type: 'date' as const, label: 'Created At' },
    }),
    [],
  );

  const customFilters = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search',
        type: 'text' as const,
        placeholder: 'Search orders, domains, emails, wallets...',
        value: searchTerm,
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setSearchTerm(value ? String(value) : '');
        },
        onClear: () => {
          setPage(1);
          setSearchTerm('');
        },
      },
      {
        id: 'userId',
        label: 'Filter by User ID',
        type: 'text' as const,
        placeholder: 'Enter User ID to filter...',
        value: userIdFilter,
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setUserIdFilter(value ? String(value) : '');
        },
        onClear: () => {
          setPage(1);
          setUserIdFilter('');
        },
      },
    ],
    [searchTerm, userIdFilter],
  );

  return (
    <Card className="border border-muted/60 m-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">All Orders</CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: {ordersQuery.data?.total ?? 0} orders
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ServerDataTable
          columns={columns}
          data={rows}
          isLoading={ordersQuery.isLoading}
          isFetching={ordersQuery.isFetching}
          page={page}
          pageSize={pageSize}
          totalPages={ordersQuery.data?.totalPages ?? 1}
          totalCount={ordersQuery.data?.total ?? 0}
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
          emptyMessage="No orders found"
          loadingMessage="Loading orders..."
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          filterDisplayOptions={{ showInHeader: false }}
        />
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'succeeded':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pending':
    case 'created':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'refunded':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getPaymentProviderDisplay(provider: string | null) {
  switch (provider?.toLowerCase()) {
    case 'stripe':
      return { label: 'Stripe', color: 'bg-blue-100 text-blue-800' };
    case 'nfsc_mainnet':
    case 'nfsc_base':
    case 'nfsc_sepolia':
      return { label: 'NFSC', color: 'bg-purple-100 text-purple-800' };
    case 'free':
      return { label: 'Free', color: 'bg-green-100 text-green-800' };
    default:
      return {
        label: provider || 'Unknown',
        color: 'bg-gray-100 text-gray-800',
      };
  }
}
