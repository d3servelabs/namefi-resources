import {
  type UserSelect,
  db,
  poweredbyNamefiDomainsTable,
  usersTable,
} from '@namefi-astra/db';
import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Context as HonoContext } from 'hono';
import type { ConnInfo } from 'hono/conninfo';
import { isNil, isEmpty } from 'ramda';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { config, secrets } from '#lib/env';
import { logger } from '#lib/logger';
import {
  setExecutionContext,
  createUserContext,
} from '#lib/execution-context/context';
import {
  getPoweredByNamefi3PHostnames,
  getPoweredByNamefiDomainFromHostname,
} from '#lib/namefi-registry';
import { canUserAccessAdminPanel, privyClient } from './utils';
import { userPermissionsTable, db as appDb } from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { eq, sql } from 'drizzle-orm';
import { verifyUserAuthAndGetUser, requireUserAuth } from '#lib/auth';
import {
  audit,
  createAuditRecord,
  type CreateAuditRecordParams,
  type AuditActorExtraInfo,
} from '#lib/auditor';
import { timingSafeEqual } from 'crypto';
import { getSignedCookie } from 'hono/cookie';

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

type ValidateApiKeyAndGetDetailsResult =
  | { valid: false }
  | {
      valid: true;
      details: {
        forceMapToPbnDomain: string | null;
        permissions: Permission[];
      };
    };

/**
 * Validate the API key and get the details.
 *
 * The API key is validated against the API_AUTH_KEY environment variable.
 * If the API key is valid, the details are returned.
 * If the API key is invalid, the result is returned with valid set to false.
 *
 * The details are returned with the following properties:
 * - forceMapToPbnDomain: The powered by namefi domain to map to.
 * - permissions: The permissions granted to the API key.
 *
 * The permissions are currently hardcoded to [Permission.READ_ANALYTICS].
 *
 * The forceMapToPbnDomain is currently set to null.
 *
 *
 * @param apiKeyFromHeader - The API key from the header.
 * @returns The result of the validation.
 */
async function validateApiKeyAndGetDetails(
  apiKeyFromHeader: string | undefined | null,
): Promise<ValidateApiKeyAndGetDetailsResult> {
  if (
    !apiKeyFromHeader ||
    !timingSafeEqual(
      Buffer.from(apiKeyFromHeader),
      Buffer.from(secrets.API_AUTH_KEY),
    )
  ) {
    return {
      valid: false,
    };
  }

  return {
    valid: true,
    details: {
      forceMapToPbnDomain: null,
      permissions: [Permission.READ_ANALYTICS],
    },
  };
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
  c: HonoContext,
): Promise<TrpcContext> => {
  const originText = c.req.header('Origin');
  const apiKeyFromHeader = c.req.header('x-api-key') || null;

  let poweredByNamefiDomain: string | null = null;
  let result: ValidateApiKeyAndGetDetailsResult;
  let originBypassedByApiKey = false;
  let userPermissions: Permission[] = [];
  if (apiKeyFromHeader) {
    result = await validateApiKeyAndGetDetails(apiKeyFromHeader);

    if (!result.valid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid API key',
      });
    }
    originBypassedByApiKey = true;
    poweredByNamefiDomain = result.details.forceMapToPbnDomain;
    userPermissions = result.details.permissions;
  }

  if (!poweredByNamefiDomain) {
    try {
      poweredByNamefiDomain = await getPbnDomainFromOriginOrThrow(originText);
    } catch (error) {
      logger.trace(error, 'Error determining powered by namefi domain');
      if (!config.ALLOW_ALL_ORIGINS && !originBypassedByApiKey) {
        throw error;
      }
    }
  }

  // Assign tRPC-specific context to logger for request identification
  logger.assign({
    isTrpc: true,
    trpcProceduresInfo: _opts.info,
    poweredByNamefiDomain: poweredByNamefiDomain,
    originBypassedByApiKey,
  });

  return {
    req: c.req,
    res: c.res,
    honoCtx: c,
    db,
    /**
     * Cached list of the current user's permissions for this request lifecycle.
     * Populated in protected middleware when user is known.
     */
    userPermissions,
    poweredByNamefiDomain,
    /**
     * A test user we can provide to return when verifyUserAuthAndCreation is called from tests
     */
    testUser: null as UserSelect | null,
    sessionId: null as string | null,
    honoVars: c.var as {
      requestId: string;
      connInfo: ConnInfo;
    },
  } satisfies TrpcContext;
};

export type TrpcContext = {
  req: HonoContext['req'];
  res: HonoContext['res'];
  honoCtx?: HonoContext;
  db: typeof db;
  /**
   * The domain name of the selling SLD, it will be null in case it is a Namefi first party origin
   */
  poweredByNamefiDomain: string | null;
  /**
   * ABAC permissions granted to current user (fetched lazily in middleware)
   */
  userPermissions?: Permission[];
  testUser: UserSelect | null;
  sessionId?: string | null;
  honoVars?: {
    requestId: string;
    connInfo: ConnInfo;
  };
  /**
   * Impersonation metadata for this request if applicable
   */
  impersonation?: {
    actorUserId: string;
    targetUserId: string;
  };
};

export type TrpcContextWithUser = TrpcContext & {
  user: UserSelect;
};
export type TrpcContextWithUserOrNull = TrpcContext & {
  user: UserSelect | null;
};

// Server-side permission helpers
export function ctxHasPermission(ctx: TrpcContext, permission: Permission) {
  return ctx.userPermissions?.includes(permission) ?? false;
}

export function ctxRequirePermission(ctx: TrpcContext, permission: Permission) {
  if (!ctxHasPermission(ctx, permission)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Missing permission' });
  }
}

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
 * Global guard: Prevent non-whitelisted mutations during impersonation.
 */
const IMPERSONATION_ALLOWED_MUTATIONS = new Set<string>([
  'users.stopImpersonating',
  'carts.addItems',
]);

const impersonationMutationGuard = t.middleware(
  async ({ ctx, next, path, type }) => {
    if (type === 'mutation' && ctx?.impersonation) {
      if (!IMPERSONATION_ALLOWED_MUTATIONS.has(path)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Mutations are disabled while impersonating',
        });
      }
    }
    return next({ ctx });
  },
);

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
 * Helper to read impersonation target strictly from cookie.
 * Returns a normalized lowercase user id or null if not present.
 */
async function readImpersonationTargetUserId(
  ctx: TrpcContext,
): Promise<string | null> {
  try {
    const cookieVal = await getSignedCookie(
      ctx.honoCtx as HonoContext,
      'impersonate-user-id',
      secrets.COOKIE_SECRET,
    );
    const raw = cookieVal?.toString()?.trim();
    return raw ? raw.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * It can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startMark = `trpc:${path}:start:${uid}`;
  const endMark = `trpc:${path}:end:${uid}`;
  const measureName = `trpc:${path}:measure:${uid}`;
  performance.mark(startMark);

  const result = await next();
  performance.mark(endMark);

  const measure = performance.measure(measureName, startMark, endMark);

  logger.trace(
    {
      context: 'TRPC',
      path,
      measure,
    },
    `[TRPC][TIMING] ${path} took ${Math.round(measure.duration)}ms to execute`,
  );

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);
  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece we use to build new queries and mutations on our tRPC API. It does not
 * guarantee that a user querying is authorized, but we can still access user session data if they
 * are logged in.
 */
const $publicProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    logger.assign({
      procedureType: 'publicProcedure',
    });
    return next({ ctx });
  });

/**
 * Middleware for verifying a user's privy authentication token and creating a user if they don't exist.
 *
 * This middleware will verify the user's privy authentication token, fetch the user from the database, and add the user to the context.
 */
export const verifyUserAuthAndCreation = t.middleware<TrpcContextWithUser>(
  async ({ ctx, next }) => {
    try {
      const authHeader = ctx.req?.header?.('Authorization');
      const { user, sessionId } = await requireUserAuth(
        authHeader,
        ctx.testUser,
      );

      logger.assign({
        userId: user?.id,
        privyUserId: user?.privyUserId,
        sessionId,
      });

      // Load user permissions for this request
      const permissionsRows = await appDb
        .select({ permission: userPermissionsTable.permission })
        .from(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, user.id));
      const userPermissions = permissionsRows.map(
        (r) => r.permission as Permission,
      );

      // Apply impersonation if token is present and caller has permission
      const impersonateUserId = await readImpersonationTargetUserId(ctx);

      let effectiveUser = user;
      let impersonation:
        | { actorUserId: string; targetUserId: string }
        | undefined;
      if (impersonateUserId && impersonateUserId !== user.id) {
        if (!userPermissions.includes(Permission.IMPERSONATE_USERS) && user) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Missing permission to impersonate user',
          });
        }

        const targetUser = await appDb.query.usersTable.findFirst({
          where: eq(usersTable.id, impersonateUserId),
        });
        if (!targetUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Target user not found',
          });
        }
        // Do not allow impersonating other admins
        const targetIsAdmin = await canUserAccessAdminPanel(targetUser);
        if (targetIsAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot impersonate an admin user',
          });
        }
        effectiveUser = targetUser;
        impersonation = { actorUserId: user.id, targetUserId: targetUser.id };
        logger.assign({
          impersonating: true,
          actorUserId: user.id,
          targetUserId: targetUser.id,
        });
      }

      // Set execution context using the effective user (impersonated or original)
      setExecutionContext(
        createUserContext({
          userId: effectiveUser.id,
          sessionId: sessionId ?? undefined,
          privyUserId: effectiveUser.privyUserId,
          requestId: ctx.honoVars?.requestId,
        }),
      );

      return next({
        ctx: {
          ...ctx,
          user: effectiveUser,
          sessionId,
          userPermissions,
          impersonation,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error verifying user auth and creation');
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
    const { user, sessionId } = await verifyUserAuthAndGetUser(
      authHeader,
      ctx.testUser,
    );
    logger.assign({
      userId: user?.id,
      privyUserId: user?.privyUserId,
      sessionId,
    });
    // Set execution context for user requests

    setExecutionContext(
      createUserContext({
        userId: user?.id,
        sessionId: sessionId ?? undefined,
        privyUserId: user?.privyUserId,
        requestId: ctx.honoVars?.requestId,
      }),
    );
    // Load user permissions if user exists
    let userPermissions: Permission[] = ctx.userPermissions ?? [];
    let effectiveUser = user ?? null;
    let impersonation:
      | { actorUserId: string; targetUserId: string }
      | undefined;
    if (user) {
      const permissionsRows = await appDb
        .select({ permission: userPermissionsTable.permission })
        .from(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, user.id));
      userPermissions = permissionsRows.map((r) => r.permission as Permission);

      // Apply impersonation if token is present and caller has permission
      const impersonateUserId = await readImpersonationTargetUserId(ctx);
      if (
        impersonateUserId &&
        impersonateUserId !== user.id &&
        userPermissions.includes(Permission.IMPERSONATE_USERS)
      ) {
        const targetUser = await appDb.query.usersTable.findFirst({
          where: eq(usersTable.id, impersonateUserId),
        });
        if (targetUser) {
          // Do not allow impersonating other admins
          const targetIsAdmin = await canUserAccessAdminPanel(targetUser);
          if (targetIsAdmin) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Cannot impersonate an admin user',
            });
          }
          effectiveUser = targetUser;
          impersonation = { actorUserId: user.id, targetUserId: targetUser.id };
          logger.assign({
            impersonating: true,
            actorUserId: user.id,
            targetUserId: targetUser.id,
          });
          setExecutionContext(
            createUserContext({
              userId: targetUser.id,
              sessionId: sessionId ?? undefined,
              privyUserId: targetUser.privyUserId,
              requestId: ctx.honoVars?.requestId,
            }),
          );
        }
      }
    }

    return next({
      ctx: {
        ...ctx,
        user: effectiveUser,
        sessionId,
        userPermissions,
        impersonation,
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
export const authedOrPublicProcedure = $publicProcedure
  .use(maybeVerifyUserAuthAndCreation)
  .use(impersonationMutationGuard)
  .use(async ({ ctx, next }) => {
    logger.assign({
      procedureType: 'authedOrPublicProcedure',
    });
    return next({ ctx });
  });

/*
 * Public procedure
 *
 * this should be our base procedure, because even if it's a public procedure,
 * it will still construct the user context,
 * and we can still access user session data if they are logged in.
 */
export const publicProcedure = authedOrPublicProcedure;

/**
 * Protected procedure
 *
 * This is the piece we will use to build new queries and mutations on our tRPC API. It will
 * guarantee that a user querying is authenticated, and that we can access user's data.
 */
export const protectedProcedure = $publicProcedure
  .use(verifyUserAuthAndCreation)
  .use(impersonationMutationGuard)
  .use(async ({ ctx, next }) => {
    logger.assign({
      procedureType: 'protectedProcedure',
    });
    return next({ ctx });
  });

/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const isAdmin = await canUserAccessAdminPanel(ctx.user);
  logger.assign({
    procedureType: 'adminProcedure',
    isAdmin,
    audit: true,
  });
  if (!isAdmin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'user is not an admin',
    });
  }
  return next({ ctx });
});

/**
 * Permission middleware builder for admin routes
 * - Allows SUPER_ADMIN to bypass specific checks
 * - Supports 'every' (default) or 'some' mode for multiple permissions
 */
function buildPermissionMiddleware(
  required: Permission | Permission[],
  options?: { mode?: 'every' | 'some' },
) {
  const requiredList = Array.isArray(required) ? required : [required];
  const mode = options?.mode ?? 'every';
  return t.middleware(async ({ ctx, next }) => {
    const userPerms = new Set(ctx.userPermissions ?? []);
    // SUPER_ADMIN bypass
    if (userPerms.has(Permission.SUPER_ADMIN)) {
      return next({ ctx });
    }
    const hasAll = requiredList.every((p) => userPerms.has(p));
    const hasSome = requiredList.some((p) => userPerms.has(p));
    const allowed = mode === 'every' ? hasAll : hasSome;
    if (!allowed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Missing required permission',
      });
    }
    return next({ ctx });
  });
}

/**
 * Higher-order helper to attach required permissions to any procedure builder.
 * Example: withRequiredPermissions(adminProcedure, Permission.READ_ANALYTICS)
 */
export function withRequiredPermissions<
  TProc extends {
    use: (mw: ReturnType<typeof t.middleware>) => any;
  },
>(
  procedure: TProc,
  required: Permission | Permission[],
  options?: { mode?: 'every' | 'some' },
): ReturnType<TProc['use']> {
  return procedure.use(buildPermissionMiddleware(required, options));
}

/**
 * Admin procedure that also enforces specific permissions
 */
export const adminProcedureWithPermissions = (
  required: Permission | Permission[],
  options?: { mode?: 'every' | 'some' },
) => adminProcedure.use(buildPermissionMiddleware(required, options));

/**
 * Audited Admin procedure
 */
export const auditedAdminProcedure = (
  params:
    | CreateAuditRecordParams
    | (({
        ctx,
        input,
        meta,
        auditActorExtraInfo,
      }: {
        ctx: TrpcContextWithUser;
        input: any;
        meta?: object;
        auditActorExtraInfo: AuditActorExtraInfo;
      }) => CreateAuditRecordParams),
) =>
  protectedProcedure.use(async ({ ctx, next, meta, getRawInput }) => {
    const input = await getRawInput();
    const isAdmin = await canUserAccessAdminPanel(ctx.user);
    logger.assign({
      procedureType: 'adminProcedure',
      isAdmin,
      audit: true,
    });
    if (!isAdmin) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'user is not an admin',
      });
    }
    const start = performance.now();
    const result = await next({ ctx });

    try {
      const auditActorExtraInfo: AuditActorExtraInfo = {
        ipAddress: ctx.honoVars?.connInfo.remote.address || '',
        ipAddressType: ctx.honoVars?.connInfo.remote.addressType || 'unknown',
        userAgent: ctx.req.header('user-agent') || '',
        referer: ctx.req.header('referer') || '',
        url: ctx.req.url,
        method: ctx.req.method,
        requestId: ctx.honoVars?.requestId || '',
        sessionId: ctx.sessionId || '',
        userId: ctx.user.id || '',
        statusCode: ctx.res.status,
        responseTimeInMs: performance.now() - start,
        type: 'user',
      };
      // Attach impersonation context to logger for downstream processing/auditing (non-breaking)
      if (ctx.impersonation) {
        logger.assign({
          auditActorUserId: ctx.impersonation.actorUserId,
          auditImpersonatedUserId: ctx.impersonation.targetUserId,
        });
      }
      audit(
        createAuditRecord(
          typeof params === 'function'
            ? params({ ctx, input, meta, auditActorExtraInfo })
            : params,
        ),
      );
    } catch (error) {
      logger.fatal({ error, userId: ctx.user.id }, 'Error auditing procedure');
    }
    return result;
  });

/**
 * Audited admin procedure that also enforces specific permissions
 */
export const auditedAdminProcedureWithPermissions = (
  required: Permission | Permission[],
  params:
    | CreateAuditRecordParams
    | ((args: {
        ctx: TrpcContextWithUser;
        input: any;
        meta?: object;
        auditActorExtraInfo: AuditActorExtraInfo;
      }) => CreateAuditRecordParams),
  options?: { mode?: 'every' | 'some' },
) =>
  auditedAdminProcedure(params).use(
    buildPermissionMiddleware(required, options),
  );

/**
 * Owner procedure for Powered-by-Namefi domains
 * Ensures the authed user owns at least one powered by namefi domain
 */
export const poweredByNamefiOwnerProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const [{ count }] = await ctx.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(poweredbyNamefiDomainsTable)
      .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id));
    if (!count) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'user is not a Powered-by-Namefi owner',
      });
    }
    return next({ ctx });
  },
);

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
export const protectedWebhookProcedure = $publicProcedure.use(
  verifyPrivyWebhookPayload,
);
