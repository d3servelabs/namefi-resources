import { buildHttpRequest } from './http-request';
import type { IndexedOperation } from './types';
import {
  loadStoredSiweToken,
  saveStoredSiweToken,
  type StoredSiweToken,
} from './siwe-token-store';

type SignMessageResult = {
  signature: string;
  address: string;
  message: string;
};

type WalletSession = {
  connected: boolean;
  address?: string;
  chainId?: number;
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

const SIWE_REFRESH_SKEW_MS = 30_000;

async function requestJson<T>(args: {
  operation: IndexedOperation;
  payload?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  methodOverride?: string;
  headers?: Record<string, string>;
  timeoutMs: number;
}): Promise<T> {
  const request = buildHttpRequest({
    operation: args.operation,
    payload: args.payload,
    pathParams: args.pathParams,
    headers: args.headers,
  });
  const response = await fetch(request.url, {
    method: args.methodOverride ?? request.method,
    headers: request.headers,
    body: request.body ? JSON.stringify(request.body) : undefined,
    signal: AbortSignal.timeout(args.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `SIWE bootstrap request failed for ${args.operation.operationId} with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

function getStoredTokenIfValid(
  token: StoredSiweToken | null,
): StoredSiweToken | null {
  if (!token) {
    return null;
  }

  if (token.expiresAt <= Date.now() + SIWE_REFRESH_SKEW_MS) {
    return null;
  }

  return token;
}

export async function ensureSiweToken(args: {
  env: string;
  session: WalletSession;
  operations: {
    getSiweNonce: IndexedOperation;
    prepareSiweMessage: IndexedOperation;
    verifySiweSignature: IndexedOperation;
    getAllowedChains?: IndexedOperation;
  };
  signMessage: (message: string) => Promise<SignMessageResult>;
  timeoutMs: number;
}): Promise<StoredSiweToken> {
  if (
    !args.session.connected ||
    !args.session.address ||
    !args.session.chainId
  ) {
    throw new Error(
      'A connected wallet session is required to bootstrap SIWE.',
    );
  }

  const cached = getStoredTokenIfValid(
    await loadStoredSiweToken({
      env: args.env,
      address: args.session.address,
    }),
  );
  if (cached) {
    return cached;
  }

  const nonceResult = await requestJson<SiweNonceResponse>({
    operation: args.operations.getSiweNonce,
    payload: {
      signerAddress: args.session.address,
    },
    timeoutMs: args.timeoutMs,
  });
  if (!nonceResult.valid) {
    throw new Error(`Failed to get SIWE nonce: ${nonceResult.error}`);
  }

  let siweChainId = args.session.chainId;
  if (args.operations.getAllowedChains) {
    const allowedChains = await requestJson<number[]>({
      operation: args.operations.getAllowedChains,
      timeoutMs: args.timeoutMs,
    });
    if (
      Array.isArray(allowedChains) &&
      allowedChains.length > 0 &&
      !allowedChains.includes(siweChainId)
    ) {
      siweChainId = allowedChains[0];
    }
  }

  const messageResult = await requestJson<SiwePrepareMessageResponse>({
    operation: args.operations.prepareSiweMessage,
    payload: {
      signerAddress: args.session.address,
      nonce: nonceResult.nonce,
      chainId: siweChainId,
    },
    timeoutMs: args.timeoutMs,
  });
  if (!messageResult.valid) {
    throw new Error(`Failed to prepare SIWE message: ${messageResult.error}`);
  }

  const signed = await args.signMessage(messageResult.messageString);
  const verificationResult = await requestJson<SiweVerifyResponse>({
    operation: args.operations.verifySiweSignature,
    payload: {
      address: args.session.address,
      message: messageResult.message,
      signature: signed.signature,
    },
    timeoutMs: args.timeoutMs,
  });
  if (!verificationResult.valid) {
    throw new Error(
      `Failed to verify SIWE message: ${verificationResult.error}`,
    );
  }

  const storedToken: StoredSiweToken = {
    token: verificationResult.token,
    address: verificationResult.session.address,
    chainId: verificationResult.session.chainId,
    createdAt: verificationResult.session.createdAt,
    expiresAt:
      new Date(verificationResult.session.createdAt).getTime() +
      verificationResult.session.maxAgeSeconds * 1000 -
      SIWE_REFRESH_SKEW_MS,
  };

  await saveStoredSiweToken({
    env: args.env,
    address: args.session.address,
    token: storedToken,
  });

  return storedToken;
}
