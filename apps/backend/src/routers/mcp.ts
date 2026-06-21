/**
 * MCP (Model Context Protocol) Hono sub-router.
 *
 * Serves the MCP StreamableHTTP transport alongside the existing oRPC/OpenAPI
 * routes. Uses {@link StreamableHTTPTransport} from `@hono/mcp` which handles
 * session management, SSE streaming, and Hono context natively.
 *
 * Auth is resolved from request headers using the same middleware as the
 * OpenAPI handler and passed into MCP tool handlers via AsyncLocalStorage.
 */
import { Hono, type Context } from 'hono';
import type { ConnInfo } from 'hono/conninfo';
import { StreamableHTTPTransport } from '@hono/mcp';
import { createMcpServerFromOrpc, mcpContextStore } from '#lib/mcp/orpc-to-mcp';
import { orpcRouter } from './openapi';
import { NAMEFI_EIP712_DOMAIN } from '#lib/auth/methods/eip712/api-key-eip712';
import {
  createAuthContext,
  authenticateRequest,
  type AuthMethodResult,
} from '#lib/auth/auth-registry';
import { defaultEip712SchemaConverter } from '#lib/eip712/orpc-eip712-schema-converter';
import { initializeAuthRegistry } from '#lib/auth/api-key-auth';
import { createRedisRateLimiter } from '#lib/rate-limit';
import { type UserSelect, db } from '@namefi-astra/db';
import type { RequestInfo } from '#lib/request-info';
import type { TrpcContextWithUserOrNull } from '#trpc/index';

// The shape Hono populates on `c.var` via the app's request middleware. Kept
// local so the MCP sub-router doesn't depend on index.ts's HonoVariables.
type McpHonoVars = {
  requestId: string;
  connInfo: ConnInfo;
  requestInfo: RequestInfo;
};

// ---------------------------------------------------------------------------
// MCP server (created once at startup from the oRPC router tree)
// ---------------------------------------------------------------------------

const mcpServer = await createMcpServerFromOrpc(orpcRouter, {
  name: 'namefi-api',
  version: 'next',
  eip712Domain: NAMEFI_EIP712_DOMAIN,
});

// @hono/mcp transport — handles session management, SSE, and reconnects.
// Connect once at startup so concurrent first requests can't race on a lazy
// `connect()` (which could throw or leave the transport half-initialized).
const transport = new StreamableHTTPTransport();
await mcpServer.connect(transport);

// ---------------------------------------------------------------------------
// Auth helper — resolves user from request headers
// ---------------------------------------------------------------------------

async function resolveAuth(
  c: Context,
): Promise<{ user: UserSelect | null; authResult: AuthMethodResult }> {
  const honoVars = c.var as unknown as McpHonoVars;
  // Prefer the proxy-aware IP (set by the app-level request-info middleware) so
  // API keys with IP allowlists resolve the same address as on the REST path;
  // fall back to the raw socket address.
  const clientIp =
    honoVars.requestInfo?.ipAddress ||
    honoVars.connInfo?.remote?.address ||
    null;
  const rawBody = await c.req.raw.clone().text();

  const authCtx = createAuthContext(
    c.req.header(),
    rawBody,
    c.req.path,
    c.req.method,
    clientIp,
  );
  authCtx.eip712Types = defaultEip712SchemaConverter.getTypes();

  const authResult = await authenticateRequest(authCtx);
  const user = authResult.success ? (authResult.user ?? null) : null;

  return { user, authResult };
}

function buildTrpcContext(
  c: Context,
  user: UserSelect | null,
  authResult: AuthMethodResult,
): TrpcContextWithUserOrNull {
  return {
    apiAuthResult: authResult,
    req: c.req as TrpcContextWithUserOrNull['req'],
    res: c.res as TrpcContextWithUserOrNull['res'],
    honoCtx: c as TrpcContextWithUserOrNull['honoCtx'],
    db,
    userPermissions: [],
    poweredByNamefiDomain: null,
    testUser: null,
    sessionId: null,
    honoVars: c.var as unknown as McpHonoVars,
    user,
  };
}

// ---------------------------------------------------------------------------
// Hono router
// ---------------------------------------------------------------------------

export const mcpRouter = new Hono();
initializeAuthRegistry();

// Per-IP rate limit, mirroring the v-next OpenAPI surface. MCP tool calls
// dispatch into the same oRPC procedures, so without this the `/mcp` route
// would let clients reach the full API uncapped. Uses the shared Redis store
// (proxy-aware IP via the app-level request-info middleware).
mcpRouter.use(
  '/*',
  createRedisRateLimiter({
    points: 60,
    duration: 60,
    keyPrefix: 'rl:mcp:ip',
  }),
);

/**
 * All MCP communication (POST for JSON-RPC, GET for SSE, DELETE for session
 * teardown) goes through a single `app.all` handler. The @hono/mcp transport
 * routes internally based on HTTP method.
 */
mcpRouter.all('/', async (c) => {
  // Resolve the base request context (db, hono vars, conn info, and a
  // best-effort transport-level auth). Per-tool auth is re-resolved from each
  // tool call's own `headers` argument inside the oRPC-to-MCP adapter.
  const { user, authResult } = await resolveAuth(c);
  const trpcContext = buildTrpcContext(c, user, authResult);

  // Run within the context store so tool handlers can reach auth / db / user
  // via AsyncLocalStorage.
  return mcpContextStore.run(trpcContext, () => transport.handleRequest(c));
});
