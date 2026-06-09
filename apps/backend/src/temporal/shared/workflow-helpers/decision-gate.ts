import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { criticalAlertWithTicket } from './critical-alert-with-ticket';
import { typedProxyActivities } from './typed-proxy-activities';

/**
 * Who is allowed to resolve a decision gate. Admin-only by default; some flows
 * (e.g. an order awaiting the customer to unlock a domain) also accept USER.
 */
export type Actor = 'USER' | 'ADMIN';

/**
 * The set of decisions a gate can receive.
 * - `RETRY` re-runs the guarded action.
 * - `PROCEED` is a passthrough — it re-throws the original failure that opened
 *   the gate, exactly as if the gate had not been there.
 * - `CANCEL` aborts with a non-retryable failure (optionally a caller-supplied
 *   message/type via {@link DecisionSignalPayload.cancelError}).
 * - `RESPOND` resolves the gate with a caller-supplied JSON payload.
 */
export type GateAction = 'PROCEED' | 'CANCEL' | 'RETRY' | 'RESPOND';

/**
 * Canonical signal payload. It is a strict superset of the legacy
 * `{ actor, actorId, action }` payload — `interactionId` and `response` are
 * optional — so existing senders deserialize cleanly when a workflow bridges a
 * legacy signal via {@link createDecisionGateRegistry}'s `legacySignals`.
 */
export interface DecisionSignalPayload<R = unknown> {
  actor: Actor;
  actorId: string;
  action: GateAction;
  /** Routes to a specific open gate. Absent → the single armed gate. */
  interactionId?: string;
  /** Meaningful only when `action === 'RESPOND'`; becomes the gate's result. */
  response?: R;
  /**
   * Meaningful only when `action === 'CANCEL'`; overrides the failure the gate
   * throws so an operator can supply a specific message/type instead of the
   * generic `decision-gate/cancelled`.
   */
  cancelError?: { message?: string; type?: string };
}

/** Default routing bucket for gates that do not specify an `interactionId`. */
export const DEFAULT_GATE_INTERACTION_ID = '__default__';

/**
 * Builds the decision signal name for a registry prefix. The default
 * (unprefixed) registry uses `'decisionGate'`; a prefixed registry uses
 * `'decisionGate:<prefix>'` so multiple registries in one workflow execution do
 * not clobber each other's handlers.
 */
export function decisionGateSignalName(prefix?: string): string {
  return prefix ? `decisionGate:${prefix}` : 'decisionGate';
}

/** Returns the decision signal definition for a registry prefix. */
export function decisionGateSignalFor(
  prefix?: string,
): workflow.SignalDefinition<[DecisionSignalPayload]> {
  return workflow.defineSignal<[DecisionSignalPayload]>(
    decisionGateSignalName(prefix),
  );
}

/**
 * The shared decision signal for the default (unprefixed) registry. A single,
 * statically-named signal carries every gate's decisions; distinctness across
 * multiple wait-points in one workflow comes from
 * {@link DecisionSignalPayload.interactionId}, not the signal name. When a
 * workflow needs more than one registry, each additional registry gets a
 * distinct signal name via {@link decisionGateSignalFor}.
 */
export const decisionGateSignal = decisionGateSignalFor();

/**
 * Discriminated outcome of a wait. `response` is present only for `RESPOND`.
 * `signal` is the decision signal that resolved the gate, or `null` when the
 * gate was resolved by a `raceWith` external resolver or by a `TIMEOUT`.
 */
export type GateOutcome<R> =
  | { action: 'PROCEED'; signal: DecisionSignalPayload<R> | null }
  | { action: 'CANCEL'; signal: DecisionSignalPayload<R> | null }
  | { action: 'RETRY'; signal: DecisionSignalPayload<R> | null }
  | { action: 'RESPOND'; response: R; signal: DecisionSignalPayload<R> | null }
  | { action: 'TIMEOUT'; signal: null };

/**
 * The decision an external `raceWith` resolver yields when it wins the race
 * against the signal/timeout wait. Mirrors {@link GateAction} but carries only
 * what the resolver itself knows (no actor/signal); `RESPOND` supplies the value.
 */
export type GateResolution<R> =
  | { action: 'PROCEED' }
  | { action: 'CANCEL' }
  | { action: 'RETRY' }
  | { action: 'RESPOND'; response: R };

export interface WaitForDecisionOptions<R> {
  /** Distinct wait-point key. Defaults to {@link DEFAULT_GATE_INTERACTION_ID}. */
  interactionId?: string;
  /** Actors permitted to resolve this gate. Defaults to `['ADMIN']`. */
  allowedActors?: Actor[];
  /** Actions this gate accepts. Defaults to all four. */
  allowedActions?: GateAction[];
  /** Timeout in ms (sum-of-slept-durations). `undefined` waits forever. */
  timeoutMs?: number;
  /**
   * Validates/parses a `RESPOND` payload. If it throws, the signal is ignored
   * and the gate keeps waiting (a malformed payload never resolves the gate).
   */
  validateResponse?: (raw: unknown) => R;
  /**
   * Optional external resolver raced against the signal/timeout wait. When its
   * promise settles first, its {@link GateResolution} becomes the outcome
   * (`signal: null`) and the wait ends without operator input — e.g. an EPP
   * import that polls the registrar lock and proceeds the moment it detects the
   * domain was unlocked, even though no admin/user ever signalled.
   *
   * If it rejects, the rejection propagates out of `waitForDecision`. The losing
   * branch's promise is abandoned (not cancelled), so a long-poll activity used
   * here keeps running in the background until it settles or the workflow closes
   * — wrap it in a {@link workflow.CancellationScope} if that matters.
   */
  raceWith?: () => Promise<GateResolution<R>>;
  /** Operator-facing context surfaced via the armed-gates query (see {@link ArmedGateContext}). */
  context?: ArmedGateContext;
}

/** Serialized failure that opened a gate, for operator display. */
export interface GateErrorInfo {
  /** The failure message. */
  message: string;
  /** ApplicationFailure type or error name (e.g. `ChildWorkflowFailure`). */
  type?: string;
  /** Best-effort structured detail (e.g. ApplicationFailure.details). */
  details?: unknown;
  /**
   * The wrapped cause, when present. Temporal wrappers like
   * `ChildWorkflowFailure` / `ActivityFailure` carry a generic message and the
   * real failure in their `cause`, so the chain is walked here.
   */
  cause?: GateErrorInfo;
}

/**
 * One entry in a gate's per-run history: a time the gate opened plus how it was
 * resolved. Accumulated in-memory for the life of the workflow run and surfaced
 * via the armed-gates query; not persisted (the resolved decision itself lives
 * durably in the audit log + Temporal event history).
 */
export interface GateAttempt {
  /** Which action attempt opened the gate (1-based; matches {@link ArmedGateContext.attempt}). */
  attempt: number;
  /** ISO time the gate opened (deterministic workflow clock). */
  openedAt: string;
  /** Serialized failure that opened the gate this time. */
  error: GateErrorInfo;
  /** How this open was resolved; absent while the gate is still awaiting a decision. */
  resolution?: {
    /** The resolving action — a {@link GateAction}, or `'TIMEOUT'` when the decision window elapsed. */
    action: GateAction | 'TIMEOUT';
    actor?: Actor;
    actorId?: string;
    /** ISO time the decision landed. */
    at: string;
  };
}

/**
 * Operator-facing context about why a gate opened and how long it will wait,
 * surfaced through the armed-gates query so the admin UI can show the error,
 * the alert description/details, and timing.
 */
export interface ArmedGateContext {
  /**
   * Short, user-centric headline for the gate (what we tried + what happened),
   * used as the alert/card title. Falls back to a generic title when unset.
   */
  alertTitle?: string;
  /** Operator-facing description of why the gate opened (the alert message / subtitle). */
  alertMessage?: string;
  /** Serialized failure that opened the gate. */
  error?: GateErrorInfo;
  /** Structured alert details supplied by the caller. */
  alertDetails?: Record<string, unknown>;
  /** ISO time the gate opened (deterministic workflow clock). */
  openedAt?: string;
  /** Admin-decision window (ms); the gate auto-fails this long after `openedAt`. */
  decisionTimeoutMs?: number;
  /** Per-attempt action deadline (ms), when the action was timeout-bounded. */
  actionTimeoutMs?: number;
  /** Which action attempt failed (1-based). */
  attempt?: number;
  /**
   * Stable class-of-gate id (e.g. `'register-or-import-poll'`). Opaque to the
   * helper; the admin side keys decision-support evidence gathering off this.
   */
  gateKind?: string;
  /**
   * Minimal params the admin side needs to gather evidence for this gate
   * (e.g. `{ normalizedDomainName }`). Set by the caller / known-gates wrapper.
   */
  evidenceParams?: Record<string, unknown>;
  /** Per-run log of every time this gate opened, oldest first. */
  history?: GateAttempt[];
}

/** Serializable description of a single currently-armed gate. */
export interface ArmedGateInfo {
  interactionId: string;
  allowedActors: Actor[];
  allowedActions: GateAction[];
  /** True when a RESPOND payload must pass a validator to resolve the gate. */
  requiresResponseValidation: boolean;
  /** Why the gate opened + timing, for operator display. */
  context?: ArmedGateContext;
}

/** Snapshot of every gate a workflow is currently awaiting a decision on. */
export interface ArmedGatesSnapshot {
  count: number;
  gates: ArmedGateInfo[];
}

/** Builds the armed-gates query name for a registry prefix. */
export function decisionGateArmedQueryName(prefix?: string): string {
  return prefix ? `decisionGateArmed:${prefix}` : 'decisionGateArmed';
}

/** Returns the armed-gates query definition for a registry prefix. */
export function decisionGateArmedQueryFor(
  prefix?: string,
): workflow.QueryDefinition<ArmedGatesSnapshot, []> {
  return workflow.defineQuery<ArmedGatesSnapshot>(
    decisionGateArmedQueryName(prefix),
  );
}

/**
 * Queries the gates the default registry is currently awaiting. Lets an
 * operator/UI inspect a running workflow — e.g. "what is this blocked on?" —
 * without sending a signal. Registered automatically by
 * {@link createDecisionGateRegistry}. Prefixed registries expose their own query
 * via {@link decisionGateArmedQueryFor}.
 */
export const decisionGateArmedQuery = decisionGateArmedQueryFor();

export interface DecisionGateRegistry {
  /**
   * The resolved prefix for this registry, or `undefined` for the default
   * (unprefixed) registry. May differ from the requested prefix when one was
   * auto-assigned to avoid a handler-name collision.
   */
  readonly prefix: string | undefined;
  /** The signal name this registry listens on — senders must target this. */
  readonly signalName: string;
  /** The query name exposing this registry's armed gates. */
  readonly armedQueryName: string;
  /**
   * Arms a gate and resolves on the first valid signal or on timeout. Safe to
   * call multiple times sequentially or to race against other promises (e.g. a
   * poll). The gate is armed before awaiting, so a signal buffered just before
   * the wait is still honored.
   */
  waitForDecision<R = unknown>(
    options?: WaitForDecisionOptions<R>,
  ): Promise<GateOutcome<R>>;
  /**
   * Snapshot of the gates currently armed (awaiting a decision). Mirrors what
   * this registry's armed-gates query returns to external callers.
   */
  getArmedGates(): ArmedGatesSnapshot;
}

/**
 * Bridges a differently-named legacy signal into the registry so existing
 * senders keep working without changes. Each entry installs its own handler
 * that forwards into the shared dispatch path.
 *
 * @deprecated Transitional only — for migrating a workflow that still defines
 * its own signal (e.g. EPP's `'nextAction'`) onto the gate without changing its
 * senders. Once senders target {@link decisionGateSignal} directly, drop the
 * bridge; this option is slated for removal to reduce complexity.
 */
export interface LegacySignalBridge {
  // biome-ignore lint/suspicious/noExplicitAny: legacy signals carry heterogeneous payloads
  signal: workflow.SignalDefinition<any[]>;
  /** Gate this legacy signal maps to. Defaults to {@link DEFAULT_GATE_INTERACTION_ID}. */
  interactionId?: string;
}

interface OpenGate {
  interactionId: string;
  allowedActors: ReadonlySet<Actor>;
  allowedActions: ReadonlySet<GateAction>;
  validateResponse?: (raw: unknown) => unknown;
  received: DecisionSignalPayload | null;
  context?: ArmedGateContext;
}

const ALL_ACTIONS: readonly GateAction[] = [
  'PROCEED',
  'CANCEL',
  'RETRY',
  'RESPOND',
];

/**
 * Memo key tracking the signal names of every registry created in THIS workflow
 * execution. Used to detect — deterministically and isolated per execution —
 * whether a registry already occupies the default handler names so a second
 * registry can auto-assign a distinct prefix instead of clobbering it.
 */
const REGISTRY_NAMES_MEMO_KEY = '__decisionGateRegistryNames';

function readRegisteredSignalNames(): string[] {
  const memo = workflow.workflowInfo().memo as
    | Record<string, unknown>
    | undefined;
  const existing = memo?.[REGISTRY_NAMES_MEMO_KEY];
  return Array.isArray(existing)
    ? existing.filter((name): name is string => typeof name === 'string')
    : [];
}

function recordRegisteredSignalName(name: string): void {
  workflow.upsertMemo({
    [REGISTRY_NAMES_MEMO_KEY]: [...readRegisteredSignalNames(), name],
  });
}

/**
 * Resolves the prefix for a new registry so its signal/query handler names do
 * not collide with another registry created earlier in the SAME workflow
 * execution. Child workflows are separate executions with isolated handler
 * namespaces, so they never collide and never need a prefix.
 *
 * - An explicit `prefix` is honored (with a warning if it is already in use).
 * - With no prefix and a free default name → the default (unprefixed) registry.
 * - With no prefix but the default name taken → a prefix derived from the
 *   workflow type, suffixed with an incrementing counter on further collisions,
 *   always logged so the author can switch to an explicit, predictable prefix.
 */
function resolveRegistryPrefix(explicitPrefix?: string): string | undefined {
  const used = readRegisteredSignalNames();

  if (explicitPrefix !== undefined) {
    const name = decisionGateSignalName(explicitPrefix);
    if (used.includes(name)) {
      // Fail fast: registering a duplicate name would bind both registries'
      // signal/query handlers to the same name, silently breaking the first.
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        type: 'decision-gate/duplicate-prefix',
        message: `Decision gate prefix "${explicitPrefix}" is already in use in this workflow execution`,
        details: [{ prefix: explicitPrefix, signalName: name }],
      });
    }
    recordRegisteredSignalName(name);
    return explicitPrefix;
  }

  const defaultName = decisionGateSignalName();
  if (!used.includes(defaultName)) {
    recordRegisteredSignalName(defaultName);
    return undefined;
  }

  // The default handler name is taken — derive a distinct prefix.
  const base = workflow.workflowInfo().workflowType;
  let prefix = base;
  let name = decisionGateSignalName(prefix);
  let attempt = 1;
  while (used.includes(name)) {
    attempt += 1;
    prefix = `${base}-${attempt}`;
    name = decisionGateSignalName(prefix);
  }

  workflow.log.warn(
    'decision-gate: multiple registries in one workflow execution; auto-assigned a prefix to avoid handler collision. Pass an explicit `prefix` for predictable signal names.',
    { prefix, signalName: name, existing: used },
  );
  recordRegisteredSignalName(name);
  return prefix;
}

/**
 * Creates a decision-gate registry. The registry installs exactly one handler
 * for its decision signal (plus one per legacy bridge) and one armed-gates
 * query handler, and routes each incoming signal to the matching open gate.
 *
 * Must be created inside the workflow as a local value — never a module-level
 * singleton — so state is isolated per run and replay-deterministic.
 *
 * Multiple wait-points in ONE workflow are normally modeled as multiple gates
 * on a SINGLE registry (distinguished by `interactionId`). When a workflow
 * genuinely needs more than one registry (e.g. composed sub-flows), pass a
 * distinct `prefix` per registry so their handler names do not collide;
 * otherwise a prefix is auto-assigned (see {@link resolveRegistryPrefix}).
 */
export function createDecisionGateRegistry(opts?: {
  /** Distinct handler-name prefix. Auto-assigned (with a warning) when omitted. */
  prefix?: string;
  /**
   * @deprecated Transitional bridge for legacy signal names — see
   * {@link LegacySignalBridge}. Slated for removal.
   */
  legacySignals?: LegacySignalBridge[];
}): DecisionGateRegistry {
  const prefix = resolveRegistryPrefix(opts?.prefix);
  const signalDefinition = decisionGateSignalFor(prefix);
  const armedQueryDefinition = decisionGateArmedQueryFor(prefix);
  const signalName = decisionGateSignalName(prefix);
  const armedQueryName = decisionGateArmedQueryName(prefix);

  const openGates = new Map<string, OpenGate>();

  const singleArmedGate = (): OpenGate | undefined =>
    openGates.size === 1 ? openGates.values().next().value : undefined;

  // Read-only snapshot used both by the query handler and getArmedGates().
  const snapshotArmedGates = (): ArmedGatesSnapshot => {
    const gates = Array.from(openGates.values(), (gate) => ({
      interactionId: gate.interactionId,
      allowedActors: Array.from(gate.allowedActors),
      allowedActions: Array.from(gate.allowedActions),
      requiresResponseValidation: gate.validateResponse !== undefined,
      context: gate.context,
    }));
    return { count: gates.length, gates };
  };

  const dispatch = (signal: DecisionSignalPayload): void => {
    // Routing: an explicit interactionId must match an open gate; otherwise the
    // signal resolves the single armed gate (legacy un-routed senders), falling
    // back to the default bucket.
    const gate = signal.interactionId
      ? openGates.get(signal.interactionId)
      : (singleArmedGate() ?? openGates.get(DEFAULT_GATE_INTERACTION_ID));

    if (!gate || gate.received) return; // unarmed / mistargeted / already decided

    if (!gate.allowedActors.has(signal.actor)) {
      workflow.log.warn('decision-gate: actor not permitted', {
        actor: signal.actor,
        interactionId: gate.interactionId,
      });
      return;
    }
    if (!gate.allowedActions.has(signal.action)) {
      workflow.log.warn('decision-gate: action not permitted', {
        action: signal.action,
        interactionId: gate.interactionId,
      });
      return;
    }
    if (signal.action === 'RESPOND' && gate.validateResponse) {
      try {
        gate.validateResponse(signal.response);
      } catch {
        workflow.log.warn('decision-gate: RESPOND payload rejected', {
          interactionId: gate.interactionId,
        });
        return; // never latch an invalid payload
      }
    }

    gate.received = signal;
  };

  workflow.setHandler(signalDefinition, dispatch);
  workflow.setHandler(armedQueryDefinition, snapshotArmedGates);
  for (const bridge of opts?.legacySignals ?? []) {
    const fixedInteractionId = bridge.interactionId;
    workflow.setHandler(bridge.signal, (payload: DecisionSignalPayload) =>
      dispatch(
        fixedInteractionId
          ? { ...payload, interactionId: fixedInteractionId }
          : payload,
      ),
    );
  }

  return {
    prefix,
    signalName,
    armedQueryName,
    getArmedGates: snapshotArmedGates,
    async waitForDecision<R = unknown>(
      options: WaitForDecisionOptions<R> = {},
    ): Promise<GateOutcome<R>> {
      const interactionId =
        options.interactionId ?? DEFAULT_GATE_INTERACTION_ID;
      const gate: OpenGate = {
        interactionId,
        allowedActors: new Set(
          options.allowedActors?.length ? options.allowedActors : ['ADMIN'],
        ),
        allowedActions: new Set(
          options.allowedActions?.length ? options.allowedActions : ALL_ACTIONS,
        ),
        validateResponse: options.validateResponse as
          | ((raw: unknown) => unknown)
          | undefined,
        received: null,
        context: options.context,
      };

      // Reject a second concurrent wait on the same interactionId: it would
      // overwrite the first gate (which could then never resolve), and the
      // finally-`delete` below would remove the replacement. Sequential reuse —
      // after the prior gate resolved and was deleted — is still fine.
      if (openGates.has(interactionId)) {
        throw workflow.ApplicationFailure.create({
          nonRetryable: true,
          type: 'decision-gate/duplicate-interaction-id',
          message: `Decision gate interactionId "${interactionId}" is already armed`,
        });
      }
      // Arm BEFORE awaiting so a signal buffered just before the wait is honored.
      openGates.set(interactionId, gate);

      const awaitSignalOrTimeout = async (): Promise<GateOutcome<R>> => {
        if (options.timeoutMs === undefined) {
          await workflow.condition(() => gate.received !== null);
        } else {
          const signalled = await workflow.condition(
            () => gate.received !== null,
            options.timeoutMs,
            {
              summary: `decision-gate:waiting-for-interaction:${interactionId}`,
            },
          );
          if (!signalled) return { action: 'TIMEOUT', signal: null };
        }

        const signal = gate.received as DecisionSignalPayload<R>;
        if (signal.action === 'RESPOND') {
          const response = (
            options.validateResponse
              ? options.validateResponse(signal.response)
              : signal.response
          ) as R;
          return { action: 'RESPOND', response, signal };
        }
        return { action: signal.action, signal } as GateOutcome<R>;
      };

      const awaitExternal = async (
        raceWith: () => Promise<GateResolution<R>>,
      ): Promise<GateOutcome<R>> => {
        const resolution = await raceWith();
        if (resolution.action === 'RESPOND') {
          // Validate external RESPONDs through the same parser as signalled ones
          // so a resolver cannot return an unvalidated `R`.
          const response = (
            options.validateResponse
              ? options.validateResponse(resolution.response)
              : resolution.response
          ) as R;
          return { action: 'RESPOND', response, signal: null };
        }
        return { action: resolution.action, signal: null };
      };

      try {
        return options.raceWith
          ? await Promise.race([
              awaitSignalOrTimeout(),
              awaitExternal(options.raceWith),
            ])
          : await awaitSignalOrTimeout();
      } finally {
        openGates.delete(interactionId);
      }
    },
  };
}

export interface RunWithDecisionGateOptions<T, R = T> {
  /** The per-run registry that owns the signal handler. */
  registry: DecisionGateRegistry;
  /** Stable, deterministic wait-point key. */
  interactionId?: string;
  /** The guarded action. Re-invoked on RETRY. */
  action: () => Promise<T>;

  /**
   * Short, user-centric alert/card title (what we tried + what happened). Falls
   * back to a generic `Decision gate awaiting action (<workflowId>)` when unset.
   */
  alertTitle?: string;
  /** Message woven into the failure alert (the subtitle / next-step). */
  alertMessage: string;
  /** `'general'` (default) → generalAlertNamefi; `'critical'` → criticalAlertWithTicket. */
  alertSeverity?: 'general' | 'critical';
  /** Ticket priority when `alertSeverity === 'critical'`. */
  alertPriority?: 1 | 2 | 3 | 4;
  /** Extra structured fields merged into the alert payload. */
  alertDetails?: Record<string, unknown>;

  /** Actors permitted to resolve the gate. Defaults to `['ADMIN']`. */
  allowedActors?: Actor[];
  /** Actions the gate accepts. Defaults to all four. */
  allowedActions?: GateAction[];
  /** Admin-decision window in ms once the gate opens. `undefined` waits forever. */
  timeoutMs?: number;
  /**
   * Deadline for each `action()` attempt, in ms. When set, the action runs in a
   * `CancellationScope.withTimeout` — if it does not settle in time the in-flight
   * work (e.g. a long-poll activity) is cancelled and the gate opens, exactly as
   * if the action had thrown. This lets the gate itself bound an otherwise
   * unbounded poll, so no external timeout wrapper is needed. `undefined` (the
   * default) leaves the action unbounded, preserving prior behavior for callers
   * whose action throws on its own (e.g. a retry-bounded poll).
   */
  actionTimeoutMs?: number;
  /**
   * Optional external resolver raced against each wait (re-created per attempt).
   * When it wins, its {@link GateResolution} drives the loop just like a signal
   * — e.g. polling that detects the awaited state and yields `PROCEED`. See
   * {@link WaitForDecisionOptions.raceWith}.
   */
  raceWith?: () => Promise<GateResolution<R>>;
  /** Caps the RETRY loop (number of action attempts). Defaults to 10. */
  maxRetries?: number;
  /**
   * Auto-retry the action before opening the gate for a human. The budget is
   * consumed only BEFORE the first gate open — once a human is involved (the
   * gate has opened at least once), failures go straight back to the gate.
   * `undefined`/`maxAttempts: 0` (the default) preserves today's behavior: any
   * failure opens the gate immediately. Each auto-retry reuses the same
   * `actionTimeoutMs`.
   *
   * `shouldRetry` optionally restricts auto-retry to failures worth retrying
   * (e.g. a transient/timeout error but not a permanent one); when it returns
   * `false` the budget is not consumed and the gate opens. Defaults to always.
   */
  autoRetry?: {
    maxAttempts?: number;
    shouldRetry?: (ctx: { attempt: number; error: unknown }) => boolean;
  };
  /**
   * Stable class-of-gate id surfaced in the armed-gate context so the admin side
   * can gather decision-support evidence for this kind of gate (see the
   * `runWithKnownGate` wrapper). Opaque to the helper.
   */
  gateKind?: string;
  /** Minimal params the admin side needs to gather evidence (e.g. the domain). */
  evidenceParams?: Record<string, unknown>;

  /** Maps a successful action result into the return value. */
  onResult?: (result: T) => R;
  /** Validates/parses a RESPOND payload into the return value. */
  validateResponse?: (raw: unknown) => R;
  /** Side effect when entering the wait (e.g. set required-action + notify). */
  onAwaitingDecision?: (ctx: {
    attempt: number;
    error: unknown;
  }) => Promise<void>;
  /** Side effect on terminal CANCEL/TIMEOUT (e.g. record a failure reason). */
  onTerminate?: (o: {
    reason: 'CANCEL' | 'TIMEOUT';
    signal: DecisionSignalPayload | null;
  }) => Promise<void>;
  /** TIMEOUT behavior: `'throw'` (default) or return a sentinel value. */
  onTimeout?: { kind: 'throw' } | { kind: 'return'; value: R };
}

async function emitFailureAlert(args: {
  alertSeverity: 'general' | 'critical';
  alertTitle?: string;
  alertMessage: string;
  alertPriority?: 1 | 2 | 3 | 4;
  alertDetails?: Record<string, unknown>;
  error: unknown;
  interactionId?: string;
  attempt: number;
}): Promise<void> {
  const info = workflow.workflowInfo();
  const detail = {
    workflowId: info.workflowId,
    runId: info.runId,
    workflowType: info.workflowType,
    interactionId: args.interactionId,
    attempt: args.attempt,
    error:
      args.error instanceof Error ? args.error.message : String(args.error),
    ...(args.alertDetails ?? {}),
  };

  const title =
    args.alertTitle ?? `Decision gate awaiting action (${info.workflowId})`;

  try {
    if (args.alertSeverity === 'critical') {
      // Critical gates also file a ClickUp incident + start the monitor workflow.
      await criticalAlertWithTicket({
        title,
        message: args.alertMessage,
        extraData: detail,
        priority: args.alertPriority,
      });
    } else {
      // Default (general) gates: a Slack ping only — a gate awaiting a decision is
      // not a hard incident, so call criticalAlertNamefi directly with
      // createIncident:false (no ClickUp ticket). criticalAlertNamefi posts to
      // Slack when NAMEFI_ALERT_SLACK_WEBHOOK_URL is set.
      const { criticalAlertNamefi } = typedProxyActivities({
        temporalEnum: TEMPORAL_ENUMS.DEFAULT,
        options: {
          ...shortRunningOpts,
          retry: { maximumInterval: '1 minute', maximumAttempts: 10 },
        },
      });
      await criticalAlertNamefi(
        { title, message: args.alertMessage, extraData: detail },
        { createIncident: false, incidentPriority: args.alertPriority },
      );
    }
  } catch (alertError) {
    // Alerting must never break the guarded flow.
    workflow.log.warn(`decision-gate: failure alert failed: ${alertError}`);
  }
}

/** Max depth walked through the `cause` chain when serializing a gate failure. */
const MAX_GATE_ERROR_DEPTH = 5;

/**
 * Serializes the failure that opened a gate for operator display, walking the
 * `cause` chain so the real error is surfaced even when wrapped by a generic
 * `ChildWorkflowFailure` / `ActivityFailure`.
 */
function serializeGateError(error: unknown, depth = 0): GateErrorInfo {
  const withCause = (info: GateErrorInfo, cause: unknown): GateErrorInfo => {
    if (cause != null && depth < MAX_GATE_ERROR_DEPTH) {
      info.cause = serializeGateError(cause, depth + 1);
    }
    return info;
  };
  if (error instanceof workflow.ApplicationFailure) {
    return withCause(
      {
        message: error.message,
        type: error.type ?? error.name,
        details: error.details,
      },
      error.cause,
    );
  }
  if (error instanceof Error) {
    return withCause(
      { message: error.message, type: error.name },
      (error as { cause?: unknown }).cause,
    );
  }
  return { message: String(error) };
}

/**
 * Runs `action`; on success returns `onResult(result)` (or the result itself).
 *
 * When `actionTimeoutMs` is set the action is bounded by a cancellable timeout:
 * if it does not settle in time the in-flight work is cancelled and the deadline
 * is treated as a failure (so an unbounded long-poll can open the gate without
 * an external timeout wrapper).
 *
 * On failure (an action throw OR its `actionTimeoutMs` deadline) it alerts the
 * team with detailed context, runs `onAwaitingDecision`, then opens a decision
 * gate and branches on the resolution — from an operator signal or, if `raceWith`
 * wins first, from the external resolver:
 * - `RETRY` → re-run `action`, bounded by `maxRetries`.
 * - `PROCEED` → passthrough: re-throw the original failure that opened the gate.
 * - `RESPOND` → return the validated payload.
 * - `CANCEL` → run `onTerminate('CANCEL')`, then throw a non-retryable failure
 *   (optionally the operator-supplied `cancelError`).
 * - `TIMEOUT` → run `onTerminate('TIMEOUT')`, then throw (or return the sentinel).
 */
export async function runWithDecisionGate<T, R = T>(
  opts: RunWithDecisionGateOptions<T, R>,
): Promise<R> {
  const {
    registry,
    action,
    interactionId,
    alertTitle,
    alertMessage,
    alertSeverity = 'general',
    alertPriority,
    alertDetails,
    allowedActors,
    allowedActions,
    timeoutMs,
    actionTimeoutMs,
    raceWith,
    maxRetries = 10,
    autoRetry,
    gateKind,
    evidenceParams,
    onResult,
    validateResponse,
    onAwaitingDecision,
    onTerminate,
    onTimeout = { kind: 'throw' },
  } = opts;

  const mapResult = (result: T): R =>
    onResult ? onResult(result) : (result as unknown as R);

  const idSuffix = interactionId ? ` [${interactionId}]` : '';

  // Runs the action, optionally bounding it by `actionTimeoutMs`. The deadline is
  // our own timer inside a cancellable scope: when it fires we cancel the
  // in-flight work (no orphaned poll) and surface a non-retryable failure, which
  // the gate loop below treats like any action throw — i.e. it opens the gate.
  // A cancellation we did NOT trigger (the whole workflow, or a parent scope,
  // being cancelled) is re-thrown so it keeps propagating instead of wrongly
  // opening the gate — `timedOut` is set only when our own timer fired.
  const runAction = async (): Promise<T> => {
    if (actionTimeoutMs === undefined) return action();
    let timedOut = false;
    const scope = new workflow.CancellationScope({ cancellable: true });
    try {
      return await scope.run(() => {
        void workflow
          .sleep(actionTimeoutMs, {
            summary: `decision-gate:timeout:${interactionId ?? DEFAULT_GATE_INTERACTION_ID}`,
          })
          .then(() => {
            timedOut = true;
            scope.cancel();
          })
          .catch(() => {
            // Timer cancelled because the action settled first — nothing to do.
          });
        return action();
      });
    } catch (error) {
      if (timedOut && workflow.isCancellation(error)) {
        const human =
          actionTimeoutMs >= 60_000
            ? `${Math.round(actionTimeoutMs / 60_000)} min`
            : `${Math.round(actionTimeoutMs / 1000)} s`;
        throw workflow.ApplicationFailure.create({
          nonRetryable: true,
          type: 'decision-gate/action-timeout',
          message: `Action exceeded its ${human} deadline${idSuffix}`,
        });
      }
      throw error;
    } finally {
      scope.cancel();
    }
  };

  // Per-run history of every gate open + resolution, surfaced via the armed-gates
  // query. The same array reference is threaded into each cycle's context, so a
  // snapshot always reflects the full history. Not persisted beyond the run.
  const history: GateAttempt[] = [];
  let autoRetriesLeft = autoRetry?.maxAttempts ?? 0;
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return mapResult(await runAction());
    } catch (error) {
      // Auto-retry before bothering a human, but only before the gate has ever
      // opened (history empty). A throwing `shouldRetry` predicate must NOT
      // escape this catch and bypass the gate — treat it as "do not auto-retry"
      // so the failure still alerts and opens the gate.
      if (autoRetriesLeft > 0 && history.length === 0) {
        let shouldAutoRetry = true;
        if (autoRetry?.shouldRetry) {
          try {
            shouldAutoRetry = autoRetry.shouldRetry({ attempt, error });
          } catch (predicateError) {
            shouldAutoRetry = false;
            workflow.log.warn(
              `decision-gate: shouldRetry predicate threw${idSuffix}; opening gate`,
              { attempt, predicateError },
            );
          }
        }
        if (shouldAutoRetry) {
          autoRetriesLeft--;
          workflow.log.debug(
            `decision-gate: auto-retrying after failure${idSuffix} (attempt ${attempt})`,
          );
          continue;
        }
      }

      const serializedError = serializeGateError(error);
      // `Date` is the deterministic workflow clock inside a Temporal workflow.
      const openedAt = new Date().toISOString();
      history.push({ attempt, openedAt, error: serializedError });

      await emitFailureAlert({
        alertSeverity,
        alertTitle,
        alertMessage,
        alertPriority,
        alertDetails,
        error,
        interactionId,
        attempt,
      });

      if (onAwaitingDecision) {
        await onAwaitingDecision({ attempt, error });
      }

      const outcome = await registry.waitForDecision<R>({
        interactionId,
        allowedActors,
        allowedActions,
        timeoutMs,
        validateResponse,
        raceWith,
        context: {
          alertTitle,
          alertMessage,
          error: serializedError,
          alertDetails,
          openedAt,
          decisionTimeoutMs: timeoutMs,
          actionTimeoutMs,
          attempt,
          gateKind,
          evidenceParams,
          history,
        },
      });

      // Stamp how this open was resolved onto its history entry.
      const latest = history[history.length - 1];
      if (latest) {
        latest.resolution = {
          action: outcome.action,
          actor: outcome.signal?.actor,
          actorId: outcome.signal?.actorId,
          at: new Date().toISOString(),
        };
      }

      if (outcome.action === 'RESPOND') {
        return outcome.response;
      }

      if (outcome.action === 'PROCEED') {
        // Passthrough: behave as if the gate weren't there — re-throw the
        // failure that opened it. (RETRY re-runs the action instead.)
        throw error;
      }

      if (outcome.action === 'CANCEL' || outcome.action === 'TIMEOUT') {
        const reason = outcome.action;
        if (onTerminate) await onTerminate({ reason, signal: outcome.signal });
        if (reason === 'TIMEOUT' && onTimeout.kind === 'return') {
          return onTimeout.value;
        }
        // CANCEL may carry an operator-supplied custom failure.
        const cancelError =
          reason === 'CANCEL' ? outcome.signal?.cancelError : undefined;
        throw workflow.ApplicationFailure.create({
          nonRetryable: true,
          type:
            reason === 'TIMEOUT'
              ? 'decision-gate/timeout'
              : (cancelError?.type ?? 'decision-gate/cancelled'),
          message:
            reason === 'TIMEOUT'
              ? `Decision gate timed out${idSuffix}: ${alertMessage}`
              : (cancelError?.message ??
                `Operation cancelled${idSuffix}: ${alertMessage}`),
          details: [{ interactionId, signal: outcome.signal, attempt }],
        });
      }

      // RETRY → re-run the action, bounded by maxRetries.
      if (attempt >= maxRetries) {
        throw workflow.ApplicationFailure.create({
          nonRetryable: true,
          type: 'decision-gate/max-retries',
          message: `Decision gate exceeded ${maxRetries} attempt(s)${idSuffix}: ${alertMessage}`,
          details: [
            { interactionId, lastSignal: outcome.signal, attempts: attempt },
          ],
        });
      }
    }
  }
}
