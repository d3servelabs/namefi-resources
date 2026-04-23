import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin powered-by-namefi sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/poweredByNamefiRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminPoweredByNamefiContract>`. Procedures
 * use `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 */

const durationConstraintsSchema = z
  .object({
    minDurationInYears: z.number().min(1),
    maxDurationInYears: z.number().min(1),
  })
  .refine((data) => data.minDurationInYears <= data.maxDurationInYears, {
    message: 'Min duration must be less than or equal to max duration',
    path: ['durationConstraints'],
  });

const getPoweredByNamefiDomainsInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(['normalizedDomainName', 'createdAt', 'updatedAt'])
    .default('normalizedDomainName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  searchTerm: z.string().optional(),
});

const domainNameInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

const createPoweredByNamefiDomainInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(z.string()).default([]),
  additionalReservedNames: z.array(z.string()).default([]),
  durationConstraints: durationConstraintsSchema,
  costPerYearInUsdCents: z.number().min(0),
  metadata: z.record(z.string(), z.any()).optional(),
  ownerId: z.string().uuid().optional(),
});

const updatePoweredByNamefiDomainInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(z.string()).optional(),
  additionalReservedNames: z.array(z.string()).optional(),
  durationConstraints: durationConstraintsSchema.optional(),
  costPerYearInUsdCents: z.number().min(0).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  ownerId: z.string().uuid().optional(),
});

const toggleStatusInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  enabled: z.boolean(),
});

const updateCostAndDurationInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  costPerYearInUsdCents: z.number().min(0),
  durationConstraints: durationConstraintsSchema,
});

const pbnDomainRowSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(z.string()).nullable(),
  additionalReservedNames: z.array(z.string()).nullable(),
  durationConstraints: z.object({
    minDurationInYears: z.number(),
    maxDurationInYears: z.number(),
  }),
  costPerYearInUsdCents: z.number(),
  metadata: z.unknown(),
  ownerId: z.string().nullable(),
  enabled: z.boolean(),
  startRolloutAt: z.date().nullable(),
});

const paginatedDomainsOutputSchema = z.object({
  data: z.array(pbnDomainRowSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

/**
 * Per-section setup-status block. Shared by `apexDomain`,
 * `namefiIoSubdomain`, and `namefiDevSubdomain` in
 * `getPoweredByNamefiDomainStatus`.
 */
const dnsSetupRecordSchema = z
  .object({
    type: z.string(),
    name: z.string(),
    rdata: z.string(),
    zoneName: z.string(),
  })
  .passthrough();

const expectedDnsRecordSchema = z.object({
  type: z.enum(['A', 'CNAME']),
  name: z.string(),
  value: z.array(z.string()),
  rank: z.number(),
});

const setupStatusSectionSchema = z
  .object({
    domain: namefiNormalizedDomainSchema,
    message: z.string(),
    recordsAreSetup: z.boolean(),
    vercelIsSetup: z.boolean(),
    vercelIsVerified: z.boolean(),
    canSetup: z.boolean(),
    records: z.array(dnsSetupRecordSchema),
    expectedRecords: z.array(expectedDnsRecordSchema),
    dnsRecordIsAnycast: z.boolean(),
  })
  .passthrough();

/**
 * `getPoweredByNamefiDomainStatus` aggregates the domain row plus a
 * detailed setup status. Each setup status entry is a three-section
 * aggregate (apex / namefi.io / namefi.dev) plus a `summary` block and a
 * top-level `vercelApplicable` flag.
 *
 * `vercelApplicable` is `false` when the PBN parent is a single-label
 * name (e.g. `nfi`), since Vercel's Domains API rejects TLDs. Callers
 * use this to hide the "Setup Vercel & DNS" affordance rather than
 * letting the user click through to an inevitable error. The authority
 * for this computation is the backend (`isVercelProvisionable` in
 * `apps/backend/src/lib/vercel/applicability.ts`); the schema captures
 * it so the frontend can type-check the flag without casts.
 */
const setupStatusEntrySchema = z
  .object({
    apexDomain: setupStatusSectionSchema,
    namefiIoSubdomain: setupStatusSectionSchema,
    namefiDevSubdomain: setupStatusSectionSchema,
    summary: z.object({
      overallStatus: z.string(),
      notice: z.string().nullable(),
      recommendations: z.array(z.string()),
    }),
    vercelApplicable: z.boolean(),
  })
  .loose();

const domainStatusOutputSchema = z.object({
  domain: pbnDomainRowSchema,
  setupStatus: z.array(setupStatusEntrySchema).nullable(),
});

const mutationResultSchema = z
  .object({
    success: z.boolean(),
    domain: pbnDomainRowSchema.optional(),
    message: z.string().optional(),
  })
  .loose();

export const adminPoweredByNamefiContract = createContract(
  { softOutput: true },
  {
    getPoweredByNamefiDomains: {
      type: 'query',
      input: getPoweredByNamefiDomainsInputSchema,
      output: paginatedDomainsOutputSchema,
    },
    getPoweredByNamefiDomainStatus: {
      type: 'query',
      input: domainNameInputSchema,
      output: domainStatusOutputSchema,
    },
    createPoweredByNamefiDomain: {
      type: 'mutation',
      input: createPoweredByNamefiDomainInputSchema,
      output: mutationResultSchema,
    },
    updatePoweredByNamefiDomain: {
      type: 'mutation',
      input: updatePoweredByNamefiDomainInputSchema,
      output: mutationResultSchema,
    },
    deletePoweredByNamefiDomain: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: mutationResultSchema,
    },
    setupVercelAndDns: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: mutationResultSchema,
    },
    setupNamefiIoSubdomain: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: mutationResultSchema,
    },
    setupNamefiDevSubdomain: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: mutationResultSchema,
    },
    togglePoweredByNamefiDomainStatus: {
      type: 'mutation',
      input: toggleStatusInputSchema,
      output: mutationResultSchema,
    },
    startPoweredByNamefiDomainRollout: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: mutationResultSchema,
    },
    updatePoweredByNamefiDomainCostAndDuration: {
      type: 'mutation',
      input: updateCostAndDurationInputSchema,
      output: mutationResultSchema,
    },
  },
);

export type AdminPoweredByNamefiContract = typeof adminPoweredByNamefiContract;
