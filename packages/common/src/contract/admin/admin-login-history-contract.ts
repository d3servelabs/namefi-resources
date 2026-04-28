import { z } from 'zod';

import { createContract } from '../create-contract';

/**
 * Contract for the admin login-history sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/adminLoginHistoryRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminLoginHistoryContract>`. Procedures use
 * `adminProcedureWithPermissions([Permission.READ_USERS])`.
 *
 * This admin surface is a read-only view onto `user_login_history`. Rows are
 * written by the login-notification pipeline
 * (`apps/backend/src/lib/login-notification/login-history.ts`).
 */

const sortingSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

const listInputSchema = z.object({
  page: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
  userId: z.string().uuid().optional(),
  /** ISO date string; include only rows with signedInAt >= this timestamp. */
  since: z.string().datetime().optional(),
  /** Filter by novelty flag. */
  novelty: z.enum(['any', 'newIp', 'newLocation', 'anyNew']).default('any'),
  sorting: z.array(sortingSchema).optional(),
});

const loginHistoryRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userEmail: z.string().nullable(),
  userPrivyUserId: z.string().nullable(),
  sessionId: z.string().nullable(),
  signedInAt: z.date(),
  lastAccessedAt: z.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  os: z.string().nullable(),
  browser: z.string().nullable(),
  device: z.string().nullable(),
  loginMethod: z.string().nullable(),
  geoCity: z.string().nullable(),
  geoSubdivision: z.string().nullable(),
  geoRegionCode: z.string().nullable(),
  geoLat: z.number().nullable(),
  geoLng: z.number().nullable(),
  isGoogleLB: z.boolean(),
  isNewIp: z.boolean(),
  isNewLocation: z.boolean(),
  isFirstSession: z.boolean(),
  notificationSent: z.boolean(),
});

const paginatedLoginHistoryOutputSchema = z.object({
  items: z.array(loginHistoryRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const adminLoginHistoryContract = createContract(
  { softOutput: true },
  {
    listLoginHistory: {
      type: 'query',
      input: listInputSchema,
      output: paginatedLoginHistoryOutputSchema,
    },
  },
);

export type AdminLoginHistoryContract = typeof adminLoginHistoryContract;
export type AdminLoginHistoryRow = z.infer<typeof loginHistoryRowSchema>;
