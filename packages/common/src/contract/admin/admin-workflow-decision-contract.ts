import { z } from 'zod';

import { createContract } from '../create-contract';

export {
  decisionGateResponseSchemas,
  processOrderItemGateResponseSchema,
  type DecisionGateInteractionId,
  type ProcessOrderItemGateResponse,
} from './decision-gate-response-schemas';

/**
 * Contract for the admin workflow-decision sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/workflowDecisionRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminWorkflowDecisionContract>`.
 *
 * This is the generic operator path for resolving a Temporal decision gate
 * (see `apps/backend/src/temporal/shared/workflow-helpers/decision-gate.ts`):
 * inspect what a running workflow is blocked on (`getArmedGates`), then send a
 * decision (`sendDecision`). Defaults target the unprefixed registry
 * (signal `decisionGate`, query `decisionGateArmed`); pass a prefixed name for
 * a workflow that hosts multiple registries.
 */

/** Mirrors `GateAction` from the decision-gate helper. */
const gateActionSchema = z.enum(['PROCEED', 'CANCEL', 'RETRY', 'RESPOND']);

const sendDecisionInputSchema = z.object({
  /** Target workflow execution id (e.g. `change-nameservers-[example.com]`). */
  workflowId: z.string().min(1),
  /** Decision signal name. Defaults to the unprefixed registry's `decisionGate`. */
  signalName: z.string().min(1).default('decisionGate'),
  action: gateActionSchema,
  /** Routes to a specific gate when the workflow hosts several. */
  interactionId: z.string().optional(),
  /** JSON payload — only meaningful when `action === 'RESPOND'`. */
  response: z.unknown().optional(),
  /**
   * Custom failure to throw — only meaningful when `action === 'CANCEL'`.
   * Overrides the generic `decision-gate/cancelled` message/type.
   */
  cancelError: z
    .object({
      message: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
});

const sendDecisionOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
});

const getArmedGatesInputSchema = z.object({
  workflowId: z.string().min(1),
  /** Armed-gates query name. Defaults to the unprefixed `decisionGateArmed`. */
  armedQueryName: z.string().min(1).default('decisionGateArmed'),
});

/** Mirrors `GateErrorInfo` from the decision-gate helper. */
const gateErrorSchema = z.object({
  message: z.string(),
  type: z.string().optional(),
  details: z.unknown().optional(),
  /** Wrapped cause chain (e.g. the real failure under a ChildWorkflowFailure). */
  cause: z.unknown().optional(),
});

/** Mirrors `GateAttempt` from the decision-gate helper. */
const gateAttemptSchema = z.object({
  attempt: z.number(),
  openedAt: z.string(),
  error: gateErrorSchema,
  resolution: z
    .object({
      action: z.string(),
      actor: z.string().optional(),
      actorId: z.string().optional(),
      at: z.string(),
    })
    .optional(),
});

/** Mirrors `ArmedGateContext` from the decision-gate helper. */
const gateContextSchema = z.object({
  alertMessage: z.string().optional(),
  error: gateErrorSchema.optional(),
  alertDetails: z.record(z.string(), z.unknown()).optional(),
  openedAt: z.string().optional(),
  decisionTimeoutMs: z.number().optional(),
  actionTimeoutMs: z.number().optional(),
  attempt: z.number().optional(),
  /** Stable class-of-gate id; selects the admin-side evidence gatherer. */
  gateKind: z.string().optional(),
  /** Params the admin side needs to gather evidence (e.g. the domain). */
  evidenceParams: z.record(z.string(), z.unknown()).optional(),
  /** Per-run log of every time this gate opened. */
  history: z.array(gateAttemptSchema).optional(),
});

/** Mirrors `ArmedGatesSnapshot` from the decision-gate helper. */
const armedGatesSnapshotSchema = z.object({
  count: z.number(),
  gates: z.array(
    z.object({
      interactionId: z.string(),
      allowedActors: z.array(z.string()),
      allowedActions: z.array(z.string()),
      requiresResponseValidation: z.boolean(),
      context: gateContextSchema.optional(),
    }),
  ),
});

const listActiveDecisionGatesInputSchema = z.object({
  /** Narrow the scan to one workflow type (recommended for large namespaces). */
  workflowType: z.string().min(1).optional(),
  /** Cap on running workflows scanned before stopping. Default 500. */
  maxScan: z.number().int().positive().max(2000).optional(),
});

/** One armed gate plus the signal name to target when resolving it. */
const activeGateSchema = z.object({
  /** The signal name to pass to `sendDecision` (prefixed for non-default registries). */
  signalName: z.string(),
  interactionId: z.string(),
  allowedActors: z.array(z.string()),
  allowedActions: z.array(z.string()),
  requiresResponseValidation: z.boolean(),
  /** Why the gate opened + timing, for operator display. */
  context: gateContextSchema.optional(),
});

const decisionGateWorkflowSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  workflowType: z.string(),
  /** ISO start time, when available. */
  startedAt: z.string().optional(),
  /** Deep link to this run in the Temporal Web UI, when derivable. */
  temporalUiUrl: z.string().optional(),
  gates: z.array(activeGateSchema),
});

const listActiveDecisionGatesOutputSchema = z.object({
  items: z.array(decisionGateWorkflowSchema),
  /** How many running workflows were scanned. */
  scanned: z.number(),
  /** True when the scan hit `maxScan` before exhausting running workflows. */
  capped: z.boolean(),
});

const gatherGateEvidenceInputSchema = z.object({
  /** Workflow whose armed gate we gather evidence for. */
  workflowId: z.string().min(1),
  /** Which armed gate (matches the `interactionId` in the armed-gates snapshot). */
  interactionId: z.string(),
  /** Armed-gates query name. Defaults to the unprefixed `decisionGateArmed`. */
  armedQueryName: z.string().min(1).default('decisionGateArmed'),
});

const gatherGateEvidenceOutputSchema = z.object({
  /** The gate kind the evidence was gathered for (from the armed gate's context). */
  gateKind: z.string().optional(),
  /**
   * Gathered decision-support evidence (e.g. registrar details, in-system flag,
   * RDAP/WHOIS). `null` when the gate has no kind or no gatherer is registered.
   */
  evidence: z.record(z.string(), z.unknown()).nullable(),
});

export const adminWorkflowDecisionContract = createContract(
  {},
  {
    getArmedGates: {
      type: 'query',
      input: getArmedGatesInputSchema,
      output: armedGatesSnapshotSchema,
    },
    listActiveDecisionGates: {
      type: 'query',
      input: listActiveDecisionGatesInputSchema,
      output: listActiveDecisionGatesOutputSchema,
    },
    gatherGateEvidence: {
      type: 'query',
      input: gatherGateEvidenceInputSchema,
      output: gatherGateEvidenceOutputSchema,
    },
    sendDecision: {
      type: 'mutation',
      input: sendDecisionInputSchema,
      output: sendDecisionOutputSchema,
    },
  },
);

export type AdminWorkflowDecisionContract =
  typeof adminWorkflowDecisionContract;
