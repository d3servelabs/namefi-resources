import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import {
  auditedAdminProcedure,
  createTRPCRouter,
  adminProcedure,
  withRequiredPermissions,
} from '../../base';
import { db, usersTable, userPermissionsTable } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { Permission, getVisiblePermissions } from '@namefi-astra/utils';
import pMap from 'p-map';
import { privyClient } from '../../utils';
import { isNotNil } from 'ramda';

const permissionEnum = z.nativeEnum(Permission);

export const permissionsRouter = createTRPCRouter({
  // List users who have any permissions
  listUsersWithPermissions: withRequiredPermissions(
    adminProcedure,
    Permission.READ_PERMISSIONS,
  ).query(async () => {
    const rows = await db
      .select({
        userId: userPermissionsTable.userId,
        privyUserId: usersTable.privyUserId,
      })
      .from(userPermissionsTable)
      .leftJoin(usersTable, eq(usersTable.id, userPermissionsTable.userId))
      .groupBy(userPermissionsTable.userId, usersTable.privyUserId);
    return pMap(rows, async (r) => {
      const privyUser = r.privyUserId
        ? await privyClient.getUserById(r.privyUserId)
        : null;

      return {
        userId: r.userId,
        primaryEmail: privyUser?.email?.address ?? null,
        privyUserId: r.privyUserId ?? null,
        primaryWalletAddress: privyUser?.wallet?.address ?? null,
        walletAddresses: privyUser?.linkedAccounts
          .map((linkedAccount) =>
            linkedAccount.type === 'wallet' &&
            linkedAccount.chainType === 'ethereum'
              ? linkedAccount.address
              : null,
          )
          .filter(isNotNil),
      };
    });
  }),

  // List all permissions enum values (TS-defined)
  listAvailablePermissions: withRequiredPermissions(
    adminProcedure,
    Permission.READ_PERMISSIONS,
  ).query(() => {
    // Only return visible permissions for UI
    return getVisiblePermissions();
  }),

  // Get a user's permissions
  getUserPermissions: withRequiredPermissions(
    adminProcedure,
    Permission.READ_PERMISSIONS,
  )
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const rows = await db
        .select({ permission: userPermissionsTable.permission })
        .from(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, input.userId));
      return rows.map((r) => r.permission as Permission);
    }),

  // Grant a set of permissions to a user (idempotent)
  grantPermissions: withRequiredPermissions(
    auditedAdminProcedure(({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: input.userId,
      action: 'grant_permissions',
      extraInput: input,
    })),
    Permission.WRITE_PERMISSIONS,
  )
    .input(
      z.object({
        userId: z.string().uuid(),
        permissions: z.array(permissionEnum).nonempty(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, permissions } = input;

      // Enforce: Only SUPER_ADMIN can grant SUPER_ADMIN
      if (
        permissions.includes(Permission.SUPER_ADMIN) &&
        !(ctx.userPermissions ?? []).includes(Permission.SUPER_ADMIN)
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only SUPER_ADMIN can grant SUPER_ADMIN',
        });
      }

      // Ensure user exists
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Always ensure hidden baseline permission exists to keep at least one row for the user
      await db
        .insert(userPermissionsTable)
        .values({ userId, permission: Permission.VIEW_ADMIN_DASHBOARD })
        .onConflictDoNothing();

      // Insert missing permissions (ignore conflicts)
      await db
        .insert(userPermissionsTable)
        .values(permissions.map((p) => ({ userId, permission: p })))
        .onConflictDoNothing();

      const rows = await db
        .select({ permission: userPermissionsTable.permission })
        .from(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, userId));
      return rows.map((r) => r.permission as Permission);
    }),

  // Revoke a set of permissions from a user
  revokePermissions: withRequiredPermissions(
    auditedAdminProcedure(({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: input.userId,
      action: 'revoke_permissions',
      extraInput: input,
    })),
    Permission.WRITE_PERMISSIONS,
  )
    .input(
      z.object({
        userId: z.string().uuid(),
        permissions: z.array(permissionEnum).nonempty(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, permissions } = input;

      await db
        .delete(userPermissionsTable)
        .where(
          and(
            eq(userPermissionsTable.userId, userId),
            inArray(userPermissionsTable.permission, permissions),
          ),
        );

      // After revoke, ensure baseline permission still exists to keep user discoverable
      await db
        .insert(userPermissionsTable)
        .values({ userId, permission: Permission.VIEW_ADMIN_DASHBOARD })
        .onConflictDoNothing();

      const rows = await db
        .select({ permission: userPermissionsTable.permission })
        .from(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, userId));
      return rows.map((r) => r.permission as Permission);
    }),
  // Delete all permissions for a user (including hidden)
  deleteUserPermissions: withRequiredPermissions(
    auditedAdminProcedure(({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: input.userId,
      action: 'delete_user_permissions',
      extraInput: input,
    })),
    Permission.WRITE_PERMISSIONS,
  )
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { userId } = input;
      await db
        .delete(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, userId));
      return { success: true };
    }),
});
