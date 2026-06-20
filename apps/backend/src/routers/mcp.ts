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

// @hono/mcp transport — handles session management, SSE, and reconnects
const transport = new StreamableHTTPTransport();

// ---------------------------------------------------------------------------
// Auth helper — resolves user from request headers
// ---------------------------------------------------------------------------

async function resolveAuth(
  c: Context,
): Promise<{ user: UserSelect | null; authResult: AuthMethodResult }> {
  const honoVars = c.var as unknown as McpHonoVars;
  const clientIp = honoVars.connInfo?.remote?.address || null;
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

  // Connect the server to the transport once, lazily on first request.
  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }

  // Run within the context store so tool handlers can reach auth / db / user
  // via AsyncLocalStorage.
  return mcpContextStore.run(trpcContext, () => transport.handleRequest(c));
});
