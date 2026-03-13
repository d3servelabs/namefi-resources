#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { repoRoot } from './lib/constants';
import { buildEip712Artifacts } from './lib/eip712-request';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import type { TypedData } from './lib/types';
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

type SignResult = {
  signature: string;
  address: string;
  primaryType: string;
};

type RunScriptResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
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
}): Promise<SignResult> {
  const result = await runBunScript({
    scriptPath: resolve(args.scriptsRoot, 'sign-typed-data.ts'),
    input: JSON.stringify(args.typedData),
    timeoutMs: args.timeoutMs,
  });

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'WalletConnect signing failed.');
  }

  return JSON.parse(result.stdout) as SignResult;
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const operationId = requireStringFlag(args, 'operationId');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const dryRun = getBooleanFlag(args, 'dry-run');
  const wcScriptsRoot = resolveWalletConnectScriptsRoot(
    getStringFlag(args, 'wc-scripts-root'),
  );
  const payload = await readJsonInput(
    getStringFlag(args, 'payload'),
    getStringFlag(args, 'payload-file'),
    'payload',
  );
  const pathParams =
    getStringFlag(args, 'path-params') ||
    getStringFlag(args, 'path-params-file')
      ? await readJsonInput(
          getStringFlag(args, 'path-params'),
          getStringFlag(args, 'path-params-file'),
          'path-params',
        )
      : {};
  const timestamp = parseIntegerFlag(
    getStringFlag(args, 'timestamp'),
    Math.floor(Date.now() / 1000),
  );
  const nonce =
    getStringFlag(args, 'nonce') ?? `0x${randomBytes(32).toString('hex')}`;
  const signTimeoutMs = parseIntegerFlag(
    getStringFlag(args, 'sign-timeout-ms'),
    DEFAULT_SIGN_TIMEOUT_MS,
  );
  const requestTimeoutMs = parseIntegerFlag(
    getStringFlag(args, 'request-timeout-ms'),
    DEFAULT_REQUEST_TIMEOUT_MS,
  );
  const sessionTimeoutMs = parseIntegerFlag(
    getStringFlag(args, 'session-timeout-ms'),
    DEFAULT_SESSION_TIMEOUT_MS,
  );

  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} was not found in ${env}.`);
  }

  const session = await getWalletSession({
    scriptsRoot: wcScriptsRoot,
    timeoutMs: sessionTimeoutMs,
  });

  const artifacts = buildEip712Artifacts({
    operation,
    payload,
    pathParams,
    timestamp,
    nonce,
  });

  if (dryRun) {
    printJson({
      env,
      operationId: operation.operationId,
      wcScriptsRoot,
      session,
      artifacts,
    });
    return;
  }

  if (!session.connected) {
    throw new Error(
      'No active WalletConnect session. Connect a wallet with the wc skill first.',
    );
  }

  if (artifacts.request.missingPathParams.length > 0) {
    throw new Error(
      `Missing required path params: ${artifacts.request.missingPathParams.join(', ')}`,
    );
  }

  const signed = await signTypedData({
    scriptsRoot: wcScriptsRoot,
    typedData: artifacts.typedData,
    timeoutMs: signTimeoutMs,
  });
  const response = await fetch(artifacts.request.url, {
    method: artifacts.request.method,
    headers: {
      ...artifacts.request.headers,
      'x-namefi-signer': signed.address,
      'x-namefi-signature': signed.signature,
    },
    body: JSON.stringify(artifacts.request.body),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const responseText = await response.text();

  let responseJson: unknown = null;
  try {
    responseJson = responseText.length > 0 ? JSON.parse(responseText) : null;
  } catch {
    responseJson = null;
  }

  printJson({
    env,
    operationId: operation.operationId,
    wcScriptsRoot,
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
    response: {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      json: responseJson,
      text: responseJson === null ? responseText : null,
    },
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
