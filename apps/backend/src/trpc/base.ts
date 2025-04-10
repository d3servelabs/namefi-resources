import { db, usersTable } from '@namefi-astra/db';
import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { isNotEmpty } from 'ramda';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { config, secrets } from '#lib/env';
import { getPoweredByNamefi3PDomains } from '#services/namefi-registry';
import { privyClient } from './utils';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, etc.
 *
 * This helper generates the "internals" for a tRPC context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createContext = async (
  _opts: FetchCreateContextFnOptions,
  c: Context,
) => {
  const originText = c.req.header('Origin');
  let thirdPartyOrigin: string | null = null;

  if (originText && isNotEmpty(originText)) {
    // parse origin url
    const origin = new URL(originText);

    // if it's not our own domain, check if it's an allowed parent domain
    if (!config.NAMEFI_FIRST_PARTY_ORIGINS?.includes(origin.hostname)) {
      const allowedParentDomains = await getPoweredByNamefi3PDomains();
      // if it's not an allowed parent domain, throw an error
      if (!allowedParentDomains.includes(origin.hostname)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'parent domain not allowed',
        });
      }
      thirdPartyOrigin = origin.hostname;
    }
  }

  return {
    req: c.req,
    res: c.res,
    db,
    /**
     * The domain of the selling SLD, it will be null in case it is a Namefi first party origin
     */
    thirdPartyOrigin,
  };
};

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that we get typesafety on the frontend if our procedure fails due to validation
 * errors on the backend.
 */
export const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURES
 *
 * These are the pieces we will use to build our tRPC API. We should import these a lot in the
 * "/src/trpc/routers" directory.
 */

/**
 * This is how we create new routers and sub-routers in our tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * It can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece we use to build new queries and mutations on our tRPC API. It does not
 * guarantee that a user querying is authorized, but we can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Middleware for verifying a user's privy authentication token and creating a user if they don't exist.
 *
 * This middleware will verify the user's privy authentication token, fetch the user from the database, and add the user to the context.
 */
export const verifyUserAuthAndCreation = t.middleware(async ({ ctx, next }) => {
  const authToken = ctx.req.header('Authorization')?.replace('Bearer ', '');

  if (!authToken) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const userClaims = await privyClient.verifyAuthToken(authToken);
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.privyUserId, userClaims.userId),
    });

    if (!user) {
      // TODO: handle this via webhook
      const newUser = await db
        .insert(usersTable)
        .values({
          privyUserId: userClaims.userId,
        })
        .returning();
      user = newUser[0];
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  } catch (error) {
    console.error('error', error);
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
});

/**
 * Protected procedure
 *
 * This is the piece we will use to build new queries and mutations on our tRPC API. It will
 * guarantee that a user querying is authenticated, and that we can access user's data.
 */
export const protectedProcedure = publicProcedure
  .use(timingMiddleware)
  .use(verifyUserAuthAndCreation);

/**
 * Middleware for verifying the payload of a privy webhook.
 *
 * This middleware will verify the payload of a privy webhook, and add the webhook body and verified status to the context.
 */
export const verifyPrivyWebhookPayload = t.middleware(async ({ ctx, next }) => {
  const webhookId = ctx.req.header('svix-id');
  const webhookTimestamp = ctx.req.header('svix-timestamp');
  const webhookSignature = ctx.req.header('svix-signature');

  if (!(webhookId && webhookTimestamp && webhookSignature)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Missing webhook headers',
    });
  }

  try {
    const body = await ctx.req.parseBody();
    const verifiedBody = await privyClient.verifyWebhook(
      body,
      {
        id: webhookId,
        timestamp: webhookTimestamp,
        signature: webhookSignature,
      },
      secrets.PRIVY_WEBHOOK_SECRET,
    );

    return next({
      ctx: {
        ...ctx,
        verifiedBody,
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid webhook signature',
      cause: error,
    });
  }
});

/**
 * Protected webhook procedure
 *
 * This is the piece we will use to build new webhook handlers on our tRPC API. It will
 * guarantee that a webhook querying is authenticated, and that we can access webhook's data.
 */
export const protectedWebhookProcedure = publicProcedure
  .use(timingMiddleware)
  .use(verifyPrivyWebhookPayload);
