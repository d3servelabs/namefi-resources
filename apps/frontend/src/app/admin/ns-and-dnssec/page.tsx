'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { Loader2 } from 'lucide-react';
import { AdminGuard } from '@/components/admin/admin-guard';
import {
  PermissionGate,
  useHasPermissions,
} from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import { PageShell } from '@/components/page-shell';
import { useTRPC } from '@/lib/trpc';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  useDrizzlerServerFilterStrategy,
  convertToDrizzlerFilterOptions,
  type DrizzlerFilterState,
} from '@/components/table/filters';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AdminDomainDetailsButton } from '@/components/admin/domain-details';
import {
  AdminEditNameserversDialog,
  AdminToggleDnssecDialog,
  DnssecCell,
  NameserversCell,
  WorkflowLink,
  operationLabel,
  type ActiveWorkflow,
  type DomainWorkflows,
  type NsDnssecDialogRow,
  type TemporalConfig,
} from '@/components/admin/ns-dnssec-dialogs';

/**
 * Page-level row shape. Extends the dialog row with everything the
 * table cells display (`userId`, `ownerAddress`, `chainId`,
 * `dnssecLastUpdatedAt`).
 */
type NsAndDnssecRow = NsDnssecDialogRow & {
  userId: string | null;
  ownerAddress: string | null;
  chainId: number;
  dnssecLastUpdatedAt: Date | null;
};

const DEFAULT_COLUMN_VISIBILITY = {
  user: true,
  nameservers: true,
  dnssec: true,
  pendingWorkflows: true,
  actions: true,
};

export default function NsAndDnssecAdminPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.READ_NS_DNSSEC]}
        loadingFallback={null}
      >
        <NsAndDnssecPage />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.READ_NS_DNSSEC]}
        loadingFallback={null}
      >
        <PageShell padding="admin" className="py-6">
          <div>You do not have permission to access this page.</div>
        </PageShell>
      </PermissionGate>
    </AdminGuard>
  );
}

function NsAndDnssecPage() {
  return (
    <PageShell padding="admin" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NS &amp; DNSSEC</h1>
        <p className="text-muted-foreground">
          Review nameservers and DNSSEC status across all user domains, and
          trigger admin overrides. Pending workflows link directly to Temporal.
        </p>
      </div>
      <NsAndDnssecTable />
    </PageShell>
  );
}

function NsAndDnssecTable() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const {
    preferences: { sorting, pageSize, columnVisibility },
    setSorting,
    setPageSize,
    setColumnVisibility,
    resetToDefaults,
  } = useTablePreferences({
    tableId: 'admin-ns-and-dnssec',
    defaultPreferences: {
      sorting: [{ id: 'normalizedDomainName', desc: false }],
      pageSize: 25,
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    },
  });

  const { hasPermissions: canWrite } = useHasPermissions([
    Permission.WRITE_NS_DNSSEC,
  ]);

  const [drizzlerFilterState, setDrizzlerFilterState] =
    useState<DrizzlerFilterState>({
      columnFilters: {},
      customFilters: {},
    });
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

  const query = useQuery(
    trpc.admin.nsAndDnssec.listDomainsNsAndDnssec.queryOptions(
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

  // Active workflows live on a separate query so the slow
  // `temporalClient.workflow.list` call does not block the table
  // render. The query keys off the visible page's domain names —
  // changing pages or filters triggers a fresh fetch. We debounce
  // the input list (joined as a stable cache key) so rapid filter
  // changes don't fire the call once per keystroke.
  const visibleDomainNames = useMemo(() => {
    // Sort so the React Query cache key for `getActiveWorkflowsForPage`
    // doesn't churn just because two fetches returned the same set of
    // rows in a different order.
    return [
      ...(query.data?.data ?? []).map((r) => r.normalizedDomainName),
    ].sort();
  }, [query.data?.data]);
  const debouncedDomainNamesKey = useDebounceValue(
    visibleDomainNames.join('\n'),
    500,
  )[0];
  const debouncedDomainNames = useMemo(() => {
    // Empty-/whitespace-only key → no domains. Without this guard a key
    // like `'\n'` would split to `['', '']` and we'd fan a workflow
    // lookup out for empty domain names.
    if (!debouncedDomainNamesKey || !debouncedDomainNamesKey.trim()) {
      return [];
    }
    return debouncedDomainNamesKey
      .split('\n')
      .filter((name) => name.length > 0);
  }, [debouncedDomainNamesKey]);

  const workflowsQuery = useQuery(
    trpc.admin.nsAndDnssec.getActiveWorkflowsForPage.queryOptions(
      { domainNames: debouncedDomainNames },
      {
        enabled: debouncedDomainNames.length > 0,
        // Keep this column lively without re-fetching the table.
        refetchInterval: 10_000,
        placeholderData: (prev) => prev,
      },
    ),
  );

  const temporal: TemporalConfig | undefined = workflowsQuery.data?.temporal;
  // Keep `workflowsByDomain` undefined while the query is in flight —
  // a `{}` fallback would let consumers treat "loading" as "no active
  // workflow" and let admins fire mutations on top of a running one.
  const workflowsByDomain = workflowsQuery.data?.workflows;
  const isWorkflowsLoading =
    debouncedDomainNames.length > 0 && !workflowsQuery.data;

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      userId: {
        id: 'userId',
        label: 'User ID',
        type: 'text',
        columnId: 'userId',
      },
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain',
        type: 'text',
        columnId: 'normalizedDomainName',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Wallet',
        type: 'text',
        columnId: 'ownerAddress',
      },
      zoneHasActiveDnssec: {
        id: 'zoneHasActiveDnssec',
        label: 'Zone Signing',
        type: 'select',
        columnId: 'zoneHasActiveDnssec',
        options: [
          { value: 'true', label: 'On' },
          { value: 'false', label: 'Off' },
        ],
        allowedOperators: ['eq', 'neq', 'isNull', 'isNotNull'],
      },
    },
    onDrizzlerFilterChange: (newFilterState) => {
      setPage(1);
      setDrizzlerFilterState(newFilterState);
    },
  });

  const columns = useMemo<ColumnDef<NsAndDnssecRow>[]>(
    () => [
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={32}
              minCharactersToDisplay={16}
              className="font-medium"
            >
              {row.original.normalizedDomainName}
            </AutoTruncateTextV2>
            <AdminDomainDetailsButton
              domainName={row.original.normalizedDomainName}
              size="icon-xs"
            />
          </div>
        ),
        size: 240,
      },
      {
        id: 'user',
        header: 'User',
        enableSorting: false,
        cell: ({ row }) => <UserCell row={row.original} />,
        size: 220,
      },
      {
        id: 'nameservers',
        header: 'Nameservers',
        enableSorting: false,
        cell: ({ row }) => <NameserversCell row={row.original} />,
        size: 280,
      },
      {
        id: 'dnssec',
        header: 'DNSSEC',
        enableSorting: false,
        cell: ({ row }) => <DnssecCell row={row.original} />,
        size: 220,
      },
      {
        id: 'pendingWorkflows',
        header: 'Pending Workflow',
        enableSorting: false,
        cell: ({ row }) => {
          const wf = workflowsByDomain?.[row.original.normalizedDomainName];
          return (
            <PendingWorkflowsCell
              workflows={wf}
              temporal={temporal}
              isLoading={isWorkflowsLoading}
            />
          );
        },
        size: 240,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const wf = workflowsByDomain?.[row.original.normalizedDomainName];
          return (
            <RowActions
              row={row.original}
              workflows={wf}
              canWrite={canWrite}
              isWorkflowsLoading={isWorkflowsLoading}
            />
          );
        },
        size: 240,
      },
    ],
    [canWrite, isWorkflowsLoading, temporal, workflowsByDomain],
  );

  return (
    <ExtensibleDataTable<NsAndDnssecRow, typeof filterStrategy>
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
      emptyMessage="No domains found"
      loadingMessage="Loading NS & DNSSEC..."
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onResetPreferences={resetToDefaults}
    />
  );
}

function UserCell({ row }: { row: NsAndDnssecRow }) {
  const userId = row.userId;
  const ownerAddress = row.ownerAddress;
  const tail = ownerAddress
    ? `${ownerAddress.slice(0, 6)}…${ownerAddress.slice(-4)}`
    : null;
  return (
    <div className="flex items-center gap-2">
      <UserWalletAvatar
        address={ownerAddress ?? undefined}
        userId={userId ?? undefined}
        className="size-6 rounded-md"
      />
      <div className="flex flex-col leading-tight">
        {userId ? (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={14}
            minCharactersToDisplay={10}
            className="text-xs"
          >
            {userId}
          </AutoTruncateTextV2>
        ) : (
          <span className="text-xs text-amber-600">No user</span>
        )}
        {tail ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {tail}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PendingWorkflowsCell({
  workflows,
  temporal,
  isLoading,
}: {
  workflows: DomainWorkflows | undefined;
  temporal: TemporalConfig | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !workflows) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking…
      </span>
    );
  }
  const list = [workflows.dnssec, workflows.ns].filter(
    (w): w is ActiveWorkflow => !!w,
  );
  if (list.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {list.map((w) => (
        <div key={w.workflowId} className="flex items-center gap-2 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{operationLabel(w.operation)}</span>
          <WorkflowLink workflow={w} temporal={temporal} />
        </div>
      ))}
    </div>
  );
}

function RowActions({
  row,
  workflows,
  canWrite,
  isWorkflowsLoading,
}: {
  row: NsAndDnssecRow;
  workflows: DomainWorkflows | undefined;
  canWrite: boolean;
  isWorkflowsLoading: boolean;
}) {
  const [nsOpen, setNsOpen] = useState(false);
  const [dnssecOpen, setDnssecOpen] = useState(false);
  // Disable while we don't yet know whether a workflow is running for
  // this domain — otherwise an admin could fire a mutation on top of a
  // pending workflow during the load window.
  const blocked = !canWrite || isWorkflowsLoading || !workflows;
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={blocked}
        onClick={() => setNsOpen(true)}
      >
        Edit Nameservers
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={blocked}
        onClick={() => setDnssecOpen(true)}
      >
        Toggle DNSSEC
      </Button>
      <AdminEditNameserversDialog
        open={nsOpen}
        onOpenChange={setNsOpen}
        row={row}
        activeWorkflow={workflows?.ns ?? null}
      />
      <AdminToggleDnssecDialog
        open={dnssecOpen}
        onOpenChange={setDnssecOpen}
        row={row}
        activeWorkflow={workflows?.dnssec ?? null}
      />
    </div>
  );
}
