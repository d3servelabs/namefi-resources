import {
  type UserSelect,
  db,
  poweredbyNamefiDomainsTable,
  usersTable,
} from '@namefi-astra/db';
import { getSkipAuthTestUser } from './skip-auth';
import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Context as HonoContext } from 'hono';
import type { ConnInfo } from 'hono/conninfo';
import { isNil, isEmpty } from 'ramda';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { config, secrets } from '#lib/env';
import { logger } from '#lib/logger';
import {
  createUserContext,
  extendCurrentExecutionContext,
} from '#lib/execution-context/context';
import {
  getPoweredByNamefi3PHostnames,
  getPoweredByNamefiDomainFromHostname,
} from '#lib/namefi-registry';
import { isHostnameAllowed } from '#lib/hostname-validation';
import { canUserAccessAdminPanel, privyClient } from './utils';
import { userPermissionsTable, db as appDb } from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { eq, sql } from 'drizzle-orm';
import { requireUserAuth } from '#lib/auth';
import { sendHttpAlert } from '../temporal/activities/default';
import { triggerLoginNotification } from '#lib/login-notification';
import type { RequestInfo } from '#lib/request-info';
import { validateApiKey } from '#lib/validate-api-key';
import {
  audit,
  createAuditRecord,
  type CreateAuditRecordParams,
  type AuditActorExtraInfo,
} from '#lib/auditor';
import { getCookie } from 'hono/cookie';
import { getAddress } from 'viem';
import {
  verifySignedPayload,
  NAMEFI_EIP712_DOMAIN,
} from '#lib/auth/ecdsa-payload-signature';
import { getPrivyUserLinkedEthereumChecksumWalletAddresses } from './utils';
import type { ORPCMeta } from '@orpc/trpc';
import type { AuthMethodResult } from '#lib/auth/auth-registry';
import type { MiddlewareBuilder } from '@trpc/server/unstable-core-do-not-import';
import { differenceInMinutes } from 'date-fns';
import {
  C15T_CONSENT_COOKIE_NAME,
  C15T_MEASUREMENT_CONSENT_HEADER,
  GA_CLIENT_ID_HEADER,
  GA_SESSION_ID_HEADER,
  getC15tMeasurementConsentState,
  mergeC15tMeasurementConsentStates,
  normalizeGaClientId,
  normalizeGaSessionId,
  parseC15tMeasurementConsentHeader,
  type C15tMeasurementConsentState,
} from '@namefi-astra/common/google-analytics';

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
  if (
    config.NAMEFI_FIRST_PARTY_HOSTNAMES &&
    isHostnameAllowed(origin.hostname, config.NAMEFI_FIRST_PARTY_HOSTNAMES)
  ) {
    return null;
  }
  // if it's not our own domain, check if it's an allowed parent domain
  const allowedThirdPartyHostnames = await getPoweredByNamefi3PHostnames();
  // if it's not an allowed parent domain, throw an error
  if (!isHostnameAllowed(origin.hostname, allowedThirdPartyHostnames)) {
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

function getGaClientIdFromHeader(headerValue: string | undefined | null) {
  return normalizeGaClientId(headerValue);
}

function getGaSessionIdFromHeader(headerValue: string | undefined | null) {
  const normalizedSessionId = normalizeGaSessionId(headerValue);
  if (!normalizedSessionId) return null;
  const sessionId = Number(normalizedSessionId);
  return Number.isSafeInteger(sessionId) && sessionId > 0 ? sessionId : null;
}

function getHostnameFromOrigin(originText: string | undefined | null) {
  if (!originText) return null;

  try {
    return new URL(originText).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
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
  if (!validateApiKey(apiKeyFromHeader, secrets.API_AUTH_KEY)) {
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
  const gaClientId = getGaClientIdFromHeader(c.req.header(GA_CLIENT_ID_HEADER));
  const gaSessionId = getGaSessionIdFromHeader(
    c.req.header(GA_SESSION_ID_HEADER),
  );
  const requestMeasurementConsentState = mergeC15tMeasurementConsentStates(
    getC15tMeasurementConsentState(
      await getCookie(c, C15T_CONSENT_COOKIE_NAME),
    ),
    parseC15tMeasurementConsentHeader(
      c.req.header(C15T_MEASUREMENT_CONSENT_HEADER),
    ),
  );
  const consentDomainName = getHostnameFromOrigin(originText);
  let measurementConsentAutoGrantedPromise: Promise<boolean> | null = null;
  const getMeasurementConsentAutoGranted = () => {
    measurementConsentAutoGrantedPromise ??= import('../routers/c15t').then(
      ({ isC15tMeasurementConsentAutoGranted }) =>
        isC15tMeasurementConsentAutoGranted(c.req.raw.headers),
    );
    return measurementConsentAutoGrantedPromise;
  };

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

  // Check for skip auth header in local/development environments
  // This allows frontend to bypass auth for local development testing
  const skipAuthHeader = c.req.header('X-Skip-Auth');
  const skipAuthTestUser = await getSkipAuthTestUser(
    skipAuthHeader,
    process.env.ENVIRONMENT,
  );
  if (skipAuthTestUser) {
    logger.debug(
      { skipAuthEmail: skipAuthTestUser.primaryEmail },
      'Skip auth header detected in dev environment',
    );
  }

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
     * Also used for skip auth mode in dev/preview environments
     */
    testUser: skipAuthTestUser,
    sessionId: null as string | null,
    gaClientId,
    gaSessionId,
    requestMeasurementConsentState,
    consentDomainName,
    getMeasurementConsentAutoGranted,
    honoVars: c.var as {
      requestId: string;
      connInfo: ConnInfo;
      requestInfo: RequestInfo;
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
  gaClientId?: string | null;
  gaSessionId?: number | null;
  requestMeasurementConsentState?: C15tMeasurementConsentState;
  consentDomainName?: string | null;
  getMeasurementConsentAutoGranted?: () => Promise<boolean>;
  honoVars?: {
    requestId: string;
    connInfo: ConnInfo;
    requestInfo: RequestInfo;
  };
  /**
   * Impersonation metadata for this request if applicable
   */
  impersonation?: {
    actorUserId: string;
    targetUserId: string;
  };
  user?: UserSelect | null;
  apiAuthResult?: AuthMethodResult;
};

export type TrpcContextWithUser = Omit<TrpcContext, 'user'> & {
  user: UserSelect;
};
export type TrpcContextWithUserOrNull = Omit<TrpcContext, 'user'> & {
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
/**
 * The meta shape attached to every tRPC procedure on this instance.
 * Exported so contract helpers (see `./contract.ts`) can plumb the actual
 * meta type into derived `QueryProcedure` / `MutationProcedure` types instead
 * of falling back to `object`.
 */
export type TrpcMeta = ORPCMeta & {
  eip712?: { input?: { acceptedPrimaryTypes?: string[] } };
};

export const t = initTRPC
  .context<TrpcContext>()
  .meta<TrpcMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error, ctx }) {
      // NOTE: HTTP 400/5XX alerting happens in `httpErrorAlertMiddleware`, not
      // here — the errorFormatter runs outside the request's async execution
      // context, so `getExecutionContext()` (user/session/request) is empty.
      const isZodError = error.cause instanceof ZodError;
      return {
        ...shape,
        code: isZodError ? 402 : shape.code,
        data: {
          ...shape.data,
          requestId: ctx?.honoVars?.requestId,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
    sse: {
      maxDurationMs: 5 * 60_000, // 5 minutes
      ping: { enabled: true, intervalMs: 3_000 },
      client: { reconnectAfterInactivityMs: 15_000 },
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

const impersonationMutationGuard = t.middleware<TrpcContextWithUser>(
  async ({ ctx, next, path, type }) => {
    if (
      type === 'mutation' &&
      ctx?.impersonation &&
      !ctx?.userPermissions?.includes(Permission.HIGH_RISK)
    ) {
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
    const cookieVal = await getCookie(
      ctx.honoCtx as HonoContext,
      'impersonate-user-id',
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
 * Attaches the tRPC route to the execution context and alerts on 400 / 5XX
 * responses surfaced to users.
 *
 * Implemented as a middleware (rather than in `errorFormatter`) so it runs
 * inside the request's async execution context — i.e. after the auth
 * middleware has populated the execution context via `setExecutionContext`.
 * Before running the procedure it merges `route` (source/path/procedureType)
 * onto the execution context so logs and alerts can see where a request is
 * being handled; `sendHttpAlert` then reads the route straight off the
 * resolved context. It inspects the `next()` result instead of throwing, and
 * never alters the response.
 *
 * Only 400 and 5XX are alerted; other codes (401/403/404 from expected user
 * actions) are ignored by `sendHttpAlert`.
 */
const httpErrorAlertMiddleware = t.middleware(
  async ({ next, path, type, ctx }) => {
    const result = await next();
    try {
      if (!result.ok) {
        const { error } = result;
        logger.trace({ error }, 'httpErrorAlertMiddleware');
        const isZodError =
          error instanceof ZodError || error.cause instanceof ZodError;
        const shouldNotAlert =
          isZodError ||
          (error as any).alert === false ||
          (error.cause as any)?.alert === false;

        const status = getHTTPStatusCodeFromError(error);
        if ((status === 400 || status >= 500) && !shouldNotAlert) {
          void sendHttpAlert(status, error, error.message, undefined, {
            trpcCode: error.code,
          });
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to send alert');
    }
    return result;
  },
);

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece we use to build new queries and mutations on our tRPC API. It does not
 * guarantee that a user querying is authorized, but we can still access user session data if they
 * are logged in.
 */
export const baseProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next, path, type }) => {
    logger.assign({
      procedureType: 'publicProcedure',
    });
    extendCurrentExecutionContext({
      type: 'user',
      route: {
        source: 'trpc',
        path,
        procedureType: type, //todo should be publicProcedure protectedProcedure, ...
        requestId: ctx.honoVars?.requestId,
      },
    });
    return next({ ctx });
  });

/**
 * Parameters for processing user auth context (permissions, impersonation, execution context).
 */
interface ProcessUserAuthContextParams {
  user: UserSelect | null;
  sessionId: string | null;
  ctx: TrpcContext;
  /** If true, throws FORBIDDEN when user lacks impersonation permission. If false, silently ignores. */
  throwOnImpersonationFailure: boolean;
}

/**
 * Result of processing user auth context.
 */
interface ProcessUserAuthContextResult {
  effectiveUser: UserSelect | null;
  sessionId: string | null;
  userPermissions: Permission[];
  impersonation?: { actorUserId: string; targetUserId: string };
}

/**
 * Shared helper for processing user auth context.
 * Handles permission loading, impersonation, and execution context setup.
 */
async function processUserAuthContext(
  params: ProcessUserAuthContextParams,
): Promise<ProcessUserAuthContextResult> {
  const { user, sessionId, ctx, throwOnImpersonationFailure } = params;

  logger.assign({
    userId: user?.id,
    privyUserId: user?.privyUserId,
    sessionId,
  });

  let userPermissions: Permission[] = ctx.userPermissions ?? [];
  let effectiveUser = user;
  let impersonation: { actorUserId: string; targetUserId: string } | undefined;

  if (user) {
    // Load user permissions and impersonation target in parallel
    const [permissionsRows, impersonateUserId] = await Promise.all([
      appDb
        .select({ permission: userPermissionsTable.permission })
        .from(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, user.id)),
      readImpersonationTargetUserId(ctx),
    ]);

    userPermissions = permissionsRows.map((r) => r.permission as Permission);

    // Handle impersonation if requested
    if (impersonateUserId && impersonateUserId !== user.id) {
      const hasImpersonatePermission = userPermissions.includes(
        Permission.IMPERSONATE_USERS,
      );

      if (!hasImpersonatePermission) {
        if (throwOnImpersonationFailure) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Missing permission to impersonate user',
          });
        }
        // Silently ignore impersonation attempt when throwOnImpersonationFailure is false
      } else {
        const targetUser = await appDb.query.usersTable.findFirst({
          where: eq(usersTable.id, impersonateUserId),
        });

        if (!targetUser) {
          if (throwOnImpersonationFailure) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Target user not found',
            });
          }
        } else {
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
      }
    }
  }

  // Set execution context using the effective user
  extendCurrentExecutionContext(
    createUserContext({
      userId: effectiveUser?.id,
      sessionId: sessionId ?? undefined,
      privyUserId: effectiveUser?.privyUserId,
      requestId: ctx.honoVars?.requestId,
    }),
  );

  return {
    effectiveUser,
    sessionId,
    userPermissions,
    impersonation,
  };
}

/**
 * Triggers login notification email for new sessions.
 * Extracted as a helper to avoid duplication between auth middlewares.
 */
function maybeNotifyLogin(params: {
  user: UserSelect;
  sessionId: string | null;
  tokenIssuedAt: Date | null;
  isNewUser: boolean;
  ctx: TrpcContext;
}): void {
  if (!config.ALLOW_LOGIN_NOTIFICATIONS) {
    return;
  }
  const { user, sessionId, tokenIssuedAt, isNewUser, ctx } = params;
  if (sessionId && tokenIssuedAt) {
    const minutesSinceLogin = differenceInMinutes(new Date(), tokenIssuedAt);
    if (minutesSinceLogin > 5) {
      return;
    }
    const requestInfo = ctx.honoVars?.requestInfo;
    const ipAddress =
      requestInfo?.ipAddress ??
      ctx.honoVars?.connInfo?.remote?.address ??
      'unknown';
    const userAgent = ctx.req?.header?.('User-Agent') ?? '';
    triggerLoginNotification({
      user,
      sessionId,
      ipAddress,
      userAgent,
      isNewUser,
      tokenIssuedAt,
      requestInfo: requestInfo ?? null,
    });
  }
}

/**
 * Shared result type for resolveUserFromRequest.
 */
interface ResolvedUser {
  user: UserSelect;
  sessionId: string | null;
  isNewUser: boolean;
  tokenIssuedAt: Date | null;
}

/**
 * Shared helper that extracts and verifies the user from the request context.
 *
 * When `required` is true, throws UNAUTHORIZED if no valid auth is present.
 * When `required` is false, returns null if no valid auth is present.
 */
async function resolveUserFromRequest(
  ctx: TrpcContext,
  options: { required: true },
): Promise<ResolvedUser>;
async function resolveUserFromRequest(
  ctx: TrpcContext,
  options: { required: false },
): Promise<ResolvedUser | null>;
async function resolveUserFromRequest(
  ctx: TrpcContext,
  options: { required: boolean },
): Promise<ResolvedUser | null> {
  // If user is already resolved on context, return it directly
  if (ctx.user) {
    return {
      user: ctx.user,
      sessionId: ctx.sessionId ?? null,
      isNewUser: false,
      tokenIssuedAt: null,
    };
  }

  // Check for skip auth test user first (set in createContext when X-Skip-Auth header is present)
  if (ctx.testUser) {
    return {
      user: ctx.testUser,
      sessionId: null,
      isNewUser: false,
      tokenIssuedAt: null,
    };
  }

  // Attempt Bearer token auth
  const authHeader = ctx.req?.header?.('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    if (options.required) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: ctx.apiAuthResult?.error ?? 'Invalid authorization header',
      });
    }
    return null;
  }

  const authResult = await requireUserAuth(authHeader, ctx.testUser);

  maybeNotifyLogin({
    user: authResult.user,
    sessionId: authResult.sessionId,
    tokenIssuedAt: authResult.tokenIssuedAt,
    isNewUser: authResult.isNewUser,
    ctx,
  });

  return {
    user: authResult.user,
    sessionId: authResult.sessionId,
    isNewUser: authResult.isNewUser,
    tokenIssuedAt: authResult.tokenIssuedAt,
  };
}

/**
 * Middleware for verifying a user's privy authentication token and creating a user if they don't exist.
 *
 * This middleware will verify the user's privy authentication token, fetch the user from the database, and add the user to the context.
 */
export const verifyUserAuthAndCreation = t.middleware<TrpcContextWithUser>(
  async ({ ctx, next }) => {
    try {
      const resolved = await resolveUserFromRequest(ctx, { required: true });

      const result = await processUserAuthContext({
        user: resolved.user,
        sessionId: resolved.sessionId ?? 'unknown',
        ctx,
        throwOnImpersonationFailure: true,
      });

      return next({
        ctx: {
          ...ctx,
          user: result.effectiveUser,
          sessionId: result.sessionId,
          userPermissions: result.userPermissions,
          impersonation: result.impersonation,
        },
      });
    } catch (error) {
      logger.trace({ error }, 'verifying user auth and creation');
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: ctx.apiAuthResult?.error,
        cause: {
          method: ctx.apiAuthResult?.methodId,
          error: ctx.apiAuthResult?.error,
        },
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
    const resolved = await resolveUserFromRequest(ctx, { required: false });

    if (!resolved) {
      return next({ ctx });
    }

    const result = await processUserAuthContext({
      user: resolved.user,
      sessionId: resolved.sessionId ?? 'unknown',
      ctx,
      throwOnImpersonationFailure: false,
    });

    return next({
      ctx: {
        ...ctx,
        user: result.effectiveUser,
        sessionId: result.sessionId,
        userPermissions: result.userPermissions,
        impersonation: result.impersonation,
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
export const authedOrPublicProcedure = baseProcedure
  .use(maybeVerifyUserAuthAndCreation)
  .use(impersonationMutationGuard)
  .use(httpErrorAlertMiddleware)
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
export const protectedProcedure = baseProcedure
  .use(verifyUserAuthAndCreation)
  .use(impersonationMutationGuard)
  .use(httpErrorAlertMiddleware)
  .use<TrpcContextWithUser>(async ({ ctx, next }) => {
    logger.assign({
      procedureType: 'protectedProcedure',
    });
    return next({ ctx });
  });

/**
 * Context type for requests with EIP-712 signed payload verification.
 */
export type TrpcContextWithSignedPayload = TrpcContextWithUser & {
  /** The wallet address that signed the payload */
  signerWalletAddress: string;
};

/**
 * Configuration for creating an EIP-712 signed payload procedure.
 */
export interface SignedPayloadProcedureConfig<
  Input,
  TTypes extends Record<string, Array<{ name: string; type: string }>>,
  TPrimaryType extends keyof TTypes & string,
> {
  /** EIP-712 type definitions for the payload */
  types: TTypes;
  /** The primary type name being signed */
  primaryType: TPrimaryType;
  /**
   * Function to extract the payload data from the procedure input.
   * The input will have { signature: string, payload: T } shape.
   */
  getPayloadFromInput: (input: Input) => Record<string, unknown>;
  /**
   * Function to extract the chainId from the procedure input payload.
   */
  getChainIdFromInput: (input: Input) => Promise<number | bigint>;
  /**
   * Function to extract the signature from the procedure input.
   */
  getSignatureFromInput: (input: Input) => string;
}

/**
 * Creates an EIP-712 signed payload verification middleware.
 *
 * This middleware:
 * 1. Requires the user to be authenticated via Privy (uses protectedProcedure)
 * 2. Verifies the EIP-712 signature on the input payload
 * 3. Confirms the signer's wallet is linked to the authenticated Privy user
 *
 * Use this for dangerous operations where you need cryptographic proof
 * that the authenticated user intentionally signed the specific payload.
 *
 * @example
 * const DELETE_ASSET_TYPES = {
 *   DeleteAsset: [
 *     { name: 'assetId', type: 'string' },
 *     { name: 'timestamp', type: 'uint256' },
 *   ],
 * };
 *
 * const deleteAssetProcedure = createSignedPayloadProcedure({
 *   types: DELETE_ASSET_TYPES,
 *   primaryType: 'DeleteAsset',
 *   getPayloadFromInput: (input) => (input as any).payload,
 *   getSignatureFromInput: (input) => (input as any).signature,
 *   getChainIdFromInput: (input) => (input as any).chainId,
 * });
 */
export function createSignedPayloadProcedure<
  Input,
  TTypes extends Record<string, Array<{ name: string; type: string }>>,
  TPrimaryType extends keyof TTypes & string,
>(config: SignedPayloadProcedureConfig<Input, TTypes, TPrimaryType>) {
  return protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
    const rawInput = (await getRawInput()) as Input;

    // Extract signature and payload from input
    const signature = config.getSignatureFromInput(rawInput);
    const payload = config.getPayloadFromInput(rawInput);
    const chainId = await config.getChainIdFromInput(rawInput);

    if (!signature) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing signature in request',
      });
    }

    // Verify the EIP-712 signature
    const verificationResult = await verifySignedPayload({
      signature,
      types: config.types,
      primaryType: config.primaryType,
      message: payload,
      domain: {
        ...NAMEFI_EIP712_DOMAIN,
        chainId,
      },
    });

    if (!verificationResult.valid || !verificationResult.recoveredAddress) {
      logger.warn(
        { error: verificationResult.error, userId: ctx.user.id },
        'EIP-712 signature verification failed',
      );
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: verificationResult.error || 'Invalid payload signature',
      });
    }

    const signerAddress = getAddress(verificationResult.recoveredAddress);

    // Get the user's linked wallets from Privy
    const privyUser = await privyClient.getUser(ctx.user.privyUserId);
    if (!privyUser) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Could not verify user wallet ownership',
      });
    }

    const userWallets = getPrivyUserLinkedEthereumChecksumWalletAddresses({
      privyUser,
    });

    // Verify the signer's wallet belongs to the authenticated user
    const signerOwnsWallet = userWallets.some(
      (wallet) => wallet.toLowerCase() === signerAddress.toLowerCase(),
    );

    if (!signerOwnsWallet) {
      logger.warn(
        {
          signerAddress,
          userWallets,
          userId: ctx.user.id,
        },
        'Payload signed by wallet not owned by authenticated user',
      );
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Signature wallet does not belong to authenticated user',
      });
    }

    logger.assign({
      signerWalletAddress: signerAddress,
      signedPayload: true,
    });

    return next({
      ctx: {
        ...ctx,
        signerWalletAddress: signerAddress,
      },
    });
  });
}

/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use<TrpcContextWithUser>(
  async ({ ctx, next }) => {
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
  },
);

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
  return t.middleware<TrpcContextWithUser>(async ({ ctx, next }) => {
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
    use: (
      mw: MiddlewareBuilder<
        TrpcContext,
        ORPCMeta,
        TrpcContextWithUser,
        unknown
      >,
    ) => any;
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
) =>
  adminProcedure.use<TrpcContextWithUser>(
    buildPermissionMiddleware(required, options),
  );

/**
 * Build AuditActorExtraInfo from request context and timing data.
 * Shared by auditedAdminProcedure and withAudit to avoid duplication.
 */
function buildAuditActorExtraInfo(
  ctx: TrpcContextWithUser,
  responseTimeInMs: number,
): AuditActorExtraInfo {
  return {
    ipAddress: ctx.honoVars?.connInfo.remote.address || '',
    ipAddressType: ctx.honoVars?.connInfo.remote.addressType || 'unknown',
    userAgent: ctx.req.header('user-agent') || '',
    referer: ctx.req.header('referer') || '',
    url: ctx.req.url || '',
    method: ctx.req.method || '',
    requestId: ctx.honoVars?.requestId || '',
    sessionId: ctx.sessionId || '',
    userId: ctx.user?.id || '',
    statusCode: ctx.res.status,
    responseTimeInMs,
    type: 'user',
  };
}

/**
 * Log impersonation context for audit trail when impersonation is active.
 * Shared by auditedAdminProcedure and withAudit.
 */
function logImpersonationContext(ctx: TrpcContextWithUser): void {
  if (ctx.impersonation) {
    logger.assign({
      auditActorUserId: ctx.impersonation.actorUserId,
      auditImpersonatedUserId: ctx.impersonation.targetUserId,
    });
  }
}

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
  protectedProcedure.use<TrpcContextWithUser>(
    async ({ ctx, next, meta, getRawInput }) => {
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
        const auditActorExtraInfo = buildAuditActorExtraInfo(
          ctx,
          performance.now() - start,
        );
        logImpersonationContext(ctx);
        audit(
          createAuditRecord(
            typeof params === 'function'
              ? params({ ctx, input, meta, auditActorExtraInfo })
              : params,
          ),
        );
      } catch (error) {
        logger.fatal(
          { error, userId: ctx.user.id },
          'Error auditing procedure',
        );
      }
      return result;
    },
  );

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
  auditedAdminProcedure(params).use<TrpcContextWithUser>(
    buildPermissionMiddleware(required, options),
  );

/**
 * Generic audit wrapper for any procedure (public/protected/authedOrPublic).
 * Use this for non-admin mutations so we capture consistent audit logs.
 */
export const withAudit = <
  Input = any,
  Output = any,
  TProc extends typeof protectedProcedure = typeof protectedProcedure,
>(
  procedure: TProc,
  params?:
    | CreateAuditRecordParams
    | ((args: {
        ctx: TrpcContextWithUser;
        input: Input;
        meta?: object;
        auditActorExtraInfo: AuditActorExtraInfo;
        path?: string;
        result?: Output;
      }) => CreateAuditRecordParams),
) =>
  procedure.use(
    t.middleware<TrpcContextWithUser>(
      async ({ ctx: _ctx, next, meta, getRawInput, path }) => {
        const ctx = _ctx as TrpcContextWithUser;
        const input = await getRawInput();
        const start = performance.now();
        const result = await next({ ctx });

        try {
          const auditActorExtraInfo = buildAuditActorExtraInfo(
            ctx,
            performance.now() - start,
          );
          logImpersonationContext(ctx);

          const record: CreateAuditRecordParams =
            typeof params === 'function'
              ? params({
                  ctx,
                  input: input as Input,
                  meta,
                  auditActorExtraInfo,
                  path,
                  result: result as Output,
                })
              : (params ?? {
                  actorType: 'user',
                  actorId: ctx.user?.id || 'anonymous',
                  actorExtraInfo: auditActorExtraInfo,
                  resourceType: 'other',
                  resourceId: '',
                  action: String(path || 'unknown_mutation'),
                  extraInput: input,
                });

          audit(createAuditRecord(record));
        } catch (error) {
          logger.fatal(
            { error, userId: (ctx as any)?.user?.id },
            'Error auditing procedure',
          );
        }
        return result;
      },
    ),
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
export const protectedWebhookProcedure = baseProcedure.use(
  verifyPrivyWebhookPayload,
);
