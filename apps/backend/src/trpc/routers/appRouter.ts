import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../context';
import { messageRouter } from './messagesRouter';
import { usersRouter } from './usersRouter';

// root router to call
export const appRouter = router({
  // merge predefined routers
  message: messageRouter,
  users: usersRouter,
  // or individual procedures
  hello: publicProcedure.input(z.string().nullish()).query(({ input, ctx }) => {
    return `hello ${input ?? ctx.user?.name ?? 'world'}`;
  }),
  // or inline a router
  admin: router({
    secret: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      if (ctx.user?.name !== 'alex') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return {
        secret: 'sauce',
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
