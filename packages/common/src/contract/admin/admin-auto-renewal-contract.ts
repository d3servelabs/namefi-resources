import type { WorkflowExecutionStatusName } from '../../types/temporal';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin auto-renewal sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/autoRenewalRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminAutoRenewalContract>`. Procedures
 * use `adminProcedureWithPermissions`.
 *
 * `AutoRenewMetrics` lives in `#temporal/activities/domain/autorenew-report.activities`
 * and cannot be cleanly imported into common. It's mirrored structurally
 * via `z.custom<T>()` so divergence surfaces at the contract-assignment
 * site in the router.
 */

// ---------------------------------------------------------------------------
// Structural mirrors (backend-only types)
// ---------------------------------------------------------------------------

/** Mirror of `UserResultForAdmin` from `autoRenewalRouter.ts` handler file. */
type UserResultForAdminLike = {
  userId: string;
  userEmail?: string;
  paymentStatus: string;
  totalAmountInUsd: number;
  refundAmountInUsd?: number;
  orderId?: string;
  domains: Array<{
    domain: string;
    registrar?: string;
    chainId?: number;
    status: 'SUCCESS' | 'FAILED' | 'PAYMENT_FAILED' | 'MISSING_PRICE';
    chargeAmountUsd?: number | null;
    errorReason?: string;
    actionRequired?: string;
    txHash?: string;
    eppOperationStatus?: string;
  }>;
  payments: Array<{
    provider: string;
    /** Amount in USD cents (1 USD = 100 cents). */
    amountInUsdCents: number;
    walletAddress?: string;
    stripeLast4?: string;
    /**
     * Provider-specific external reference.
     * - Stripe: Payment Intent ID (e.g. `pi_...`)
     * - NFSC / X402 / MPP: on-chain transaction hash
     */
    paymentProviderReferenceId?: string;
  }>;
};

/**
 * Mirror of `AutoRenewMetrics` from
 * `apps/backend/src/temporal/activities/domain/autorenew-report.activities.ts`.
 *
 * `PaymentProvider` is defined in `@namefi-astra/db/types` (a dep of common);
 * `NamefiNormalizedDomain` is defined in `@namefi-astra/utils`, but we use
 * plain `string` here since the zod type-only parameter ignores the brand.
 */
type AutoRenewMetricsLike = {
  reportDate: Date;
  totalUsersProcessed: number;
  totalDomainsProcessed: number;
  successfulRenewals: number;
  failedRenewals: number;
  totalAmountChargedInUsd: number;
  totalAmountRefundedInUsd: number;
  paymentMethodBreakdown: Record<
    string,
    { count: number; amountInUsd: number }
  >;
  failureBreakdown: {
    failedToCharge: number;
    registrarErrors: number;
    missingPriceData: number;
  };
  criticalDomains: Array<{
    domain: string;
    userId: string;
    userEmail?: string;
    issue: string;
    registrar?: string;
    expirationDate?: Date;
    actionRequired: string;
  }>;
  userCommunication: {
    upcomingRenewalNotifications: number;
    successfulRenewalConfirmations: number;
    failedRenewalAlerts: number;
    paymentFailureNotifications: number;
  };
  executionMetrics: {
    totalExecutionTime: number;
    averageTimePerUser: number;
    childWorkflowsSpawned: number;
  };
  registrarBreakdown: Record<string, { successful: number; failed: number }>;
  largestTransaction: {
    userId: string;
    amount: number;
    domainCount: number;
  };
  domainsInTransferPeriod?: number;
  domainsInAddPeriod?: number;
  lockedDomains?: number;
  domainLockStatus?: Record<
    string,
    {
      isTransferPeriod: boolean;
      isAddPeriod: boolean;
      locked: boolean;
      error?: boolean;
    }
  >;
  comparisonWithPreviousDay?: {
    renewalsDiff: number;
    revenueDiff: number;
    failuresDiff: number;
    successRateDiff: number;
  };
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const getAutoRenewalWorkflowByIdInputSchema = z.object({
  workflowId: z.string(),
  runId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

const workflowListOutputSchema = z.array(
  z.custom<{
    workflowId: string;
    status: string;
    startTime: Date | null;
    closeTime: Date | null;
    runId: string;
    summary?: {
      totalUsers: number;
      successfulUsers: number;
      failedUsers: number;
      totalDomains: number;
      totalDomainsRenewed: number;
      totalDomainsFailed: number;
      totalRevenueUsd: number;
      executionTimeMs: number;
    };
  }>(() => true),
);

const workflowDetailOutputSchema = z.custom<
  | {
      exists: true;
      workflowId: string;
      status: WorkflowExecutionStatusName;
      startTime: Date | null;
      closeTime: Date | null;
      runId: string;
      historyLength: number | null;
      temporal: { apiUrl: string; namespace: string };
    }
  | {
      exists: true;
      workflowId: string;
      status: WorkflowExecutionStatusName;
      startTime: Date | null;
      closeTime: Date | null;
      runId: string;
      historyLength: number | null;
      temporal: { apiUrl: string; namespace: string };
      metrics: AutoRenewMetricsLike;
      userResults: UserResultForAdminLike[];
    }
  | {
      exists: false;
      workflowId: string;
    }
>(() => true);

export const adminAutoRenewalContract = createContract(
  { softOutput: true },
  {
    getAllAutoRenewalWorkflows: {
      type: 'query',
      input: z.void(),
      output: workflowListOutputSchema,
    },
    getAutoRenewalWorkflowById: {
      type: 'query',
      input: getAutoRenewalWorkflowByIdInputSchema,
      output: workflowDetailOutputSchema,
    },
  },
);

export type AdminAutoRenewalContract = typeof adminAutoRenewalContract;
