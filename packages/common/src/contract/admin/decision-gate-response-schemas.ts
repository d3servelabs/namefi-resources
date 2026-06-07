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

/**
 * Registrar/DNS operation status — the RESPOND payload for the poll-wrapping
 * gates (`pollRegistrarOperationStatus`, `pollDsRecord*`, …). When a poll times
 * out, an admin verifies the registrar's real state and RESPONDs with the
 * terminal status the workflow should continue with.
 *
 * Mirrors `OperationStatus` from `@namefi-astra/registrars`; kept as a local
 * `z.enum` so this package takes no registrars dependency. The match is asserted
 * at compile time in `decision-gate-response-types.test.ts`.
 */
export const operationStatusSchema = z.enum([
  'ERROR',
  'FAILED',
  'IN_PROGRESS',
  'SUBMITTED',
  'SUCCESSFUL',
  'REQUIRES_ACTION',
]);
export type OperationStatusResponse = z.infer<typeof operationStatusSchema>;

/**
 * Terminal statuses an admin would realistically RESPOND with (a timed-out poll
 * never returns the non-terminal ones). The admin UI offers these as the select.
 */
export const TERMINAL_OPERATION_STATUSES = [
  'SUCCESSFUL',
  'FAILED',
  'ERROR',
  'REQUIRES_ACTION',
] as const satisfies readonly OperationStatusResponse[];

/**
 * ISO-8601 expiration timestamp — the RESPOND payload for the
 * `extend-expiration-poll` gate. After a renewal succeeds at the registrar the
 * workflow polls until the new expiration propagates; if that poll times out an
 * admin verifies the registrar's real expiration and RESPONDs with it.
 *
 * Mirrors `pollAndExpectExpirationChange`'s return type (an ISO string produced
 * by `new Date(...).toISOString()`); the match is asserted at compile time in
 * `decision-gate-response-types.test.ts`.
 */
export const expirationIsoSchema = z.string().datetime();
export type ExpirationIsoResponse = z.infer<typeof expirationIsoSchema>;

/** interactionId → RESPOND payload schema. */
export const decisionGateResponseSchemas = {
  'process-order-item': processOrderItemGateResponseSchema,
  // Poll-wrapping gates whose RESPOND payload is an OperationStatus.
  'ds-association-poll': operationStatusSchema,
  'ds-removal-status-poll': operationStatusSchema,
  'ds-removal-propagation-poll': operationStatusSchema,
  // Registrar register/import status poll (epp + sld). The admin verifies the
  // registrar's state and RESPONDs with the terminal status; the workflow
  // synthesizes the operation result it continues with.
  'register-or-import-poll': operationStatusSchema,
  // Registrar register/import SUBMIT (epp). When a submit fails, an admin who
  // verified the real registrar state RESPONDs with the status the workflow
  // should continue from (typically SUCCESSFUL); the workflow synthesizes the
  // operation result from it.
  'register-or-import-submit': operationStatusSchema,
  // EPP renewal status poll. The gate maps the activity's `{ status }` result to
  // a bare OperationStatus, so the RESPOND payload is the status alone.
  'extend-epp-status-poll': operationStatusSchema,
  // Post-renewal expiration-propagation poll. RESPOND with the verified new
  // expiration as an ISO-8601 timestamp.
  'extend-expiration-poll': expirationIsoSchema,
} as const;

export type DecisionGateInteractionId =
  keyof typeof decisionGateResponseSchemas;
