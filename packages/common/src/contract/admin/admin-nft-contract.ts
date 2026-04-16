import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';
import type { WorkflowExecutionStatusName } from '../../types/temporal';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin NFT sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/nftRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminNftContract>`. Procedures use
 * `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 *
 * Workflow status strings reuse `WorkflowExecutionStatusName` from
 * `@temporalio/client`.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const getNftsWithExpirationStatusInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

const domainAndChainIdInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  chainId: z.number(),
});

const extendRegistrationInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  chainId: z.number(),
  durationInYears: z.number().min(1).max(10),
  ownerAddress: z.string(),
  userId: z.string(),
});

const getWorkflowHistoryInputSchema = z.object({
  days: z.enum(['1', '3', '7']).default('7'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  workflowType: z.enum(['all', 'burn', 'fix', 'extend']).default('all'),
  nextPageToken: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

// TODO(contract): replace with structural schema for the NFT row aggregate.
// Backend dts reports every column as `never` because of a drizzle type
// widening quirk; keeping this opaque for now.
const nftListOutputSchema = z.custom<{
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}>(() => true);

const burnOrFixResultSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
  message: z.string(),
});

const getBurnWorkflowStatusOutputSchema = z.custom<
  | {
      workflowId: string;
      status: WorkflowExecutionStatusName;
      startTime: Date;
      closeTime: Date | undefined;
      historyLength: number;
    }
  | {
      workflowId: null;
      status: string;
      startTime: null;
      closeTime: null;
      historyLength: number;
    }
>(() => true);

const activeWorkflowsListSchema = z.array(
  z.custom<{
    workflowId: string;
    domainName: string;
    chainId: number;
    startTime: Date;
    runId: string;
    status: WorkflowExecutionStatusName;
  }>(() => true),
);

const workflowHistoryOutputSchema = z.custom<{
  data: Array<{
    workflowId: string;
    workflowType: string;
    status: string;
    startTime: Date | null;
    closeTime: Date | null;
    runId: string;
    executionTime: number | null;
    domainName: string | null;
    chainId: number | null;
    error: string | null;
  }>;
  pagination: {
    page: number | undefined;
    limit: number;
    totalCount: number | undefined;
    totalPages: number | undefined;
    nextPageToken: string | undefined;
    hasNextPage: boolean;
  };
  temporal: { apiUrl: string; namespace: string };
}>(() => true);

export const adminNftContract = {
  getNftsWithExpirationStatus: {
    type: 'query',
    input: getNftsWithExpirationStatusInputSchema,
    output: nftListOutputSchema,
  },
  burnNft: {
    type: 'mutation',
    input: domainAndChainIdInputSchema,
    output: burnOrFixResultSchema,
  },
  getBurnWorkflowStatus: {
    type: 'query',
    input: domainAndChainIdInputSchema,
    output: getBurnWorkflowStatusOutputSchema,
  },
  getActiveBurnWorkflows: {
    type: 'query',
    input: z.void(),
    output: activeWorkflowsListSchema,
  },
  getActiveFixExpirationWorkflows: {
    type: 'query',
    input: z.void(),
    output: activeWorkflowsListSchema,
  },
  getActiveExtendRegistrationWorkflows: {
    type: 'query',
    input: z.void(),
    output: activeWorkflowsListSchema,
  },
  extendRegistration: {
    type: 'mutation',
    input: extendRegistrationInputSchema,
    output: burnOrFixResultSchema,
  },
  fixNftExpiration: {
    type: 'mutation',
    input: domainAndChainIdInputSchema,
    output: burnOrFixResultSchema,
  },
  getWorkflowHistory: {
    type: 'query',
    input: getWorkflowHistoryInputSchema,
    output: workflowHistoryOutputSchema,
  },
} as const satisfies RouterContract;

export type AdminNftContract = typeof adminNftContract;
