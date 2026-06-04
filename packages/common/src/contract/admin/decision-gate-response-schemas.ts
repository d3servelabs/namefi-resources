import { z } from 'zod';

/**
 * Zod schemas for decision-gate `RESPOND` payloads, keyed by the gate's
 * `interactionId`. A gate's RESPOND payload is the type of the action the gate
 * wraps — when an admin RESPONDs, the value becomes that action's result.
 *
 * These schemas are the single source of truth for both:
 *  - the **frontend** (render/validate the RESPOND form for a given gate), and
 *  - the **backend workflow** (used as the gate's `validateResponse`).
 *
 * Each schema must stay in sync with the wrapped action's output type; the match
 * is asserted at compile time in
 * `apps/backend/src/temporal/workflows/decision-gate-response-types.test.ts`.
 *
 * Gates not listed here take no meaningful RESPOND payload (they wrap a
 * `void`-returning action — RESPOND just resolves them as done).
 */

/**
 * `process-order-item` gate. Mirrors `AcquireDomainWorkflowOutput`: an admin who
 * completed the registration/mint out-of-band supplies the mint tx hash so the
 * order item records it and is marked SUCCEEDED.
 */
export const processOrderItemGateResponseSchema = z.object({
  mintTxHash: z.string().optional(),
});
export type ProcessOrderItemGateResponse = z.infer<
  typeof processOrderItemGateResponseSchema
>;

/** interactionId → RESPOND payload schema. */
export const decisionGateResponseSchemas = {
  'process-order-item': processOrderItemGateResponseSchema,
} as const;

export type DecisionGateInteractionId =
  keyof typeof decisionGateResponseSchemas;
