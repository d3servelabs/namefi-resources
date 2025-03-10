import { userInsertSchema } from '@namefi-astra/db';
import { z } from 'zod';
import { createUser, getUserEmail } from '#services/users';
import { publicProcedure, router } from '../context';

export const usersRouter = router({
  getUserEmail: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getUserEmail(input.id)),

  createUser: publicProcedure
    .input(userInsertSchema)
    .mutation(({ input }) => createUser(input)),
});
