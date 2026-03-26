import type {
  Eip712Domain,
  Eip712Field,
  IndexedOperation,
  PreparedEip712Artifacts,
} from './types';
import {
  joinUrl,
  payloadTypeFromPrimaryType,
  resolvePathTemplate,
} from './utils';

export function buildEip712Artifacts(args: {
  operation: IndexedOperation;
  payload: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  timestamp: number;
  nonce: string;
  domain: Eip712Domain;
  types: Record<string, Eip712Field[]>;
  primaryType: string;
}): PreparedEip712Artifacts {
  const { operation, payload, timestamp, nonce } = args;
  const payloadType = payloadTypeFromPrimaryType(args.primaryType);

  if (!payloadType) {
    throw new Error(
      `Primary type ${args.primaryType} is not a valid envelope type.`,
    );
  }

  if (Number.isNaN(timestamp)) {
    throw new Error('Timestamp must be a valid integer.');
  }

  const envelope = {
    payloadType,
    payload,
    timestamp,
    nonce,
  };
  const typedData = {
    domain: args.domain,
    types: args.types,
    primaryType: args.primaryType,
    message: envelope,
  };
  const { resolvedPath, missingPathParams } = resolvePathTemplate(
    operation.path,
    args.pathParams ?? {},
  );

  return {
    envelope,
    typedData,
    request: {
      method: operation.method,
      path: operation.path,
      resolvedPath,
      url: joinUrl(operation.requestBaseUrl, resolvedPath),
      headers: {
        'Content-Type': 'application/json',
        'x-namefi-eip712-type': args.primaryType,
      },
      missingPathParams,
      body: envelope,
    },
  };
}
