import { db, userUpdateSchema, usersTable } from '@namefi-astra/db';
import type { ChecksumWalletAddress } from '@namefi-astra/utils';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { isEmpty, isNil } from 'ramda';
import { z } from 'zod';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure } from '../base';
import { privyClient } from '../utils';

export const usersRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        data: userUpdateSchema.pick({ primaryEmail: true }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          ...input.data,
        })
        .where(eq(usersTable.id, ctx.user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return updatedUser;
    }),

  getCurrentUserDomains: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    const [error, privyUser] = await resolve(
      privyClient.getUserById(user.privyUserId),
    );

    if (error || isNil(privyUser)) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'could not find user details',
      });
    }

    // #region get all user wallets addresses
    const userWalletsAddressesSet = new Set<ChecksumWalletAddress>();

    const primaryWalletAddress = checksumWalletAddressSchema.safeParse(
      privyUser.wallet?.address,
    );
    if (primaryWalletAddress.success) {
      userWalletsAddressesSet.add(primaryWalletAddress.data);
    }

    for (const linkedAccount of privyUser.linkedAccounts) {
      if (linkedAccount.type === 'wallet') {
        const checksumWalletAddress = checksumWalletAddressSchema.safeParse(
          linkedAccount.address,
        );
        if (checksumWalletAddress.success) {
          userWalletsAddressesSet.add(checksumWalletAddress.data);
        }
      }
    }
    const userWalletsAddresses = Array.from(userWalletsAddressesSet);
    // #endregion get all user wallets addresses

    if (isEmpty(userWalletsAddresses)) {
      return [];
    }

    const nfts = await db.query.namefiNftTable.findMany({
      where: (table, { inArray }) =>
        inArray(table.ownerAddress, userWalletsAddresses),
    });

    return nfts;
  }),
});
