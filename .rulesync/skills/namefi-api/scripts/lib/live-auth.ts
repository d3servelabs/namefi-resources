import type { Eip712Domain, Eip712Field, PreparedHttpRequest } from './types';
import { loadManifest } from './manifest';
import { joinUrl } from './utils';

export type Eip712TypesForMethodResponse =
  | {
      found: true;
      acceptedPrimaryTypes: string[];
      types: Record<string, Eip712Field[]>;
    }
  | {
      found: false;
      availableMethods?: string[];
    };

export type SiwePreparedMessage = {
  address: `0x${string}`;
  chainId: number;
  domain: string;
  expirationTime?: string;
  issuedAt?: string;
  nonce: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
  scheme?: string;
  statement?: string;
  uri: string;
  version: '1';
};

export type SiweNonceResponse =
  | {
      valid: true;
      nonce: string;
    }
  | {
      valid: false;
      error: string;
    };

export type SiwePrepareMessageResponse =
  | {
      valid: true;
      message: SiwePreparedMessage;
      messageString: string;
    }
  | {
      valid: false;
      error: string;
    };

type HelperRequestResult<T> = {
  request: PreparedHttpRequest;
  response: T;
};

const DEFAULT_CONTENT_TYPE = 'application/json';

const eip712DomainCache = new Map<string, Eip712Domain>();
const eip712TypesForMethodCache = new Map<
  string,
  Eip712TypesForMethodResponse
>();
const allEip712TypesCache = new Map<string, Record<string, Eip712Field[]>>();
const allowedChainsCache = new Map<string, number[]>();

async function getRequestBaseUrl(env: string): Promise<string> {
  const manifest = await loadManifest();
  const entry = manifest[env];

  if (!entry) {
    throw new Error(
      `Unknown environment ${env}. Available environments: ${Object.keys(manifest).join(', ')}`,
    );
  }

  return entry.requestBaseUrl;
}

function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(searchParams, key, item);
    }
    return;
  }

  searchParams.append(key, String(value));
}

function buildHelperRequest(args: {
  baseUrl: string;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}): PreparedHttpRequest {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(args.query ?? {})) {
    appendQueryValue(searchParams, key, value);
  }

  const queryString = searchParams.toString();
  const resolvedPath = `${args.path}${queryString ? `?${queryString}` : ''}`;

  return {
    method: args.method.toUpperCase(),
    path: args.path,
    resolvedPath,
    url: joinUrl(args.baseUrl, resolvedPath),
    headers: {
      'Content-Type': DEFAULT_CONTENT_TYPE,
      ...(args.headers ?? {}),
    },
    missingPathParams: [],
    body: args.body ?? null,
  };
}

async function requestJson<T>(args: {
  request: PreparedHttpRequest;
  timeoutMs: number;
}): Promise<T> {
  const response = await fetch(args.request.url, {
    method: args.request.method,
    headers: args.request.headers,
    body: args.request.body ? JSON.stringify(args.request.body) : undefined,
    signal: AbortSignal.timeout(args.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Request failed for ${args.request.method} ${args.request.resolvedPath} with status ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export async function fetchEip712Domain(args: {
  env: string;
  chain: number;
  timeoutMs: number;
}): Promise<HelperRequestResult<Eip712Domain>> {
  const cacheKey = `${args.env}:${args.chain}`;
  const baseUrl = await getRequestBaseUrl(args.env);
  const request = buildHelperRequest({
    baseUrl,
    method: 'GET',
    path: '/eip712/domain',
    query: { chain: args.chain },
  });
  const cached = eip712DomainCache.get(cacheKey);

  if (cached) {
    return { request, response: cached };
  }

  const response = await requestJson<Eip712Domain>({
    request,
    timeoutMs: args.timeoutMs,
  });
  eip712DomainCache.set(cacheKey, response);

  return { request, response };
}

export async function fetchAllEip712Types(args: {
  env: string;
  timeoutMs: number;
}): Promise<HelperRequestResult<Record<string, Eip712Field[]>>> {
  const baseUrl = await getRequestBaseUrl(args.env);
  const request = buildHelperRequest({
    baseUrl,
    method: 'GET',
    path: '/eip712/types',
  });
  const cached = allEip712TypesCache.get(args.env);

  if (cached) {
    return { request, response: cached };
  }

  const response = await requestJson<Record<string, Eip712Field[]>>({
    request,
    timeoutMs: args.timeoutMs,
  });
  allEip712TypesCache.set(args.env, response);

  return { request, response };
}

export async function fetchEip712TypesForMethod(args: {
  env: string;
  method: string;
  timeoutMs: number;
}): Promise<HelperRequestResult<Eip712TypesForMethodResponse>> {
  const cacheKey = `${args.env}:${args.method}`;
  const baseUrl = await getRequestBaseUrl(args.env);
  const request = buildHelperRequest({
    baseUrl,
    method: 'GET',
    path: '/eip712/types-for-method',
    query: { method: args.method },
  });
  const cached = eip712TypesForMethodCache.get(cacheKey);

  if (cached) {
    return { request, response: cached };
  }

  const response = await requestJson<Eip712TypesForMethodResponse>({
    request,
    timeoutMs: args.timeoutMs,
  });
  eip712TypesForMethodCache.set(cacheKey, response);

  return { request, response };
}

export async function fetchAllowedChains(args: {
  env: string;
  timeoutMs: number;
}): Promise<HelperRequestResult<number[]>> {
  const baseUrl = await getRequestBaseUrl(args.env);
  const request = buildHelperRequest({
    baseUrl,
    method: 'GET',
    path: '/siwe/allowed-chains',
  });
  const cached = allowedChainsCache.get(args.env);

  if (cached) {
    return { request, response: cached };
  }

  const response = await requestJson<number[]>({
    request,
    timeoutMs: args.timeoutMs,
  });
  allowedChainsCache.set(args.env, response);

  return { request, response };
}

export async function fetchSiweNonce(args: {
  env: string;
  signerAddress: string;
  timeoutMs: number;
}): Promise<HelperRequestResult<SiweNonceResponse>> {
  const baseUrl = await getRequestBaseUrl(args.env);
  const request = buildHelperRequest({
    baseUrl,
    method: 'GET',
    path: '/siwe/nonce',
    query: { signerAddress: args.signerAddress },
  });
  const response = await requestJson<SiweNonceResponse>({
    request,
    timeoutMs: args.timeoutMs,
  });

  return { request, response };
}

export async function fetchPreparedSiweMessage(args: {
  env: string;
  signerAddress: string;
  nonce: string;
  chainId: number;
  timeoutMs: number;
}): Promise<HelperRequestResult<SiwePrepareMessageResponse>> {
  const baseUrl = await getRequestBaseUrl(args.env);
  const request = buildHelperRequest({
    baseUrl,
    method: 'GET',
    path: '/siwe/message',
    query: {
      signerAddress: args.signerAddress,
      nonce: args.nonce,
      chainId: args.chainId,
    },
  });
  const response = await requestJson<SiwePrepareMessageResponse>({
    request,
    timeoutMs: args.timeoutMs,
  });

  return { request, response };
}

export async function buildVerifySiweRequest(args: {
  env: string;
  signerAddress: string;
  message: SiwePreparedMessage;
}): Promise<PreparedHttpRequest> {
  const baseUrl = await getRequestBaseUrl(args.env);

  return buildHelperRequest({
    baseUrl,
    method: 'POST',
    path: '/siwe/verify',
    body: {
      address: args.signerAddress,
      message: args.message,
      signature: '<fill externally>',
    },
  });
}
