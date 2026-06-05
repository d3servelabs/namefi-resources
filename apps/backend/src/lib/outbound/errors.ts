import { TRPCError } from '@trpc/server';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/unstable-core-do-not-import';

export type OutboundApiErrorCode =
  | 'OUTBOUND_BAD_REQUEST'
  | 'OUTBOUND_UNAUTHORIZED'
  | 'OUTBOUND_FORBIDDEN'
  | 'OUTBOUND_NOT_FOUND'
  | 'OUTBOUND_PAYMENT_REQUIRED'
  | 'OUTBOUND_CONFLICT'
  | 'OUTBOUND_TEMPORARILY_UNAVAILABLE'
  | 'OUTBOUND_INTERNAL_ERROR';

export type OutboundApiErrorPayload = {
  publicApiError: true;
  error: {
    code: OutboundApiErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
};

export function isOutboundApiErrorPayload(
  value: unknown,
): value is OutboundApiErrorPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as {
    publicApiError?: unknown;
    error?: {
      code?: unknown;
      message?: unknown;
      retryable?: unknown;
    };
  };

  return (
    payload.publicApiError === true &&
    !!payload.error &&
    typeof payload.error.code === 'string' &&
    typeof payload.error.message === 'string' &&
    typeof payload.error.retryable === 'boolean'
  );
}

export function createOutboundApiError({
  code,
  trpcCode,
  message,
  retryable = false,
  details,
}: {
  code: OutboundApiErrorCode;
  trpcCode: TRPC_ERROR_CODE_KEY;
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}): TRPCError {
  return new TRPCError({
    code: trpcCode,
    message,
    cause: {
      publicApiError: true,
      error: {
        code,
        message,
        retryable,
        ...(details ? { details } : {}),
      },
    } satisfies OutboundApiErrorPayload,
  });
}
