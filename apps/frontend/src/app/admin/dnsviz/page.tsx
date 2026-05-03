'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { ServerDataTable } from '@/components/table/server-data-table';
import { useTRPC, useTRPCClient } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
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
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
  DnsvizAnalysisRow,
  DnsvizAnalysisStatus,
  DnsvizGraphType,
} from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';

export default function AdminDnsvizPage() {
  return (
    <AdminGuard>
      <DnsvizAnalysesPanel />
    </AdminGuard>
  );
}

const STATUS_FILTERS: Array<{
  value: 'ANY' | DnsvizAnalysisStatus;
  label: string;
}> = [
  { value: 'ANY', label: 'Any status' },
  { value: 'BOGUS', label: 'BOGUS' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'INSECURE', label: 'INSECURE' },
  { value: 'SECURE', label: 'SECURE' },
];

const STATUS_BADGE_VARIANT: Record<
  DnsvizAnalysisStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SECURE: 'default',
  INSECURE: 'secondary',
  BOGUS: 'destructive',
  ERROR: 'destructive',
};

function DnsvizAnalysesPanel() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [domainSearch, setDomainSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ANY' | DnsvizAnalysisStatus
  >('ANY');
  const [analysisDate, setAnalysisDate] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'analysisDate', desc: true },
  ]);
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
        domainSearch: domainSearch.trim() || undefined,
        status: statusFilter === 'ANY' ? undefined : statusFilter,
        analysisDate: analysisDate || undefined,
        sorting: sorting.length > 0 ? sorting : undefined,
      },
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
          <span className="text-sm font-mono">{row.original.analysisDate}</span>
        ),
        size: 110,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {row.original.normalizedDomainName}
          </code>
        ),
        size: 220,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={STATUS_BADGE_VARIANT[row.original.status]}
            className="font-mono text-xs"
          >
            {row.original.status}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: 'registrarKey',
        header: 'Registrar',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.registrarKey}
          </span>
        ),
        size: 120,
      },
      {
        id: 'supportsDnssec',
        header: 'DNSSEC',
        cell: ({ row }) => {
          const supports = row.original.supportsDnssec;
          if (supports == null) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return supports ? (
            <Badge variant="outline" className="text-xs">
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              No
            </Badge>
          );
        },
        size: 90,
      },
      {
        accessorKey: 'errorsCount',
        header: 'Errors',
        cell: ({ row }) => {
          const n = row.original.errorsCount;
          const ignored = row.original.summary?.ignoredErrorsCount ?? 0;
          return (
            <span
              className={
                n > 0
                  ? 'text-sm font-mono text-destructive'
                  : 'text-sm font-mono text-muted-foreground'
              }
            >
              {n}
              {ignored > 0 ? (
                <span className="ml-1 text-muted-foreground">
                  ({ignored} ignored)
                </span>
              ) : null}
            </span>
          );
        },
        size: 130,
      },
      {
        id: 'reasoning',
        header: 'Reasoning',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.reasoning}
          </span>
        ),
        size: 380,
      },
      {
        id: 'analyzedAt',
        header: 'Analyzed',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(
              new UTCDate(row.original.analysisStartedAt),
              "yyyy-MM-dd HH:mm 'UTC'",
            )}
          </span>
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

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>DNSViz Analyses</CardTitle>
        <p className="text-xs text-muted-foreground">
          Per-domain DNSSEC verdict + reasoning. Open the graph for any row to
          see the chain-of-trust diagram, or download as PNG / SVG / HTML.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="dnsviz-domain-search"
              className="text-xs text-muted-foreground"
            >
              Domain
            </label>
            <Input
              id="dnsviz-domain-search"
              placeholder="search by domain…"
              value={domainSearch}
              onChange={(e) => {
                setPage(1);
                setDomainSearch(e.target.value);
              }}
              className="w-64"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="dnsviz-status-filter"
              className="text-xs text-muted-foreground"
            >
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v as 'ANY' | DnsvizAnalysisStatus);
              }}
            >
              <SelectTrigger id="dnsviz-status-filter" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="dnsviz-date-filter"
              className="text-xs text-muted-foreground"
            >
              Analysis date
            </label>
            <Input
              id="dnsviz-date-filter"
              type="date"
              value={analysisDate}
              onChange={(e) => {
                setPage(1);
                setAnalysisDate(e.target.value);
              }}
              className="w-44"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${query.isFetching ? 'animate-spin' : ''}`}
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
                <XIcon className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setSubmitOpen(true)}
                disabled={selectedRows.size === 0}
              >
                <Play className="h-3 w-3 mr-1" />
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
          <ServerDataTable
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
      <DialogContent className="max-w-xl">
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
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1.5" />
            )}
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
        <Eye className="h-3 w-3 mr-1.5" />
        Graph
      </Button>
      <Button variant="outline" size="sm" onClick={onShowDetails}>
        <ListTree className="h-3 w-3 mr-1.5" />
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
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-3 w-3 mr-1.5" />
          )}
          Download
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Graph</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => downloadGraph.run({ id: row.id, type: 'png' })}
            >
              PNG (raster)
            </DropdownMenuItem>
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
              <ExternalLink className="h-3 w-3 mr-1.5" />
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

  // Render the interactive XHTML viewer — same output as the "HTML" download
  // option, embedded SVG with hover/click interactions for the chain of trust.
  const query = useQuery(
    trpc.admin.dnsviz.getAnalysisGraph.queryOptions(
      target ? { id: target.id, type: 'html' } : { id: '', type: 'html' },
      {
        enabled: open,
        // Cache rendered graphs briefly so reopening the same row doesn't
        // re-spawn `dnsviz graph`.
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
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {target?.domainName ?? 'DNSViz graph'}{' '}
            <span className="font-mono text-xs text-muted-foreground">
              {target?.analysisDate}
            </span>
          </DialogTitle>
          <DialogDescription>
            Chain-of-trust diagram rendered by <code>dnsviz graph</code> from
            the stored probe blob — hover the nodes for details.
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
              // `srcDoc` keeps the doc inline (no Blob URL lifecycle) and
              // works with the trusted dnsviz-generated XHTML. Sandbox
              // allow-scripts because the viewer's tooltips are JS-driven.
              srcDoc={html}
              title={`DNSViz graph for ${target?.domainName ?? ''}`}
              sandbox="allow-scripts"
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
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-y-auto">
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
  messages: Array<{
    zone: string;
    path: string;
    code: string | null;
    description: string;
    ignored: boolean;
  }>;
  emptyMessage: string;
}) {
  if (messages.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 overflow-x-auto rounded border">
        <table className="min-w-full text-left text-xs">
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
                  {m.code ?? '—'}
                  {m.ignored ? (
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      ignored
                    </Badge>
                  ) : null}
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
 * Per-row Download → "probe.json" / "grok.json" handler. Fetches the
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
 * text payloads (XHTML from dnsviz) we route through `TextDecoder` so
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
