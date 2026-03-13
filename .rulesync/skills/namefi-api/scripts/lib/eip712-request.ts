import type { IndexedOperation, PreparedEip712Artifacts } from './types';
import { joinUrl, resolvePathTemplate } from './utils';

export function buildEip712Artifacts(args: {
  operation: IndexedOperation;
  payload: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  timestamp: number;
  nonce: string;
}): PreparedEip712Artifacts {
  const { operation, payload, timestamp, nonce } = args;

  if (
    !operation.primaryType ||
    !operation.payloadType ||
    !operation.eip712Types
  ) {
    throw new Error(
      `Operation ${operation.operationId} does not have resolved EIP-712 metadata.`,
    );
  }

  if (Number.isNaN(timestamp)) {
    throw new Error('Timestamp must be a valid integer.');
  }

  const envelope = {
    payloadType: operation.payloadType,
    payload,
    timestamp,
    nonce,
  };
  const typedData = {
    domain: {
      name: 'Namefi',
      version: '1',
    },
    types: operation.eip712Types,
    primaryType: operation.primaryType,
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
        'x-namefi-eip712-type': operation.primaryType,
      },
      missingPathParams,
      body: envelope,
    },
  };
}
