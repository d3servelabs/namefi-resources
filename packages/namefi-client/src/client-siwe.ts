import type { ClientOptions } from '@orpc/client';
import { recoverMessageAddress, verifyMessage } from 'viem';
import type { CreateNamefiClientAuth, EIP712Signer } from './index';
import type { NamefiClientContext, NamefiClientFetch } from './client-x402';

const SIWE_TOKEN_HEADER = 'x-namefi-siwe-token';
const SIWE_TOKEN_REFRESH_SKEW_MS = 30_000;

type ClientSiweLogger = {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

type SiweTokenState = {
  token: string;
  expiresAt: number;
};

type SiweNonceResponse =
  | {
      valid: true;
      nonce: string;
    }
  | {
      valid: false;
      error: string;
    };

type SiwePreparedMessage = {
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

type SiwePrepareMessageResponse =
  | {
      valid: true;
      message: SiwePreparedMessage;
      messageString: string;
    }
  | {
      valid: false;
      error: string;
    };

type SiweVerifyResponse =
  | {
      valid: true;
      recoveredAddress: string;
      token: string;
      session: {
        address: string;
        chainId: number;
        createdAt: string;
        maxAgeSeconds: number;
      };
    }
  | {
      valid: false;
      error: string;
    };

export type CreateNamefiClientSiweOptions = {
  chainId?: number;
};

export function createNamefiClientSiweFetch({
  authentication,
  logger,
  nextFetch,
  siwe,
  vNextUrl,
  isEip712Path,
}: {
  authentication: CreateNamefiClientAuth;
  logger?: ClientSiweLogger;
  nextFetch: NamefiClientFetch;
  siwe?: CreateNamefiClientSiweOptions;
  vNextUrl: string;
  isEip712Path: (path: readonly string[]) => boolean;
}) {
  const eip712Authentication =
    authentication.type === 'EIP712' ? authentication : null;
  let tokenState: SiweTokenState | null = null;
  let refreshPromise: Promise<SiweTokenState> | null = null;

  return (async (
    request: Request,
    init,
    options,
    path,
    input,
  ): Promise<Response> => {
    if (!eip712Authentication || isEip712Path(path) || isSiwePath(path)) {
      return nextFetch(request, init, options, path, input);
    }

    const token = await getValidToken();
    const authenticatedRequest = withHeader(request, SIWE_TOKEN_HEADER, token);
    const response = await nextFetch(
      authenticatedRequest,
      init,
      options,
      path,
      input,
    );

    if (response.status !== 401) {
      return response;
    }

    logger?.info('SIWE token rejected, refreshing and retrying request');
    tokenState = null;
    refreshPromise = null;

    const refreshedToken = await getValidToken();
    const retryRequest = withHeader(request, SIWE_TOKEN_HEADER, refreshedToken);

    return nextFetch(retryRequest, init, options, path, input);
  }) satisfies NamefiClientFetch;

  async function getValidToken(): Promise<string> {
    if (tokenState && tokenState.expiresAt > Date.now()) {
      return tokenState.token;
    }

    if (!refreshPromise) {
      refreshPromise = createTokenState();
    }

    try {
      tokenState = await refreshPromise;
      return tokenState.token;
    } finally {
      refreshPromise = null;
    }
  }

  async function createTokenState(): Promise<SiweTokenState> {
    if (!eip712Authentication) {
      throw new Error('SIWE bootstrap requires EIP712 authentication');
    }

    const signer = eip712Authentication.signer;
    const signerAddress = await signer.getAddress();
    const nonceResult = await getSiweNonce(vNextUrl, signerAddress);

    if (!nonceResult.valid) {
      throw new Error(`Failed to get SIWE nonce: ${nonceResult.error}`);
    }

    const messageResult = await prepareSiweMessage(vNextUrl, {
      signerAddress,
      nonce: nonceResult.nonce,
      chainId: siwe?.chainId,
    });

    if (!messageResult.valid) {
      throw new Error(`Failed to prepare SIWE message: ${messageResult.error}`);
    }

    const signature = await signer.signMessage(messageResult.messageString);
    const localVerification = await verifySignedSiweMessageLocally({
      signerAddress,
      message: messageResult.messageString,
      signature,
    });

    if (!localVerification.valid) {
      throw new Error(
        localVerification.recoveredAddress
          ? `SIWE local verification failed: expected ${signerAddress}, recovered ${localVerification.recoveredAddress}`
          : 'SIWE local verification failed before server verification',
      );
    }

    const verificationResult = await verifySiweSignature(vNextUrl, {
      address: signerAddress,
      message: messageResult.message,
      signature,
    });

    if (!verificationResult.valid) {
      throw new Error(
        `Failed to verify SIWE message: ${verificationResult.error}`,
      );
    }

    const expiresAt =
      new Date(verificationResult.session.createdAt).getTime() +
      verificationResult.session.maxAgeSeconds * 1000 -
      SIWE_TOKEN_REFRESH_SKEW_MS;

    return {
      token: verificationResult.token,
      expiresAt,
    };
  }
}

function isSiwePath(path: readonly string[]): boolean {
  return path[0] === 'siwe';
}

function withHeader(request: Request, name: string, value: string): Request {
  const headers = new Headers(request.headers);
  headers.set(name, value);

  return new Request(request, {
    headers,
    credentials: 'include',
  });
}

async function getSiweNonce(
  vNextUrl: string,
  signerAddress: `0x${string}`,
): Promise<SiweNonceResponse> {
  const url = new URL('siwe/nonce', ensureDirectoryUrl(vNextUrl));
  url.searchParams.set('signerAddress', signerAddress);

  return requestJson<SiweNonceResponse>(url.toString(), {
    method: 'GET',
  });
}

async function prepareSiweMessage(
  vNextUrl: string,
  input: {
    signerAddress: `0x${string}`;
    nonce: string;
    chainId?: number;
  },
): Promise<SiwePrepareMessageResponse> {
  const url = new URL('siwe/message', ensureDirectoryUrl(vNextUrl));
  url.searchParams.set('signerAddress', input.signerAddress);
  url.searchParams.set('nonce', input.nonce);
  if (input.chainId !== undefined) {
    url.searchParams.set('chainId', String(input.chainId));
  }

  return requestJson<SiwePrepareMessageResponse>(url.toString(), {
    method: 'GET',
  });
}

async function verifySiweSignature(
  vNextUrl: string,
  input: {
    address: `0x${string}`;
    message: SiwePreparedMessage;
    signature: `0x${string}`;
  },
): Promise<SiweVerifyResponse> {
  const url = new URL('siwe/verify', ensureDirectoryUrl(vNextUrl));

  return requestJson<SiweVerifyResponse>(url.toString(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await globalThis.fetch(url, {
    ...init,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(
      `SIWE bootstrap request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

function ensureDirectoryUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

async function verifySignedSiweMessageLocally({
  signerAddress,
  message,
  signature,
}: {
  signerAddress: `0x${string}`;
  message: string;
  signature: `0x${string}`;
}): Promise<
  { valid: true } | { valid: false; recoveredAddress?: `0x${string}` }
> {
  const valid = await verifyMessage({
    address: signerAddress,
    message,
    signature,
  });

  if (valid) {
    return { valid: true };
  }

  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });

    return {
      valid: false,
      recoveredAddress,
    };
  } catch {
    return { valid: false };
  }
}

export type { EIP712Signer };
