import type { IndexedOperation, PreparedHttpRequest } from './types';
import { joinUrl, resolvePathTemplate } from './utils';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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

  if (typeof value === 'object') {
    searchParams.append(key, JSON.stringify(value));
    return;
  }

  searchParams.append(key, String(value));
}

function buildQueryString(payload: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    appendQueryValue(searchParams, key, value);
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

export function buildHttpRequest(args: {
  operation: IndexedOperation;
  payload?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  headers?: Record<string, string>;
}): PreparedHttpRequest {
  const payload = args.payload ?? {};
  const method = args.operation.method.toUpperCase();
  const { resolvedPath, missingPathParams } = resolvePathTemplate(
    args.operation.path,
    args.pathParams ?? {},
  );
  const hasBody = BODY_METHODS.has(method);
  const resolvedPathWithQuery = hasBody
    ? resolvedPath
    : `${resolvedPath}${buildQueryString(payload)}`;

  return {
    method,
    path: args.operation.path,
    resolvedPath: resolvedPathWithQuery,
    url: joinUrl(args.operation.requestBaseUrl, resolvedPathWithQuery),
    headers: {
      'Content-Type': 'application/json',
      ...(args.headers ?? {}),
    },
    missingPathParams,
    body: hasBody ? payload : null,
  };
}
