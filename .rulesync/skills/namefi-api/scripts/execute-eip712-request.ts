#!/usr/bin/env bun
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { repoRoot } from './lib/constants';
import { buildEip712Artifacts } from './lib/eip712-request';
import { buildHttpRequest } from './lib/http-request';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { ensureSiweToken } from './lib/siwe';
import type {
  IndexedOperation,
  PreparedHttpRequest,
  TypedData,
} from './lib/types';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

type WalletSession = {
  connected: boolean;
  address?: string;
  chainId?: number;
  chainName?: string;
  peerName?: string;
  createdAt?: number;
};

type SignTypedDataResult = {
  signature: string;
  address: string;
  primaryType: string;
};

type SignMessageResult = {
  signature: string;
  address: string;
  message: string;
};

type RunScriptResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

type ExecutionMode = 'eip712' | 'siwe-required' | 'siwe-optional' | 'none';

type ParsedCliArgs = {
  env: string;
  operationId: string;
  useRawOperations: boolean;
  dryRun: boolean;
  preferAuth: boolean;
  wcScriptsRoot: string;
  payload: Record<string, unknown>;
  pathParams: Record<string, unknown>;
  timestamp: number;
  nonce: string;
  signTimeoutMs: number;
  requestTimeoutMs: number;
  sessionTimeoutMs: number;
};

const DEFAULT_SIGN_TIMEOUT_MS = 300_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_SESSION_TIMEOUT_MS = 10_000;

function resolveWalletConnectScriptsRoot(explicitRoot: string | null): string {
  const candidates = explicitRoot
    ? [resolve(explicitRoot)]
    : [
        resolve(repoRoot, '.opencode/skill/wc/scripts'),
        resolve(repoRoot, '.claude/skills/wc/scripts'),
      ];

  for (const candidate of candidates) {
    if (
      existsSync(resolve(candidate, 'get-session.ts')) &&
      existsSync(resolve(candidate, 'sign-typed-data.ts'))
    ) {
      return candidate;
    }
  }

  throw new Error(
    'Could not find WalletConnect helper scripts. Pass --wc-scripts-root=/path/to/wc/scripts.',
  );
}

async function readJsonInput(
  inlineValue: string | null,
  filePath: string | null,
  label: string,
): Promise<Record<string, unknown>> {
  if (inlineValue) {
    return JSON.parse(inlineValue) as Record<string, unknown>;
  }

  if (filePath) {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  }

  throw new Error(`Pass ${label} with --${label} or --${label}-file.`);
}

async function runBunScript(args: {
  scriptPath: string;
  input?: string;
  timeoutMs: number;
}): Promise<RunScriptResult> {
  const child = spawn(process.execPath, [args.scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];

  child.stdout.on('data', (chunk: Buffer | string) => {
    stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  child.stderr.on('data', (chunk: Buffer | string) => {
    stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  if (args.input) {
    child.stdin.write(args.input);
  }
  child.stdin.end();

  const exitCode = await new Promise<number>(
    (resolvePromise, rejectPromise) => {
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        rejectPromise(
          new Error(
            `Timed out after ${args.timeoutMs}ms running ${args.scriptPath}.`,
          ),
        );
      }, args.timeoutMs);

      child.on('error', (error) => {
        clearTimeout(timeout);
        rejectPromise(error);
      });

      child.on('exit', (code) => {
        clearTimeout(timeout);
        resolvePromise(code ?? 1);
      });
    },
  );

  return {
    stdout: Buffer.concat(stdoutChunks).toString('utf8').trim(),
    stderr: Buffer.concat(stderrChunks).toString('utf8').trim(),
    exitCode,
  };
}

async function getWalletSession(args: {
  scriptsRoot: string;
  timeoutMs: number;
}): Promise<WalletSession> {
  const result = await runBunScript({
    scriptPath: resolve(args.scriptsRoot, 'get-session.ts'),
    timeoutMs: args.timeoutMs,
  });

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'Failed to check WalletConnect session.');
  }

  return JSON.parse(result.stdout) as WalletSession;
}

async function signTypedData(args: {
  scriptsRoot: string;
  typedData: TypedData;
  timeoutMs: number;
}): Promise<SignTypedDataResult> {
  const result = await runBunScript({
    scriptPath: resolve(args.scriptsRoot, 'sign-typed-data.ts'),
    input: JSON.stringify(args.typedData),
    timeoutMs: args.timeoutMs,
  });

  if (result.exitCode !== 0) {
    throw new Error(
      result.stderr || 'WalletConnect typed-data signing failed.',
    );
  }

  return JSON.parse(result.stdout) as SignTypedDataResult;
}

async function signMessage(args: {
  scriptsRoot: string;
  message: string;
  timeoutMs: number;
}): Promise<SignMessageResult> {
  const result = await runBunScript({
    scriptPath: resolve(args.scriptsRoot, 'sign-message.ts'),
    input: args.message,
    timeoutMs: args.timeoutMs,
  });

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'WalletConnect message signing failed.');
  }

  return JSON.parse(result.stdout) as SignMessageResult;
}

function parseIntegerFlag(value: string | null, fallbackValue: number): number {
  if (!value) {
    return fallbackValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer value: ${value}`);
  }

  return parsed;
}

async function parseJsonFlagPair(
  rawArgs: ReturnType<typeof parseArgs>,
  flagName: string,
): Promise<Record<string, unknown>> {
  const inlineValue = getStringFlag(rawArgs, flagName);
  const fileValue = getStringFlag(rawArgs, `${flagName}-file`);
  if (inlineValue || fileValue) {
    return readJsonInput(inlineValue, fileValue, flagName);
  }
  return {};
}

async function parseCliArgs(): Promise<ParsedCliArgs> {
  const rawArgs = parseArgs(process.argv.slice(2));
  const payload = await parseJsonFlagPair(rawArgs, 'payload');
  const pathParams = await parseJsonFlagPair(rawArgs, 'path-params');

  return {
    env: requireStringFlag(rawArgs, 'env'),
    operationId: requireStringFlag(rawArgs, 'operationId'),
    useRawOperations: getBooleanFlag(rawArgs, 'raw'),
    dryRun: getBooleanFlag(rawArgs, 'dry-run'),
    preferAuth: getBooleanFlag(rawArgs, 'prefer-auth'),
    wcScriptsRoot: resolveWalletConnectScriptsRoot(
      getStringFlag(rawArgs, 'wc-scripts-root'),
    ),
    payload,
    pathParams,
    timestamp: parseIntegerFlag(
      getStringFlag(rawArgs, 'timestamp'),
      Math.floor(Date.now() / 1000),
    ),
    nonce:
      getStringFlag(rawArgs, 'nonce') ?? `0x${randomBytes(32).toString('hex')}`,
    signTimeoutMs: parseIntegerFlag(
      getStringFlag(rawArgs, 'sign-timeout-ms'),
      DEFAULT_SIGN_TIMEOUT_MS,
    ),
    requestTimeoutMs: parseIntegerFlag(
      getStringFlag(rawArgs, 'request-timeout-ms'),
      DEFAULT_REQUEST_TIMEOUT_MS,
    ),
    sessionTimeoutMs: parseIntegerFlag(
      getStringFlag(rawArgs, 'session-timeout-ms'),
      DEFAULT_SESSION_TIMEOUT_MS,
    ),
  };
}

function determineExecutionMode(
  operation: IndexedOperation,
  preferAuth: boolean,
): ExecutionMode {
  if (operation.hasEip712) {
    return 'eip712';
  }
  if (operation.authMode === 'siwe-required') {
    return 'siwe-required';
  }
  if (operation.authMode === 'siwe-optional' && preferAuth) {
    return 'siwe-optional';
  }
  if (operation.authMode === 'none' || operation.authMode === 'siwe-optional') {
    return 'none';
  }
  throw new Error(
    `Operation ${operation.operationId} has unknown auth requirements. Inspect the indexed operation before executing it.`,
  );
}

async function ensureWalletSession(
  executionMode: ExecutionMode,
  dryRun: boolean,
  wcScriptsRoot: string,
  sessionTimeoutMs: number,
): Promise<WalletSession | null> {
  if (executionMode === 'none' && !dryRun) {
    return null;
  }

  const session = await getWalletSession({
    scriptsRoot: wcScriptsRoot,
    timeoutMs: sessionTimeoutMs,
  });

  if (executionMode !== 'none' && !session.connected) {
    throw new Error(
      'No active WalletConnect session. Connect a wallet with the wc skill first.',
    );
  }

  return session;
}

async function parseJsonResponse(response: Response): Promise<{
  json: unknown;
  text: string | null;
}> {
  const responseText = await response.text();

  try {
    return {
      json: responseText.length > 0 ? JSON.parse(responseText) : null,
      text: null,
    };
  } catch {
    return {
      json: null,
      text: responseText,
    };
  }
}

function formatResponseSummary(
  response: Response,
  parsed: { json: unknown; text: string | null },
): Record<string, unknown> {
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type'),
    json: parsed.json,
    text: parsed.text,
  };
}

async function executeEip712Mode(
  cliArgs: ParsedCliArgs,
  operation: IndexedOperation,
  session: WalletSession | null,
): Promise<void> {
  const artifacts = buildEip712Artifacts({
    operation,
    payload: cliArgs.payload,
    pathParams: cliArgs.pathParams,
    timestamp: cliArgs.timestamp,
    nonce: cliArgs.nonce,
  });

  if (cliArgs.dryRun) {
    printJson({
      env: cliArgs.env,
      operationId: operation.operationId,
      authKind: operation.authKind,
      authMode: operation.authMode,
      executionMode: 'eip712',
      wcScriptsRoot: cliArgs.wcScriptsRoot,
      session,
      artifacts,
    });
    return;
  }

  if (artifacts.request.missingPathParams.length > 0) {
    throw new Error(
      `Missing required path params: ${artifacts.request.missingPathParams.join(', ')}`,
    );
  }

  const signed = await signTypedData({
    scriptsRoot: cliArgs.wcScriptsRoot,
    typedData: artifacts.typedData,
    timeoutMs: cliArgs.signTimeoutMs,
  });

  const response = await fetch(artifacts.request.url, {
    method: artifacts.request.method,
    headers: {
      ...artifacts.request.headers,
      'x-namefi-signer': signed.address,
      'x-namefi-signature': signed.signature,
    },
    body: JSON.stringify(artifacts.request.body),
    signal: AbortSignal.timeout(cliArgs.requestTimeoutMs),
  });
  const parsed = await parseJsonResponse(response);

  printJson({
    env: cliArgs.env,
    operationId: operation.operationId,
    authKind: operation.authKind,
    authMode: operation.authMode,
    executionMode: 'eip712',
    wcScriptsRoot: cliArgs.wcScriptsRoot,
    session,
    signer: {
      address: signed.address,
      primaryType: signed.primaryType,
    },
    request: {
      method: artifacts.request.method,
      url: artifacts.request.url,
      resolvedPath: artifacts.request.resolvedPath,
      headers: {
        ...artifacts.request.headers,
        'x-namefi-signer': signed.address,
        'x-namefi-signature': signed.signature,
      },
      body: artifacts.request.body,
    },
    response: formatResponseSummary(response, parsed),
  });
}

async function acquireSiweTokenForRequest(
  cliArgs: ParsedCliArgs,
  operations: IndexedOperation[],
  session: WalletSession,
  request: PreparedHttpRequest,
): Promise<string> {
  const getSiweNonceOperation = findOperation(operations, {
    operationId: 'getSiweNonce',
  });
  const prepareSiweMessageOperation = findOperation(operations, {
    operationId: 'prepareSiweMessage',
  });
  const verifySiweSignatureOperation = findOperation(operations, {
    operationId: 'verifySiweSignature',
  });

  if (
    !getSiweNonceOperation ||
    !prepareSiweMessageOperation ||
    !verifySiweSignatureOperation
  ) {
    throw new Error(
      'Missing SIWE helper operations in the local index. Refresh the namefi-api cache first.',
    );
  }

  const getAllowedChainsOperation = findOperation(operations, {
    operationId: 'getAllowedChains',
  });

  const tokenState = await ensureSiweToken({
    env: cliArgs.env,
    session,
    operations: {
      getSiweNonce: getSiweNonceOperation,
      prepareSiweMessage: prepareSiweMessageOperation,
      verifySiweSignature: verifySiweSignatureOperation,
      getAllowedChains: getAllowedChainsOperation ?? undefined,
    },
    signMessage: async (message) =>
      signMessage({
        scriptsRoot: cliArgs.wcScriptsRoot,
        message,
        timeoutMs: cliArgs.signTimeoutMs,
      }),
    timeoutMs: cliArgs.requestTimeoutMs,
  });

  request.headers['x-namefi-siwe-token'] = tokenState.token;
  return tokenState.token;
}

async function executeHttpMode(
  cliArgs: ParsedCliArgs,
  operation: IndexedOperation,
  executionMode: ExecutionMode,
  operations: IndexedOperation[],
  session: WalletSession | null,
): Promise<void> {
  const request = buildHttpRequest({
    operation,
    payload: cliArgs.payload,
    pathParams: cliArgs.pathParams,
  });

  if (request.missingPathParams.length > 0) {
    throw new Error(
      `Missing required path params: ${request.missingPathParams.join(', ')}`,
    );
  }

  const needsSiwe =
    executionMode === 'siwe-required' || executionMode === 'siwe-optional';

  if (cliArgs.dryRun) {
    printJson({
      env: cliArgs.env,
      operationId: operation.operationId,
      authKind: operation.authKind,
      authMode: operation.authMode,
      executionMode,
      wcScriptsRoot: cliArgs.wcScriptsRoot,
      session,
      request,
      siweToken: needsSiwe ? '(would acquire SIWE token at runtime)' : null,
    });
    return;
  }

  if (needsSiwe) {
    await acquireSiweTokenForRequest(
      cliArgs,
      operations,
      session as WalletSession,
      request,
    );
  }

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body ? JSON.stringify(request.body) : undefined,
    signal: AbortSignal.timeout(cliArgs.requestTimeoutMs),
  });
  const parsed = await parseJsonResponse(response);

  printJson({
    env: cliArgs.env,
    operationId: operation.operationId,
    authKind: operation.authKind,
    authMode: operation.authMode,
    executionMode,
    wcScriptsRoot: cliArgs.wcScriptsRoot,
    session,
    request,
    response: formatResponseSummary(response, parsed),
  });
}

export async function executeRequestCli(): Promise<void> {
  const cliArgs = await parseCliArgs();

  const index = await loadEnvironmentIndex(cliArgs.env);
  const operations = selectOperations(index, cliArgs.useRawOperations);
  const operation = findOperation(operations, {
    operationId: cliArgs.operationId,
  });

  if (!operation) {
    throw new Error(
      `Operation ${cliArgs.operationId} was not found in ${cliArgs.env}.`,
    );
  }

  const executionMode = determineExecutionMode(operation, cliArgs.preferAuth);
  const session = await ensureWalletSession(
    executionMode,
    cliArgs.dryRun,
    cliArgs.wcScriptsRoot,
    cliArgs.sessionTimeoutMs,
  );

  if (executionMode === 'eip712') {
    await executeEip712Mode(cliArgs, operation, session);
    return;
  }

  await executeHttpMode(cliArgs, operation, executionMode, operations, session);
}

if (isMainModule(import.meta)) {
  executeRequestCli().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
