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
 * Per-row payload. DNSSEC fields are sourced from the cached
 * `indexed_domains.dnssec_status` jsonb (`IndexedDomainDnssecStatus`),
 * not a live registrar call — so they're nullable when the domain has
 * never been indexed, and `dnssecLastUpdatedAt` exposes freshness so
 * the UI can flag stale rows. Active-workflow info has been split out
 * into `getActiveWorkflowsForPage` to keep this list query fast and
 * cacheable.
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
  dnssecLastUpdatedAt: z.date().nullable(),
});

const listOutputSchema = z.object({
  data: z.array(nsAndDnssecRowSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

const temporalConfigSchema = z.object({
  apiUrl: z.string(),
  namespace: z.string(),
});

const activeWorkflowsInputSchema = z.object({
  /**
   * Domain names whose active workflows we want. Capped at the page
   * size cap (100) since the frontend only fires this for the visible
   * page.
   */
  domainNames: z.array(z.string()).max(100),
});

const activeWorkflowsOutputSchema = z.object({
  /** Same Temporal config the workflow-history admin view returns. */
  temporal: temporalConfigSchema,
  /**
   * Map of normalized domain name → at most one DNSSEC and one
   * nameservers workflow. Domains not present in the input are absent;
   * domains with no active workflow have both slots null.
   */
  workflows: z.record(
    z.string(),
    z.object({
      dnssec: activeWorkflowSchema.nullable(),
      ns: activeWorkflowSchema.nullable(),
    }),
  ),
});

/**
 * Mirror of `DnssecStatusDetails` from `apps/backend/src/lib/domains/dnssec.ts`.
 * Same shape as the user-facing `domainConfig.dnssec.getDomainDnssecDetails`
 * output; we duplicate the schema here (rather than importing) so this
 * sub-contract stays self-contained.
 */
const dnssecDetailsSuccessSchema = z.object({
  success: z.literal(true),
  dnssecStatus: z.string(),
  supportsDnssec: z.boolean(),
  hasDelegationSigner: z.boolean(),
  isUsingNamefiDelegationSigner: z.boolean().optional(),
  zoneHasActiveDnssec: z.boolean(),
  isUsingNamefiNameservers: z.boolean(),
  nameservers: z.array(z.string()),
  delegationSigners: z.array(z.any()).optional(),
  zoneSigningConfig: z.any().optional(),
});

/**
 * Failure-shaped response so the registrar/probe call failing doesn't
 * surface as a hard query error. The frontend can show "live lookup
 * failed, showing cached data" rather than retrying a 500 three times.
 */
const dnssecDetailsFailureSchema = z.object({
  success: z.literal(false),
  domainName: z.string(),
  error: z.string(),
});

const dnssecDetailsResponseSchema = z.discriminatedUnion('success', [
  dnssecDetailsSuccessSchema,
  dnssecDetailsFailureSchema,
]);

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
    /**
     * Live-fetch active Temporal workflows for the current page. Split
     * from the list query so the table renders immediately and the
     * Pending Workflow column streams in independently.
     */
    getActiveWorkflowsForPage: {
      type: 'query',
      input: activeWorkflowsInputSchema,
      output: activeWorkflowsOutputSchema,
    },
    /**
     * Live `getDnssecStatusDetails(domainName)`, used by the per-row
     * modals when the admin opens them — gives them up-to-date
     * delegation-signer detail without paying that cost on the list.
     */
    getDnssecDetails: {
      type: 'query',
      input: domainNameInputSchema,
      output: dnssecDetailsResponseSchema,
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
