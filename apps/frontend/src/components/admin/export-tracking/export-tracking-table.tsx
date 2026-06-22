'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { CHAINS } from '@namefi-astra/utils/chains';
import { ExportStatusBadge } from './export-status-badge';
import { ExportTrackingCard } from './export-tracking-card';
import {
  ChainCell,
  formatDateTime,
  LatestEvidenceCell,
  OwnerAddressCell,
} from './export-tracking-cells';
import { StatusHistorySubrow } from './status-history-subrow';
import type { ExportTrackingRecord } from './types';
import { VerifyButton } from './verify-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { PermissionGate } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';

/**
 * Whether a row has any expandable detail (status-history timeline / email
 * timestamps). Shared by the desktop `getRowCanExpand` and the mobile card so
 * both gate the expander on the exact same condition.
 */
const rowCanExpand = (record: ExportTrackingRecord): boolean =>
  (record.statusHistory?.length ?? 0) > 0 ||
  Boolean(record.pendingNotifiedAt) ||
  Boolean(record.notifiedAt);

export function ExportTrackingTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  // Which mobile cards have their status-history timeline expanded. Cards start
  // collapsed so the list stays scannable; this only drives the card layout.
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(
    () => new Set(),
  );

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
        latestEvidence: false,
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
    trpc.admin.exportTracking.getExportTrackingRecords.queryOptions(
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

  const triggerExportTrackingMutation = useMutation(
    trpc.admin.schedules.triggerSchedule.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey:
            trpc.admin.exportTracking.getExportTrackingRecords.queryKey(),
        });
      },
      onError: (error) => {
        toast.error('Failed to trigger export tracking workflow', {
          description: error.message,
        });
      },
    }),
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
                data-testid={`admin.export-tracking.list.row.${row.original.id}.expand-toggle`}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
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
          cell: ({ row }) => <ChainCell chainId={row.original.chainId} />,
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
          cell: ({ row }) => (
            <OwnerAddressCell
              ownerAddress={row.original.ownerAddress}
              data-testid={`admin.export-tracking.list.row.${row.original.id}.owner`}
            />
          ),
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
          cell: ({ row }) => formatDateTime(row.original.statusChangedAt),
          size: 160,
        },
        {
          accessorKey: 'clientApprovedAt',
          header: 'Client Approved',
          cell: ({ row }) => formatDateTime(row.original.clientApprovedAt),
          size: 160,
        },
        {
          accessorKey: 'adminVerifiedAt',
          header: 'Admin Verified',
          cell: ({ row }) => formatDateTime(row.original.adminVerifiedAt),
          size: 160,
        },
        {
          accessorKey: 'pendingNotifiedAt',
          header: 'Pending Email Sent',
          cell: ({ row }) => formatDateTime(row.original.pendingNotifiedAt),
          size: 180,
        },
        {
          accessorKey: 'notifiedAt',
          header: 'Completion Email Sent',
          cell: ({ row }) => formatDateTime(row.original.notifiedAt),
          size: 190,
        },
        {
          accessorKey: 'nftBurnedAt',
          header: 'NFT Burned',
          cell: ({ row }) => formatDateTime(row.original.nftBurnedAt),
          size: 160,
        },
        {
          accessorKey: 'latestEvidence',
          header: 'Latest Evidence',
          enableSorting: false,
          cell: ({ row }) => (
            <LatestEvidenceCell
              latestEvidence={row.original.latestEvidence}
              data-testid={`admin.export-tracking.list.row.${row.original.id}.latest-evidence`}
            />
          ),
          size: 320,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => (
            <VerifyButton
              record={row.original}
              data-testid={`admin.export-tracking.row.${row.original.id}.actions`}
            />
          ),
          size: 280,
        },
      ] satisfies ColumnDef<ExportTrackingRecord>[],
    [],
  );

  const renderSubRow = (row: Row<ExportTrackingRecord>) => (
    <StatusHistorySubrow
      statusHistory={row.original.statusHistory ?? []}
      pendingNotifiedAt={row.original.pendingNotifiedAt}
      notifiedAt={row.original.notifiedAt}
    />
  );

  const handleToggleCardExpanded = useCallback((id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Mobile card renderer. Renders off the SAME row data + shared cell components
  // as the desktop columns, so a phone gets a readable stacked card per record
  // instead of a horizontally-scrolling table. Gated internally by
  // ExtensibleDataTable on useIsMobile().
  const renderMobileCard = useCallback(
    (row: Row<ExportTrackingRecord>) => {
      const record = row.original;
      return (
        <ExportTrackingCard
          record={record}
          canExpand={rowCanExpand(record)}
          isExpanded={expandedCardIds.has(record.id)}
          onToggleExpanded={() => handleToggleCardExpanded(record.id)}
        />
      );
    },
    [expandedCardIds, handleToggleCardExpanded],
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PermissionGate permissions={[Permission.WRITE_SCHEDULES]}>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              triggerExportTrackingMutation.mutate({
                scheduleId: 'domain-export-tracking-schedule',
              })
            }
            disabled={triggerExportTrackingMutation.isPending}
            data-testid="admin.export-tracking.toolbar.run-button"
          >
            <Play className="h-4 w-4 me-1" />
            {triggerExportTrackingMutation.isPending
              ? 'Triggering...'
              : 'Run Export Tracking'}
          </Button>
        </PermissionGate>
      </div>

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
        getRowCanExpand={(row) => rowCanExpand(row.original)}
        renderMobileCard={renderMobileCard}
        emptyMessage="No export tracking records found"
        loadingMessage="Loading export tracking records..."
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onResetPreferences={resetToDefaults}
      />
    </div>
  );
}
