import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/unstable-core-do-not-import';
import {
  // JSONRPC2_TO_HTTP_CODE,
  // HTTP_CODE_TO_JSONRPC2 as HTTP_STATUS_TO_TRPC_CODE,
  // getStatusCodeFromKey,
  getStatusKeyFromCode,
} from '@trpc/server/unstable-core-do-not-import';
import { ORPCError } from '@orpc/server';
import { z, ZodError } from 'zod';

// ============ Zod Schemas ============

export const TrpcErrorCodeSchema = z.enum([
  'PARSE_ERROR',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'PAYMENT_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_SUPPORTED',
  'TIMEOUT',
  'CONFLICT',
  'PRECONDITION_FAILED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'UNPROCESSABLE_CONTENT',
  'TOO_MANY_REQUESTS',
  'CLIENT_CLOSED_REQUEST',
  'INTERNAL_SERVER_ERROR',
  'NOT_IMPLEMENTED',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
]);

export type TrpcErrorCode = z.infer<typeof TrpcErrorCodeSchema>;

export const ValidationErrorDataSchema = z.object({
  formErrors: z.array(z.string()),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
});

export type ValidationErrorData = z.infer<typeof ValidationErrorDataSchema>;

export const OrpcErrorDataSchema = z.object({
  code: z.string(),
  status: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

export type OrpcErrorData = z.infer<typeof OrpcErrorDataSchema>;

// ============ Converter Functions ============

/**
 * Converts a TRPCError to an ORPCError with the correct HTTP status code.
 * Special handling for ZodError in the cause chain - returns INPUT_VALIDATION_FAILED (422).
 */
export function toOrpcError(trpcError: TRPCError): ORPCError<string, unknown> {
  const status = getHTTPStatusCodeFromError(trpcError);

  // Special handling for ZodError validation errors
  if (trpcError.cause instanceof ZodError) {
    return new ORPCError('INPUT_VALIDATION_FAILED', {
      status: 422,
      message: trpcError.message,
      data: trpcError.cause.flatten(),
      cause: trpcError.cause,
    });
  }

  return new ORPCError(trpcError.code, {
    status,
    message: trpcError.message,
    cause: trpcError,
  });
}

/**
 * Converts an ORPCError to a TRPCError.
 * Attempts to match the ORPC code directly to a tRPC code,
 * otherwise falls back to inferring from HTTP status.
 */
export function toTrpcError(orpcError: ORPCError<string, unknown>): TRPCError {
  // Try direct code match first
  const parseResult = TrpcErrorCodeSchema.safeParse(orpcError.code);

  let code: TRPC_ERROR_CODE_KEY;
  if (parseResult.success) {
    code = parseResult.data;
  } else {
    // Fall back to status-based lookup
    code = getStatusKeyFromCode(orpcError.status) ?? 'INTERNAL_SERVER_ERROR';
  }

  return new TRPCError({
    code,
    message: orpcError.message,
    cause: orpcError.cause,
  });
}

/**
 * Creates an interceptor function for use with ORPC's onError.
 * Catches ORPCErrors that wrap TRPCErrors and re-throws them as properly mapped ORPCErrors.
 */
export function createTrpcToOrpcErrorInterceptor() {
  return (error: Error) => {
    if (error instanceof ORPCError && error.cause instanceof TRPCError) {
      throw toOrpcError(error.cause);
    }
  };
}
