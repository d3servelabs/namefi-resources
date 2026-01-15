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
import { useTablePreferences } from '@/hooks/use-table-preferences';
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

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

type OrderItemRow = {
  id: string;
  normalizedDomainName: string;
  amountInUsdCents: number;
  durationInYears: number;
  type: string;
  registrar: string;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  orderStatus: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  paymentProvider: string | null;
  paymentStatus: string | null;
  paymentAmount: number | null;
  nfscWalletAddress: string | null;
  boughtForType: 'Own Wallet' | 'Other Wallet' | 'Unknown';
  userWallets: string[];
  freeClaimId: string | null;
  freeClaimGroupOrCampaignKey: string | null;
  freeClaimReason: string | null;
};

export default function AdminOrderItemsPage() {
  return (
    <AdminGuard>
      <PermissionGate
        permissions={[Permission.READ_ORDERS, Permission.READ_USERS]}
        permissionsMode="every"
      >
        <OrderItemsTable />
      </PermissionGate>
    </AdminGuard>
  );
}

function OrderItemsTable() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const defaultColumnVisibility: VisibilityState = {
    id: false,
    orderId: false,
    userId: false,
    userPrivyUserId: false,
    updatedAt: false,
    durationInYears: false,
    orderStatus: false,
    userWallets: false,
    nfscWalletAddress: false,
    freeClaimId: false,
    freeClaimGroupOrCampaignKey: true,
    freeClaimReason: false,
  };

  const {
    preferences: {
      columnVisibility,
      sorting,
      filters: columnFilters,
      pageSize,
    },
    setColumnVisibility,
    setSorting,
    setFilters: setColumnFilters,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-order-items',
    defaultPreferences: {
      columnVisibility: defaultColumnVisibility,
      sorting: [{ id: 'createdAt', desc: true }],
      filters: [],
      pageSize: 20,
    },
  });

  const orderItems = useQuery(
    trpc.admin.listOrderItems.queryOptions(
      {
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
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

  const handleCopyWallet = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Copied address to clipboard');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  }, []);

  const columns = useMemo<ColumnDef<OrderItemRow>[]>(
    () => [
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain Name',
        cell: ({ row }) => (
          <div className="font-medium">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={30}
              minCharactersToDisplay={30}
            >
              {row.original.normalizedDomainName}
            </AutoTruncateTextV2>
          </div>
        ),
        size: 200,
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
                  onClick={() => handleCopyWallet(row.original.userEmail!)}
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
        accessorKey: 'paymentProvider',
        header: 'Payment',
        cell: ({ row }) => {
          const provider = getPaymentProviderDisplay(
            row.original.paymentProvider,
          );
          const amount = row.original.paymentAmount;
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className={cn('w-fit', provider.color)}>
                {provider.label}
              </Badge>
              {amount !== null && (
                <span className="text-sm font-medium">
                  ${(amount / 100).toFixed(2)}
                </span>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'nftWalletAddress',
        header: 'Receiving Wallet',
        cell: ({ row }) => {
          // RENEW type doesn't have a receiving wallet
          if (row.original.type === 'RENEW') {
            return <span className="text-muted-foreground">-</span>;
          }

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
                onClick={() => handleCopyWallet(checksummedAddress)}
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
        accessorKey: 'boughtForType',
        header: 'Bought For',
        cell: ({ row }) => {
          // RENEW type doesn't have "bought for" concept
          if (row.original.type === 'RENEW') {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <Badge
              variant="outline"
              className={cn(
                'w-fit',
                getBoughtForBadge(row.original.boughtForType),
              )}
            >
              {row.original.boughtForType}
            </Badge>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.type}</Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'registrar',
        header: 'Registrar',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.registrar}</span>
        ),
        size: 100,
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
        accessorKey: 'paymentStatus',
        header: 'Payment Status',
        cell: ({ row }) => {
          const status = row.original.paymentStatus;
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
        size: 120,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-help">
                  {formatDistanceToNow(new Date(row.original.createdAt), {
                    addSuffix: true,
                  })}
                </span>
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
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={8}
            minCharactersToDisplay={8}
            className="font-mono text-xs"
          >
            {row.original.id}
          </AutoTruncateTextV2>
        ),
        size: 100,
      },
      {
        accessorKey: 'orderId',
        header: 'Order ID',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={8}
            minCharactersToDisplay={8}
            className="font-mono text-xs"
          >
            {row.original.orderId}
          </AutoTruncateTextV2>
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
        accessorKey: 'freeClaimGroupOrCampaignKey',
        header: 'Free Claim Campaign',
        cell: ({ row }) => {
          const campaign = row.original.freeClaimGroupOrCampaignKey;
          if (!campaign)
            return <span className="text-muted-foreground">-</span>;
          return (
            <Badge
              variant="outline"
              className="bg-purple-100 text-purple-800 border-purple-300"
            >
              {campaign}
            </Badge>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'freeClaimReason',
        header: 'Free Claim Reason',
        cell: ({ row }) => {
          const reason = row.original.freeClaimReason;
          if (!reason) return <span className="text-muted-foreground">-</span>;
          return (
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={30}
              minCharactersToDisplay={20}
              className="text-sm"
            >
              {reason}
            </AutoTruncateTextV2>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'freeClaimId',
        header: 'Free Claim ID',
        cell: ({ row }) => {
          const id = row.original.freeClaimId;
          if (!id) return <span className="text-muted-foreground">-</span>;
          return (
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={8}
              minCharactersToDisplay={8}
              className="font-mono text-xs"
            >
              {id}
            </AutoTruncateTextV2>
          );
        },
        size: 100,
      },
    ],
    [handleCopyWallet],
  );

  const rows = useMemo(() => {
    return (orderItems.data?.items ?? []).map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      boughtForType: item.boughtForType as
        | 'Own Wallet'
        | 'Other Wallet'
        | 'Unknown',
    }));
  }, [orderItems.data?.items]);

  const filterConfig = useMemo(
    () => ({
      normalizedDomainName: { type: 'text' as const, label: 'Domain Name' },
      userEmail: { type: 'text' as const, label: 'User Email' },
      userId: { type: 'text' as const, label: 'User ID' },
      nftWalletAddress: { type: 'text' as const, label: 'Receiving Wallet' },
      type: { type: 'text' as const, label: 'Type' },
      registrar: { type: 'text' as const, label: 'Registrar' },
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
      freeClaimGroupOrCampaignKey: {
        type: 'text' as const,
        label: 'Free Claim Campaign',
      },
    }),
    [],
  );

  const customFilters = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search',
        type: 'text' as const,
        placeholder: 'Search domains, emails, wallets, IDs...',
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
    ],
    [searchTerm],
  );

  return (
    <Card className="border border-muted/60 m-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Order Items</CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: {orderItems.data?.total ?? 0} items
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ServerDataTable
          columns={columns}
          data={rows}
          isLoading={orderItems.isLoading}
          isFetching={orderItems.isFetching}
          page={page}
          pageSize={pageSize}
          totalPages={orderItems.data?.totalPages ?? 1}
          totalCount={orderItems.data?.total ?? 0}
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
          emptyMessage="No order items found"
          loadingMessage="Loading order items..."
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          filterDisplayOptions={{ showInHeader: false }}
          onResetPreferences={resetToDefaults}
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
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getPaymentProviderDisplay(provider: string | null) {
  switch (provider) {
    case 'STRIPE':
      return {
        label: 'Stripe',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'NFSC':
      return {
        label: 'NFSC',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    default:
      return {
        label: provider || 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
      };
  }
}

function getBoughtForBadge(type: string) {
  switch (type) {
    case 'Own Wallet':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Other Wallet':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
