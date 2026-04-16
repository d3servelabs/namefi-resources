import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin export-tracking sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/exportTrackingRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminExportTrackingContract>`. Procedures
 * use `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 */

const getExportTrackingRecordsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

const idInputSchema = z.object({ id: z.string().uuid() });

const sendExportTrackingEmailInputSchema = z.object({
  id: z.string().uuid(),
  forceResend: z.boolean().optional().default(false),
});

const exportTrackingListOutputSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

const exportTrackingActionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const sendEmailOutputSchema = z.object({
  success: z.boolean(),
  sent: z.boolean().optional(),
  message: z.string().optional(),
  emailType: z.string().optional(),
});

export const adminExportTrackingContract = {
  getExportTrackingRecords: {
    type: 'query',
    input: getExportTrackingRecordsInputSchema,
    output: exportTrackingListOutputSchema,
  },
  verifyExportTracking: {
    type: 'mutation',
    input: idInputSchema,
    output: exportTrackingActionOutputSchema,
  },
  resolveExportTracking: {
    type: 'mutation',
    input: idInputSchema,
    output: exportTrackingActionOutputSchema,
  },
  sendExportTrackingEmail: {
    type: 'mutation',
    input: sendExportTrackingEmailInputSchema,
    output: sendEmailOutputSchema,
  },
} as const satisfies RouterContract;

export type AdminExportTrackingContract = typeof adminExportTrackingContract;
