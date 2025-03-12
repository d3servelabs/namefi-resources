import { initTRPC } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Context } from 'hono';
import superjson from 'superjson';
import { db } from '#lib/db/client';

export const createContext = (
  _opts: FetchCreateContextFnOptions,
  c: Context,
) => {
  // TODO: Implement auth
  const getUser = () => {
    return {
      name: 'alex',
      id: '1b939aa9-6c9b-4fec-9019-d7fd453443fd',
    };
  };

  return {
    req: c.req,
    res: c.res,
    user: getUser(),
    db,
  };
};

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
