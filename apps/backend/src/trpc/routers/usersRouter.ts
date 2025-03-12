import { db, userInsertSchema, usersTable } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { publicProcedure, router } from '../context';

export const usersRouter = router({
  getUserEmail: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db
        .select({
          primaryEmail: usersTable.primaryEmail,
        })
        .from(usersTable)
        .where(eq(usersTable.id, input.id));

      if (!user || user.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return user[0];
    }),

  createUser: publicProcedure
    .input(userInsertSchema)
    .mutation(async ({ input }) => {
      const user = await db.insert(usersTable).values(input).returning();
      return user[0];
    }),
});
