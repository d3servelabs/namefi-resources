import { randomBytes } from 'node:crypto';
import { buildHttpRequest } from './http-request';
import {
  buildVerifySiweRequest,
  fetchAllowedChains,
  fetchEip712Domain,
  fetchEip712TypesForMethod,
  fetchPreparedSiweMessage,
  fetchSiweNonce,
} from './live-auth';
import type {
  Eip712Field,
  IndexedOperation,
  PreparedHttpRequest,
} from './types';
import { payloadTypeFromPrimaryType } from './utils';
import { buildEip712Artifacts } from './eip712-request';

const DEFAULT_EIP712_CHAIN = 1;

function buildSignerPlaceholder(value: string | null): string {
  return value ?? '<fill externally>';
}

function scorePrimaryTypeCandidate(args: {
  primaryType: string;
  types: Record<string, Eip712Field[]>;
  payload: Record<string, unknown>;
}): number {
  const payloadType = payloadTypeFromPrimaryType(args.primaryType);
  const payloadFields = payloadType ? (args.types[payloadType] ?? []) : [];

  if (payloadFields.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const expectedKeys = new Set(payloadFields.map((field) => field.name));
  const providedKeys = Object.keys(args.payload);
  const matchCount = providedKeys.filter((key) => expectedKeys.has(key)).length;
  const extraCount = providedKeys.filter(
    (key) => !expectedKeys.has(key),
  ).length;
  const missingCount = [...expectedKeys].filter(
    (key) => !providedKeys.includes(key),
  ).length;

  return matchCount * 4 - extraCount * 5 - missingCount;
}

export function selectPrimaryType(args: {
  acceptedPrimaryTypes: string[];
  types: Record<string, Eip712Field[]>;
  payload: Record<string, unknown>;
  requestedPrimaryType?: string | null;
}): string {
  if (args.acceptedPrimaryTypes.length === 0) {
    throw new Error('No accepted primary types were returned for this method.');
  }

  if (args.requestedPrimaryType) {
    if (!args.acceptedPrimaryTypes.includes(args.requestedPrimaryType)) {
      throw new Error(
        `Primary type ${args.requestedPrimaryType} is not accepted. Allowed values: ${args.acceptedPrimaryTypes.join(', ')}`,
      );
    }

    return args.requestedPrimaryType;
  }

  if (args.acceptedPrimaryTypes.length === 1) {
    return args.acceptedPrimaryTypes[0];
  }

  const ranked = args.acceptedPrimaryTypes
    .map((primaryType, index) => ({
      primaryType,
      index,
      score: scorePrimaryTypeCandidate({
        primaryType,
        types: args.types,
        payload: args.payload,
      }),
    }))
    .sort(
      (left, right) => right.score - left.score || left.index - right.index,
    );

  return ranked[0]?.primaryType ?? args.acceptedPrimaryTypes[0];
}

export async function prepareEip712Request(args: {
  env: string;
  operation: IndexedOperation;
  payload: Record<string, unknown>;
  pathParams: Record<string, unknown>;
  timeoutMs: number;
  chain?: number | null;
  signerAddress?: string | null;
  primaryType?: string | null;
  timestamp?: number | null;
  nonce?: string | null;
}): Promise<Record<string, unknown>> {
  if (!args.operation.hasEip712) {
    throw new Error(
      `Operation ${args.operation.operationId} does not require EIP-712 authentication.`,
    );
  }

  const chain = args.chain ?? DEFAULT_EIP712_CHAIN;
  const domainResult = await fetchEip712Domain({
    env: args.env,
    chain,
    timeoutMs: args.timeoutMs,
  });
  const methodTypesResult = await fetchEip712TypesForMethod({
    env: args.env,
    method: args.operation.operationId,
    timeoutMs: args.timeoutMs,
  });

  if (!methodTypesResult.response.found) {
    throw new Error(
      `No live EIP-712 types were found for ${args.operation.operationId}.`,
    );
  }

  const selectedPrimaryType = selectPrimaryType({
    acceptedPrimaryTypes: methodTypesResult.response.acceptedPrimaryTypes,
    types: methodTypesResult.response.types,
    payload: args.payload,
    requestedPrimaryType: args.primaryType ?? null,
  });
  const artifacts = buildEip712Artifacts({
    operation: args.operation,
    payload: args.payload,
    pathParams: args.pathParams,
    timestamp: args.timestamp ?? Math.floor(Date.now() / 1000),
    nonce: args.nonce ?? `0x${randomBytes(32).toString('hex')}`,
    domain: domainResult.response,
    types: methodTypesResult.response.types,
    primaryType: selectedPrimaryType,
  });

  return {
    env: args.env,
    operationId: args.operation.operationId,
    method: args.operation.method,
    path: args.operation.path,
    authKind: args.operation.authKind,
    authMode: args.operation.authMode,
    preparationMode: 'eip712',
    helperRequests: {
      getEip712Domain: domainResult.request,
      getEip712TypesForMethod: methodTypesResult.request,
    },
    domainRequestChain: chain,
    domain: artifacts.typedData.domain,
    acceptedPrimaryTypes: methodTypesResult.response.acceptedPrimaryTypes,
    primaryType: artifacts.typedData.primaryType,
    payloadType: payloadTypeFromPrimaryType(artifacts.typedData.primaryType),
    types: artifacts.typedData.types,
    envelope: artifacts.envelope,
    typedData: artifacts.typedData,
    signatureRequest: {
      method: 'eth_signTypedData_v4',
      signerAddress: buildSignerPlaceholder(args.signerAddress ?? null),
      typedData: artifacts.typedData,
    },
    signatureHeadersTemplate: {
      'x-namefi-signer': buildSignerPlaceholder(args.signerAddress ?? null),
      'x-namefi-signature': '<fill externally>',
      'x-namefi-eip712-type': artifacts.typedData.primaryType,
    },
    request: {
      ...artifacts.request,
      headers: {
        ...artifacts.request.headers,
        'x-namefi-signer': buildSignerPlaceholder(args.signerAddress ?? null),
        'x-namefi-signature': '<fill externally>',
        'x-namefi-eip712-type': artifacts.typedData.primaryType,
      },
    },
  };
}

export async function prepareSiweAuthentication(args: {
  env: string;
  operation: IndexedOperation;
  payload: Record<string, unknown>;
  pathParams: Record<string, unknown>;
  timeoutMs: number;
  signerAddress: string;
  chain?: number | null;
}): Promise<Record<string, unknown>> {
  const request = buildHttpRequest({
    operation: args.operation,
    payload: args.payload,
    pathParams: args.pathParams,
  });
  const allowedChainsResult = await fetchAllowedChains({
    env: args.env,
    timeoutMs: args.timeoutMs,
  });
  const selectedChainId = args.chain ?? allowedChainsResult.response[0] ?? 1;

  if (
    allowedChainsResult.response.length > 0 &&
    !allowedChainsResult.response.includes(selectedChainId)
  ) {
    throw new Error(
      `Chain ${selectedChainId} is not allowed for SIWE in ${args.env}. Allowed values: ${allowedChainsResult.response.join(', ')}`,
    );
  }

  const nonceResult = await fetchSiweNonce({
    env: args.env,
    signerAddress: args.signerAddress,
    timeoutMs: args.timeoutMs,
  });

  if (!nonceResult.response.valid) {
    throw new Error(`Failed to get SIWE nonce: ${nonceResult.response.error}`);
  }

  const messageResult = await fetchPreparedSiweMessage({
    env: args.env,
    signerAddress: args.signerAddress,
    nonce: nonceResult.response.nonce,
    chainId: selectedChainId,
    timeoutMs: args.timeoutMs,
  });

  if (!messageResult.response.valid) {
    throw new Error(
      `Failed to prepare SIWE message: ${messageResult.response.error}`,
    );
  }

  const verifyRequest = await buildVerifySiweRequest({
    env: args.env,
    signerAddress: args.signerAddress,
    message: messageResult.response.message,
  });

  return {
    env: args.env,
    operationId: args.operation.operationId,
    method: args.operation.method,
    path: args.operation.path,
    authKind: args.operation.authKind,
    authMode: args.operation.authMode,
    preparationMode: 'siwe',
    allowedChainsRequest: allowedChainsResult.request,
    allowedChains: allowedChainsResult.response,
    selectedChainId,
    nonceRequest: nonceResult.request,
    nonce: nonceResult.response.nonce,
    prepareMessageRequest: messageResult.request,
    message: messageResult.response.message,
    messageString: messageResult.response.messageString,
    signingRequest: {
      method: 'personal_sign',
      signerAddress: args.signerAddress,
      message: messageResult.response.messageString,
    },
    verifyRequest,
    tokenHeader: 'x-namefi-siwe-token',
    request: {
      ...request,
      headers: {
        ...request.headers,
        'x-namefi-siwe-token': '<fill after verify>',
      },
    },
  };
}
