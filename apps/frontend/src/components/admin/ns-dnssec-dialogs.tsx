'use client';

/**
 * Shared NS & DNSSEC admin dialog primitives.
 *
 * Lifted out of `apps/frontend/src/app/admin/ns-and-dnssec/page.tsx` so the
 * same dialogs can be embedded in the per-domain admin modal. The page
 * still owns its table and column wiring; everything that's about
 * "act on a single domain" lives here.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { LoadingButton } from '@/components/buttons/loading-button';
import { AsyncButton } from '@/components/buttons/async-button';
import { useTRPC } from '@/lib/trpc';
import { getTemporalWorkflowUrl } from '@/components/admin/temporal-workflow-url';

export type ActiveWorkflow = {
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

export type DomainWorkflows = {
  dnssec: ActiveWorkflow | null;
  ns: ActiveWorkflow | null;
};

export type TemporalConfig = { apiUrl: string; namespace: string };

/**
 * Minimal row shape consumed by the dialogs and status cells in this
 * module. `NsAndDnssecRow` (the table-row type on the page) is a
 * structural superset, so callers can pass their richer row directly.
 */
export type NsDnssecDialogRow = {
  normalizedDomainName: string;
  nameservers: string[];
  isUsingNamefiNameservers: boolean;
  /**
   * Cached DNSSEC fields from `indexed_domains.dnssec_status`. `null`
   * when the domain has never been indexed; the live `getDnssecDetails`
   * query inside the toggle dialog overlays fresh values once it
   * resolves.
   */
  dnssecZoneHasActiveDnssec: boolean | null;
  dnssecHasDelegationSigner: boolean | null;
  dnssecIsUsingNamefiDelegationSigner: boolean | null;
};

/**
 * After any mutation that changes a domain's NS or DNSSEC state, refresh
 * both the workflows query (so the Pending Workflow column / banner shows
 * the newly-started run without waiting for the 10s refetch interval) and
 * the list query (so cached `dnssec_status` and `nameservers` stay
 * roughly in sync once the indexer catches up).
 */
export function useInvalidateNsAndDnssecQueries() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: trpc.admin.nsAndDnssec.getActiveWorkflowsForPage.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.nsAndDnssec.listDomainsNsAndDnssec.queryKey(),
    });
  };
}

export function operationLabel(op: ActiveWorkflow['operation']): string {
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

export function WorkflowLink({
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

export function NameserversCell({ row }: { row: NsDnssecDialogRow }) {
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

export function DnssecCell({ row }: { row: NsDnssecDialogRow }) {
  if (row.dnssecZoneHasActiveDnssec === null) {
    return <span className="text-xs text-amber-600">Not indexed</span>;
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

export function ActiveWorkflowBanner({
  workflow,
  domainName,
  scope,
}: {
  workflow: ActiveWorkflow | null;
  domainName: string;
  scope: 'dnssec' | 'nameservers';
}) {
  const trpc = useTRPC();
  const invalidate = useInvalidateNsAndDnssecQueries();
  const cancelDnssec = useMutation(
    trpc.admin.nsAndDnssec.cancelDnssecWorkflow.mutationOptions({
      onSuccess: () => {
        toast.success('Cancellation requested');
        invalidate();
      },
      onError: (error) => toast.error(`Failed to cancel: ${error.message}`),
    }),
  );
  const cancelNs = useMutation(
    trpc.admin.nsAndDnssec.cancelNameserversWorkflow.mutationOptions({
      onSuccess: () => {
        toast.success('Cancellation requested');
        invalidate();
      },
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
    <div
      className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-2 text-xs"
      data-testid={`admin.ns-dnssec.active-workflow-banner.${scope}`}
    >
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>{operationLabel(workflow.operation)}</span>
      <span
        className="font-mono text-muted-foreground"
        data-testid={`admin.ns-dnssec.active-workflow-banner.${scope}.workflow-id`}
      >
        {workflow.workflowId}
      </span>
      <LoadingButton
        variant="destructive"
        size="sm"
        className="ms-auto"
        isLoading={cancelDnssec.isPending || cancelNs.isPending}
        loadingText="Cancelling..."
        onClick={handleCancel}
        data-testid={`admin.ns-dnssec.active-workflow-banner.${scope}.cancel-button`}
      >
        <XCircleIcon className="w-3 h-3" />
        Cancel
      </LoadingButton>
    </div>
  );
}

export function AdminEditNameserversDialog({
  open,
  onOpenChange,
  row,
  activeWorkflow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: NsDnssecDialogRow;
  activeWorkflow: ActiveWorkflow | null;
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

  const invalidate = useInvalidateNsAndDnssecQueries();
  const changeMutation = useMutation(
    trpc.admin.nsAndDnssec.changeNameservers.mutationOptions({
      onSuccess: () => {
        toast.success('Nameservers change submitted');
        invalidate();
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
        invalidate();
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(`Failed to reset nameservers: ${error.message}`),
    }),
  );

  const trimmed = draft.map((v) => v.trim()).filter((v) => v.length > 0);
  const isValid = trimmed.length >= 2 && trimmed.length <= 4;
  const hasActive = !!activeWorkflow;

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
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-lg')}
        data-testid="admin.ns-dnssec.edit-nameservers-dialog"
      >
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
          workflow={activeWorkflow}
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
                data-testid={`admin.ns-dnssec.edit-nameservers-dialog.nameserver-input.${index + 1}`}
              />
              {draft.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  disabled={hasActive}
                  data-testid={`admin.ns-dnssec.edit-nameservers-dialog.nameserver-remove-button.${index + 1}`}
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
              data-testid="admin.ns-dnssec.edit-nameservers-dialog.add-nameserver-button"
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
            data-testid="admin.ns-dnssec.edit-nameservers-dialog.reset-button"
          >
            <RotateCw className="w-4 h-4" />
            Reset to Namefi
          </AsyncButton>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-testid="admin.ns-dnssec.edit-nameservers-dialog.cancel-button"
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
              data-testid="admin.ns-dnssec.edit-nameservers-dialog.save-button"
            >
              Save
            </AsyncButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminToggleDnssecDialog({
  open,
  onOpenChange,
  row,
  activeWorkflow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: NsDnssecDialogRow;
  activeWorkflow: ActiveWorkflow | null;
}) {
  const trpc = useTRPC();
  const invalidate = useInvalidateNsAndDnssecQueries();
  const enableMutation = useMutation(
    trpc.admin.nsAndDnssec.enableDnssec.mutationOptions({
      onSuccess: () => {
        toast.success('Enable DNSSEC submitted');
        invalidate();
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
        invalidate();
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(`Failed to disable DNSSEC: ${error.message}`),
    }),
  );

  // Fetch live DNSSEC details only while the dialog is open. The list
  // table renders cached values from `indexed_domains.dnssec_status`;
  // the modal hits the registrar so the admin's decision is based on
  // up-to-date delegation-signer info.
  const detailsQuery = useQuery(
    trpc.admin.nsAndDnssec.getDnssecDetails.queryOptions(
      { domainName: row.normalizedDomainName },
      { enabled: open },
    ),
  );
  const detailsResponse = detailsQuery.data;
  const details = detailsResponse?.success ? detailsResponse : undefined;
  const liveError =
    detailsResponse && !detailsResponse.success ? detailsResponse.error : null;

  // Fall back to the cached row values until the live fetch resolves so
  // the dialog isn't blank on open.
  const zoneOn = details?.zoneHasActiveDnssec ?? row.dnssecZoneHasActiveDnssec;
  const hasDs = details?.hasDelegationSigner ?? row.dnssecHasDelegationSigner;
  const isNamefiDs =
    details?.isUsingNamefiDelegationSigner ??
    row.dnssecIsUsingNamefiDelegationSigner;

  const isUsingNamefiSigning = isNamefiDs === true && zoneOn === true;
  const hasActive = !!activeWorkflow;
  // Cached `row.*` values seed the summary so the dialog isn't blank on
  // open, but actions stay locked until we have a successful live
  // response. A pending or errored live query means the inferred
  // Enable/Disable choice could be wrong, and clicking would fire a
  // workflow against stale state.
  const liveLoaded = !!details;
  const actionsBlocked = hasActive || !liveLoaded;

  // Render labels that preserve the tri-state. Cached row values are
  // `null` for never-indexed domains; we must not collapse that to a
  // concrete "Off"/"None" or the dialog will misrepresent reality.
  const zoneSigningLabel = zoneOn === null ? 'Unknown' : zoneOn ? 'On' : 'Off';
  const delegationSignerLabel =
    hasDs === null
      ? 'Unknown'
      : !hasDs
        ? 'None'
        : isNamefiDs == null
          ? 'Configured (signer unknown)'
          : isNamefiDs
            ? 'Namefi'
            : 'Custom';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-md')}
        data-testid="admin.ns-dnssec.toggle-dnssec-dialog"
      >
        <DialogHeader>
          <DialogTitle>Toggle DNSSEC — {row.normalizedDomainName}</DialogTitle>
          <DialogDescription>
            Admin override. Action is recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <ActiveWorkflowBanner
          workflow={activeWorkflow}
          domainName={row.normalizedDomainName}
          scope="dnssec"
        />

        <div className="flex flex-col gap-2 text-sm">
          {detailsQuery.isLoading ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading live status…
            </span>
          ) : null}
          {liveError ? (
            <span className="text-xs text-amber-600">
              Live lookup failed — showing cached values. ({liveError})
            </span>
          ) : null}
          <div>
            Zone signing: <strong>{zoneSigningLabel}</strong>
          </div>
          <div>
            Delegation signer: <strong>{delegationSignerLabel}</strong>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="admin.ns-dnssec.toggle-dnssec-dialog.close-button"
          >
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
                    disabled={actionsBlocked}
                    data-testid="admin.ns-dnssec.toggle-dnssec-dialog.disable-button"
                  />
                }
              >
                <ShieldMinusIcon className="w-4 h-4" />
                Disable Namefi Signing
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="admin.ns-dnssec.toggle-dnssec-dialog.disable-confirm-dialog">
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
                    data-testid="admin.ns-dnssec.toggle-dnssec-dialog.disable-confirm-button"
                  >
                    Confirm and disable
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AsyncButton
              size="sm"
              disabled={actionsBlocked}
              onClick={async () =>
                enableMutation.mutateAsync({
                  domainName: row.normalizedDomainName,
                })
              }
              data-testid="admin.ns-dnssec.toggle-dnssec-dialog.enable-button"
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
