'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import type {
  ColumnDef,
  Row,
  SortingState,
  ColumnDefResolved,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { UserWalletAvatar } from '@/components/user-avatar';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { NetworkLogo } from '@/components/network-logo';
import { getChain, CHAINS } from '@namefi-astra/utils/chains';
import { ExportStatusBadge } from './export-status-badge';
import { StatusHistorySubrow } from './status-history-subrow';
import { VerifyButton } from './verify-button';

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

type ExportTrackingRecord = {
  id: string;
  normalizedDomainName: string;
  chainId: number;
  ownerAddress: string;
  status: string;
  previousStatus: string | null;
  statusHistory: Array<{
    timestamp: string;
    status: string;
    eppStatuses?: string[];
  }> | null;
  eppStatuses: string[] | null;
  registrarKey: string | null;
  statusChangedAt: Date;
  firstDetectedAt: Date;
  lastCheckedAt: Date;
  clientApprovedAt: Date | null;
  adminVerifiedAt: Date | null;
  verfyingAdminId: string | null;
  confirmedOutOfAccountAt: Date | null;
  nftBurnedAt: Date | null;
  nftBurnTxHash: string | null;
  userNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function ExportTrackingTable() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);

  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-export-tracking',
    defaultPreferences: {
      sorting: [{ id: 'statusChangedAt', desc: true }],
      pageSize: 25,
      columnVisibility: {
        statusChangedAt: false,
        registrarKey: false,
      },
    },
  });

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

  const query = useQuery(
    trpc.admin.getExportTrackingRecords.queryOptions(
      {
        page,
        pageSize,
        filters: backendFilters,
        sorting: backendSorting,
      },
      {
        placeholderData: (prev) => prev,
      },
    ),
  );

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain',
        type: 'text',
        columnId: 'normalizedDomainName',
      },
      status: {
        id: 'status',
        label: 'Status',
        type: 'select',
        columnId: 'status',
        options: [
          { value: 'NO_SIGNAL', label: 'No Signal' },
          { value: 'UNDETERMINED', label: 'Undetermined' },
          { value: 'PENDING_TRANSFER', label: 'Pending Transfer' },
          { value: 'TRANSFER_PERIOD', label: 'Transfer Period' },
          { value: 'TRANSFER_COMPLETED', label: 'Transfer Completed' },
          { value: 'TRANSFER_FAILED', label: 'Transfer Failed' },
          { value: 'NEEDS_ADMIN_REVIEW', label: 'Needs Admin Review' },
          { value: 'NOTIFIED', label: 'Notified' },
          { value: 'RESOLVED', label: 'Resolved' },
        ],
      },
      chainId: {
        id: 'chainId',
        label: 'Chain',
        type: 'select',
        columnId: 'chainId',
        options: [
          { value: String(CHAINS.base.id), label: CHAINS.base.name },
          { value: String(CHAINS.mainnet.id), label: CHAINS.mainnet.name },
          { value: String(CHAINS.sepolia.id), label: CHAINS.sepolia.name },
        ],
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Owner Address',
        type: 'text',
        columnId: 'ownerAddress',
      },
      registrarKey: {
        id: 'registrarKey',
        label: 'Registrar',
        type: 'text',
        columnId: 'registrarKey',
      },
    },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);
    },
  });

  const columns = useMemo(
    () =>
      [
        {
          id: 'expander',
          header: '',
          cell: ({ row }) => {
            const hasHistory =
              row.original.statusHistory &&
              row.original.statusHistory.length > 0;
            if (!hasHistory) return null;

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
          size: 40,
        },
        {
          accessorKey: 'normalizedDomainName',
          header: 'Domain',
          cell: ({ row }) => (
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={30}
              minCharactersToDisplay={15}
              className="font-medium"
            >
              {row.original.normalizedDomainName}
            </AutoTruncateTextV2>
          ),
          size: 200,
        },
        {
          accessorKey: 'chainId',
          header: 'Chain',
          cell: ({ row }) => {
            const chain = getChain(row.original.chainId);
            return (
              <div className="flex items-center gap-2">
                <NetworkLogo
                  network={row.original.chainId}
                  className="w-5 h-5"
                />
                <span className="text-xs text-muted-foreground">
                  {chain?.name ?? `Chain ${row.original.chainId}`}
                </span>
              </div>
            );
          },
          size: 120,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => <ExportStatusBadge status={row.original.status} />,
          size: 150,
        },
        {
          accessorKey: 'ownerAddress',
          header: 'Owner',
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
                    minCharactersToDisplay={10}
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
          size: 200,
        },
        {
          accessorKey: 'registrarKey',
          header: 'Registrar',
          cell: ({ row }) => (
            <span className="text-xs">{row.original.registrarKey ?? '-'}</span>
          ),
          size: 120,
        },
        {
          accessorKey: 'statusChangedAt',
          header: 'Status Changed',
          cell: ({ row }) =>
            row.original.statusChangedAt
              ? new Date(row.original.statusChangedAt).toLocaleString()
              : '-',
          size: 160,
        },
        {
          accessorKey: 'clientApprovedAt',
          header: 'Client Approved',
          cell: ({ row }) =>
            row.original.clientApprovedAt
              ? new Date(row.original.clientApprovedAt).toLocaleString()
              : '-',
          size: 160,
        },
        {
          accessorKey: 'adminVerifiedAt',
          header: 'Admin Verified',
          cell: ({ row }) =>
            row.original.adminVerifiedAt
              ? new Date(row.original.adminVerifiedAt).toLocaleString()
              : '-',
          size: 160,
        },
        {
          accessorKey: 'nftBurnedAt',
          header: 'NFT Burned',
          cell: ({ row }) =>
            row.original.nftBurnedAt
              ? new Date(row.original.nftBurnedAt).toLocaleString()
              : '-',
          size: 160,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => <VerifyButton record={row.original} />,
          size: 120,
        },
      ] satisfies ColumnDef<ExportTrackingRecord>[],
    [],
  );

  const renderSubRow = (row: Row<ExportTrackingRecord>) => (
    <StatusHistorySubrow statusHistory={row.original.statusHistory ?? []} />
  );

  return (
    <ExtensibleDataTable<ExportTrackingRecord, typeof filterStrategy>
      filterStrategy={filterStrategy}
      columns={columns}
      data={query.data?.data ?? []}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      page={page}
      pageSize={pageSize}
      totalPages={query.data?.pagination.totalPages ?? 1}
      totalCount={query.data?.pagination.totalCount ?? 0}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPage(1);
        setPageSize(size);
      }}
      sorting={sorting}
      onSortingChange={setSorting}
      renderSubRow={renderSubRow}
      getRowCanExpand={(row) => (row.original.statusHistory?.length ?? 0) > 0}
      emptyMessage="No export tracking records found"
      loadingMessage="Loading export tracking records..."
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onResetPreferences={resetToDefaults}
    />
  );
}

type VisibilityStateFromColumns<CDef extends ColumnDefResolved<any>> = {
  [key in NonNullable<
    CDef['id'] extends string ? CDef['id'] : CDef['accessorKey']
  >]?: boolean;
};

type UseVisibilityProps<CDef extends ColumnDefResolved<any>> = {
  initial?: VisibilityStateFromColumns<CDef>;
  columns: CDef[];
  defaultVisibility?: boolean;
};

const useVisibility = <CDef extends ColumnDefResolved<any>>({
  initial = {},
  columns,
  defaultVisibility = false,
}: UseVisibilityProps<CDef>) => {
  const base = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id ?? column.accessorKey ?? ''] = defaultVisibility;
      return acc;
    }, {} as any);
  }, [columns, defaultVisibility]);

  const [columnVisibility, setColumnVisibility] = useState<
    VisibilityStateFromColumns<CDef>
  >({ ...base, ...initial });

  const toggleColumnVisibility = useCallback(
    (columnId: keyof typeof initial) => {
      setColumnVisibility((prevVisibility) => ({
        ...prevVisibility,
        [columnId]: !prevVisibility[columnId],
      }));
    },
    [],
  );

  return { columnVisibility, setColumnVisibility, toggleColumnVisibility };
};
