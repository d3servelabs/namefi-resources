'use client';

import { useState } from 'react';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decisionGateResponseSchemas,
  expirationIsoSchema,
  operationStatusSchema,
  processOrderItemGateResponseSchema,
  TERMINAL_OPERATION_STATUSES,
} from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Ban, Play, Reply, RefreshCw, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { AsyncButton } from '@/components/buttons/async-button';
import { PageShell } from '@/components/page-shell';
import { withAdminGuard } from '@/components/admin/admin-guard';

type ActiveGatesOutput =
  AppRouterOutput['admin']['workflowDecision']['listActiveDecisionGates'];
type GateWorkflow = ActiveGatesOutput['items'][number];
type Gate = GateWorkflow['gates'][number];

type SendDecisionInput = {
  workflowId: string;
  signalName: string;
  action: 'PROCEED' | 'CANCEL' | 'RETRY' | 'RESPOND';
  interactionId: string;
  response?: unknown;
};

const ACTION_ICON = {
  PROCEED: Play,
  RETRY: RotateCw,
  CANCEL: Ban,
  RESPOND: Reply,
} as const;

function formatStartedAt(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

/** The RESPOND payload schema declared for a gate, if any. */
function responseSchemaFor(interactionId: string) {
  return decisionGateResponseSchemas[
    interactionId as keyof typeof decisionGateResponseSchemas
  ];
}

type ResolvedResponse =
  | { ok: true; value: unknown }
  | { ok: false; message: string };

/** Folds a zod `safeParse` result into a {@link ResolvedResponse}. */
function toResolvedResponse(
  parsed: { success: true; data: unknown } | { success: false },
  message: string,
): ResolvedResponse {
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, message };
}

export default withAdminGuard(function DecisionGatesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    ...trpc.admin.workflowDecision.listActiveDecisionGates.queryOptions({}),
    refetchInterval: 30_000,
  });

  const sendDecision = useMutation({
    ...trpc.admin.workflowDecision.sendDecision.mutationOptions(),
    onSuccess: (_data, variables) => {
      toast.success(`Sent ${variables.action} to ${variables.workflowId}`);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.workflowDecision.listActiveDecisionGates.queryKey(
          {},
        ),
      });
    },
    onError: (error) => {
      toast.error(`Failed to send decision: ${error.message}`);
    },
  });

  // Resolve to true/false instead of rejecting (onError already toasts) so
  // AsyncButton still settles AND callers can keep the RESPOND dialog open on
  // failure rather than dropping the typed payload.
  const send = async (input: SendDecisionInput): Promise<boolean> => {
    try {
      await sendDecision.mutateAsync(input);
      return true;
    } catch {
      return false;
    }
  };

  const items = listQuery.data?.items ?? [];
  const rows = items.flatMap((workflow) =>
    workflow.gates.map((gate) => ({ workflow, gate })),
  );

  return (
    <PageShell padding="admin">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Decision Gates</h1>
          <p className="text-muted-foreground">
            Running workflows awaiting an operator decision. Resolve a gate by
            sending PROCEED / RETRY / CANCEL, or RESPOND with a payload.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${listQuery.isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Awaiting decisions</CardTitle>
          <CardDescription>
            {listQuery.isLoading
              ? 'Scanning running workflows…'
              : `${rows.length} armed gate(s) across ${items.length} workflow(s)` +
                (listQuery.data
                  ? ` — scanned ${listQuery.data.scanned}${listQuery.data.capped ? ' (capped)' : ''}`
                  : '')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isError ? (
            <p className="text-sm text-red-600">
              Failed to load: {listQuery.error.message}
            </p>
          ) : rows.length === 0 && !listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              No workflows are currently awaiting a decision.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Allowed</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ workflow, gate }) => (
                  <TableRow
                    key={`${workflow.workflowId}:${gate.signalName}:${gate.interactionId}`}
                  >
                    <TableCell className="align-top">
                      <div className="font-medium">{workflow.workflowType}</div>
                      <div className="text-xs text-muted-foreground break-all">
                        {workflow.workflowId}
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-mono text-xs">
                      {gate.interactionId}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        {gate.allowedActions.map((a) => (
                          <Badge key={a} variant="secondary">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                      {formatStartedAt(workflow.startedAt)}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        {gate.allowedActions.map((rawAction) => {
                          const action =
                            rawAction as SendDecisionInput['action'];
                          if (action === 'RESPOND') {
                            return (
                              <RespondDialog
                                key={action}
                                workflowId={workflow.workflowId}
                                gate={gate}
                                onSend={send}
                              />
                            );
                          }
                          const Icon = ACTION_ICON[action];
                          return (
                            <AsyncButton
                              key={action}
                              size="sm"
                              variant={
                                action === 'CANCEL' ? 'destructive' : 'outline'
                              }
                              onClick={() =>
                                send({
                                  workflowId: workflow.workflowId,
                                  signalName: gate.signalName,
                                  action,
                                  interactionId: gate.interactionId,
                                })
                              }
                            >
                              <Icon className="h-3.5 w-3.5 mr-1.5" />
                              {action}
                            </AsyncButton>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
});

function RespondDialog({
  workflowId,
  gate,
  onSend,
}: {
  workflowId: string;
  gate: Gate;
  onSend: (input: SendDecisionInput) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [mintTxHash, setMintTxHash] = useState('');
  // No default: the admin must explicitly pick a status (empty fails the schema
  // parse below) so the happy path can't be sent by accident in a recovery flow.
  const [status, setStatus] = useState<string>('');
  const [expirationIso, setExpirationIso] = useState('');

  const schema = responseSchemaFor(gate.interactionId);
  const isProcessOrderItem = gate.interactionId === 'process-order-item';
  const isOperationStatus = schema === operationStatusSchema;
  const isExpirationIso = schema === expirationIsoSchema;

  // Validate + build the RESPOND payload for the gate's declared schema. Kept
  // separate so `submit` stays a thin orchestration step.
  const resolveResponse = (): ResolvedResponse => {
    if (isProcessOrderItem) {
      const candidate = mintTxHash.trim()
        ? { mintTxHash: mintTxHash.trim() }
        : {};
      return toResolvedResponse(
        processOrderItemGateResponseSchema.safeParse(candidate),
        'Invalid response payload',
      );
    }
    if (isOperationStatus) {
      return toResolvedResponse(
        operationStatusSchema.safeParse(status),
        'Pick a verified status',
      );
    }
    if (isExpirationIso) {
      return toResolvedResponse(
        expirationIsoSchema.safeParse(expirationIso.trim()),
        'Enter the new expiration as an ISO-8601 timestamp',
      );
    }
    // Gate takes no payload — RESPOND just resolves it as done.
    return { ok: true, value: undefined };
  };

  const submit = async () => {
    const resolved = resolveResponse();
    if (!resolved.ok) {
      toast.error(resolved.message);
      return;
    }
    const sent = await onSend({
      workflowId,
      signalName: gate.signalName,
      action: 'RESPOND',
      interactionId: gate.interactionId,
      response: resolved.value,
    });
    // Keep the dialog (and the typed payload) on failure — onError already toasted.
    if (sent) {
      setOpen(false);
      setMintTxHash('');
      setExpirationIso('');
      setStatus('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Reply className="h-3.5 w-3.5 mr-1.5" />
        RESPOND
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to gate</DialogTitle>
          <DialogDescription>
            Resolve <span className="font-mono">{gate.interactionId}</span> on{' '}
            <span className="font-mono break-all">{workflowId}</span> by
            supplying the result the workflow should continue with.
          </DialogDescription>
        </DialogHeader>

        {isProcessOrderItem ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="mintTxHash">
              Mint transaction hash (optional)
            </label>
            <Input
              id="mintTxHash"
              placeholder="0x… (leave blank if none)"
              value={mintTxHash}
              onChange={(e) => setMintTxHash(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use this when the registration/mint was completed out-of-band. The
              item is recorded and marked SUCCEEDED.
            </p>
          </div>
        ) : isOperationStatus ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="opStatus">
              Verified registrar operation status
            </label>
            <select
              id="opStatus"
              className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="" disabled>
                Select a verified status…
              </option>
              {TERMINAL_OPERATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              The poll timed out but the operation is still queued. Verify the
              registrar's real state, then send the status the workflow should
              continue with.
            </p>
          </div>
        ) : isExpirationIso ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="expirationIso">
              Verified new expiration (ISO-8601)
            </label>
            <Input
              id="expirationIso"
              placeholder="2027-06-03T00:00:00.000Z"
              value={expirationIso}
              onChange={(e) => setExpirationIso(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The renewal already succeeded; this poll waits for the new
              expiration to propagate. Verify the registrar's expiration and
              send it as an ISO-8601 timestamp (e.g. 2027-06-03T00:00:00.000Z).
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This gate takes no payload — responding resolves it as done.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <AsyncButton onClick={submit}>Send RESPOND</AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
