'use client';

import { withAdminGuard } from '@/components/admin/admin-guard';
import { useTRPCClient } from '@/lib/trpc';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@namefi-astra/ui/components/shadcn/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Loader2Icon,
  FilterIcon,
  Trash2Icon,
  RefreshCwIcon,
  EyeIcon,
  CalendarIcon,
} from 'lucide-react';
import { DataTable } from '@/components/table/data-table';
import type { Row } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar } from '@namefi-astra/ui/components/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import JsonView from '@uiw/react-json-view';
import { useTheme } from 'next-themes';
import { PageShell } from '@/components/page-shell';

type AuditRow = {
  service_name?: string;
  audit_payload: any;
  ts: number;
  id: string;
};

type FilterFields = {
  resourceType?: string;
  resourceId?: string;
  actorType?: string;
  actorId?: string;
  action?: string;
};

type Filters = FilterFields & {
  timestampGte?: number;
  timestampLte?: number;
};

function AuditLogsPageInner() {
  const trpcClient = useTRPCClient();
  const { theme } = useTheme();

  const orderBy = 'timestamp_desc' as const;

  const {
    preferences: { pageSize },
    setPageSize,
  } = useTablePreferences({
    tableId: 'admin-audit-logs',
    defaultPreferences: {
      pageSize: 50,
    },
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>({});
  const [draftFilters, setDraftFilters] = useState<FilterFields>({});
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>(undefined);

  // Details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);

  // Filter panel state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin.bigQueryAudit.list', pageSize, orderBy, appliedFilters],
    queryFn: ({ pageParam }) =>
      trpcClient.admin.bigQueryAudit.list.query({
        pageSize,
        pageToken: pageParam,
        orderBy,
        filters: appliedFilters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    initialPageParam: undefined as string | undefined,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo<AuditRow[]>(() => {
    const seenIds = new Set<string>();

    return (data?.pages ?? []).flatMap((page) =>
      ((page.rows as AuditRow[]) || []).filter((row) => {
        const rowKey =
          row.id || `${row.ts}-${JSON.stringify(row.audit_payload)}`;

        if (seenIds.has(rowKey)) {
          return false;
        }

        seenIds.add(rowKey);
        return true;
      }),
    );
  }, [data?.pages]);

  const nextPageToken = data?.pages.at(-1)?.nextPageToken;
  const activeFilterCount = Object.values(appliedFilters).filter(
    (value) => value !== undefined,
  ).length;

  const columns = useMemo(
    () => [
      {
        id: 'ts',
        header: 'Timestamp',
        accessorFn: (row: AuditRow) => row.ts,
        cell: ({ getValue }: any) =>
          new Date(Number(getValue()) / 1000).toLocaleString(),
        sortingFn: (a: Row<AuditRow>, b: Row<AuditRow>) =>
          (a?.original?.ts ?? 0) - (b?.original?.ts ?? 0),
      },
      {
        id: 'service_name',
        header: 'Service',
        accessorKey: 'service_name',
        cell: ({ getValue }: any) => {
          const val = getValue();
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
              {val || '-'}
            </span>
          );
        },
      },
      {
        id: 'actor',
        header: 'Actor',
        accessorFn: (row: AuditRow) => {
          const payload = row.audit_payload;
          const actorType = payload?.actorType || '';
          const actorId = payload?.actorId || '';
          return actorType || actorId ? `${actorType}:${actorId}` : '-';
        },
        cell: ({ getValue }: any) => {
          const val = String(getValue());
          if (val === '-') return '-';
          const [type, id] = val.split(':');

          const actorColorMap: Record<string, string> = {
            admin:
              'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            user: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
            system:
              'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          };
          const colorClass =
            actorColorMap[type?.toLowerCase()] ||
            'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';

          return (
            <div className="flex flex-col gap-1">
              <span
                className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}
              >
                {type}
              </span>
              <span
                className="text-xs text-muted-foreground font-mono truncate max-w-[150px]"
                title={id}
              >
                {id}
              </span>
            </div>
          );
        },
      },
      {
        id: 'resource',
        header: 'Resource',
        accessorFn: (row: AuditRow) => {
          const payload = row.audit_payload;
          const resourceType = payload?.resourceType || '';
          const resourceId = payload?.resourceId || '';
          return resourceType || resourceId
            ? `${resourceType}:${resourceId}`
            : '-';
        },
        cell: ({ getValue }: any) => {
          const val = String(getValue());
          if (val === '-') return '-';
          const [type, id] = val.split(':');

          const resourceColorMap: Record<string, string> = {
            domain:
              'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            user: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
            order:
              'bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
            transaction:
              'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800',
            workflow:
              'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
            cart: 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
          };
          const colorClass =
            resourceColorMap[type?.toLowerCase()] ||
            'bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800';

          return (
            <div className="flex flex-col gap-1">
              <span
                className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}
              >
                {type}
              </span>
              <span
                className="text-xs text-muted-foreground font-mono truncate max-w-[150px]"
                title={id}
              >
                {id}
              </span>
            </div>
          );
        },
      },
      {
        id: 'action',
        header: 'Action',
        accessorFn: (row: AuditRow) => row.audit_payload?.action || '-',
        cell: ({ getValue }: any) => {
          const val = getValue();
          const colorMap: Record<string, string> = {
            create:
              'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
            update:
              'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            delete:
              'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
            read: 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
            login:
              'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            logout:
              'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
          };
          const colorClass =
            colorMap[val?.toLowerCase()] ||
            'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800';
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}
            >
              {val}
            </span>
          );
        },
      },
      {
        id: 'details',
        header: 'Details',
        enableSorting: false,
        cell: ({ row }: any) => (
          <Button
            data-testid={`admin.audit-logs.row.view-button.${row.original.id}`}
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRow(row.original);
              setDetailsModalOpen(true);
            }}
          >
            <EyeIcon className="h-3 w-3 me-1" />
            View
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <PageShell padding="admin" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Explore audit events from all services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterPanel
            filterSheetOpen={filterSheetOpen}
            setFilterSheetOpen={setFilterSheetOpen}
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilterCount={activeFilterCount}
            isFetching={isFetching}
            startDate={draftStartDate}
            setStartDate={setDraftStartDate}
            endDate={draftEndDate}
            setEndDate={setDraftEndDate}
            onApply={(nextFilters) => {
              setAppliedFilters(nextFilters);
              setFilterSheetOpen(false);
            }}
            onReset={() => {
              setDraftFilters({});
              setDraftStartDate(undefined);
              setDraftEndDate(undefined);
              setAppliedFilters({});
              setFilterSheetOpen(false);
            }}
          />
          <Button
            data-testid="admin.audit-logs.refresh-button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2Icon className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4 me-2" />
            )}
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading || isFetchingNextPage}
        pageSize={pageSize}
        onPageSizeChange={(n) => setPageSize(n)}
        nextPageToken={hasNextPage ? nextPageToken : undefined}
        onLoadMore={() => void fetchNextPage()}
      />

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent
          data-testid="admin.audit-logs.details-dialog"
          className={cn(
            MOBILE_BOTTOM_SHEET_DIALOG,
            '!max-w-3xl !max-h-[80vh] overflow-y-auto',
          )}
        >
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <p
                    data-testid="admin.audit-logs.details.id"
                    className="font-mono text-sm"
                  >
                    {selectedRow.id}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Service
                  </Label>
                  <p
                    data-testid="admin.audit-logs.details.service"
                    className="text-sm"
                  >
                    {selectedRow.service_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Timestamp
                  </Label>
                  <p
                    data-testid="admin.audit-logs.details.timestamp"
                    className="text-sm"
                  >
                    {new Date(selectedRow.ts / 1000).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Action
                  </Label>
                  <p
                    data-testid="admin.audit-logs.details.action"
                    className="text-sm"
                  >
                    {selectedRow.audit_payload?.action || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">
                  Actor Information
                </Label>
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Type
                    </Label>
                    <p className="text-sm">
                      {selectedRow.audit_payload?.actorType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ID</Label>
                    <p className="text-sm font-mono">
                      {selectedRow.audit_payload?.actorId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">
                  Resource Information
                </Label>
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Type
                    </Label>
                    <p className="text-sm">
                      {selectedRow.audit_payload?.resourceType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ID</Label>
                    <p className="text-sm font-mono">
                      {selectedRow.audit_payload?.resourceId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">
                  Extra Input
                </Label>
                <div className="p-3 bg-muted rounded-lg overflow-auto max-h-[300px]">
                  <JsonView
                    value={selectedRow.audit_payload?.extraInput || {}}
                    collapsed={1}
                    displayDataTypes={false}
                    style={
                      {
                        '--w-rjv-background-color': 'transparent',
                        '--w-rjv-border-left-width': '0px',
                        '--w-rjv-color':
                          theme === 'dark' ? '#e5e7eb' : '#1f2937',
                        '--w-rjv-key-string':
                          theme === 'dark' ? '#93c5fd' : '#2563eb',
                        '--w-rjv-info-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-line-color':
                          theme === 'dark' ? '#4b5563' : '#d1d5db',
                        '--w-rjv-arrow-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-edit-color':
                          theme === 'dark' ? '#60a5fa' : '#3b82f6',
                        '--w-rjv-copied-color':
                          theme === 'dark' ? '#34d399' : '#10b981',
                      } as any
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">
                  Full Payload
                </Label>
                <div className="p-3 bg-muted rounded-lg overflow-auto max-h-[400px]">
                  <JsonView
                    value={selectedRow.audit_payload || {}}
                    collapsed={2}
                    displayDataTypes={false}
                    style={
                      {
                        '--w-rjv-background-color': 'transparent',
                        '--w-rjv-border-left-width': '0px',
                        '--w-rjv-color':
                          theme === 'dark' ? '#e5e7eb' : '#1f2937',
                        '--w-rjv-key-string':
                          theme === 'dark' ? '#93c5fd' : '#2563eb',
                        '--w-rjv-info-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-line-color':
                          theme === 'dark' ? '#4b5563' : '#d1d5db',
                        '--w-rjv-arrow-color':
                          theme === 'dark' ? '#9ca3af' : '#6b7280',
                        '--w-rjv-edit-color':
                          theme === 'dark' ? '#60a5fa' : '#3b82f6',
                        '--w-rjv-copied-color':
                          theme === 'dark' ? '#34d399' : '#10b981',
                      } as any
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export default withAdminGuard(AuditLogsPageInner);

export function FilterPanel({
  filterSheetOpen,
  setFilterSheetOpen,
  draftFilters,
  setDraftFilters,
  appliedFilterCount,
  isFetching,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onApply,
  onReset,
}: {
  filterSheetOpen: boolean;
  setFilterSheetOpen: Dispatch<SetStateAction<boolean>>;
  draftFilters: FilterFields;
  setDraftFilters: Dispatch<SetStateAction<FilterFields>>;
  appliedFilterCount: number;
  isFetching: boolean;
  startDate: Date | undefined;
  setStartDate: Dispatch<SetStateAction<Date | undefined>>;
  endDate: Date | undefined;
  setEndDate: Dispatch<SetStateAction<Date | undefined>>;
  onApply: (filters: Filters) => void;
  onReset: () => void;
}) {
  const handleApplyFilters = () => {
    onApply({
      ...draftFilters,
      timestampGte: startDate ? startDate.getTime() * 1000 : undefined,
      timestampLte: endDate
        ? new Date(endDate).setHours(23, 59, 59, 999) * 1000
        : undefined,
    });
  };

  const handleResetFilters = () => {
    onReset();
  };

  return (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetTrigger
        render={
          <Button
            data-testid="admin.audit-logs.filters-button"
            variant="outline"
            size="sm"
          />
        }
      >
        <FilterIcon className="h-4 w-4 me-2" />
        Filters
        {appliedFilterCount > 0 && (
          <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {appliedFilterCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        data-testid="admin.audit-logs.filter-panel"
        side="left"
        className="overflow-y-auto px-8 pt-2"
      >
        <SheetHeader>
          <SheetTitle>Filter Audit Logs</SheetTitle>
          <SheetDescription>
            Refine your search with detailed filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2">Resource Type</Label>
            <Input
              data-testid="admin.audit-logs.filter.resource-type"
              value={draftFilters.resourceType ?? ''}
              onChange={(e) =>
                setDraftFilters((f) => ({
                  ...f,
                  resourceType: e.target.value || undefined,
                }))
              }
              placeholder="domain, user, order, ..."
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Resource ID</Label>
            <Input
              data-testid="admin.audit-logs.filter.resource-id"
              value={draftFilters.resourceId ?? ''}
              onChange={(e) =>
                setDraftFilters((f) => ({
                  ...f,
                  resourceId: e.target.value || undefined,
                }))
              }
              placeholder="resource identifier"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Action</Label>
            <Input
              data-testid="admin.audit-logs.filter.action"
              value={draftFilters.action ?? ''}
              onChange={(e) =>
                setDraftFilters((f) => ({
                  ...f,
                  action: e.target.value || undefined,
                }))
              }
              placeholder="create, update, delete, ..."
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Actor Type</Label>
            <Input
              data-testid="admin.audit-logs.filter.actor-type"
              value={draftFilters.actorType ?? ''}
              onChange={(e) =>
                setDraftFilters((f) => ({
                  ...f,
                  actorType: e.target.value || undefined,
                }))
              }
              placeholder="admin, user, system"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Actor ID</Label>
            <Input
              data-testid="admin.audit-logs.filter.actor-id"
              value={draftFilters.actorId ?? ''}
              onChange={(e) =>
                setDraftFilters((f) => ({
                  ...f,
                  actorId: e.target.value || undefined,
                }))
              }
              placeholder="wallet, user id, ..."
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-2">Date Range</Label>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2">Start Date</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        data-testid="admin.audit-logs.filter.start-date-button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-start font-normal',
                          !startDate && 'text-muted-foreground',
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, 'yyyy-MM-dd')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2">End Date</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        data-testid="admin.audit-logs.filter.end-date-button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-start font-normal',
                          !endDate && 'text-muted-foreground',
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, 'yyyy-MM-dd')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              data-testid="admin.audit-logs.filter.apply-button"
              onClick={handleApplyFilters}
              disabled={isFetching}
              className="flex-1"
            >
              Apply Filters
            </Button>
            <Button
              data-testid="admin.audit-logs.filter.reset-button"
              variant="outline"
              onClick={handleResetFilters}
              disabled={isFetching}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
