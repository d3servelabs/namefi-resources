import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import type { WorkflowExecutionStatusName } from '../../types/temporal';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin bulk-burn sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/bulkBurnRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminBulkBurnContract>`. Procedures use
 * `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 *
 * Bulk burn workflow state types (`BulkBurnWorkflowState`, `DomainToBurn`)
 * are mirrored structurally from the backend's
 * `#temporal/workflows/bulk-burn-expired-domains.workflow` — divergence is
 * caught at the contract-assignment site in the router file.
 */

// ---------------------------------------------------------------------------
// Structural mirrors of backend temporal types
// ---------------------------------------------------------------------------

type BulkBurnInternalStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PROCESSING'
  | 'TIMED_OUT'
  | 'VERIFYING'
  | 'WAITING_APPROVAL';

/**
 * Mirror of `DomainToBurn` from
 * `apps/backend/src/temporal/activities/domain/bulk-burn.activities.ts`.
 */
type DomainToBurnLike = {
  domain: string;
  chainId: number;
  ownerAddress: string;
  nftExpirationDate: Date;
  daysSinceExpiration: number;
  registrar?: string;
};

/**
 * Mirror of `BulkBurnWorkflowState` from
 * `apps/backend/src/temporal/workflows/bulk-burn-expired-domains.workflow.ts`.
 *
 * `approvedDomains`, `verificationTime`, `approvalTime`, `completionTime`
 * are declared with `?` (optional keys) rather than required-undefined so
 * they match the backend's `BulkBurnWorkflowState` interface exactly.
 */
type BulkBurnWorkflowStateLike = {
  currentStatus: BulkBurnInternalStatus;
  totalRequested: number;
  verifiedDomains: DomainToBurnLike[];
  skippedDomains: Array<{ domain: string; reason: string }>;
  approvedDomains?: string[];
  successfulBurns: Array<{ domain: string; txHash: string }>;
  failedBurns: Array<{ domain: string; error: string }>;
  verificationTime?: Date;
  approvalTime?: Date;
  completionTime?: Date;
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const workflowIdInputSchema = z.object({ workflowId: z.string() });

const approveBulkBurnInputSchema = z.object({
  workflowId: z.string(),
  domainNames: z.array(namefiNormalizedDomainSchema),
});

const enrichBulkBurnDomainsInputSchema = z.object({
  domainNames: z.array(namefiNormalizedDomainSchema).max(5000),
});

const burnAllExpiredDomainsInputSchema = z.object({
  safeToBurnOnly: z
    .literal(true)
    .describe(
      'This a confirmation flag to only burn domains that are safe to burn, you cannot burn domains that are not safe to burn',
    ),
  dryRun: z.boolean().default(true),
  maxBurns: z.number().min(1).max(100).default(10),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

const bulkBurnWorkflowListSchema = z.array(
  z.custom<{
    workflowId: string;
    /** `WorkflowExecutionStatusName` plus the `'Unknown'` fallback the handler returns when `workflowInfo.status?.name` is undefined. */
    status: WorkflowExecutionStatusName | 'Unknown';
    startTime: Date;
    closeTime: Date | undefined;
    runId: string;
    state: BulkBurnWorkflowStateLike | undefined;
  }>(() => true),
);

const bulkBurnWorkflowByIdSchema = z.custom<
  | {
      exists: true;
      workflowId: string;
      /** Either the workflow's internal bulk-burn status, a `WorkflowExecutionStatusName`, or the `'Unknown'` fallback. */
      status: BulkBurnInternalStatus | WorkflowExecutionStatusName | 'Unknown';
      startTime: Date;
      closeTime: Date | undefined;
      runId: string;
      state: BulkBurnWorkflowStateLike | undefined;
    }
  | {
      exists: false;
      workflowId?: undefined;
      status?: undefined;
      startTime?: undefined;
      closeTime?: undefined;
      runId?: undefined;
      state?: undefined;
    }
>(() => true);

const pendingBulkBurnWorkflowSchema = z.custom<
  | {
      exists: true;
      workflowId: string;
      status: BulkBurnInternalStatus;
      startTime: Date;
      runId: string;
      state: BulkBurnWorkflowStateLike;
      error?: undefined;
      errorCode?: undefined;
    }
  | {
      exists: false;
      workflowId?: undefined;
      status?: undefined;
      startTime?: undefined;
      runId?: undefined;
      state?: undefined;
      error?: string | undefined;
      errorCode?: string | undefined;
    }
>(() => true);

const enrichBulkBurnOutputSchema = z.custom<
  Record<string, { autoRenewEnabled: boolean | null; userEmail: string | null }>
>(() => true);

const approveBulkBurnOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
  approvedCount: z.number(),
});

const cancelBulkBurnOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
});

const burnAllExpiredDomainsOutputSchema = z.custom<
  | {
      success: boolean;
      message: string;
      domainsProcessed: number;
      burnedDomains: Array<{
        normalizedDomainName: unknown;
        chainId: unknown;
        reason: string;
        nftExpirationTime: unknown;
        domainExpirationTime: unknown;
        dryRun: boolean;
      }>;
      skippedDomains: Array<{
        normalizedDomainName: unknown;
        chainId: unknown;
        reason: string;
        nftExpirationTime: unknown;
        domainExpirationTime: unknown;
      }>;
      errors?: undefined;
    }
  | {
      success: boolean;
      message: string;
      domainsProcessed: number;
      burnedDomains: Array<{
        normalizedDomainName: unknown;
        chainId: unknown;
        workflowId: string;
        reason: string;
        nftExpirationTime: unknown;
        domainExpirationTime: unknown;
        status: string;
      }>;
      skippedDomains: Array<{
        normalizedDomainName: unknown;
        chainId: unknown;
        reason: string;
      }>;
      errors: Array<{
        normalizedDomainName: unknown;
        chainId: unknown;
        error: string;
        nftExpirationTime: unknown;
        domainExpirationTime: unknown;
      }>;
    }
>(() => true);

export const adminBulkBurnContract = createContract(
  { softOutput: true },
  {
    getAllBulkBurnWorkflows: {
      type: 'query',
      input: z.void(),
      output: bulkBurnWorkflowListSchema,
    },
    getBulkBurnWorkflowById: {
      type: 'query',
      input: workflowIdInputSchema,
      output: bulkBurnWorkflowByIdSchema,
    },
    getPendingBulkBurnWorkflow: {
      type: 'query',
      input: z.void(),
      output: pendingBulkBurnWorkflowSchema,
    },
    approveBulkBurn: {
      type: 'mutation',
      input: approveBulkBurnInputSchema,
      output: approveBulkBurnOutputSchema,
    },
    cancelBulkBurn: {
      type: 'mutation',
      input: workflowIdInputSchema,
      output: cancelBulkBurnOutputSchema,
    },
    enrichBulkBurnDomains: {
      type: 'query',
      input: enrichBulkBurnDomainsInputSchema,
      output: enrichBulkBurnOutputSchema,
    },
    burnAllExpiredDomains: {
      type: 'mutation',
      input: burnAllExpiredDomainsInputSchema,
      output: burnAllExpiredDomainsOutputSchema,
    },
  },
);

export type AdminBulkBurnContract = typeof adminBulkBurnContract;
