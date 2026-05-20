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
  OwnerAddressCell,
} from './export-tracking-cells';
import { StatusHistorySubrow } from './status-history-subrow';
import type { ExportTrackingRecord as BaseExportTrackingRecord } from './types';
import { VerifyButton } from './verify-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { PermissionGate } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';

type EvidenceSourceEntry = {
  source:
  | 'AccountCheck'
  | 'DomainIndex'
  | 'RDAPStatus'
  | 'RDAPEvents'
  | 'WHOIS'
  | 'DirectRegistrar';
  status:
  | 'positive_pending'
  | 'positive_period'
  | 'positive_completed'
  | 'positive_failed'
  | 'negative'
  | 'no_data'
  | 'error';
  evidence?: unknown;
  error?: string;
  checkedAt: string;
};

type SourceBasedLatestEvidence = {
  checkedAt?: string;
  decisionAction?: string;
  decisionReason?: string;
  sources?: EvidenceSourceEntry[];
  eppStatuses?: string[];
};

type TableLatestEvidence =
  | BaseExportTrackingRecord['latestEvidence']
  | SourceBasedLatestEvidence
  | null;

type TableExportTrackingRecord = Omit<
  BaseExportTrackingRecord,
  'latestEvidence'
> & {
  isActive?: boolean;
  verifyingAdminId?: string | null;
  pendingExportEmailSentAt?: Date | string | null;
  pendingExportEmailLastAttemptAt?: Date | string | null;
  pendingExportEmailAttempts?: number | null;
  pendingExportEmailLastError?: string | null;
  pendingExportEmailRecipient?: string | null;
  failedExportEmailSentAt?: Date | string | null;
  failedExportEmailLastAttemptAt?: Date | string | null;
  failedExportEmailAttempts?: number | null;
  failedExportEmailLastError?: string | null;
  failedExportEmailRecipient?: string | null;
  completedExportEmailSentAt?: Date | string | null;
  completedExportEmailLastAttemptAt?: Date | string | null;
  completedExportEmailAttempts?: number | null;
  completedExportEmailLastError?: string | null;
  completedExportEmailRecipient?: string | null;
  latestEvidence: TableLatestEvidence;
};

const toDateOrNull = (value: Date | string | null | undefined): Date | null =>
  value ? new Date(value) : null;

const getPendingEmailSentAt = (
  record: TableExportTrackingRecord,
): Date | string | null | undefined =>
  record.pendingExportEmailSentAt ?? record.pendingNotifiedAt;

const getCompletedEmailSentAt = (
  record: TableExportTrackingRecord,
): Date | string | null | undefined =>
  record.completedExportEmailSentAt ?? record.notifiedAt;

/**
 * Whether a row has any expandable detail (status-history timeline / email
 * timestamps). Shared by the desktop `getRowCanExpand` and the mobile card so
 * both gate the expander on the exact same condition.
 */
const rowCanExpand = (record: TableExportTrackingRecord): boolean =>
  (record.statusHistory?.length ?? 0) > 0 ||
  Boolean(getPendingEmailSentAt(record)) ||
  Boolean(record.failedExportEmailSentAt) ||
  Boolean(getCompletedEmailSentAt(record));

const buildVerifyButtonRecord = (record: TableExportTrackingRecord) => ({
  id: record.id,
  normalizedDomainName: record.normalizedDomainName,
  status: record.status,
  isActive: record.isActive ?? true,
  adminVerifiedAt: record.adminVerifiedAt,
  nftBurnedAt: record.nftBurnedAt,
  pendingExportEmailSentAt: toDateOrNull(getPendingEmailSentAt(record)),
  failedExportEmailSentAt: toDateOrNull(record.failedExportEmailSentAt),
  completedExportEmailSentAt: toDateOrNull(getCompletedEmailSentAt(record)),
});

const buildCardRecord = (
  record: TableExportTrackingRecord,
): BaseExportTrackingRecord => ({
  ...record,
  pendingNotifiedAt: toDateOrNull(getPendingEmailSentAt(record)),
  notifiedAt: toDateOrNull(getCompletedEmailSentAt(record)),
  latestEvidence:
    'sources' in (record.latestEvidence ?? {})
      ? null
      : (record.latestEvidence as BaseExportTrackingRecord['latestEvidence']),
});

const hasSourceEvidence = (
  latestEvidence: TableLatestEvidence,
): latestEvidence is SourceBasedLatestEvidence =>
  Boolean(
    latestEvidence &&
    'sources' in latestEvidence &&
    Array.isArray(latestEvidence.sources),
  );

const formatSourceBasedAccountSummary = (
  latestEvidence: SourceBasedLatestEvidence,
): string => {
  const accountSource = latestEvidence.sources?.find(
    (source) => source.source === 'AccountCheck',
  );

  if (!accountSource) return 'No data';
  if (accountSource.status === 'positive_completed') {
    return 'Out of account (confirmed)';
  }
  if (accountSource.status === 'negative') {
    return 'In account (confirmed)';
  }
  if (accountSource.status === 'error') {
    return `Error: ${accountSource.error ?? 'unknown'}`;
  }
  if (accountSource.status === 'no_data') {
    return 'No data';
  }

  return accountSource.status;
};

const formatSourceBasedRdapSummary = (
  latestEvidence: SourceBasedLatestEvidence,
): string => {
  const rdapEventsSource = latestEvidence.sources?.find(
    (source) => source.source === 'RDAPEvents',
  );
  const rdapEvidence = rdapEventsSource?.evidence as
    | { eventAction?: string; eventDate?: string }
    | undefined;

  if (!rdapEventsSource) return 'No data';
  if (rdapEventsSource.status === 'positive_completed') {
    return rdapEvidence?.eventDate
      ? `Detected (${new Date(rdapEvidence.eventDate).toLocaleString()})`
      : 'Detected';
  }
  if (rdapEventsSource.status === 'negative') {
    return 'Not detected';
  }
  if (rdapEventsSource.status === 'error') {
    return `Error: ${rdapEventsSource.error ?? 'unknown'}`;
  }
  if (rdapEventsSource.status === 'no_data') {
    return 'No data';
  }

  return rdapEventsSource.status;
};

const formatSourceBasedDomainIndexSummary = (
  latestEvidence: SourceBasedLatestEvidence,
): string => {
  const domainIndexSource = latestEvidence.sources?.find(
    (source) => source.source === 'DomainIndex',
  );

  if (!domainIndexSource) return 'No data';
  if (domainIndexSource.status === 'positive_completed') {
    return 'Missing from registrar';
  }
  if (domainIndexSource.status === 'negative') {
    return 'Present (indexed)';
  }
  if (domainIndexSource.status === 'error') {
    return `Error: ${domainIndexSource.error ?? 'unknown'}`;
  }
  if (domainIndexSource.status === 'no_data') {
    return 'Not indexed';
  }

  return domainIndexSource.status;
};

function LatestEvidenceTableCell({
  latestEvidence,
}: {
  latestEvidence: TableLatestEvidence;
}) {
  if (!latestEvidence) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const accountSummary = hasSourceEvidence(latestEvidence)
    ? formatSourceBasedAccountSummary(latestEvidence)
    : latestEvidence.accountCheck
      ? `${latestEvidence.accountCheck.inOurAccount ? 'In account' : 'Out of account'} (${latestEvidence.accountCheck.confirmed ? 'confirmed' : 'unconfirmed'})`
      : 'Unknown';

  const rdapSummary = hasSourceEvidence(latestEvidence)
    ? formatSourceBasedRdapSummary(latestEvidence)
    : latestEvidence.rdapTransferEvent?.detected
      ? latestEvidence.rdapTransferEvent.eventDate
        ? `Detected (${new Date(latestEvidence.rdapTransferEvent.eventDate).toLocaleString()})`
        : 'Detected'
      : 'Not detected';

  const domainIndexSummary = hasSourceEvidence(latestEvidence)
    ? formatSourceBasedDomainIndexSummary(latestEvidence)
    : null;

  return (
    <div className="space-y-0.5 text-xs max-w-[300px]">
      <div>
        <span className="text-muted-foreground">Account:</span>{' '}
        <span>{accountSummary}</span>
      </div>
      <div>
        <span className="text-muted-foreground">RDAP transfer:</span>{' '}
        <span>{rdapSummary}</span>
      </div>
      {domainIndexSummary ? (
        <div>
          <span className="text-muted-foreground">Domain index:</span>{' '}
          <span>{domainIndexSummary}</span>
        </div>
      ) : null}
      {latestEvidence.checkedAt && (
        <div className="text-muted-foreground">
          Checked: {new Date(latestEvidence.checkedAt).toLocaleString()}
        </div>
      )}
      {hasSourceEvidence(latestEvidence) ? (
        <div className="text-muted-foreground">
          Sources: {latestEvidence.sources?.length ?? 0} (
          {latestEvidence.sources?.filter((source) => source.status === 'error')
            .length ?? 0}{' '}
          errored)
        </div>
      ) : latestEvidence.evidenceSource ? (
        <div className="text-muted-foreground">
          Source: {latestEvidence.evidenceSource}
        </div>
      ) : null}
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs -ms-2"
            />
          }
        >
          View JSON
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[440px] max-sm:w-[calc(100vw-2rem)] p-3"
        >
          <div className="space-y-2">
            <div className="text-xs font-medium">Latest Evidence</div>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
              {JSON.stringify(latestEvidence, null, 2)}
            </pre>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
        pendingExportEmailAttempts: false,
        pendingExportEmailLastError: false,
        failedExportEmailSentAt: false,
        failedExportEmailAttempts: false,
        failedExportEmailLastError: false,
        completedExportEmailAttempts: false,
        completedExportEmailLastError: false,
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
      isActive: {
        id: 'isActive',
        label: 'Row state',
        type: 'select',
        columnId: 'isActive',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Terminal (frozen)' },
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
            if (!rowCanExpand(row.original)) return null;

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
          accessorKey: 'pendingExportEmailSentAt',
          header: 'Pending Email Sent',
          cell: ({ row }) =>
            formatDateTime(getPendingEmailSentAt(row.original)),
          size: 180,
        },
        {
          accessorKey: 'pendingExportEmailAttempts',
          header: 'Pending Attempts',
          cell: ({ row }) => row.original.pendingExportEmailAttempts ?? 0,
          size: 140,
        },
        {
          accessorKey: 'pendingExportEmailLastError',
          header: 'Pending Last Error',
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-xs text-red-600 font-mono">
              {row.original.pendingExportEmailLastError ?? '-'}
            </span>
          ),
          size: 220,
        },
        {
          accessorKey: 'failedExportEmailSentAt',
          header: 'Failed Email Sent',
          cell: ({ row }) =>
            formatDateTime(row.original.failedExportEmailSentAt),
          size: 180,
        },
        {
          accessorKey: 'failedExportEmailAttempts',
          header: 'Failed Attempts',
          cell: ({ row }) => row.original.failedExportEmailAttempts ?? 0,
          size: 140,
        },
        {
          accessorKey: 'failedExportEmailLastError',
          header: 'Failed Last Error',
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-xs text-red-600 font-mono">
              {row.original.failedExportEmailLastError ?? '-'}
            </span>
          ),
          size: 220,
        },
        {
          accessorKey: 'completedExportEmailSentAt',
          header: 'Completion Email Sent',
          cell: ({ row }) =>
            formatDateTime(getCompletedEmailSentAt(row.original)),
          size: 200,
        },
        {
          accessorKey: 'completedExportEmailAttempts',
          header: 'Completion Attempts',
          cell: ({ row }) => row.original.completedExportEmailAttempts ?? 0,
          size: 150,
        },
        {
          accessorKey: 'completedExportEmailLastError',
          header: 'Completion Last Error',
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-xs text-red-600 font-mono">
              {row.original.completedExportEmailLastError ?? '-'}
            </span>
          ),
          size: 220,
        },
        {
          accessorKey: 'isActive',
          header: 'Active',
          cell: ({ row }) =>
            (row.original.isActive ?? true) ? (
              <span className="text-xs font-medium">Active</span>
            ) : (
              <span className="text-xs text-muted-foreground">Terminal</span>
            ),
          size: 90,
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
            <LatestEvidenceTableCell
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
              record={buildVerifyButtonRecord(row.original)}
              data-testid={`admin.export-tracking.row.${row.original.id}.actions`}
            />
          ),
          size: 280,
        },
      ] satisfies ColumnDef<TableExportTrackingRecord>[],
    [],
  );

  const renderSubRow = (row: Row<TableExportTrackingRecord>) => (
    <StatusHistorySubrow
      statusHistory={row.original.statusHistory ?? []}
      pendingExportEmailSentAt={getPendingEmailSentAt(row.original)}
      pendingExportEmailAttempts={row.original.pendingExportEmailAttempts}
      pendingExportEmailLastError={row.original.pendingExportEmailLastError}
      failedExportEmailSentAt={row.original.failedExportEmailSentAt}
      failedExportEmailAttempts={row.original.failedExportEmailAttempts}
      failedExportEmailLastError={row.original.failedExportEmailLastError}
      completedExportEmailSentAt={getCompletedEmailSentAt(row.original)}
      completedExportEmailAttempts={row.original.completedExportEmailAttempts}
      completedExportEmailLastError={row.original.completedExportEmailLastError}
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
    (row: Row<TableExportTrackingRecord>) => {
      const record = row.original;
      return (
        <ExportTrackingCard
          record={buildCardRecord(record)}
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

      <ExtensibleDataTable<TableExportTrackingRecord, typeof filterStrategy>
        filterStrategy={filterStrategy}
        columns={columns}
        data={(query.data?.data ?? []) as TableExportTrackingRecord[]}
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
