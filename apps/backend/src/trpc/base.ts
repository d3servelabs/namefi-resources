import { type UserSelect, db } from '@namefi-astra/db';
import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Context } from 'hono';
import { isNil, isEmpty } from 'ramda';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { config, secrets } from '#lib/env';
import { logger } from '#lib/logger';
import {
  getPoweredByNamefi3PHostnames,
  getPoweredByNamefiDomainFromHostname,
} from '#lib/namefi-registry';
import { isUserAdmin, privyClient } from './utils';
import { verifyUserAuthAndGetUser, requireUserAuth } from '#lib/auth';

/**
 * Get the powered by namefi (pbn) domain from the origin.
 * If the origin is not a powered by namefi domain, throw an error.
 * If the origin is a powered by namefi domain, return the domain.
 * If the origin is not a powered by namefi domain, check if it's an allowed parent domain.
 * If it's not an allowed parent domain, throw an error.
 *
 * @param originText - The origin text to get the powered by namefi domain from.
 * @returns The powered by namefi domain.
 * @throws {TRPCError} If the origin is not a powered by namefi domain, or if it's not an allowed parent domain.
 */
export async function getPbnDomainFromOriginOrThrow(
  originText: string | undefined | null,
) {
  if (isNil(originText) || isEmpty(originText)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Origin is required',
    });
  }

  let origin: URL;
  try {
    // parse origin url
    origin = new URL(originText);
  } catch (error) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Error parsing origin',
      cause: error,
    });
  }

  //if it's our own domain, return null
  if (config.NAMEFI_FIRST_PARTY_HOSTNAMES?.includes(origin.hostname)) {
    return null;
  }
  // if it's not our own domain, check if it's an allowed parent domain
  const allowedThirdPartyHostnames = await getPoweredByNamefi3PHostnames();
  // if it's not an allowed parent domain, throw an error
  if (!allowedThirdPartyHostnames.includes(origin.hostname)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'parent domain not allowed',
    });
  }
  const thirdPartyDomainFromHostname =
    await getPoweredByNamefiDomainFromHostname(origin.hostname);
  if (!thirdPartyDomainFromHostname) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'parent domain not allowed',
    });
  }
  return thirdPartyDomainFromHostname;
}

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
): Promise<TrpcContext> => {
  const originText = c.req.header('Origin');

  let poweredByNamefiDomain: string | null = null;

  try {
    poweredByNamefiDomain = await getPbnDomainFromOriginOrThrow(originText);
  } catch (error) {
    logger.error(error, 'Error determining powered by namefi domain');
    if (!config.ALLOW_ALL_ORIGINS) {
      throw error;
    }
  }

  return {
    req: c.req,
    res: c.res,
    db,
    poweredByNamefiDomain,
    /**
     * A test user we can provide to return when verifyUserAuthAndCreation is called from tests
     */
    testUser: null as UserSelect | null,
  } satisfies TrpcContext;
};

export type TrpcContext = {
  req: Context['req'];
  res: Context['res'];
  db: typeof db;
  /**
   * The domain name of the selling SLD, it will be null in case it is a Namefi first party origin
   */
  poweredByNamefiDomain: string | null;
  testUser: UserSelect | null;
};

export type TrpcContextWithUser = TrpcContext & {
  user: UserSelect;
};
export type TrpcContextWithUserOrNull = TrpcContext & {
  user: UserSelect | null;
};

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
  sse: {
    maxDurationMs: 120_000, // 2 minutes
    ping: { enabled: true, intervalMs: 30_000 },
    client: { reconnectAfterInactivityMs: 30_000 },
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
  performance.mark('requestStart-trpc');

  const result = await next();
  performance.mark('requestEnd-trpc');

  const measure = performance.measure(
    'request-trpc',
    'requestStart-trpc',
    'requestEnd-trpc',
  );
  logger.trace(
    {
      context: 'TRPC',
      path,
      measure,
    },
    `[TRPC][TIMING] ${path} took ${Math.round(measure.duration)}ms to execute`,
  );

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
export const verifyUserAuthAndCreation = t.middleware<TrpcContextWithUser>(
  async ({ ctx, next }) => {
    try {
      const authHeader = ctx.req?.header?.('Authorization');
      const user = await requireUserAuth(authHeader, ctx.testUser);

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
  },
);

/**
 * Middleware for verifying a user's privy authentication token and creating a user if they don't exist.
 *
 * This middleware will verify the user's privy authentication token, fetch the user from the database, and add the user to the context.
 * If the user is not found, it will return a null user.
 */
export const maybeVerifyUserAuthAndCreation =
  t.middleware<TrpcContextWithUserOrNull>(async ({ ctx, next }) => {
    const authHeader = ctx.req?.header?.('Authorization');
    const { user } = await verifyUserAuthAndGetUser(authHeader, ctx.testUser);

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  });

/**
 * Authed or public  procedure
 * This is to be used for procedures that are not protected, but we might want different behavior based on whether the user is authenticated or not.
 *
 *  It will check if the user is authenticated,
 * if so it will verify the user's authentication token and add the user to the context.
 * If the user is not authenticated, it will add a null user to the context.
 */
export const authedOrPublicProcedure = publicProcedure.use(
  maybeVerifyUserAuthAndCreation,
);

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
 * Admin procedure
 *
 * This is the piece we will use to build new queries and mutations on our tRPC API. It will
 * guarantee that a user querying is authenticated, and that we can access user's data.
 */

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const isAdmin = await isUserAdmin(ctx.user.privyUserId);
  if (!isAdmin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'user is not an admin',
    });
  }
  return next({ ctx });
});

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
