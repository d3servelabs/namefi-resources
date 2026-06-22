import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin free-claims sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/freeClaimsRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminFreeClaimsContract>`. Procedures use
 * `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 */

const getFreeClaimsWithPaginationInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum([
      'groupOrCampaignKey',
      'reason',
      'exactDomainName',
      'parentDomain',
      'expirationDate',
      'createdAt',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  searchTerm: z.string().optional(),
  status: z.enum(['all', 'IDLE', 'CLAIMING', 'CLAIMED']).default('all'),
});

const createFreeClaimInputSchema = z
  .object({
    userId: z.string().uuid(),
    groupOrCampaignKey: z.string().min(1),
    reason: z.string().min(1),
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
    expirationDate: z.date().optional(),
    // Free-claim guard policy, persisted to `freeClaimsTable.metadata`.
    // KNOWN LIMITATION: these are supported by the API/backend but are not yet
    // exposed as controls in the admin UI form, so today they are only settable
    // via a direct API call. The safe default (premium blocked, no cap) applies
    // to claims created without them. Surfacing them in the admin form is a
    // possible follow-up.
    /** Allow claiming premium domains with this claim (default: blocked). */
    allowPremium: z.boolean().optional(),
    /** Max 1-year registration price (USD) claimable for free (no cap if unset). */
    maxPrice: z.number().positive().optional(),
  })
  .refine((data) => data.exactDomainName || data.parentDomain, {
    message: 'Either exactDomainName or parentDomain must be provided',
    path: ['exactDomainName', 'parentDomain'],
  })
  .refine((data) => !(data.exactDomainName && data.parentDomain), {
    message: 'Cannot specify both exactDomainName and parentDomain',
    path: ['exactDomainName', 'parentDomain'],
  });

const updateFreeClaimInputSchema = z
  .object({
    id: z.string().uuid(),
    groupOrCampaignKey: z.string().min(1).optional(),
    reason: z.string().min(1).optional(),
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
    expirationDate: z.date().optional(),
    /** Allow claiming premium domains with this claim (default: blocked). */
    allowPremium: z.boolean().optional(),
    /** Max 1-year registration price (USD) claimable for free (no cap if unset). */
    maxPrice: z.number().positive().optional(),
  })
  .refine((data) => !(data.exactDomainName && data.parentDomain), {
    message: 'Cannot specify both exactDomainName and parentDomain',
    path: ['exactDomainName', 'parentDomain'],
  });

const deleteFreeClaimInputSchema = z.object({
  id: z.string().uuid(),
});

const freeClaimRowSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    groupOrCampaignKey: z.string(),
    reason: z.string().nullable(),
    exactDomainName: namefiNormalizedDomainSchema.nullable(),
    parentDomain: namefiNormalizedDomainSchema.nullable(),
    expirationDate: z.date().nullable(),
    orderItemId: z.string().nullable(),
    claimingStatus: z.enum(['IDLE', 'CLAIMING', 'CLAIMED']),
    claimedDomainName: namefiNormalizedDomainSchema.nullable(),
    claimedAt: z.date().nullable(),
    metadata: z.any(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .passthrough();

const paginatedFreeClaimsOutputSchema = z.object({
  data: z.array(freeClaimRowSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

const mutationResultSchema = z.object({
  success: z.boolean(),
  claim: freeClaimRowSchema.optional(),
});

export const adminFreeClaimsContract = createContract(
  { softOutput: true },
  {
    getFreeClaimsWithPagination: {
      type: 'query',
      input: getFreeClaimsWithPaginationInputSchema,
      output: paginatedFreeClaimsOutputSchema,
    },
    createFreeClaim: {
      type: 'mutation',
      input: createFreeClaimInputSchema,
      output: mutationResultSchema,
    },
    updateFreeClaim: {
      type: 'mutation',
      input: updateFreeClaimInputSchema,
      output: mutationResultSchema,
    },
    deleteFreeClaim: {
      type: 'mutation',
      input: deleteFreeClaimInputSchema,
      output: mutationResultSchema,
    },
  },
);

export type AdminFreeClaimsContract = typeof adminFreeClaimsContract;
