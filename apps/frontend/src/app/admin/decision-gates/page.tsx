'use client';

import { type CSSProperties, type ReactNode, useState } from 'react';
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
  MobileTableItem,
  MobileTableItemActions,
  MobileTableItemContent,
  MobileTableItemField,
  MobileTableItemHeader,
  MobileTableItemTitle,
  MobileTableList,
} from '@/components/ui/mobile-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Ban,
  ExternalLink,
  Info,
  Play,
  Reply,
  RefreshCw,
  RotateCw,
  Search,
} from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { AsyncButton } from '@/components/buttons/async-button';
import { PageShell } from '@/components/page-shell';
import { withAdminGuard } from '@/components/admin/admin-guard';

type ActiveGatesOutput =
  AppRouterOutput['admin']['workflowDecision']['listActiveDecisionGates'];
type GateWorkflow = ActiveGatesOutput['items'][number];
type Gate = GateWorkflow['gates'][number];
type GateHistoryEntry = NonNullable<
  NonNullable<Gate['context']>['history']
>[number];

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

/** UI-only: CANCEL is shown to operators as FAIL (the action value stays CANCEL). */
function actionLabel(action: string): string {
  return action === 'CANCEL' ? 'FAIL' : action;
}

function formatDuration(ms: number): string {
  if (ms >= 86_400_000) return `${Math.round(ms / 86_400_000)}d`;
  if (ms >= 3_600_000) return `${Math.round(ms / 3_600_000)}h`;
  if (ms >= 60_000) return `${Math.round(ms / 60_000)}min`;
  return `${Math.round(ms / 1000)}s`;
}

/** The deadline = openedAt + window, formatted. */
function formatDeadline(
  openedAt: string | undefined,
  windowMs: number,
): string {
  if (!openedAt) return '—';
  return formatStartedAt(
    new Date(new Date(openedAt).getTime() + windowMs).toISOString(),
  );
}

/** Walks the serialized error's `cause` chain to its deepest (root) failure. */
function deepestError(error: unknown): { message?: string; type?: string } {
  let current: unknown = error;
  let deepest: { message?: string; type?: string } = {};
  for (let guard = 0; current && typeof current === 'object' && guard < 10; ) {
    const node = current as {
      message?: unknown;
      type?: unknown;
      cause?: unknown;
    };
    if (typeof node.message === 'string') {
      deepest = {
        message: node.message,
        type: typeof node.type === 'string' ? node.type : undefined,
      };
    }
    current = node.cause;
    guard += 1;
  }
  return deepest;
}

/** CSS-variable theme for `@uiw/react-json-view` — bright, high-contrast colors
 *  in dark mode so values are easy to read against the muted panel. */
function jsonViewStyle(theme: string | undefined): CSSProperties {
  const dark = theme === 'dark';
  return {
    '--w-rjv-background-color': 'transparent',
    '--w-rjv-border-left-width': '0px',
    '--w-rjv-color': dark ? '#f3f4f6' : '#1f2937',
    '--w-rjv-key-string': dark ? '#bfdbfe' : '#2563eb',
    '--w-rjv-string-color': dark ? '#bbf7d0' : '#16a34a',
    '--w-rjv-number-color': dark ? '#fdba74' : '#b45309',
    '--w-rjv-boolean-color': dark ? '#fdba74' : '#b45309',
    '--w-rjv-null-color': dark ? '#cbd5e1' : '#6b7280',
    '--w-rjv-nan-color': dark ? '#cbd5e1' : '#6b7280',
    '--w-rjv-info-color': dark ? '#cbd5e1' : '#6b7280',
    '--w-rjv-line-color': dark ? '#6b7280' : '#d1d5db',
    '--w-rjv-arrow-color': dark ? '#cbd5e1' : '#6b7280',
    '--w-rjv-copied-color': dark ? '#34d399' : '#10b981',
  } as unknown as CSSProperties;
}

/** Renders any value as themed, collapsible JSON (the shared admin JSON viewer). */
function JsonBlock({
  value,
  collapsed = 2,
}: {
  value: unknown;
  collapsed?: number | boolean;
}) {
  const { theme } = useTheme();
  if (value === null || typeof value !== 'object') {
    return (
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted/50 p-3 text-sm">
        {String(value)}
      </pre>
    );
  }
  return (
    <div className="max-h-72 overflow-auto rounded-md bg-muted/50 p-3 text-sm">
      <JsonView
        value={value as object}
        collapsed={collapsed}
        displayDataTypes={false}
        style={jsonViewStyle(theme)}
      />
    </div>
  );
}

/** The failure that opened the gate, shown prominently (not muted) in the row. */
function GateErrorSummary({ context }: { context: Gate['context'] }) {
  const error = context?.error;
  const alertMessage = context?.alertMessage;
  if (!error && !alertMessage) return null;
  const root = error ? deepestError(error) : undefined;
  const showRoot = root?.message && root.message !== error?.message;
  return (
    <div className="mt-1.5 space-y-1">
      {error ? (
        <p className="break-words text-base font-semibold text-red-600 dark:text-red-400">
          {error.type ? (
            <span className="font-mono text-sm opacity-80">{error.type}: </span>
          ) : null}
          {error.message}
        </p>
      ) : null}
      {showRoot ? (
        <p className="break-words text-sm text-red-500/90 dark:text-red-400/90">
          ↳ {root?.type ? `${root.type}: ` : ''}
          {root?.message}
        </p>
      ) : null}
      {alertMessage ? (
        <p className="break-words text-sm text-foreground/70">{alertMessage}</p>
      ) : null}
    </div>
  );
}

/** All timestamps for a gate in one dedicated column: started / opened / deadlines. */
function GateTimingCell({
  startedAt,
  context,
}: {
  startedAt?: string;
  context: Gate['context'];
}) {
  const rows: Array<{ label: string; value: string }> = [];
  if (startedAt)
    rows.push({ label: 'Started', value: formatStartedAt(startedAt) });
  if (context?.openedAt) {
    rows.push({ label: 'Opened', value: formatStartedAt(context.openedAt) });
  }
  if (context?.openedAt && context.decisionTimeoutMs != null) {
    rows.push({
      label: 'Auto-fails',
      value: formatDeadline(context.openedAt, context.decisionTimeoutMs),
    });
  }
  if (context?.actionTimeoutMs != null) {
    rows.push({
      label: 'Action deadline',
      value: formatDuration(context.actionTimeoutMs),
    });
  }
  if (rows.length === 0)
    return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-1 text-sm">
      {rows.map((row) => (
        <div key={row.label}>
          <span className="text-muted-foreground">{row.label}: </span>
          <span className="font-mono text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** One armed-gate history entry as a readable timeline row. */
function GateHistoryItem({ entry }: { entry: GateHistoryEntry }) {
  const entryRoot = deepestError(entry.error);
  return (
    <li className="break-words text-sm text-muted-foreground">
      <span className="font-mono text-foreground">#{entry.attempt}</span>{' '}
      {formatStartedAt(entry.openedAt)} —{' '}
      <span className="text-foreground">
        {entryRoot.message ?? entry.error.message}
      </span>
      {entry.resolution ? (
        <span className="text-foreground">
          {' → '}
          {actionLabel(entry.resolution.action)}
          {entry.resolution.actor ? ` by ${entry.resolution.actor}` : ''}{' '}
          {formatStartedAt(entry.resolution.at)}
        </span>
      ) : (
        <span className="italic"> · awaiting decision</span>
      )}
    </li>
  );
}

type GateActionName = 'PROCEED' | 'RETRY' | 'RESPOND' | 'CANCEL';

interface GateGuidance {
  /** One line on why this kind of gate opens. */
  summary: string;
  /** Per-action advice; only shown for actions the gate actually allows. */
  actions: Partial<Record<GateActionName, string>>;
  /** Evidence-derived recommendation, shown once evidence is gathered. */
  evidenceHint?: (evidence: Record<string, unknown>) => string;
}

/** True when the gathered evidence suggests the domain already exists somewhere. */
function evidenceSuggestsPresent(evidence: Record<string, unknown>): boolean {
  const registrar = evidence.registrar as Record<string, unknown> | undefined;
  const registrarAccount = evidence.registrarAccount as
    | { found?: boolean }
    | undefined;
  const inSystem = evidence.inSystem as { inSystem?: boolean } | undefined;
  const rdapWhois = evidence.rdapWhois as Record<string, unknown> | undefined;
  const registrarKnown = Boolean(registrar) && !('error' in (registrar ?? {}));
  const publiclyRegistered =
    Boolean(rdapWhois) && !('error' in (rdapWhois ?? {}));
  return (
    registrarAccount?.found === true ||
    registrarKnown ||
    inSystem?.inSystem === true ||
    publiclyRegistered
  );
}

type PaymentChargeState = 'charged' | 'not-charged' | 'unknown';

/**
 * Classify NFSC charge evidence: `charged` (tx ref / SUCCEEDED), `not-charged`
 * (found but neither), or `unknown` (missing / errored / not found) — so a
 * missing record never steers the operator to CANCEL on incomplete evidence.
 */
function paymentChargeState(
  evidence: Record<string, unknown>,
): PaymentChargeState {
  const payment = evidence.payment as
    | {
        found?: boolean;
        error?: unknown;
        status?: string;
        paymentProviderReferenceId?: string | null;
      }
    | undefined;
  if (!payment || payment.error !== undefined || payment.found === false) {
    return 'unknown';
  }
  if (payment.status === 'SUCCEEDED' || payment.paymentProviderReferenceId) {
    return 'charged';
  }
  return 'not-charged';
}

/** Operator guidance per known gate kind — what each response means and when. */
const GATE_GUIDANCE: Record<string, GateGuidance> = {
  'register-or-import-poll': {
    summary:
      'The registrar register/import status poll exceeded its deadline. The operation is usually still queued at the registrar — verify its real state (registrar details, RDAP/WHOIS) before deciding.',
    actions: {
      RESPOND:
        'You verified the terminal status at the registrar — supply it (e.g. SUCCESSFUL once the domain shows registered, FAILED if rejected) and the workflow continues from there.',
      RETRY:
        'Re-poll the registrar when the operation may still be completing (offered for IMPORT only).',
      CANCEL:
        'Fail the workflow when the operation cannot recover (optionally with a custom message).',
    },
    evidenceHint: (evidence) =>
      evidenceSuggestsPresent(evidence)
        ? 'The domain appears registered (registrar / RDAP / WHOIS) — you can RESPOND SUCCESSFUL.'
        : 'No sign the domain is registered yet — RETRY to keep polling (IMPORT) or verify at the registrar before deciding.',
  },
  'register-or-import-submit': {
    summary:
      'The submit request to the registrar failed. It may or may not have reached the registrar, and re-submitting is NOT idempotent — check the evidence (already registered / already in our accounts?) before choosing RETRY.',
    actions: {
      RESPOND:
        'Evidence shows the submit actually went through — supply the verified terminal status (SUCCESSFUL / FAILED / ERROR) and the workflow continues.',
      RETRY:
        'Evidence shows the request did NOT land (not registered, not in our accounts) — safe to re-submit.',
      CANCEL: 'Fail the workflow when the submit cannot succeed.',
    },
    evidenceHint: (evidence) =>
      evidenceSuggestsPresent(evidence)
        ? 'The domain appears already present (registrar / our accounts / RDAP) — re-submitting could create a DUPLICATE. Prefer RESPOND with the verified status over RETRY.'
        : 'No sign the request landed — RETRY (re-submit) is likely safe.',
  },
  'process-order-item': {
    summary:
      'Processing this order item failed (acquire / register / import / renew). Re-running is not idempotent, so verify the domain’s real state before deciding.',
    actions: {
      RESPOND:
        'You completed the operation out-of-band (the domain is registered / minted) — supply the result (the mint tx hash, if any) and the item resolves as done.',
      CANCEL: 'Fail the item (it is refunded) when it cannot be completed.',
    },
    evidenceHint: (evidence) =>
      evidenceSuggestsPresent(evidence)
        ? 'The domain appears registered / in our accounts — it may already be done. RESPOND to mark the item complete.'
        : 'No sign the domain landed — CANCEL to fail and refund, or complete it manually then RESPOND.',
  },
  'nfsc-charge': {
    summary:
      'The on-chain NFSC charge failed. It may or may not have landed — check the payment status and tx reference before deciding. Re-charging is not offered (double-charge risk).',
    actions: {
      RESPOND:
        'The charge actually landed on-chain — supply its tx hash and the payment is marked SUCCEEDED.',
      CANCEL: 'Fail the payment when the charge did not go through.',
    },
    evidenceHint: (evidence) => {
      const state = paymentChargeState(evidence);
      if (state === 'charged') {
        return 'The payment shows a tx reference / SUCCEEDED status — the charge likely landed. RESPOND with the tx hash.';
      }
      if (state === 'not-charged') {
        return 'No tx reference and the payment is not SUCCEEDED — the charge likely did not land. CANCEL to fail the payment.';
      }
      return 'Payment evidence is unavailable or incomplete — verify the DB + on-chain state manually before deciding.';
    },
  },
};

/**
 * A titled card section for the details modal — consistent border + tint so the
 * sections read as distinct blocks instead of a flat wall of text.
 */
function ModalSection({
  title,
  tone = 'default',
  children,
}: {
  title: string;
  tone?: 'default' | 'error' | 'info';
  children: ReactNode;
}) {
  const toneClass =
    tone === 'error'
      ? 'border-red-500/30 bg-red-500/5'
      : tone === 'info'
        ? 'border-blue-500/30 bg-blue-500/5'
        : 'border-border bg-muted/30';
  return (
    <section className={`space-y-2 rounded-lg border p-4 ${toneClass}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** "What to do" panel: gate-kind summary + advice for each allowed action. */
function GateGuidanceSection({ gate }: { gate: Gate }) {
  const gateKind = gate.context?.gateKind;
  const guidance = gateKind ? GATE_GUIDANCE[gateKind] : undefined;
  if (!guidance) return null;
  return (
    <ModalSection title="What to do" tone="info">
      <p className="text-sm text-foreground/80">{guidance.summary}</p>
      <ul className="space-y-1">
        {gate.allowedActions.map((action) => {
          const tip = guidance.actions[action as GateActionName];
          if (!tip) return null;
          return (
            <li key={action} className="text-sm">
              <span className="font-semibold">{actionLabel(action)}</span>{' '}
              <span className="text-muted-foreground">— {tip}</span>
            </li>
          );
        })}
      </ul>
    </ModalSection>
  );
}

/** A labeled block of gathered evidence rendered as themed JSON. */
function EvidenceJson({ label, value }: { label: string; value: unknown }) {
  if (value === undefined) return null;
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <JsonBlock value={value} collapsed={false} />
    </div>
  );
}

/** Summary chips + per-source JSON for gathered decision-support evidence. */
function GateEvidenceView({
  evidence,
  gateKind,
}: {
  evidence: Record<string, unknown> | null | undefined;
  gateKind?: string;
}) {
  if (!evidence) {
    return (
      <p className="text-base text-muted-foreground">
        No evidence available for this gate.
      </p>
    );
  }
  const registrar = evidence.registrar as Record<string, unknown> | undefined;
  const registrarAccount = evidence.registrarAccount as
    | {
        found?: boolean;
        registrarKey?: string;
        isMissingFromRegistrar?: boolean;
      }
    | undefined;
  const inSystem = evidence.inSystem as
    | { inSystem?: boolean; chainId?: number }
    | undefined;
  const rdapWhois = evidence.rdapWhois as
    | { locked?: boolean; source?: string }
    | undefined;
  const payment = evidence.payment as
    | {
        found?: boolean;
        status?: string;
        paymentProviderReferenceId?: string | null;
      }
    | undefined;
  const hint = gateKind
    ? GATE_GUIDANCE[gateKind]?.evidenceHint?.(evidence)
    : undefined;
  // "In our system" is three independent folds; the umbrella is true if ANY holds:
  //  1. found by the registrar service (sldRegistrar.getDomainDetails)
  //  2. present in indexedDomainsTable (our 3rd-party registrar-account index)
  //  3. owned as a Namefi NFT on-chain (namefiNftOwnersView)
  const registrarFound = registrar !== undefined && !('error' in registrar);
  const indexed = registrarAccount?.found === true;
  const hasNft = inSystem?.inSystem === true;
  const inOurSystem = registrarFound || indexed || hasNft;
  // Domain gates gather these folds; payment-only gates (nfsc-charge) skip them.
  const hasSystemEvidence =
    registrar !== undefined ||
    registrarAccount !== undefined ||
    inSystem !== undefined;
  return (
    <div className="space-y-3">
      {hint ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-sm font-medium text-foreground/90">
          {hint}
        </p>
      ) : null}
      {hasSystemEvidence ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={inOurSystem ? 'default' : 'outline'}>
            In our system: {inOurSystem ? 'Yes' : 'No'}
          </Badge>
          {registrar !== undefined ? (
            <Badge variant={registrarFound ? 'secondary' : 'outline'}>
              Registrar (sldRegistrar): {registrarFound ? 'found' : 'not found'}
            </Badge>
          ) : null}
          {registrarAccount !== undefined ? (
            <Badge variant={indexed ? 'secondary' : 'outline'}>
              Indexed domains:{' '}
              {indexed
                ? `${registrarAccount.registrarKey ?? 'found'}${registrarAccount.isMissingFromRegistrar ? ' · missing' : ''}`
                : 'not found'}
            </Badge>
          ) : null}
          {inSystem?.inSystem !== undefined ? (
            <Badge variant={hasNft ? 'secondary' : 'outline'}>
              Namefi NFT:{' '}
              {hasNft
                ? inSystem.chainId != null
                  ? `chain ${inSystem.chainId}`
                  : 'yes'
                : 'none'}
            </Badge>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {rdapWhois?.locked !== undefined ? (
          <Badge variant="outline">
            {rdapWhois.locked ? 'Locked' : 'Unlocked'}
            {rdapWhois.source ? ` · ${rdapWhois.source}` : ''}
          </Badge>
        ) : null}
        {payment ? (
          <Badge
            variant={
              paymentChargeState(evidence) === 'charged' ? 'default' : 'outline'
            }
          >
            {payment.found === false
              ? 'Payment not found'
              : `Payment${payment.status ? ` · ${payment.status}` : ''}${
                  payment.paymentProviderReferenceId ? ' · has tx' : ''
                }`}
          </Badge>
        ) : null}
      </div>
      <EvidenceJson label="Payment" value={evidence.payment} />
      <EvidenceJson
        label="Registrar (sldRegistrar)"
        value={evidence.registrar}
      />
      <EvidenceJson label="Indexed domains" value={evidence.registrarAccount} />
      <EvidenceJson label="Namefi NFT (on-chain)" value={evidence.inSystem} />
      <EvidenceJson label="RDAP / WHOIS" value={evidence.rdapWhois} />
    </div>
  );
}

/**
 * Lazy decision-support panel: gathers evidence (registrar / in-system / RDAP-
 * WHOIS) on demand, server-side, only when an operator asks — so a slow lookup
 * never blocks the gate list.
 */
function GateEvidencePanel({
  workflowId,
  interactionId,
  gateKind,
  armedQueryName,
}: {
  workflowId: string;
  interactionId: string;
  gateKind?: string;
  armedQueryName: string;
}) {
  const trpc = useTRPC();
  const [enabled, setEnabled] = useState(false);
  const evidenceQuery = useQuery({
    ...trpc.admin.workflowDecision.gatherGateEvidence.queryOptions({
      workflowId,
      interactionId,
      armedQueryName,
    }),
    enabled,
    staleTime: 60_000,
  });

  if (!gateKind) return null;

  if (!enabled) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-1.5 h-7 px-2 text-sm"
        onClick={() => setEnabled(true)}
      >
        <Search className="h-3.5 w-3.5 mr-1" />
        Gather evidence
      </Button>
    );
  }

  return (
    <div className="mt-1.5">
      {evidenceQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Gathering evidence…</p>
      ) : evidenceQuery.isError ? (
        <p className="text-sm text-red-500">
          Failed: {evidenceQuery.error.message}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => evidenceQuery.refetch()}
          >
            retry
          </button>
        </p>
      ) : (
        <GateEvidenceView
          evidence={evidenceQuery.data?.evidence}
          gateKind={gateKind}
        />
      )}
    </div>
  );
}

/**
 * Modal with the full gate context — prominent error + themed JSON, alert
 * details, lazily-gathered decision-support evidence, and the attempt history —
 * so the table row stays compact.
 */
function GateDetailsDialog({
  workflow,
  gate,
}: {
  workflow: GateWorkflow;
  gate: Gate;
}) {
  const context = gate.context;
  const error = context?.error;
  const root = error ? deepestError(error) : undefined;
  const showRoot = root?.message && root.message !== error?.message;
  const history = context?.history ?? [];
  const armedQueryName = gate.signalName.replace(
    /^decisionGate/,
    'decisionGateArmed',
  );
  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="sm" variant="outline" className="h-8" />}
      >
        <Info className="mr-1.5 h-3.5 w-3.5" />
        Details
      </DialogTrigger>
      <DialogContent className="!max-w-2xl max-h-[85vh] overflow-y-auto text-base">
        <DialogHeader>
          <DialogTitle>Gate details</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{gate.interactionId}</span> on{' '}
            <span className="break-all font-mono">{workflow.workflowId}</span>
          </DialogDescription>
        </DialogHeader>

        <GateGuidanceSection gate={gate} />

        {error ? (
          <ModalSection title="Error" tone="error">
            <p className="break-words text-base font-semibold text-red-600 dark:text-red-400">
              {error.type ? `${error.type}: ` : ''}
              {error.message}
            </p>
            {showRoot ? (
              <p className="break-words text-sm text-red-500/90 dark:text-red-400/90">
                ↳ {root?.type ? `${root.type}: ` : ''}
                {root?.message}
              </p>
            ) : null}
            <JsonBlock value={error} />
          </ModalSection>
        ) : null}

        {context?.alertDetails ? (
          <ModalSection title="Alert details">
            <JsonBlock value={context.alertDetails} />
          </ModalSection>
        ) : null}

        {context?.gateKind ? (
          <ModalSection title="Decision support">
            <GateEvidencePanel
              workflowId={workflow.workflowId}
              interactionId={gate.interactionId}
              gateKind={context.gateKind}
              armedQueryName={armedQueryName}
            />
          </ModalSection>
        ) : null}

        {history.length > 1 ? (
          <ModalSection title={`History (${history.length})`}>
            <ul className="space-y-1">
              {history.map((entry) => (
                <GateHistoryItem
                  key={`${entry.attempt}-${entry.openedAt}`}
                  entry={entry}
                />
              ))}
            </ul>
          </ModalSection>
        ) : null}
      </DialogContent>
    </Dialog>
  );
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

/** One gate rendered as a card (orders-page style); titled by its alert message. */
function GateCard({
  workflow,
  gate,
  onSend,
}: {
  workflow: GateWorkflow;
  gate: Gate;
  onSend: (input: SendDecisionInput) => Promise<boolean>;
}) {
  const title =
    gate.context?.alertMessage ??
    gate.context?.gateKind ??
    workflow.workflowType;
  return (
    <MobileTableItem>
      <MobileTableItemHeader>
        <MobileTableItemTitle className="break-words">
          {title}
        </MobileTableItemTitle>
        {gate.context?.gateKind ? (
          <Badge variant="secondary" className="shrink-0">
            {gate.context.gateKind}
          </Badge>
        ) : null}
      </MobileTableItemHeader>

      <MobileTableItemContent>
        <MobileTableItemField
          label="Workflow"
          className="items-start"
          value={
            <span className="break-all">
              <span className="font-medium">{workflow.workflowType}</span>{' '}
              <span className="text-muted-foreground">
                · {workflow.workflowId}
              </span>
              {workflow.temporalUiUrl ? (
                <a
                  href={workflow.temporalUiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Temporal
                </a>
              ) : null}
            </span>
          }
        />
        <MobileTableItemField
          label="Gate"
          value={
            <span className="break-all font-mono">{gate.interactionId}</span>
          }
        />
        <MobileTableItemField
          label="Allowed"
          className="items-start"
          value={
            <span className="flex flex-wrap gap-1">
              {gate.allowedActions.map((a) => (
                <Badge key={a} variant="outline">
                  {actionLabel(a)}
                </Badge>
              ))}
            </span>
          }
        />
        <GateTimingCell startedAt={workflow.startedAt} context={gate.context} />
        <GateErrorSummary context={gate.context} />
      </MobileTableItemContent>

      <MobileTableItemActions className="flex-wrap">
        <GateDetailsDialog workflow={workflow} gate={gate} />
        {gate.allowedActions.map((rawAction) => {
          const action = rawAction as SendDecisionInput['action'];
          if (action === 'RESPOND') {
            return (
              <RespondDialog
                key={action}
                workflowId={workflow.workflowId}
                gate={gate}
                onSend={onSend}
              />
            );
          }
          if (action === 'CANCEL') {
            return (
              <CancelDialog
                key={action}
                workflowId={workflow.workflowId}
                gate={gate}
                onSend={onSend}
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
                onSend({
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
      </MobileTableItemActions>
    </MobileTableItem>
  );
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
      toast.success(
        `Sent ${actionLabel(variables.action)} to ${variables.workflowId}`,
      );
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
            sending PROCEED / RETRY / FAIL, or RESPOND with a payload.
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
            <p className="text-base text-red-600">
              Failed to load: {listQuery.error.message}
            </p>
          ) : rows.length === 0 && !listQuery.isLoading ? (
            <p className="text-base text-muted-foreground">
              No workflows are currently awaiting a decision.
            </p>
          ) : (
            <MobileTableList>
              {rows.map(({ workflow, gate }) => (
                <GateCard
                  key={`${workflow.workflowId}:${gate.signalName}:${gate.interactionId}`}
                  workflow={workflow}
                  gate={gate}
                  onSend={send}
                />
              ))}
            </MobileTableList>
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
      <label className="text-base font-medium" htmlFor={id}>
        {field.label}
        {field.optional ? ' (optional)' : ''}
      </label>
      {field.kind === 'enum' ? (
        <select
          id={id}
          className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-sm"
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
          <p className="text-base text-muted-foreground">
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
        FAIL
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fail gate</DialogTitle>
          <DialogDescription>
            Fail <span className="font-mono">{gate.interactionId}</span> on{' '}
            <span className="font-mono break-all">{workflowId}</span>.
            Optionally supply a custom failure message the workflow throws
            instead of the generic one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-base font-medium" htmlFor="cancelMessage">
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
            Send FAIL
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
