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

/** Mirrors `ArmedGatesSnapshot` from the decision-gate helper. */
const armedGatesSnapshotSchema = z.object({
  count: z.number(),
  gates: z.array(
    z.object({
      interactionId: z.string(),
      allowedActors: z.array(z.string()),
      allowedActions: z.array(z.string()),
      requiresResponseValidation: z.boolean(),
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
});

const decisionGateWorkflowSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  workflowType: z.string(),
  /** ISO start time, when available. */
  startedAt: z.string().optional(),
  gates: z.array(activeGateSchema),
});

const listActiveDecisionGatesOutputSchema = z.object({
  items: z.array(decisionGateWorkflowSchema),
  /** How many running workflows were scanned. */
  scanned: z.number(),
  /** True when the scan hit `maxScan` before exhausting running workflows. */
  capped: z.boolean(),
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
    sendDecision: {
      type: 'mutation',
      input: sendDecisionInputSchema,
      output: sendDecisionOutputSchema,
    },
  },
);

export type AdminWorkflowDecisionContract =
  typeof adminWorkflowDecisionContract;
