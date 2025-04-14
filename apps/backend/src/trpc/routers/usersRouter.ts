import { db, userUpdateSchema, usersTable } from '@namefi-astra/db';
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
    const [error, privyUser] = await resolve(
      privyClient.getUserById(ctx.user.privyUserId),
    );

    if (error || isNil(privyUser)) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'could not find user details',
      });
    }

    // TODO(Sami -> Sid): We need to get the full list of linked wallets from privy
    const userWalletsAddresses = [privyUser.wallet?.address].filter(
      (address): address is string => !isNil(address),
    );
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
