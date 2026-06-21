/**
 * oRPC-to-MCP adapter
 *
 * Walks an oRPC router tree, converts every procedure into an MCP tool,
 * and dispatches tool calls directly to the procedure (no HTTP round-trip).
 *
 * Per-request context (req/res/db/hono metadata) is passed via AsyncLocalStorage.
 * Tool-specific auth is resolved from the MCP tool arguments before the request
 * is forwarded into the oRPC procedure.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import {
  resolveContractProcedures,
  isProcedure,
  call,
  type AnyProcedure,
  type AnyRouter,
} from '@orpc/server';
import type { TypedDataDomain } from 'viem';
import {
  EIP712_SIGNATURE_HEADER_HEADERS,
  EIP712_SIGNATURE_HEADER_METHOD_ID,
} from '#lib/auth/methods/eip712/api-key-eip712';
import { SIWE_SIGNATURE_HEADER_HEADERS } from '#lib/auth/methods/siwe/api-key-siwe';
import { defaultEip712SchemaConverter } from '#lib/eip712/orpc-eip712-schema-converter';
import {
  authenticateRequest,
  createAuthContext,
} from '#lib/auth/auth-registry';
import type { TrpcContextWithUserOrNull } from '#trpc/index';
import { z } from 'zod';
import { resolve } from '@namefi-astra/utils';

export const mcpContextStore =
  new AsyncLocalStorage<TrpcContextWithUserOrNull>();

interface Eip712InputMeta {
  acceptedPrimaryTypes: string[];
  types: Record<string, { name: string; type: string }[]>;
}

interface ProcedureMeta {
  route?: {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: readonly string[];
    method?: string;
    path?: string;
  };
  eip712?: {
    input: Eip712InputMeta;
  };
}

interface McpToolCallBody {
  payload?: unknown;
  payloadType?: string;
  nonce?: string;
  timestamp?: number;
}

interface McpToolCallInput {
  headers?: Record<string, string>;
  body?: McpToolCallBody;
}

interface DiscoveredTool {
  path: string[];
  name: string;
  procedure: AnyProcedure;
  inputSchema: AnySchema;
  description: string;
  routePath: string;
  routeMethod: string;
  eip712?: Eip712InputMeta;
}

export interface OrpcToMcpOptions {
  name: string;
  version: string;
  eip712Domain?: TypedDataDomain;
}

const toolHeadersSchema = z
  .record(z.string(), z.string())
  .default({})
  .describe(
    'HTTP-style auth headers for this tool call. Put auth headers here, not on the MCP transport request. Examples: x-namefi-signer, x-namefi-signature, x-namefi-eip712-type, x-namefi-siwe-token, x-oneshot-singed-on-behalf.',
  );

function buildToolDescription(
  toolName: string,
  meta: ProcedureMeta | undefined,
  eip712Domain?: TypedDataDomain,
): string {
  const base = meta?.route?.description ?? meta?.route?.summary ?? '';

  const eip712 = meta?.eip712;
  if (!eip712?.input) {
    return base;
  }

  const { acceptedPrimaryTypes, types } = eip712.input;
  const acceptedTypesLabel =
    acceptedPrimaryTypes.length > 0
      ? acceptedPrimaryTypes.join(', ')
      : '(fetch with getEip712TypesForMethod)';

  const lines: string[] = [
    'Description:',
    base || 'This tool supports EIP-712 authentication.',
    '',
    'Instructions:',
    '1. MCP tool arguments use a wrapper object: { headers, body }.',
    '2. Put authentication headers inside headers. Do not rely on the outer MCP HTTP request headers for tool authentication.',
    '3. Put the procedure payload inside body.payload.',
    `4. For EIP-712 signed calls, build the full signed envelope in body using payload, payloadType, nonce, and timestamp. Fetch signing metadata with getEip712Domain and getEip712TypesForMethod using method="${toolName}".`,
    `5. For EIP-712, include these headers in headers: ${EIP712_SIGNATURE_HEADER_HEADERS.SIGNER}: <checksummed wallet address that signed>, ${EIP712_SIGNATURE_HEADER_HEADERS.SIGNATURE}: <0x-prefixed typed-data signature>, ${EIP712_SIGNATURE_HEADER_HEADERS.TYPE}: <one of ${acceptedTypesLabel}>.`,
    `6. For SIWE auth, include ${SIWE_SIGNATURE_HEADER_HEADERS.TOKEN}: <token> in headers and prepare it with getSiweNonce, prepareSiweMessage, verifySiweSignature, and getAllowedChains.`,
    '7. If you call through 1ShotPay, also include x-oneshot-singed-on-behalf: <accountAddress from get_info> in headers.',
    '',
    'EIP-712 Details:',
  ];

  if (eip712Domain) {
    lines.push(`Signing Domain: ${JSON.stringify(eip712Domain)}`);
  }

  lines.push(`Accepted Primary Types: ${acceptedTypesLabel}`, '');
  lines.push('EIP-712 Types:');
  lines.push(JSON.stringify(types, null, 2));
  lines.push('');

  for (const primaryType of acceptedPrimaryTypes) {
    const payloadType = primaryType.replace(/Envelope$/, '');
    lines.push(`Example body for ${primaryType}:`);
    lines.push('{');
    lines.push('  "payload": { <tool payload> },');
    lines.push(`  "payloadType": "${payloadType}",`);
    lines.push('  "nonce": "<random_string>",');
    lines.push('  "timestamp": <unix_seconds>');
    lines.push('}');
    lines.push('');
  }

  lines.push('Related Tools:');
  lines.push('- getEip712Domain, getEip712TypesForMethod, getAllEip712Types');
  lines.push(
    '- getSiweNonce, prepareSiweMessage, verifySiweSignature, getAllowedChains',
  );

  return lines.join('\n');
}

function buildToolBodySchema(
  payloadSchema: AnySchema | undefined,
  eip712?: Eip712InputMeta,
): z.ZodTypeAny {
  const payloadField = payloadSchema
    ? (payloadSchema as z.ZodTypeAny).describe(
        'The underlying oRPC procedure input. For plain and SIWE auth, this payload is passed directly to the procedure.',
      )
    : z
        .any()
        .optional()
        .describe(
          'The underlying oRPC procedure input. Omit for tools with no payload.',
        );

  return z
    .object({
      payload: payloadField,
      payloadType: z
        .string()
        .optional()
        .describe(
          eip712
            ? `Required for EIP-712 signed calls. Use one of: ${eip712.acceptedPrimaryTypes.join(', ')}`
            : 'Optional payload type label used when constructing signed envelopes.',
        ),
      nonce: z
        .string()
        .optional()
        .describe(
          'Required for EIP-712 signed calls. Nonce embedded in the signed request body.',
        ),
      timestamp: z
        .number()
        .int()
        .optional()
        .describe(
          'Required for EIP-712 signed calls. Unix timestamp embedded in the signed request body.',
        ),
    })
    .describe(
      eip712
        ? 'Unified MCP request body. For plain/SIWE auth, body.payload is forwarded to the procedure. For EIP-712 auth, this full body object is treated as the signed request body and body.payload is forwarded after verification.'
        : 'Unified MCP request body. body.payload is forwarded to the procedure.',
    );
}

function buildToolInputSchema(procedure: AnyProcedure): AnySchema {
  const def = procedure['~orpc'];
  const meta = def.meta as ProcedureMeta | undefined;
  const payloadSchema = def.inputSchema as AnySchema | undefined;

  return z
    .object({
      headers: toolHeadersSchema,
      body: buildToolBodySchema(payloadSchema, meta?.eip712?.input),
    })
    .describe(
      'MCP tool request wrapper. Put auth headers in headers and the tool request body in body.',
    ) as AnySchema;
}

function normalizeHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(headers ?? {})) {
    normalized[key.toLowerCase()] = value;
  }

  return normalized;
}

function shouldUseFullBodyForAuth(
  headers: Record<string, string | undefined>,
): boolean {
  return Boolean(
    headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNER] ||
      headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNATURE] ||
      headers[EIP712_SIGNATURE_HEADER_HEADERS.TYPE],
  );
}

function getRawBodyForAuth(
  headers: Record<string, string | undefined>,
  body: McpToolCallBody | undefined,
): string {
  const valueForAuth = shouldUseFullBodyForAuth(headers)
    ? (body ?? {})
    : (body?.payload ?? {});

  try {
    return JSON.stringify(valueForAuth);
  } catch {
    return '';
  }
}

async function authenticateToolCall(
  tool: DiscoveredTool,
  headers: Record<string, string | undefined>,
  body: McpToolCallBody | undefined,
  baseContext: TrpcContextWithUserOrNull,
) {
  const clientIp = baseContext.honoVars?.connInfo?.remote?.address ?? null;
  const rawBody = getRawBodyForAuth(headers, body);
  const authCtx = createAuthContext(
    headers,
    rawBody,
    tool.routePath,
    tool.routeMethod,
    clientIp,
  );

  authCtx.eip712Types = defaultEip712SchemaConverter.getTypes();

  return authenticateRequest(authCtx);
}

function getProcedureInputFromToolCall(
  body: McpToolCallBody | undefined,
): unknown {
  return body?.payload ?? {};
}

async function discoverTools(
  router: AnyRouter,
  eip712Domain?: TypedDataDomain,
): Promise<DiscoveredTool[]> {
  const tools: DiscoveredTool[] = [];

  await resolveContractProcedures(
    { router, path: [] },
    ({ contract, path }) => {
      if (!isProcedure(contract)) return;

      const procedure = contract as AnyProcedure;
      const def = procedure['~orpc'];
      const meta = def.meta as ProcedureMeta | undefined;
      const name = meta?.route?.operationId ?? path.join('.');

      tools.push({
        path: [...path],
        name,
        procedure,
        inputSchema: buildToolInputSchema(procedure),
        routePath: meta?.route?.path ?? `/${name}`,
        routeMethod: (meta?.route?.method ?? 'POST').toUpperCase(),
        eip712: meta?.eip712?.input,
        description: buildToolDescription(name, meta, eip712Domain),
      });
    },
  );

  return tools;
}

export async function createMcpServerFromOrpc(
  router: AnyRouter,
  options: OrpcToMcpOptions,
): Promise<McpServer> {
  const { name, version, eip712Domain } = options;
  const tools = await discoverTools(router, eip712Domain);

  const server = new McpServer({ name, version });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: McpToolCallInput) => executeToolCall(tool, args),
    );
  }

  return server;
}

/**
 * Enforce the EIP-712 primary-type guard that the OpenAPI handler applies via
 * its `onStart` client interceptor. Direct `call()` dispatch bypasses that
 * interceptor, so without this an EIP-712 signature valid for one primary type
 * could authenticate a tool whose `acceptedPrimaryTypes` does not include it.
 * Mirrors apps/backend/src/routers/openapi.ts.
 */
function assertEip712TypeAllowed(
  tool: DiscoveredTool,
  headers: Record<string, string | undefined>,
  authResult: { methodId: string | null },
): void {
  if (authResult.methodId !== EIP712_SIGNATURE_HEADER_METHOD_ID) {
    return;
  }
  const acceptedPrimaryTypes = tool.eip712?.acceptedPrimaryTypes ?? [];
  if (acceptedPrimaryTypes.length === 0) {
    return;
  }
  const type = headers[EIP712_SIGNATURE_HEADER_HEADERS.TYPE];
  if (!type) {
    throw new Error('No EIP-712 type provided');
  }
  if (!acceptedPrimaryTypes.includes(type)) {
    throw new Error('Invalid EIP-712 type');
  }
}

async function executeToolCall(
  tool: DiscoveredTool,
  input: McpToolCallInput,
): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
  try {
    const baseContext = mcpContextStore.getStore();
    if (!baseContext) {
      throw new Error('MCP base context is unavailable');
    }

    const headers = normalizeHeaders(input.headers);
    const body = input.body;
    const authResult = await authenticateToolCall(
      tool,
      headers,
      body,
      baseContext,
    );

    assertEip712TypeAllowed(tool, headers, authResult);

    const mergedContext: TrpcContextWithUserOrNull = {
      ...baseContext,
      apiAuthResult: authResult,
      user: authResult.success ? (authResult.user ?? null) : null,
    };

    const normalizedInput = getProcedureInputFromToolCall(body);

    const [error, result] = await resolve(
      call(tool.procedure, normalizedInput, {
        context: mergedContext,
      }),
    );

    if (error) {
      throw error;
    }

    const text =
      typeof result === 'string'
        ? result
        : (JSON.stringify(result, null, 2) ?? '(no content)');
    return {
      content: [{ type: 'text', text }],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      content: [
        { type: 'text', text: `Error executing ${tool.name}: ${message}` },
      ],
      isError: true,
    };
  }
}
