'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Copy, Play } from 'lucide-react';
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
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { PermissionGate } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';

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
  pendingNotifiedAt: Date | null;
  userNotified: boolean;
  notifiedAt: Date | null;
  latestEvidence: {
    checkedAt?: string;
    evidenceSource?: 'DIRECT_REGISTRAR' | 'RDAP' | 'WHOIS' | 'NONE';
    accountCheck?: {
      inOurAccount?: boolean;
      confirmed?: boolean;
    };
    rdapTransferEvent?: {
      detected?: boolean;
      eventAction?: string;
      eventDate?: string;
    };
    decisionAction?: string;
    decisionReason?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export function ExportTrackingTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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
          accessorKey: 'pendingNotifiedAt',
          header: 'Pending Email Sent',
          cell: ({ row }) =>
            row.original.pendingNotifiedAt
              ? new Date(row.original.pendingNotifiedAt).toLocaleString()
              : '-',
          size: 180,
        },
        {
          accessorKey: 'notifiedAt',
          header: 'Completion Email Sent',
          cell: ({ row }) =>
            row.original.notifiedAt
              ? new Date(row.original.notifiedAt).toLocaleString()
              : '-',
          size: 190,
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
          accessorKey: 'latestEvidence',
          header: 'Latest Evidence',
          enableSorting: false,
          cell: ({ row }) => {
            const latestEvidence = row.original.latestEvidence;
            if (!latestEvidence) {
              return <span className="text-xs text-muted-foreground">-</span>;
            }

            const accountCheck = latestEvidence.accountCheck;
            const accountSummary = accountCheck
              ? `${accountCheck.inOurAccount ? 'In account' : 'Out of account'} (${accountCheck.confirmed ? 'confirmed' : 'unconfirmed'})`
              : 'Unknown';

            const rdapEvent = latestEvidence.rdapTransferEvent;
            const rdapSummary = rdapEvent?.detected
              ? rdapEvent.eventDate
                ? `Detected (${new Date(rdapEvent.eventDate).toLocaleString()})`
                : 'Detected'
              : 'Not detected';

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
                {latestEvidence.checkedAt && (
                  <div className="text-muted-foreground">
                    Checked:{' '}
                    {new Date(latestEvidence.checkedAt).toLocaleString()}
                  </div>
                )}
                {latestEvidence.evidenceSource && (
                  <div className="text-muted-foreground">
                    Source: {latestEvidence.evidenceSource}
                  </div>
                )}
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs -ml-2"
                      />
                    }
                  >
                    View JSON
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[440px] p-3">
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
          },
          size: 320,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => <VerifyButton record={row.original} />,
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
          >
            <Play className="h-4 w-4 mr-1" />
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
        getRowCanExpand={(row) =>
          (row.original.statusHistory?.length ?? 0) > 0 ||
          Boolean(row.original.pendingNotifiedAt) ||
          Boolean(row.original.notifiedAt)
        }
        emptyMessage="No export tracking records found"
        loadingMessage="Loading export tracking records..."
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onResetPreferences={resetToDefaults}
      />
    </div>
  );
}
