import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin BigQuery audit sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/bigQueryAuditRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminBigQueryAuditContract>`. Every
 * procedure uses `adminProcedure` — middleware decisions stay at the
 * router file.
 */

const listInputSchema = z.object({
  pageSize: z.number().min(1).max(1000).default(50),
  pageToken: z.string().optional(),
  orderBy: z
    .enum(['timestamp_desc', 'timestamp_asc'])
    .default('timestamp_desc'),
  filters: z
    .object({
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      actorType: z.string().optional(),
      actorId: z.string().optional(),
      action: z.string().optional(),
      timestampGte: z.number().optional(),
      timestampLte: z.number().optional(),
    })
    .optional(),
});

/**
 * Mirror of `ListAuditLogsResult` from
 * `apps/backend/src/lib/bigquery_audit_client.ts`. Declared as a real
 * `z.object(...)` (not `z.custom<T>`) because tRPC's caller-side type
 * helpers collapse top-level `z.custom<T>` outputs to `() => never` at
 * the `TRPCOptionsProxy.queryOptions(...)` boundary — a proper z.object
 * propagates cleanly.
 */
const listAuditLogsOutputSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())),
  totalRows: z.number(),
  nextPageToken: z.string().optional(),
});

export const adminBigQueryAuditContract = {
  list: {
    type: 'query',
    input: listInputSchema,
    output: listAuditLogsOutputSchema,
  },
} as const satisfies RouterContract;

export type AdminBigQueryAuditContract = typeof adminBigQueryAuditContract;
