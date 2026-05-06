import { z } from 'zod';

import { createContract } from '../create-contract';

/**
 * Contract for the admin dnsviz sub-router.
 *
 * Backs the `/admin/dnsviz` page. `listAnalyses` is a paginated read of the
 * `dnsviz_analyses` table; `getAnalysisGraph` invokes the dnsviz CLI
 * (`runDnsvizGraphBuffered`) on the stored probe blob and returns the
 * rendered output as base64 so the frontend can build a Blob URL for the
 * modal preview + download dropdown.
 */

const dnsvizAnalysisStatusSchema = z.enum([
  'SECURE',
  'INSECURE',
  'BOGUS',
  'ERROR',
]);

const dnsvizGraphTypeSchema = z.enum(['png', 'svg', 'html']);

const dnsvizAnalysisSummarySchema = z
  .object({
    delegationStatus: z.string().nullable(),
    zoneStatus: z.string().nullable(),
    parentChainStatuses: z.record(z.string(), z.string()),
    topErrors: z.array(z.string()),
    topWarnings: z.array(z.string()),
    ignoredErrorsCount: z.number().optional(),
    ignoredWarningsCount: z.number().optional(),
  })
  .nullable();

/**
 * `filters` and `sorting` are typed as `z.any()` because they come from
 * `@samyx/drizzler-filters-sorters` (`FilterOptions`/`SortOptions`) — a
 * recursive shape we don't want to mirror here. The router calls
 * `buildWhereClause` / `buildSortClause` against the `tableStructure`
 * mapping defined in `adminDnsvizRouter.ts` to translate them into SQL.
 * Same convention as `admin-ns-and-dnssec-contract.ts`.
 */
const listInputSchema = z.object({
  page: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(100).default(25),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

const dnsvizAnalysisRowSchema = z.object({
  id: z.string().uuid(),
  normalizedDomainName: z.string(),
  registrarKey: z.string(),
  /** `YYYY-MM-DD` UTC, the unique-per-day key. */
  analysisDate: z.string(),
  analysisStartedAt: z.date(),
  durationMs: z.number().nullable(),
  status: dnsvizAnalysisStatusSchema,
  errorsCount: z.number(),
  warningsCount: z.number(),
  summary: dnsvizAnalysisSummarySchema,
  errorMessage: z.string().nullable(),
  workflowRunId: z.string().nullable(),
  expiresAt: z.date(),
  /** Derived in the router: a one-line human reasoning for the verdict. */
  reasoning: z.string(),
  /**
   * `indexed_domains.dnssec_status->>'supportsDnssec'` for the matching
   * domain, when present. `null` when the domain isn't in the index
   * (e.g. ad-hoc third-party domains run via the on-demand workflow).
   * Mapped after the SQL query for now; we'll move it into a postgres
   * view / generated column later.
   */
  supportsDnssec: z.boolean().nullable(),
  /**
   * Snapshot of `indexed_domains.nameservers` + `is_using_namefi_nameservers`
   * + the rest of `indexed_domains.dnssec_status` for the matching domain.
   * All fields are `null` when the domain isn't in the index. Same
   * post-query mapping as `supportsDnssec`.
   */
  nameservers: z.array(z.string()).nullable(),
  isUsingNamefiNameservers: z.boolean().nullable(),
  dnssecHasDelegationSigner: z.boolean().nullable(),
  dnssecIsUsingNamefiDelegationSigner: z.boolean().nullable(),
  dnssecZoneHasActiveDnssec: z.boolean().nullable(),
  /**
   * NFT owner snapshot, joined from `namefi_nft_owners_view` →
   * `privy_users` → `users`. All `null` when the domain has no NFT
   * minted (e.g. third-party domains run via the on-demand workflow,
   * or a domain that hasn't been tokenized yet).
   */
  userId: z.string().uuid().nullable(),
  ownerAddress: z.string().nullable(),
  chainId: z.number().int().nullable(),
});

const listOutputSchema = z.object({
  rows: z.array(dnsvizAnalysisRowSchema),
  total: z.number(),
  totalPages: z.number(),
});

const getAnalysisGraphInputSchema = z.object({
  id: z.string().uuid(),
  type: dnsvizGraphTypeSchema,
});

const getAnalysisGraphOutputSchema = z.object({
  contentType: z.string(),
  /** Suggested filename — `<domain>-<analysisDate>.<type>`. */
  fileName: z.string(),
  /** Rendered output, base64-encoded. */
  base64: z.string(),
});

const dnsvizMessageEntrySchema = z.object({
  zone: z.string(),
  path: z.string(),
  code: z.string().nullable(),
  description: z.string(),
  ignored: z.boolean(),
  severity: z.enum(['error', 'warning']),
});

const getAnalysisDetailsInputSchema = z.object({
  id: z.string().uuid(),
});

const getAnalysisDetailsOutputSchema = z.object({
  row: dnsvizAnalysisRowSchema,
  /**
   * Every error+warning extracted from the stored grokData with full path
   * and code. Unlike `summary.topErrors` (capped at 3) this is the full
   * list, useful for the per-row details modal.
   */
  messages: z.array(dnsvizMessageEntrySchema),
  /** Counts split by severity + whether the code is in the ignored set. */
  counts: z.object({
    totalErrors: z.number(),
    totalWarnings: z.number(),
    ignoredErrors: z.number(),
    ignoredWarnings: z.number(),
  }),
  /** Full grok JSON for raw inspection in the details modal. */
  grokData: z.unknown(),
});

const dnsvizJsonKindSchema = z.enum(['probe', 'grok']);

const getAnalysisJsonInputSchema = z.object({
  id: z.string().uuid(),
  /** Which jsonb column to return: `probe` (raw dnsviz probe output) or
   *  `grok` (the validation assessment). */
  kind: dnsvizJsonKindSchema,
});

const getAnalysisJsonOutputSchema = z.object({
  /** Suggested filename — `<domain>-<analysisDate>.<kind>.json`. */
  fileName: z.string(),
  /**
   * Pretty-printed JSON ready to drop into a Blob. Returning a string
   * (rather than a parsed object) lets the frontend skip the
   * stringify-on-download step and keeps tRPC's payload well-typed.
   */
  contentJson: z.string(),
});

/**
 * Same filter shape as `listAnalyses` minus pagination/sorting — used by
 * `getAnalysesCounts` so the count view tracks whatever the table view
 * is currently filtered to. Drizzler-shaped `filters` payload, same as
 * the list query.
 */
const analysesCountsInputSchema = z.object({
  filters: z.any().optional(),
});

const failureBreakdownSchema = z.object({
  /** `is_using_namefi_nameservers` is `true` for these failing rows. */
  usingNamefiNs: z.number(),
  /** `is_using_namefi_nameservers` is `false`. */
  customNs: z.number(),
  /** No matching `indexed_domains` row, so the flag is unknown. */
  unknownNs: z.number(),
  /** `dnssec_status->>'supportsDnssec'` is true. */
  supportsDnssec: z.number(),
  /** `dnssec_status->>'supportsDnssec'` is false. */
  noSupportsDnssec: z.number(),
  /** No `dnssec_status` jsonb (or no indexed row). */
  unknownSupportsDnssec: z.number(),
});

const analysesCountsOutputSchema = z.object({
  /** Total rows matching the filter, before any breakdown. */
  total: z.number(),
  /** Counts per status enum value. Always all four keys present. */
  byStatus: z.object({
    SECURE: z.number(),
    INSECURE: z.number(),
    BOGUS: z.number(),
    ERROR: z.number(),
  }),
  /**
   * For each "actionable failure" status (BOGUS + ERROR), how the
   * failing rows distribute across `is_using_namefi_nameservers` and
   * `dnssec_status->>'supportsDnssec'`. Useful for spotting whether a
   * spike of failures correlates with a specific NS provider or DNSSEC
   * support state.
   */
  failureBreakdown: z.object({
    BOGUS: failureBreakdownSchema,
    ERROR: failureBreakdownSchema,
  }),
});

const runOnDemandAnalysisInputSchema = z.object({
  /**
   * Normalized domain names to analyze. The on-demand workflow handles
   * normalization + dedupe internally; we just bound the size here so an
   * admin click can't accidentally fan out to thousands of probes.
   */
  domains: z.array(z.string().min(1)).min(1).max(100),
  /** Optional override for `analysis_date` (`YYYY-MM-DD`). */
  analysisDate: z.string().optional(),
});

const runOnDemandAnalysisOutputSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  domains: z.array(z.string()),
});

export const adminDnsvizContract = {
  listAnalyses: {
    type: 'query',
    input: listInputSchema,
    output: listOutputSchema,
  },
  getAnalysisGraph: {
    type: 'query',
    input: getAnalysisGraphInputSchema,
    output: getAnalysisGraphOutputSchema,
  },
  getAnalysisDetails: {
    type: 'query',
    input: getAnalysisDetailsInputSchema,
    output: getAnalysisDetailsOutputSchema,
  },
  getAnalysesCounts: {
    type: 'query',
    input: analysesCountsInputSchema,
    output: analysesCountsOutputSchema,
  },
  getAnalysisJson: {
    type: 'query',
    input: getAnalysisJsonInputSchema,
    output: getAnalysisJsonOutputSchema,
  },
  runOnDemandAnalysis: {
    type: 'mutation',
    input: runOnDemandAnalysisInputSchema,
    output: runOnDemandAnalysisOutputSchema,
  },
} as const;

export type AdminDnsvizContract = typeof adminDnsvizContract;
export type DnsvizAnalysisRow = z.infer<typeof dnsvizAnalysisRowSchema>;
export type DnsvizAnalysisStatus = z.infer<typeof dnsvizAnalysisStatusSchema>;
export type DnsvizGraphType = z.infer<typeof dnsvizGraphTypeSchema>;
export type DnsvizMessageEntry = z.infer<typeof dnsvizMessageEntrySchema>;
export type DnsvizJsonKind = z.infer<typeof dnsvizJsonKindSchema>;
export type DnsvizAnalysesCounts = z.infer<typeof analysesCountsOutputSchema>;
export type DnsvizFailureBreakdown = z.infer<typeof failureBreakdownSchema>;

// Mark the createContract import as used so the file shape matches its
// siblings under this folder, even though we don't apply softOutput here.
void createContract;
