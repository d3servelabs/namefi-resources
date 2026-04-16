import { Permission } from '@namefi-astra/utils';
import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin permissions sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/permissionsRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminPermissionsContract>`. Middleware
 * varies per procedure (`withRequiredPermissions(adminProcedure, ...)` and
 * `withRequiredPermissions(auditedAdminProcedure(...), ...)`) — all
 * decisions stay at the router file.
 */

// ---------------------------------------------------------------------------
// Permission enum — `@namefi-astra/utils` is already a dep of common, so
// we reuse the TS string enum directly. `z.nativeEnum` validates at runtime
// and typed `Permission` at the type level.
// ---------------------------------------------------------------------------

const permissionSchema = z.nativeEnum(Permission);

const userIdInputSchema = z.object({ userId: z.string().uuid() });

const userIdAndPermissionsInputSchema = z.object({
  userId: z.string().uuid(),
  permissions: z.array(permissionSchema).nonempty(),
});

const listUsersWithPermissionsRowSchema = z.object({
  userId: z.string(),
  primaryEmail: z.string().nullable(),
  privyUserId: z.string().nullable(),
  primaryWalletAddress: z.string().nullable(),
  /**
   * Privy's `linkedAccounts` may be absent entirely when Privy hasn't
   * returned a linked user — the handler forwards `undefined` in that
   * case.
   */
  walletAddresses: z.array(z.string()).optional(),
});

export const adminPermissionsContract = {
  listUsersWithPermissions: {
    type: 'query',
    input: z.void(),
    output: z.array(listUsersWithPermissionsRowSchema),
  },
  listAvailablePermissions: {
    type: 'query',
    input: z.void(),
    output: z.array(permissionSchema),
  },
  getUserPermissions: {
    type: 'query',
    input: userIdInputSchema,
    output: z.array(permissionSchema),
  },
  grantPermissions: {
    type: 'mutation',
    input: userIdAndPermissionsInputSchema,
    output: z.array(permissionSchema),
  },
  revokePermissions: {
    type: 'mutation',
    input: userIdAndPermissionsInputSchema,
    output: z.array(permissionSchema),
  },
  deleteUserPermissions: {
    type: 'mutation',
    input: userIdInputSchema,
    output: z.object({ success: z.boolean() }),
  },
} as const satisfies RouterContract;

export type AdminPermissionsContract = typeof adminPermissionsContract;
