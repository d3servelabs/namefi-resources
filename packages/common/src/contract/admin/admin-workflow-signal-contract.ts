import { z } from 'zod';

import { createContract } from '../create-contract';

/**
 * Contract for the admin workflow-signal sub-router
 * (`apps/backend/src/trpc/routers/admin/workflowSignalRouter.ts`).
 *
 * A generic "send a signal to a running workflow by id + name" operator path,
 * separate from the decision-gate `sendDecision` (which only targets an *armed*
 * gate). Its primary use is the `runWithTestHarness` failure-injection signal —
 * fired while a poll is still in-flight (no gate armed yet) — so the operator can
 * force the action to fail and watch the decision gate open. The backend refuses
 * this in preview/production (see the router's environment guard).
 */

const sendSignalInputSchema = z.object({
  /** Target workflow execution id (e.g. `enable-dnssec-[example.com]`). */
  workflowId: z.string().min(1).trim(),
  /** The signal name to send (e.g. `test-harness:enable-dnssec:ds-association`). */
  signalName: z.string().min(1).trim(),
  /** Optional JSON payload delivered as the signal's single argument. */
  payload: z.unknown().optional(),
});

const sendSignalOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
});

export const adminWorkflowSignalContract = createContract(
  {},
  {
    sendSignal: {
      type: 'mutation',
      input: sendSignalInputSchema,
      output: sendSignalOutputSchema,
    },
  },
);

export type AdminWorkflowSignalContract = typeof adminWorkflowSignalContract;
