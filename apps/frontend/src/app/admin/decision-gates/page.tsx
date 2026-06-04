'use client';

import { useState } from 'react';
import { z } from 'zod';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decisionGateResponseSchemas } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
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
  cancelError?: { message?: string; type?: string };
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

/**
 * One form field derived from a gate's RESPOND zod schema. `name === ''` is the
 * single field for a scalar (non-object) schema.
 */
type SchemaField = {
  name: string;
  label: string;
  optional: boolean;
} & ({ kind: 'enum'; options: readonly string[] } | { kind: 'string' });

/**
 * Classifies a leaf zod schema into a form field using only stable public API
 * (`instanceof` + `safeParse(undefined)` for optionality), so it works across
 * zod versions without touching internals.
 */
function classifyLeaf(
  schema: z.ZodType,
  name: string,
  label: string,
): SchemaField {
  const optional = schema.safeParse(undefined).success;
  if (schema instanceof z.ZodEnum) {
    return {
      name,
      label,
      optional,
      kind: 'enum',
      options: [...schema.options] as readonly string[],
    };
  }
  return { name, label, optional, kind: 'string' };
}

/**
 * Describes the form fields for a gate's RESPOND schema by introspecting the
 * shared zod schema — so a new gate works in this UI with no extra state/branch.
 */
function describeSchemaFields(schema: z.ZodType | undefined): SchemaField[] {
  if (!schema) return [];
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    return Object.entries(shape).map(([key, field]) =>
      classifyLeaf(field, key, key),
    );
  }
  return [classifyLeaf(schema, '', 'Value')];
}

/** Builds the RESPOND payload from the form values for a schema. */
function buildCandidate(
  schema: z.ZodType,
  fields: SchemaField[],
  values: Record<string, string>,
): unknown {
  if (schema instanceof z.ZodObject) {
    const candidate: Record<string, string> = {};
    for (const field of fields) {
      const value = values[field.name]?.trim();
      if (value) candidate[field.name] = value;
    }
    return candidate;
  }
  return values[''] ?? '';
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
                          if (action === 'CANCEL') {
                            return (
                              <CancelDialog
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
                              variant="outline"
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

function SchemaFieldInput({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `respond-${field.name || 'value'}`;
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {field.label}
        {field.optional ? ' (optional)' : ''}
      </label>
      {field.kind === 'enum' ? (
        <select
          id={id}
          className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Select a value…
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

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
  // One generic value map keyed by field name — driven entirely by the gate's
  // RESPOND zod schema, so a new gate needs no new state or branch here.
  const [values, setValues] = useState<Record<string, string>>({});

  const schema = responseSchemaFor(gate.interactionId);
  const fields = describeSchemaFields(schema);

  const submit = async () => {
    let response: unknown;
    if (schema) {
      const parsed = schema.safeParse(buildCandidate(schema, fields, values));
      if (!parsed.success) {
        toast.error('Invalid response — check the fields and try again.');
        return;
      }
      response = parsed.data;
    }
    const sent = await onSend({
      workflowId,
      signalName: gate.signalName,
      action: 'RESPOND',
      interactionId: gate.interactionId,
      response,
    });
    // Keep the dialog (and the typed payload) on failure — onError already toasted.
    if (sent) {
      setOpen(false);
      setValues({});
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

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This gate takes no payload — responding resolves it as done.
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <SchemaFieldInput
                key={field.name || '__value'}
                field={field}
                value={values[field.name] ?? ''}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, [field.name]: next }))
                }
              />
            ))}
          </div>
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

function CancelDialog({
  workflowId,
  gate,
  onSend,
}: {
  workflowId: string;
  gate: Gate;
  onSend: (input: SendDecisionInput) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    const trimmed = message.trim();
    const sent = await onSend({
      workflowId,
      signalName: gate.signalName,
      action: 'CANCEL',
      interactionId: gate.interactionId,
      cancelError: trimmed ? { message: trimmed } : undefined,
    });
    if (sent) {
      setOpen(false);
      setMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" />}>
        <Ban className="h-3.5 w-3.5 mr-1.5" />
        CANCEL
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel gate</DialogTitle>
          <DialogDescription>
            Fail <span className="font-mono">{gate.interactionId}</span> on{' '}
            <span className="font-mono break-all">{workflowId}</span>.
            Optionally supply a custom failure message the workflow throws
            instead of the generic one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="cancelMessage">
            Failure message (optional)
          </label>
          <Input
            id="cancelMessage"
            placeholder="Leave blank for the default cancellation error"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Back
          </Button>
          <AsyncButton variant="destructive" onClick={submit}>
            Send CANCEL
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
