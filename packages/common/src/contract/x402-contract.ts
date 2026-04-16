import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the x402 router.
 *
 * The router (`apps/backend/src/trpc/routers/x402Router.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof x402Contract>`. The single procedure
 * exposes the progress of an x402 purchase Temporal workflow to anyone
 * holding the purchase id — it's a `publicProcedure`.
 *
 * The output payload mirrors the backend-local types
 * `X402PurchaseProgressSnapshot` / `X402PurchaseProgressPayload` in
 * `x402Router.ts`. We model the workflow-status and workflow-step fields
 * as literal unions here so this package does not need a dep on
 * `@temporalio/client`. Divergence between the backend's types and these
 * contract types is caught at compile time by the contract-assignment in
 * `createContractTRPCRouter<typeof x402Contract>`.
 */

// ---------------------------------------------------------------------------
// Shared workflow status / step schemas (mirror of the ones in
// `dns-records-contract.ts` — kept independent because tRPC's
// `WorkflowExecutionStatusName` is the same literal union).
// ---------------------------------------------------------------------------

const workflowStatusSchema = z.union([
  z.literal('UNSPECIFIED'),
  z.literal('RUNNING'),
  z.literal('COMPLETED'),
  z.literal('FAILED'),
  z.literal('CANCELLED'),
  z.literal('TERMINATED'),
  z.literal('CONTINUED_AS_NEW'),
  z.literal('TIMED_OUT'),
  z.literal('UNKNOWN'),
  z.literal('NOT_FOUND'),
]);

const workflowStepStatusSchema = z.union([
  z.literal('PENDING'),
  z.literal('IN_PROGRESS'),
  z.literal('COMPLETED'),
  z.literal('FAILED'),
  z.literal('SKIPPED'),
]);

const stepWorkflowInfoSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  progressQueryName: z.string(),
});

type WorkflowStepShape = {
  id: string;
  status: z.infer<typeof workflowStepStatusSchema>;
  startedAt?: number;
  completedAt?: number;
  message?: string;
  nestedWorkflow?: z.infer<typeof stepWorkflowInfoSchema>;
  substeps?: WorkflowStepShape[];
};

const workflowStepSchema: z.ZodType<WorkflowStepShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    status: workflowStepStatusSchema,
    startedAt: z.number().optional(),
    completedAt: z.number().optional(),
    message: z.string().optional(),
    nestedWorkflow: stepWorkflowInfoSchema.optional(),
    substeps: z.array(workflowStepSchema).optional(),
  }),
);

const workflowProgressStateSchema = z.object({
  steps: z.array(workflowStepSchema),
  phase: z.union([
    z.literal('RUNNING'),
    z.literal('COMPLETED'),
    z.literal('FAILED'),
  ]),
  error: z.string().optional(),
  timestamps: z.object({
    startedAt: z.number(),
    lastUpdatedAt: z.number(),
    completedAt: z.number().optional(),
  }),
});

// ---------------------------------------------------------------------------
// x402 purchase progress payload
// ---------------------------------------------------------------------------

const x402PurchaseProgressPayloadSchema = z.object({
  workflowStatus: workflowStatusSchema,
  runId: z.string().nullable(),
  state: workflowProgressStateSchema.nullable(),
  purchaseId: z.string(),
  domain: z.string().nullable(),
  purchaseStatus: z.string().nullable(),
  buyerWallet: z.string().nullable(),
  amountInUsdCents: z.number().nullable(),
  network: z.string().nullable(),
  settlementTxHash: z.string().nullable(),
  orderId: z.string().nullable(),
  fetchedAt: z.string(),
});

export type X402PurchaseProgressPayload = z.infer<
  typeof x402PurchaseProgressPayloadSchema
>;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

const getX402PurchaseProgressInputSchema = z.object({
  purchaseId: z.string().uuid(),
});

export const x402Contract = createContract(
  { softOutput: true },
  {
    getX402PurchaseProgress: {
      type: 'query',
      input: getX402PurchaseProgressInputSchema,
      output: x402PurchaseProgressPayloadSchema,
    },
  },
);

export type X402Contract = typeof x402Contract;
