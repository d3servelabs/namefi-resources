import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from '../create-contract';

/**
 * Contract for the admin NS & DNSSEC sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/nsAndDnssecRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminNsAndDnssecContract>`.
 *
 * Mirrors the shape of `admin-domain-preferences-contract.ts`. All
 * mutating procedures use `auditedAdminProcedureWithPermissions` —
 * decisions stay at the router.
 */

const listInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  filters: z.any().optional(),
  sorting: z.any().optional(),
  /**
   * Filter rows by whether the domain is a subdomain of any
   * PoweredByNamefi (PBN) parent (third-party domains we manage DNS for).
   * - `all` (default): no PBN constraint
   * - `pbnOnly`: only rows whose normalizedDomainName ends with `.<pbn-parent>`
   * - `excludePbn`: drop those rows
   * The PBN parent list is resolved server-side from
   * `getPoweredByNamefi3PDomains()` (Redis-cached 12h).
   */
  pbnFilter: z.enum(['all', 'pbnOnly', 'excludePbn']).default('all'),
});

/**
 * Active workflow row from `temporalClient.workflow.list` filtered to a
 * domain. Mirrors the shape returned by
 * `getActiveDnssecOperationWorkflows` /
 * `queryActiveNameserversChangeWorkflow` in the backend lib.
 */
const activeWorkflowSchema = z.object({
  operation: z.enum([
    'ENABLE_DNSSEC',
    'REMOVE_DNSSEC',
    'CHANGE_NAMESERVERS',
    'RESET_NAMESERVERS',
  ]),
  workflowId: z.string(),
  runId: z.string(),
  workflowType: z.string(),
  status: z.literal('RUNNING'),
});

/**
 * Per-row payload. Most DNSSEC fields are optional because the registrar
 * call may fail/time-out for an individual domain — the row falls back
 * to `dnssecError: true` in that case so the table can still render.
 */
const nsAndDnssecRowSchema = z.object({
  userId: z.string().nullable(),
  normalizedDomainName: z.string(),
  ownerAddress: z.string().nullable(),
  chainId: z.number(),
  nameservers: z.array(z.string()),
  isUsingNamefiNameservers: z.boolean(),
  dnssecZoneHasActiveDnssec: z.boolean().nullable(),
  dnssecHasDelegationSigner: z.boolean().nullable(),
  dnssecIsUsingNamefiDelegationSigner: z.boolean().nullable(),
  dnssecError: z.boolean(),
  activeDnssecWorkflow: activeWorkflowSchema.nullable(),
  activeNameserversWorkflow: activeWorkflowSchema.nullable(),
});

const listOutputSchema = z.object({
  data: z.array(nsAndDnssecRowSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
  /**
   * Temporal config exposed to the frontend so it can construct workflow
   * UI URLs. Mirrors the `temporal: { apiUrl, namespace }` field returned
   * by `apps/backend/src/trpc/routers/admin/nftRouter.ts:884`.
   */
  temporal: z.object({
    apiUrl: z.string(),
    namespace: z.string(),
  }),
});

const domainNameInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const changeNameserversInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  nameservers: z.array(z.string().min(1)).min(2).max(4),
});

const cancelDnssecWorkflowInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  operation: z.enum(['ENABLE_DNSSEC', 'REMOVE_DNSSEC']),
});

const cancelWorkflowOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
});

export const adminNsAndDnssecContract = createContract(
  { softOutput: true },
  {
    listDomainsNsAndDnssec: {
      type: 'query',
      input: listInputSchema,
      output: listOutputSchema,
    },
    enableDnssec: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: z.object({ success: z.boolean() }),
    },
    disableDnssec: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: z.object({ success: z.boolean() }),
    },
    changeNameservers: {
      type: 'mutation',
      input: changeNameserversInputSchema,
      output: z.object({ success: z.boolean() }),
    },
    resetNameservers: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: z.object({ success: z.boolean() }),
    },
    cancelDnssecWorkflow: {
      type: 'mutation',
      input: cancelDnssecWorkflowInputSchema,
      output: cancelWorkflowOutputSchema,
    },
    cancelNameserversWorkflow: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: cancelWorkflowOutputSchema,
    },
  },
);

export type AdminNsAndDnssecContract = typeof adminNsAndDnssecContract;
