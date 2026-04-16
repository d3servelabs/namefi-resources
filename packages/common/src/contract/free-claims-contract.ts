import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import {
  workflowExecutionStatusNameSchema,
  type WorkflowExecutionStatusName,
} from '../types/temporal';
import type { SearchAttributes } from '@temporalio/common';
import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the free claims router.
 *
 * The router (`apps/backend/src/trpc/routers/freeClaimsRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof freeClaimsContract>`. Every procedure
 * uses `protectedProcedure` on the backend.
 *
 * Temporal types are imported directly from `@temporalio/client` /
 * `@temporalio/common` (type-only), so divergence between backend and
 * contract is caught by the zod custom-schema type parameter.
 */

// ---------------------------------------------------------------------------
// Temporal `WorkflowExecutionStatusName` as a zod-typed custom schema so the
// runtime parse stays permissive, but consumers see the exact temporal
// literal union at the type level.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// checkEligibility
// ---------------------------------------------------------------------------

const checkEligibilityInputSchema = z.object({
  groupOrCampaignKey: z.string().min(1),
  normalizedDomainName: namefiNormalizedDomainSchema,
});

// TODO(contract): replace with a structural schema for CheckClaimEligibilityOutput.
const checkEligibilityOutputSchema = z.custom<unknown>(() => true);

// ---------------------------------------------------------------------------
// processClaim / processClaimWithTransaction
// ---------------------------------------------------------------------------

const processClaimInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  recipientWalletAddress: checksumWalletAddressSchema,
  durationInYears: z.number().int().min(1).max(1),
  registrarKey: z.string().min(1),
});

const processClaimOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
  orderId: z.string().optional(),
  orderItemId: z.string().optional(),
  message: z.string(),
});

const processClaimWithTransactionInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  recipientWalletAddress: checksumWalletAddressSchema,
  registrarKey: z.string().min(1),
});

const processClaimWithTransactionOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
  claimId: z.string(),
  orderId: z.string(),
  orderItemId: z.string(),
  message: z.string(),
});

// ---------------------------------------------------------------------------
// getDomainClaimStatus
// ---------------------------------------------------------------------------

const getDomainClaimStatusInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  claimId: z.string().optional(),
});

const getDomainClaimStatusOutputSchema = z.object({
  status: workflowExecutionStatusNameSchema,
  result: z.any(),
  workflowState: z.unknown(),
  startTime: z.date(),
  closeTime: z.date().optional(),
});

// ---------------------------------------------------------------------------
// searchWorkflows
// ---------------------------------------------------------------------------

const searchWorkflowsInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema.optional(),
  groupOrCampaignKey: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

const searchWorkflowsOutputSchema = z.array(
  z.custom<{
    workflowId: string;
    workflowType: string;
    status: WorkflowExecutionStatusName;
    startTime: Date;
    closeTime: Date | undefined;
    searchAttributes: SearchAttributes;
  }>(() => true),
);

// ---------------------------------------------------------------------------
// getUserClaims
// ---------------------------------------------------------------------------

const freeClaimRowSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  id: z.string(),
  userId: z.string(),
  groupOrCampaignKey: z.string(),
  reason: z.string().nullable(),
  exactDomainName: namefiNormalizedDomainSchema.nullable().optional(),
  parentDomain: namefiNormalizedDomainSchema.nullable().optional(),
  expirationDate: z.date().nullable(),
  orderItemId: z.string().nullable(),
  claimingStatus: z.union([
    z.literal('CLAIMED'),
    z.literal('CLAIMING'),
    z.literal('IDLE'),
  ]),
  claimedDomainName: namefiNormalizedDomainSchema.nullable().optional(),
  claimedAt: z.date().nullable(),
  metadata: z.any(),
  isExpired: z.boolean(),
});

const campaignParentDomainClaimEntrySchema = z.object({
  type: z.literal('campaignParentDomain'),
  groupOrCampaignKey: z.string(),
  parentDomain: namefiNormalizedDomainSchema,
  reason: z.string().nullable(),
  counts: z.object({
    total: z.number(),
    available: z.number(),
    expired: z.number(),
    unclaimed: z.number(),
  }),
  claims: z.array(freeClaimRowSchema),
  claim: z.undefined().optional(),
});

const singleExactDomainClaimEntrySchema = z.object({
  groupOrCampaignKey: z.undefined().optional(),
  parentDomain: z.undefined().optional(),
  reason: z.undefined().optional(),
  counts: z.undefined().optional(),
  claims: z.undefined().optional(),
  type: z.literal('singleExactDomain'),
  claim: freeClaimRowSchema,
});

const getUserClaimsOutputSchema = z.array(
  z.union([
    campaignParentDomainClaimEntrySchema,
    singleExactDomainClaimEntrySchema,
    z.null(),
  ]),
);

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const freeClaimsContract = createContract(
  { softOutput: true },
  {
    checkEligibility: {
      type: 'query',
      input: checkEligibilityInputSchema,
      output: checkEligibilityOutputSchema,
    },
    processClaim: {
      type: 'mutation',
      input: processClaimInputSchema,
      output: processClaimOutputSchema,
    },
    getDomainClaimStatus: {
      type: 'query',
      input: getDomainClaimStatusInputSchema,
      output: getDomainClaimStatusOutputSchema,
    },
    searchWorkflows: {
      type: 'query',
      input: searchWorkflowsInputSchema,
      output: searchWorkflowsOutputSchema,
    },
    processClaimWithTransaction: {
      type: 'mutation',
      input: processClaimWithTransactionInputSchema,
      output: processClaimWithTransactionOutputSchema,
    },
    getUserClaims: {
      type: 'query',
      input: z.void(),
      output: getUserClaimsOutputSchema,
    },
  },
);

export type FreeClaimsContract = typeof freeClaimsContract;
