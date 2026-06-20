'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { useTRPC, useTRPCClient } from '@/lib/trpc';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import {
  AnalysisDateCell,
  AnalyzedAtCell,
  DnsvizAnalysisCard,
  DnsvizMessageCard,
  type DnsvizDetailMessage,
  DomainNameCell as DnsvizDomainNameCell,
  DsStatusCell,
  ErrorsCountCell,
  MessageCodeCell,
  NamefiNsBadgeCell,
  NameserversListCell,
  ReasoningCell,
  RegistrarCell,
  StatusBadge,
  STATUS_BADGE_VARIANT,
  SupportsDnssecCell,
  UserCell,
  ZoneSigningCell,
} from './dnsviz-cells';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import {
  Eye,
  Download,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ListTree,
  Play,
  X as XIcon,
} from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import { useTheme } from 'next-themes';
import type { ColumnDef, Row, SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
  DnsvizAnalysesCounts,
  DnsvizAnalysisRow,
  DnsvizFailureBreakdown,
  DnsvizGraphType,
} from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';

export default function AdminDnsvizPage() {
  return (
    <AdminGuard>
      <DnsvizAnalysesPanel />
    </AdminGuard>
  );
}

function DnsvizAnalysesPanel() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'analysisDate', desc: true },
  ]);
  // Drizzler filter strategy: per-column filters with multiple
  // conditions + AND/OR. The state is converted to `FilterOptions`
  // server-side via `convertToDrizzlerFilterOptions`. Debounced 500ms
  // so a typing user doesn't fan out a request per keystroke.
  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({ columnFilters: {}, customFilters: {} });
  const [debouncedDrizzlerFilterState] = useDebounceValue(
    drizzlerFilterState,
    500,
  );
  const backendFilters = useMemo(
    () =>
      convertToDrizzlerFilterOptions(
        debouncedDrizzlerFilterState.columnFilters,
      ),
    [debouncedDrizzlerFilterState],
  );
  const backendSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;
    return sorting.map((s) => ({
      column: s.id,
      order: s.desc ? ('desc' as const) : ('asc' as const),
    }));
  }, [sorting]);
  const [graphTarget, setGraphTarget] = useState<{
    id: string;
    domainName: string;
    analysisDate: string;
  } | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<{
    id: string;
    domainName: string;
    analysisDate: string;
  } | null>(null);
  /**
   * Multiselect state: keyed by row id (UUID), value is the row's domain
   * name. Stored as a Map so selections persist across pagination — the
   * domains we submit to the on-demand workflow may span multiple pages.
   */
  const [selectedRows, setSelectedRows] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [submitOpen, setSubmitOpen] = useState(false);

  const query = useQuery(
    trpc.admin.dnsviz.listAnalyses.queryOptions(
      {
        page,
        pageSize,
        filters: backendFilters,
        sorting: backendSorting,
      },
      { placeholderData: (prev) => prev },
    ),
  );

  // Same filters minus pagination/sorting — driven independently so
  // it doesn't refetch when the user only pages or re-sorts.
  const countsQuery = useQuery(
    trpc.admin.dnsviz.getAnalysesCounts.queryOptions(
      { filters: backendFilters },
      { placeholderData: (prev) => prev },
    ),
  );

  const rows = query.data?.rows ?? [];
  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selectedRows.has(r.id));
  const someOnPageSelected =
    rows.some((r) => selectedRows.has(r.id)) && !allOnPageSelected;

  const toggleAllOnPage = useCallback(
    (checked: boolean) => {
      setSelectedRows((prev) => {
        const next = new Map(prev);
        if (checked) {
          for (const r of rows) next.set(r.id, r.normalizedDomainName);
        } else {
          for (const r of rows) next.delete(r.id);
        }
        return next;
      });
    },
    [rows],
  );
  const toggleRow = useCallback(
    (id: string, domainName: string, checked: boolean) => {
      setSelectedRows((prev) => {
        const next = new Map(prev);
        if (checked) next.set(id, domainName);
        else next.delete(id);
        return next;
      });
    },
    [],
  );
  const clearSelection = useCallback(() => setSelectedRows(new Map()), []);

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain',
        type: 'text',
        columnId: 'normalizedDomainName',
      },
      analysisDate: {
        id: 'analysisDate',
        label: 'Analysis date',
        type: 'date',
        columnId: 'analysisDate',
      },
      status: {
        id: 'status',
        label: 'Status',
        type: 'select',
        columnId: 'status',
        options: [
          { value: 'SECURE', label: 'SECURE' },
          { value: 'INSECURE', label: 'INSECURE' },
          { value: 'BOGUS', label: 'BOGUS' },
          { value: 'ERROR', label: 'ERROR' },
          { value: 'EXPECTED_ERROR', label: 'EXPECTED ERROR' },
          { value: 'WARN', label: 'WARN' },
        ],
      },
      registrarKey: {
        id: 'registrarKey',
        label: 'Registrar',
        type: 'text',
        columnId: 'registrarKey',
      },
      // Booleans are text-cast on the server (`::text` / `->> 'key'`)
      // so eq/neq accept 'true'/'false'; isNull/isNotNull cover the
      // join-miss case.
      isUsingNamefiNameservers: {
        id: 'isUsingNamefiNameservers',
        label: 'Namefi NS',
        type: 'select',
        columnId: 'isUsingNamefiNameservers',
        options: [
          { value: 'true', label: 'Namefi' },
          { value: 'false', label: 'Custom' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      supportsDnssec: {
        id: 'supportsDnssec',
        label: 'Supports DNSSEC',
        type: 'select',
        columnId: 'supportsDnssec',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      dnssecZoneHasActiveDnssec: {
        id: 'dnssecZoneHasActiveDnssec',
        label: 'Zone Signing',
        type: 'select',
        columnId: 'dnssecZoneHasActiveDnssec',
        options: [
          { value: 'true', label: 'On' },
          { value: 'false', label: 'Off' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      dnssecHasDelegationSigner: {
        id: 'dnssecHasDelegationSigner',
        label: 'Has DS',
        type: 'select',
        columnId: 'dnssecHasDelegationSigner',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      dnssecIsUsingNamefiDelegationSigner: {
        id: 'dnssecIsUsingNamefiDelegationSigner',
        label: 'Namefi DS',
        type: 'select',
        columnId: 'dnssecIsUsingNamefiDelegationSigner',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
      userId: {
        id: 'userId',
        label: 'User ID',
        type: 'text',
        columnId: 'userId',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Owner wallet',
        type: 'text',
        columnId: 'ownerAddress',
      },
    },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);
    },
  });

  const columns = useMemo<ColumnDef<DnsvizAnalysisRow>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allOnPageSelected}
            indeterminate={someOnPageSelected}
            onCheckedChange={(c) => toggleAllOnPage(c === true)}
            aria-label="Select all rows on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRows.has(row.original.id)}
            onCheckedChange={(c) =>
              toggleRow(
                row.original.id,
                row.original.normalizedDomainName,
                c === true,
              )
            }
            aria-label={`Select ${row.original.normalizedDomainName}`}
          />
        ),
        size: 44,
        enableSorting: false,
      },
      {
        accessorKey: 'analysisDate',
        header: 'Date',
        cell: ({ row }) => (
          <AnalysisDateCell analysisDate={row.original.analysisDate} />
        ),
        size: 110,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <DnsvizDomainNameCell
            normalizedDomainName={row.original.normalizedDomainName}
          />
        ),
        size: 240,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 110,
      },
      {
        accessorKey: 'registrarKey',
        header: 'Registrar',
        cell: ({ row }) => (
          <RegistrarCell registrarKey={row.original.registrarKey} />
        ),
        size: 120,
      },
      {
        id: 'user',
        header: 'User',
        enableSorting: false,
        cell: ({ row }) => <UserCell row={row.original} />,
        size: 220,
      },
      {
        id: 'isUsingNamefiNameservers',
        header: 'Namefi NS',
        enableSorting: false,
        cell: ({ row }) => (
          <NamefiNsBadgeCell value={row.original.isUsingNamefiNameservers} />
        ),
        size: 110,
      },
      {
        id: 'nameservers',
        header: 'Nameservers',
        enableSorting: false,
        cell: ({ row }) => <NameserversListCell row={row.original} />,
        size: 220,
      },
      {
        id: 'supportsDnssec',
        header: 'Supports DNSSEC',
        enableSorting: false,
        cell: ({ row }) => (
          <SupportsDnssecCell value={row.original.supportsDnssec} />
        ),
        size: 140,
      },
      {
        id: 'zoneSigning',
        header: 'Zone Signing',
        enableSorting: false,
        cell: ({ row }) => (
          <ZoneSigningCell value={row.original.dnssecZoneHasActiveDnssec} />
        ),
        size: 150,
      },
      {
        id: 'dsStatus',
        header: 'DS Status',
        enableSorting: false,
        cell: ({ row }) => (
          <DsStatusCell
            hasDs={row.original.dnssecHasDelegationSigner}
            isNamefiDs={row.original.dnssecIsUsingNamefiDelegationSigner}
          />
        ),
        size: 140,
      },
      {
        accessorKey: 'errorsCount',
        header: 'Errors',
        cell: ({ row }) => <ErrorsCountCell row={row.original} />,
        size: 130,
      },
      {
        id: 'reasoning',
        header: 'Reasoning',
        cell: ({ row }) => <ReasoningCell reasoning={row.original.reasoning} />,
        size: 380,
      },
      {
        id: 'analyzedAt',
        header: 'Analyzed',
        cell: ({ row }) => (
          <AnalyzedAtCell analysisStartedAt={row.original.analysisStartedAt} />
        ),
        size: 160,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onView={() =>
              setGraphTarget({
                id: row.original.id,
                domainName: row.original.normalizedDomainName,
                analysisDate: row.original.analysisDate,
              })
            }
            onShowDetails={() =>
              setDetailsTarget({
                id: row.original.id,
                domainName: row.original.normalizedDomainName,
                analysisDate: row.original.analysisDate,
              })
            }
          />
        ),
        size: 300,
      },
    ],
    [
      allOnPageSelected,
      someOnPageSelected,
      selectedRows,
      toggleAllOnPage,
      toggleRow,
    ],
  );

  /**
   * Mobile card renderer for the EDT. Renders the SAME row data through the
   * SAME shared cells as the desktop columns, and forwards the row's select
   * checkbox + `RowActions` wired to the SAME selection / dialog handlers — so
   * the card and the table can never drift (switch layout, reuse logic).
   */
  const renderMobileCard = useCallback(
    (tableRow: Row<DnsvizAnalysisRow>) => {
      const row = tableRow.original;
      return (
        <DnsvizAnalysisCard
          row={row}
          selectControl={
            <Checkbox
              checked={selectedRows.has(row.id)}
              onCheckedChange={(c) =>
                toggleRow(row.id, row.normalizedDomainName, c === true)
              }
              aria-label={`Select ${row.normalizedDomainName}`}
            />
          }
          actions={
            <RowActions
              row={row}
              onView={() =>
                setGraphTarget({
                  id: row.id,
                  domainName: row.normalizedDomainName,
                  analysisDate: row.analysisDate,
                })
              }
              onShowDetails={() =>
                setDetailsTarget({
                  id: row.id,
                  domainName: row.normalizedDomainName,
                  analysisDate: row.analysisDate,
                })
              }
            />
          }
        />
      );
    },
    [selectedRows, toggleRow],
  );

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>DNSViz Analyses</CardTitle>
        <p className="text-xs text-muted-foreground">
          Per-domain DNSSEC verdict + reasoning. Open the graph for any row to
          see the chain-of-trust diagram, or download as SVG / HTML.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <CountsCard
          data={countsQuery.data}
          isLoading={countsQuery.isLoading}
          isError={countsQuery.isError}
        />
        {/*
          Refresh button is the only loose control left here — filters
          all live in the drizzler `<ExtensibleDataTable>` filter panel
          below, sourced from `filterStrategy`.
        */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 me-2 ${query.isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {selectedRows.size > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-primary/5 p-2 text-sm">
            <span>
              <strong>{selectedRows.size}</strong> domain
              {selectedRows.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedRows.size === 0}
              >
                <XIcon className="h-3 w-3 me-1" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setSubmitOpen(true)}
                disabled={selectedRows.size === 0}
              >
                <Play className="h-3 w-3 me-1" />
                Run on-demand analysis
              </Button>
            </div>
          </div>
        ) : null}

        {query.isError ? (
          <div className="flex items-center gap-2 rounded border border-destructive/50 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load: {query.error.message}</span>
          </div>
        ) : (
          <ExtensibleDataTable<DnsvizAnalysisRow, typeof filterStrategy>
            filterStrategy={filterStrategy}
            columns={columns}
            data={rows}
            isLoading={query.isLoading}
            isFetching={query.isFetching}
            page={page}
            pageSize={pageSize}
            totalPages={query.data?.totalPages ?? 1}
            totalCount={query.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
            sorting={sorting}
            onSortingChange={setSorting}
            renderMobileCard={renderMobileCard}
            emptyMessage="No DNSSEC analyses match the current filters."
            loadingMessage="Loading DNSViz analyses..."
          />
        )}
      </CardContent>

      <GraphPreviewDialog
        target={graphTarget}
        onClose={() => setGraphTarget(null)}
      />
      <AnalysisDetailsDialog
        target={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />
      <RunOnDemandDialog
        open={submitOpen}
        domains={Array.from(selectedRows.values())}
        onClose={() => setSubmitOpen(false)}
        onSuccess={() => {
          clearSelection();
          setSubmitOpen(false);
        }}
      />
    </Card>
  );
}

function RunOnDemandDialog({
  open,
  domains,
  onClose,
  onSuccess,
}: {
  open: boolean;
  domains: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const runMutation = useMutation(
    trpc.admin.dnsviz.runOnDemandAnalysis.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `On-demand analysis started for ${data.domains.length} domain${
            data.domains.length === 1 ? '' : 's'
          }`,
          {
            description: `Workflow: ${data.workflowId}`,
          },
        );
        queryClient.invalidateQueries({
          queryKey: trpc.admin.dnsviz.listAnalyses.queryKey(),
        });
        onSuccess();
      },
      onError: (err) => {
        toast.error('Failed to start workflow', { description: err.message });
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'max-w-xl')}>
        <DialogHeader>
          <DialogTitle>Run on-demand DNSSEC analysis</DialogTitle>
          <DialogDescription>
            Submits these domains to <code>dnsvizOnDemandWorkflow</code> on the
            INDEXERS task queue. Existing rows for today will be overwritten by
            the new analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded border bg-muted/30 p-2 max-h-60 overflow-y-auto">
          <ul className="space-y-1 text-xs font-mono">
            {domains.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={runMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => runMutation.mutate({ domains })}
            disabled={runMutation.isPending || domains.length === 0}
          >
            {runMutation.isPending ? (
              <Loader2 className="h-3 w-3 me-1.5 animate-spin" />
            ) : (
              <Play className="h-3 w-3 me-1.5" />
            )}
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Aggregate-counts banner shown above the table. Uses
 * `getAnalysesCounts` (same filters as the list, no pagination) so it
 * reflects whatever the table is currently filtered to. The
 * BOGUS+ERROR breakdown is rendered only when there's at least one
 * actionable failure — for clean days the card stays compact.
 */
function CountsCard({
  data,
  isLoading,
  isError,
}: {
  data: DnsvizAnalysesCounts | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isError) {
    return (
      <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs">
        Failed to load count distribution
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
        {isLoading ? 'Loading distribution…' : 'No data'}
      </div>
    );
  }
  const { byStatus, total, failureBreakdown } = data;
  const showBreakdown = byStatus.BOGUS > 0 || byStatus.ERROR > 0;
  return (
    <div className="rounded border bg-muted/20 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">
          {total} {total === 1 ? 'analysis' : 'analyses'}
        </span>
        <StatusCount label="SECURE" count={byStatus.SECURE} variant="default" />
        <StatusCount
          label="INSECURE"
          count={byStatus.INSECURE}
          variant="secondary"
        />
        <StatusCount
          label="BOGUS"
          count={byStatus.BOGUS}
          variant="destructive"
        />
        <StatusCount
          label="ERROR"
          count={byStatus.ERROR}
          variant="destructive"
        />
        <StatusCount label="WARN" count={byStatus.WARN} variant="secondary" />
        <StatusCount
          label="EXPECTED ERROR"
          count={byStatus.EXPECTED_ERROR}
          variant="outline"
        />
      </div>
      {showBreakdown ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(['BOGUS', 'ERROR'] as const).map((s) =>
            byStatus[s] > 0 ? (
              <FailureBreakdownBlock
                key={s}
                status={s}
                breakdown={failureBreakdown[s]}
              />
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatusCount({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={variant} className="font-mono">
        {label}
      </Badge>
      <span className="font-mono">{count}</span>
    </span>
  );
}

function FailureBreakdownBlock({
  status,
  breakdown,
}: {
  status: 'BOGUS' | 'ERROR';
  breakdown: DnsvizFailureBreakdown;
}) {
  return (
    <div className="rounded border bg-background p-2">
      <div className="mb-1 font-semibold">{status} breakdown</div>
      <div className="grid grid-cols-2 gap-x-3 font-mono">
        <div>
          <div className="text-muted-foreground">Nameservers</div>
          <div>Namefi: {breakdown.usingNamefiNs}</div>
          <div>Custom: {breakdown.customNs}</div>
          <div>Unknown: {breakdown.unknownNs}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Supports DNSSEC</div>
          <div>Yes: {breakdown.supportsDnssec}</div>
          <div>No: {breakdown.noSupportsDnssec}</div>
          <div>Unknown: {breakdown.unknownSupportsDnssec}</div>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  row,
  onView,
  onShowDetails,
}: {
  row: DnsvizAnalysisRow;
  onView: () => void;
  onShowDetails: () => void;
}) {
  const downloadGraph = useGraphDownload();
  const downloadJson = useJsonDownload();
  const isPending = downloadGraph.isPending || downloadJson.isPending;

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={onView}>
        <Eye className="h-3 w-3 me-1.5" />
        Graph
      </Button>
      <Button variant="outline" size="sm" onClick={onShowDetails}>
        <ListTree className="h-3 w-3 me-1.5" />
        Details
      </Button>
      {/*
        Mirrors the canonical pattern in
        `apps/frontend/src/components/dropdowns/cart-dropdown.tsx`:
        DropdownMenuLabel + items inside DropdownMenuGroup, items that
        live outside the group go at the bottom of DropdownMenuContent.
      */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" disabled={isPending} />}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 me-1.5 animate-spin" />
          ) : (
            <Download className="h-3 w-3 me-1.5" />
          )}
          Download
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Graph</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => downloadGraph.run({ id: row.id, type: 'svg' })}
            >
              SVG (vector)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadGraph.run({ id: row.id, type: 'html' })}
            >
              HTML (interactive)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                downloadGraph.run({
                  id: row.id,
                  type: 'html',
                  openInTab: true,
                })
              }
            >
              <ExternalLink className="h-3 w-3 me-1.5" />
              Open HTML in new tab
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Raw JSON</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => downloadJson.run({ id: row.id, kind: 'probe' })}
            >
              probe.json
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadJson.run({ id: row.id, kind: 'grok' })}
            >
              grok.json
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function GraphPreviewDialog({
  target,
  onClose,
}: {
  target: { id: string; domainName: string; analysisDate: string } | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const open = target !== null;

  // Render the generated HTML viewer from the stored audit artifact.
  const query = useQuery(
    trpc.admin.dnsviz.getAnalysisGraph.queryOptions(
      target ? { id: target.id, type: 'html' } : { id: '', type: 'html' },
      {
        enabled: open,
        // Cache rendered graphs briefly so reopening the same row does not
        // regenerate the same HTML.
        staleTime: 60_000,
      },
    ),
  );

  const html = useMemo(() => {
    if (!query.data) return null;
    return base64ToUtf8(query.data.base64);
  }, [query.data]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          '!max-w-[85vw] !min-w-5xl max-h-[90vh] overflow-y-auto',
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {target?.domainName ?? 'DNSSEC graph'}{' '}
            <span className="font-mono text-xs text-muted-foreground">
              {target?.analysisDate}
            </span>
          </DialogTitle>
          <DialogDescription>
            Temporary chain-of-trust diagram rendered from the stored DNSSEC
            audit artifact.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-[400px] items-center justify-center rounded border bg-muted/30">
          {query.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rendering graph…
            </div>
          ) : query.isError ? (
            <div className="flex flex-col items-center gap-2 text-sm p-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Failed to render: {query.error.message}</span>
            </div>
          ) : html ? (
            <iframe
              srcDoc={html}
              title={`DNSSEC graph for ${target?.domainName ?? ''}`}
              sandbox=""
              className="h-[70vh] w-full rounded bg-white"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnalysisDetailsDialog({
  target,
  onClose,
}: {
  target: { id: string; domainName: string; analysisDate: string } | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const open = target !== null;

  const query = useQuery(
    trpc.admin.dnsviz.getAnalysisDetails.queryOptions(
      target ? { id: target.id } : { id: '' },
      { enabled: open, staleTime: 30_000 },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          '!max-w-5xl max-h-[90vh] overflow-y-auto',
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {target?.domainName ?? 'Analysis details'}{' '}
            <span className="font-mono text-xs text-muted-foreground">
              {target?.analysisDate}
            </span>
          </DialogTitle>
          <DialogDescription>
            Full error / warning list and raw grok output for this analysis.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading details…
          </div>
        ) : query.isError ? (
          <div className="flex flex-col items-center gap-2 p-6 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Failed to load: {query.error.message}</span>
          </div>
        ) : query.data ? (
          <DetailsBody
            row={query.data.row}
            messages={query.data.messages}
            counts={query.data.counts}
            grokData={query.data.grokData}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailsBody({
  row,
  messages,
  counts,
  grokData,
}: {
  row: DnsvizAnalysisRow;
  messages: Array<{
    zone: string;
    path: string;
    code: string | null;
    description: string;
    ignored: boolean;
    severity: 'error' | 'warning';
  }>;
  counts: {
    totalErrors: number;
    totalWarnings: number;
    ignoredErrors: number;
    ignoredWarnings: number;
  };
  grokData: unknown;
}) {
  const errors = messages.filter((m) => m.severity === 'error');
  const warnings = messages.filter((m) => m.severity === 'warning');
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="rounded border bg-muted/30 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={STATUS_BADGE_VARIANT[row.status]}
            className="font-mono"
          >
            {row.status}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {row.registrarKey}
          </span>
          <span className="text-xs text-muted-foreground">
            analyzed{' '}
            {format(
              new UTCDate(row.analysisStartedAt),
              "yyyy-MM-dd HH:mm 'UTC'",
            )}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{row.reasoning}</p>
        {row.errorMessage ? (
          <p className="mt-2 text-xs text-destructive">
            <strong>Error:</strong> {row.errorMessage}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span>
            Errors: <strong>{counts.totalErrors}</strong>
            {counts.ignoredErrors > 0 ? (
              <span className="text-muted-foreground">
                {' '}
                ({counts.ignoredErrors} ignored)
              </span>
            ) : null}
          </span>
          <span>
            Warnings: <strong>{counts.totalWarnings}</strong>
            {counts.ignoredWarnings > 0 ? (
              <span className="text-muted-foreground">
                {' '}
                ({counts.ignoredWarnings} ignored)
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <MessagesTable
        title={`Errors (${errors.length})`}
        messages={errors}
        emptyMessage="No errors recorded for this analysis."
      />
      <MessagesTable
        title={`Warnings (${warnings.length})`}
        messages={warnings}
        emptyMessage="No warnings recorded for this analysis."
      />

      <details className="rounded border bg-muted/30 p-3 text-xs">
        <summary className="cursor-pointer font-semibold">
          Raw grok JSON
        </summary>
        <div className="mt-2 max-h-[400px] overflow-auto rounded bg-background p-2">
          <JsonView
            value={(grokData ?? {}) as object}
            collapsed={2}
            displayDataTypes={false}
            style={
              {
                '--w-rjv-background-color': 'transparent',
                '--w-rjv-border-left-width': '0px',
                '--w-rjv-color': theme === 'dark' ? '#e5e7eb' : '#1f2937',
                '--w-rjv-key-string': theme === 'dark' ? '#93c5fd' : '#2563eb',
                '--w-rjv-info-color': theme === 'dark' ? '#9ca3af' : '#6b7280',
                '--w-rjv-line-color': theme === 'dark' ? '#4b5563' : '#d1d5db',
                '--w-rjv-arrow-color': theme === 'dark' ? '#9ca3af' : '#6b7280',
                '--w-rjv-edit-color': theme === 'dark' ? '#60a5fa' : '#3b82f6',
                '--w-rjv-copied-color':
                  theme === 'dark' ? '#34d399' : '#10b981',
              } as any
            }
          />
        </div>
      </details>
    </div>
  );
}

function MessagesTable({
  title,
  messages,
  emptyMessage,
}: {
  title: string;
  messages: Array<DnsvizDetailMessage>;
  emptyMessage: string;
}) {
  const isMobile = useIsMobile();

  if (messages.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  if (isMobile) {
    // Mobile: a vertical stack of cards built from the SAME message entries as
    // the desktop table, reusing the shared `DnsvizMessageCard` cells so the
    // two layouts can never drift.
    return (
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="mt-2 flex flex-col gap-2.5">
          {messages.map((m, i) => (
            <DnsvizMessageCard key={`${m.zone}-${m.path}-${i}`} message={m} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 overflow-x-auto rounded border">
        {/* desktop-only table; mobile renders cards via useIsMobile above */}
        <table className="min-w-full text-start text-xs" /* mobile-ok */>
          <thead className="bg-muted/50 font-mono text-muted-foreground">
            <tr>
              <th className="p-2">Zone</th>
              <th className="p-2">Code</th>
              <th className="p-2">Description</th>
              <th className="p-2">Path</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m, i) => (
              <tr
                key={`${m.zone}-${m.path}-${i}`}
                className={m.ignored ? 'opacity-60' : ''}
              >
                <td className="border-t p-2 font-mono">{m.zone}</td>
                <td className="border-t p-2 font-mono">
                  <MessageCodeCell message={m} />
                </td>
                <td className="border-t p-2">{m.description}</td>
                <td className="border-t p-2 font-mono text-[10px] text-muted-foreground">
                  {m.path}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * On-demand fetch + browser download. Calls the same tRPC procedure as the
 * preview dialog but fires once-per-click and routes the bytes through a
 * Blob URL so the browser's native download flow handles the save.
 *
 * `openInTab=true` is intended for the HTML output, which is a self-contained
 * interactive document better viewed in-browser than as a downloaded file.
 */
function useGraphDownload() {
  const trpcClient = useTRPCClient();
  const [isPending, setIsPending] = useState(false);

  async function run(args: {
    id: string;
    type: DnsvizGraphType;
    openInTab?: boolean;
  }) {
    if (isPending) return;
    setIsPending(true);
    try {
      const result = await trpcClient.admin.dnsviz.getAnalysisGraph.query({
        id: args.id,
        type: args.type,
      });
      const blob = base64ToBlob(result.base64, result.contentType);
      const url = URL.createObjectURL(blob);
      try {
        if (args.openInTab) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = result.fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } finally {
        // Revoke after the browser has had time to consume it. For new-tab
        // we delay longer because the new window needs to load the URL.
        setTimeout(
          () => URL.revokeObjectURL(url),
          args.openInTab ? 60_000 : 1_000,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to render graph', { description: message });
    } finally {
      setIsPending(false);
    }
  }

  return { run, isPending };
}

/**
 * Per-row Download -> "probe.json" / "grok.json" handler. Fetches the
 * stored jsonb blob via tRPC, wraps the (already pretty-printed) string in
 * a Blob, and triggers the browser's native download via a hidden `<a>`.
 */
function useJsonDownload() {
  const trpcClient = useTRPCClient();
  const [isPending, setIsPending] = useState(false);

  async function run(args: { id: string; kind: 'probe' | 'grok' }) {
    if (isPending) return;
    setIsPending(true);
    try {
      const result = await trpcClient.admin.dnsviz.getAnalysisJson.query(args);
      const blob = new Blob([result.contentJson], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1_000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to fetch ${args.kind}.json`, {
        description: message,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { run, isPending };
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

/**
 * Decode a base64 payload to a UTF-8 string. `atob` returns binary bytes; for
 * text payloads we route through `TextDecoder` so
 * non-ASCII content survives.
 */
function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
