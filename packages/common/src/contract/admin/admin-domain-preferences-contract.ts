import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin domain-preferences sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/domainPreferencesRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminDomainPreferencesContract>`.
 * Procedures use `adminProcedureWithPermissions` /
 * `auditedAdminProcedureWithPermissions` — decisions stay at the router.
 */

const listInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

const updateInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  domainPreferencesAndConfig: z.object({
    forwardTo: z.string().optional(),
    autoEnsEnabled: z.boolean().optional(),
    autoParkEnabled: z.boolean().optional(),
    autoRenewEnabled: z.boolean().optional(),
  }),
});

/**
 * Paginated domain-preferences rows with dynamic filter/sort support.
 * Row shape has several nullable text columns; typed as `z.any()` so
 * drizzle's join-flattened rows assign freely.
 */
const listOutputSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

export const adminDomainPreferencesContract = {
  listDomainPreferences: {
    type: 'query',
    input: listInputSchema,
    output: listOutputSchema,
  },
  updateDomainPreferences: {
    type: 'mutation',
    input: updateInputSchema,
    output: z.object({ success: z.boolean() }),
  },
} as const satisfies RouterContract;

export type AdminDomainPreferencesContract =
  typeof adminDomainPreferencesContract;
