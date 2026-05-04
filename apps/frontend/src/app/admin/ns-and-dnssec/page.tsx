'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { toast } from 'sonner';
import {
  ExternalLink,
  Loader2,
  RotateCw,
  ShieldCheckIcon,
  ShieldMinusIcon,
  ShieldPlusIcon,
  ShieldXIcon,
  XCircleIcon,
} from 'lucide-react';
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
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { LoadingButton } from '@/components/buttons/loading-button';
import { AsyncButton } from '@/components/buttons/async-button';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { getTemporalWorkflowUrl } from '@/components/admin/temporal-workflow-url';

type ActiveWorkflow = {
  operation:
    | 'ENABLE_DNSSEC'
    | 'REMOVE_DNSSEC'
    | 'CHANGE_NAMESERVERS'
    | 'RESET_NAMESERVERS';
  workflowId: string;
  runId: string;
  workflowType: string;
  status: 'RUNNING';
};

type NsAndDnssecRow = {
  userId: string | null;
  normalizedDomainName: string;
  ownerAddress: string | null;
  chainId: number;
  nameservers: string[];
  isUsingNamefiNameservers: boolean;
  dnssecZoneHasActiveDnssec: boolean | null;
  dnssecHasDelegationSigner: boolean | null;
  dnssecIsUsingNamefiDelegationSigner: boolean | null;
  dnssecError: boolean;
  activeDnssecWorkflow: ActiveWorkflow | null;
  activeNameserversWorkflow: ActiveWorkflow | null;
};

type TemporalConfig = { apiUrl: string; namespace: string };

const DEFAULT_COLUMN_VISIBILITY = {
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
        // Refresh active workflow / DNSSEC info regularly while the page
        // is open so the "pending workflow" column stays accurate.
        refetchInterval: 10_000,
        placeholderData: (prev) => prev,
      },
    ),
  );

  const temporal: TemporalConfig | undefined = query.data?.temporal;

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
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={32}
            minCharactersToDisplay={16}
            className="font-medium"
          >
            {row.original.normalizedDomainName}
          </AutoTruncateTextV2>
        ),
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
        cell: ({ row }) => (
          <PendingWorkflowsCell row={row.original} temporal={temporal} />
        ),
        size: 240,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions row={row.original} canWrite={canWrite} />
        ),
        size: 240,
      },
    ],
    [canWrite, temporal],
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

function NameserversCell({ row }: { row: NsAndDnssecRow }) {
  if (row.nameservers.length === 0) {
    return <span className="text-xs text-amber-600">Not indexed</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {row.isUsingNamefiNameservers ? (
          <Badge variant="secondary" className="text-xs">
            Namefi
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Custom
          </Badge>
        )}
      </div>
      <ul className="text-xs text-muted-foreground font-mono leading-tight">
        {row.nameservers.map((ns) => (
          <li key={ns}>{ns}</li>
        ))}
      </ul>
    </div>
  );
}

function DnssecCell({ row }: { row: NsAndDnssecRow }) {
  if (row.dnssecError) {
    return (
      <span className="text-xs text-amber-600">Failed to load DNSSEC</span>
    );
  }
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-2">
        {row.dnssecZoneHasActiveDnssec ? (
          <>
            <ShieldCheckIcon className="w-4 h-4 text-green-500" />
            <span>Zone signing on</span>
          </>
        ) : (
          <>
            <ShieldXIcon className="w-4 h-4 text-red-500" />
            <span>Zone signing off</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {row.dnssecHasDelegationSigner ? (
          row.dnssecIsUsingNamefiDelegationSigner ? (
            <>
              <ShieldCheckIcon className="w-4 h-4 text-green-500" />
              <span>Namefi DS</span>
            </>
          ) : (
            <>
              <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
              <span>Custom DS</span>
            </>
          )
        ) : (
          <>
            <ShieldXIcon className="w-4 h-4 text-red-500" />
            <span>No DS</span>
          </>
        )}
      </div>
    </div>
  );
}

function WorkflowLink({
  workflow,
  temporal,
}: {
  workflow: ActiveWorkflow;
  temporal: TemporalConfig | undefined;
}) {
  if (!temporal) {
    return <span className="font-mono text-xs">{workflow.workflowId}</span>;
  }
  const url = getTemporalWorkflowUrl({
    apiUrl: temporal.apiUrl,
    namespace: temporal.namespace,
    workflowId: workflow.workflowId,
    runId: workflow.runId,
  });
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-mono"
    >
      {workflow.workflowId}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function operationLabel(op: ActiveWorkflow['operation']): string {
  switch (op) {
    case 'ENABLE_DNSSEC':
      return 'Enabling DNSSEC';
    case 'REMOVE_DNSSEC':
      return 'Disabling DNSSEC';
    case 'CHANGE_NAMESERVERS':
      return 'Changing nameservers';
    case 'RESET_NAMESERVERS':
      return 'Resetting nameservers';
  }
}

function PendingWorkflowsCell({
  row,
  temporal,
}: {
  row: NsAndDnssecRow;
  temporal: TemporalConfig | undefined;
}) {
  const workflows = [
    row.activeDnssecWorkflow,
    row.activeNameserversWorkflow,
  ].filter((w): w is ActiveWorkflow => !!w);
  if (workflows.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {workflows.map((w) => (
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
  canWrite,
}: {
  row: NsAndDnssecRow;
  canWrite: boolean;
}) {
  const [nsOpen, setNsOpen] = useState(false);
  const [dnssecOpen, setDnssecOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!canWrite}
        onClick={() => setNsOpen(true)}
      >
        Edit Nameservers
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!canWrite}
        onClick={() => setDnssecOpen(true)}
      >
        Toggle DNSSEC
      </Button>
      <AdminEditNameserversDialog
        open={nsOpen}
        onOpenChange={setNsOpen}
        row={row}
      />
      <AdminToggleDnssecDialog
        open={dnssecOpen}
        onOpenChange={setDnssecOpen}
        row={row}
      />
    </div>
  );
}

function ActiveWorkflowBanner({
  workflow,
  domainName,
  scope,
}: {
  workflow: ActiveWorkflow | null;
  domainName: string;
  scope: 'dnssec' | 'nameservers';
}) {
  const trpc = useTRPC();
  const cancelDnssec = useMutation(
    trpc.admin.nsAndDnssec.cancelDnssecWorkflow.mutationOptions({
      onSuccess: () => toast.success('Cancellation requested'),
      onError: (error) => toast.error(`Failed to cancel: ${error.message}`),
    }),
  );
  const cancelNs = useMutation(
    trpc.admin.nsAndDnssec.cancelNameserversWorkflow.mutationOptions({
      onSuccess: () => toast.success('Cancellation requested'),
      onError: (error) => toast.error(`Failed to cancel: ${error.message}`),
    }),
  );

  if (!workflow) return null;

  const handleCancel = () => {
    if (scope === 'dnssec') {
      const op = workflow.operation;
      if (op !== 'ENABLE_DNSSEC' && op !== 'REMOVE_DNSSEC') return;
      cancelDnssec.mutate({ domainName, operation: op });
    } else {
      cancelNs.mutate({ domainName });
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-2 text-xs">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>{operationLabel(workflow.operation)}</span>
      <span className="font-mono text-muted-foreground">
        {workflow.workflowId}
      </span>
      <LoadingButton
        variant="destructive"
        size="sm"
        className="ml-auto"
        isLoading={cancelDnssec.isPending || cancelNs.isPending}
        loadingText="Cancelling..."
        onClick={handleCancel}
      >
        <XCircleIcon className="w-3 h-3" />
        Cancel
      </LoadingButton>
    </div>
  );
}

function AdminEditNameserversDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: NsAndDnssecRow;
}) {
  const trpc = useTRPC();
  const initial = useMemo(() => {
    const values = row.nameservers.length >= 2 ? row.nameservers : ['', ''];
    return values;
  }, [row.nameservers]);

  const [draft, setDraft] = useState<string[]>(initial);

  // Reset draft whenever the dialog opens for a fresh edit.
  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const changeMutation = useMutation(
    trpc.admin.nsAndDnssec.changeNameservers.mutationOptions({
      onSuccess: () => {
        toast.success('Nameservers change submitted');
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(`Failed to change nameservers: ${error.message}`),
    }),
  );
  const resetMutation = useMutation(
    trpc.admin.nsAndDnssec.resetNameservers.mutationOptions({
      onSuccess: () => {
        toast.success('Reset to Namefi nameservers submitted');
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(`Failed to reset nameservers: ${error.message}`),
    }),
  );

  const trimmed = draft.map((v) => v.trim()).filter((v) => v.length > 0);
  const isValid = trimmed.length >= 2 && trimmed.length <= 4;
  const hasActive = !!row.activeNameserversWorkflow;

  const onAdd = () => {
    if (draft.length >= 4) return;
    setDraft([...draft, '']);
  };
  const onRemove = (i: number) => {
    setDraft(draft.filter((_, idx) => idx !== i));
  };
  const onChange = (i: number, v: string) => {
    setDraft(draft.map((cur, idx) => (idx === i ? v : cur)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit nameservers — {row.normalizedDomainName}
          </DialogTitle>
          <DialogDescription>
            Admin override. The owner&apos;s wallet signature is bypassed and
            this action is recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <ActiveWorkflowBanner
          workflow={row.activeNameserversWorkflow}
          domainName={row.normalizedDomainName}
          scope="nameservers"
        />

        <div className="flex flex-col gap-2">
          {draft.map((value, index) => (
            <div key={`ns-${index}`} className="flex items-center gap-2">
              <Input
                value={value}
                placeholder={`ns${index + 1}.example.com`}
                onChange={(e) => onChange(index, e.target.value)}
                disabled={hasActive}
              />
              {draft.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  disabled={hasActive}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {draft.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={onAdd}
              disabled={hasActive}
            >
              Add nameserver
            </Button>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
          <AsyncButton
            variant="outline"
            size="sm"
            disabled={hasActive || row.isUsingNamefiNameservers}
            onClick={async () =>
              resetMutation.mutateAsync({
                domainName: row.normalizedDomainName,
              })
            }
          >
            <RotateCw className="w-4 h-4" />
            Reset to Namefi
          </AsyncButton>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <AsyncButton
              size="sm"
              disabled={!isValid || hasActive}
              onClick={async () =>
                changeMutation.mutateAsync({
                  domainName: row.normalizedDomainName,
                  nameservers: trimmed,
                })
              }
            >
              Save
            </AsyncButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminToggleDnssecDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: NsAndDnssecRow;
}) {
  const trpc = useTRPC();
  const enableMutation = useMutation(
    trpc.admin.nsAndDnssec.enableDnssec.mutationOptions({
      onSuccess: () => {
        toast.success('Enable DNSSEC submitted');
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(`Failed to enable DNSSEC: ${error.message}`),
    }),
  );
  const disableMutation = useMutation(
    trpc.admin.nsAndDnssec.disableDnssec.mutationOptions({
      onSuccess: () => {
        toast.success('Disable DNSSEC submitted');
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(`Failed to disable DNSSEC: ${error.message}`),
    }),
  );

  const isUsingNamefiSigning =
    row.dnssecIsUsingNamefiDelegationSigner === true &&
    row.dnssecZoneHasActiveDnssec === true;
  const hasActive = !!row.activeDnssecWorkflow;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Toggle DNSSEC — {row.normalizedDomainName}</DialogTitle>
          <DialogDescription>
            Admin override. Action is recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <ActiveWorkflowBanner
          workflow={row.activeDnssecWorkflow}
          domainName={row.normalizedDomainName}
          scope="dnssec"
        />

        <div className="flex flex-col gap-2 text-sm">
          <div>
            Zone signing:{' '}
            <strong>{row.dnssecZoneHasActiveDnssec ? 'On' : 'Off'}</strong>
          </div>
          <div>
            Delegation signer:{' '}
            <strong>
              {row.dnssecHasDelegationSigner
                ? row.dnssecIsUsingNamefiDelegationSigner
                  ? 'Namefi'
                  : 'Custom'
                : 'None'}
            </strong>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isUsingNamefiSigning ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <LoadingButton
                    size="sm"
                    variant="destructive"
                    isLoading={disableMutation.isPending}
                    loadingText="Disabling..."
                    disabled={hasActive}
                  />
                }
              >
                <ShieldMinusIcon className="w-4 h-4" />
                Disable Namefi Signing
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable Namefi signing?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reduce the security of {row.normalizedDomainName}{' '}
                    and may affect services that depend on DNSSEC. The owner is
                    not being asked to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() =>
                      disableMutation.mutate({
                        domainName: row.normalizedDomainName,
                      })
                    }
                  >
                    Confirm and disable
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AsyncButton
              size="sm"
              disabled={hasActive}
              onClick={async () =>
                enableMutation.mutateAsync({
                  domainName: row.normalizedDomainName,
                })
              }
            >
              <ShieldPlusIcon className="w-4 h-4" />
              Enable Namefi Signing
            </AsyncButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
