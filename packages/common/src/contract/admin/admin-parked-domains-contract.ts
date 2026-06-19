import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from '../create-contract';

/**
 * Contract for the admin parked-domains sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/parkedDomainsRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminParkedDomainsContract>`.
 *
 * - `listParkedDomains` is a cheap DB-only enumeration of parked domains.
 * - `verifyParkedDomains` runs live DNS/SSL/HTTP probes on a small batch of
 *   domains (no persistence) — a mutation so it only fires on explicit action.
 *
 * The verification result schema mirrors `ParkedDomainVerification` in
 * `apps/backend/src/lib/domains/parking-verification.ts`; keep them in sync.
 */

const listInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

/**
 * Parked-domain rows (domain + ownership + parking config). Row columns come
 * from a drizzle join, so the array is typed as `z.any()` like the sibling
 * domain-preferences contract.
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

const checkStatusSchema = z.enum(['pass', 'warn', 'fail', 'skipped']);

const dnsCheckSchema = z.object({
  status: checkStatusSchema,
  detail: z.string(),
  expected: z.object({ a: z.string(), aaaa: z.string() }),
  observed: z.object({ a: z.array(z.string()), aaaa: z.array(z.string()) }),
  gateEnabled: z.boolean(),
  gateTxtPresent: z.boolean(),
  redirectTxt: z.string().nullable(),
});

const sslCheckSchema = z.object({
  status: checkStatusSchema,
  detail: z.string(),
  issuer: z.string().nullable(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  daysUntilExpiry: z.number().nullable(),
  hostnameCovered: z.boolean(),
  authorized: z.boolean(),
});

const servingCheckSchema = z.object({
  status: checkStatusSchema,
  detail: z.string(),
  httpStatus: z.number().nullable(),
});

const redirectHopSchema = z.object({
  status: z.number(),
  location: z.string(),
});

const redirectCheckSchema = z.object({
  status: checkStatusSchema,
  detail: z.string(),
  expectedTarget: z.string().nullable(),
  observedTarget: z.string().nullable(),
  redirectChain: z.array(redirectHopSchema),
});

export const parkedDomainVerificationSchema = z.object({
  domain: z.string(),
  punycode: z.string(),
  mode: z.enum(['park', 'forward']),
  forwardTo: z.string().nullable(),
  publiclyVerifiable: z.boolean(),
  dns: dnsCheckSchema,
  ssl: sslCheckSchema,
  serving: servingCheckSchema,
  redirect: redirectCheckSchema,
  overall: checkStatusSchema,
  checkedAt: z.string(),
});

const verifyInputSchema = z.object({
  /** Domains to verify in one call — a page, a selection, or a batch of "all". */
  domains: z.array(namefiNormalizedDomainSchema).min(1).max(50),
});

const verifyOutputSchema = z.object({
  results: z.array(parkedDomainVerificationSchema),
});

/** Bare list of parked domain names, for the "verify all" UI action. */
const listAllNamesInputSchema = z.object({
  limit: z.number().int().min(1).max(2000).default(500),
});

const listAllNamesOutputSchema = z.object({
  domains: z.array(z.string()),
  total: z.number(),
  /** True when more parked domains exist than the returned `domains` (capped). */
  truncated: z.boolean(),
});

export const adminParkedDomainsContract = createContract(
  { softOutput: true },
  {
    listParkedDomains: {
      type: 'query',
      input: listInputSchema,
      output: listOutputSchema,
    },
    listAllParkedDomainNames: {
      type: 'query',
      input: listAllNamesInputSchema,
      output: listAllNamesOutputSchema,
    },
    verifyParkedDomains: {
      type: 'mutation',
      input: verifyInputSchema,
      output: verifyOutputSchema,
    },
  },
);

export type AdminParkedDomainsContract = typeof adminParkedDomainsContract;
