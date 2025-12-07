/**
 * EPP Error System
 *
 * Inspired by Prisma's error hierarchy:
 * - EppError (base)
 *   - EppKnownError (errors with EPP result codes)
 *     - EppObjectExistsError
 *     - EppObjectNotFoundError
 *     - EppAuthenticationError
 *     - EppAuthorizationError
 *     - EppStatusProhibitsError
 *     - EppBillingError
 *     - EppTransferError
 *     - EppValidationError
 *     - EppCommandError
 *   - EppUnknownError (unexpected errors)
 *   - EppTransportError (connection/network errors)
 *   - EppProtocolError (XML/parsing errors)
 */

import type {
  EppResultCode,
  EppResult,
  EppTransactionId,
} from '../protocol/core/types';

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Base class for all EPP errors.
 * Never thrown directly - use specific subclasses.
 */
export abstract class EppError extends Error {
  /** Error code for programmatic handling */
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
    this.name = this.constructor.name;
    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ============================================================================
// Unknown Error (Unexpected)
// ============================================================================

/**
 * Unexpected error that doesn't fit known categories.
 * Usually indicates a bug or unexpected registry behavior.
 */
export class EppUnknownError extends EppError {
  readonly code = 'EPP_UNKNOWN_ERROR' as const;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
  }
}

// ============================================================================
// Transport Error (Connection/Network)
// ============================================================================

/**
 * Connection or network-level error.
 * Occurs before EPP protocol communication.
 */
export class EppTransportError extends EppError {
  readonly code = 'EPP_TRANSPORT_ERROR' as const;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
  }
}

// ============================================================================
// Protocol Error (XML/Parsing)
// ============================================================================

/**
 * XML parsing or protocol-level error.
 * The response was received but couldn't be parsed.
 */
export class EppProtocolError extends EppError {
  readonly code = 'EPP_PROTOCOL_ERROR' as const;

  constructor(
    message: string,
    public readonly rawXml?: string,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
  }
}

// ============================================================================
// Known Error Base (Has EPP Result Code)
// ============================================================================

export interface EppKnownErrorMeta {
  resultCode: EppResultCode;
  results?: EppResult[];
  trID?: EppTransactionId;
}

/**
 * Base class for errors with known EPP result codes.
 * Provides structured error information from the registry.
 */
export abstract class EppKnownError extends EppError {
  /** EPP result code (e.g., 2302, 2303) */
  readonly resultCode: EppResultCode;
  /** Full EPP result objects */
  readonly results?: EppResult[];
  /** Transaction IDs */
  readonly trID?: EppTransactionId;

  constructor(message: string, meta: EppKnownErrorMeta) {
    super(message);
    this.resultCode = meta.resultCode;
    this.results = meta.results;
    this.trID = meta.trID;
  }
}

// ============================================================================
// Specific Known Errors
// ============================================================================

/**
 * Object already exists (code 2302).
 * e.g., trying to create a domain that's already registered.
 */
export class EppObjectExistsError extends EppKnownError {
  readonly code = 'EPP_OBJECT_EXISTS' as const;

  constructor(
    public readonly objectType: 'domain' | 'contact' | 'host' | 'unknown',
    public readonly objectId: string,
    meta: EppKnownErrorMeta,
  ) {
    super(`${objectType} '${objectId}' already exists`, meta);
  }
}

/**
 * Object does not exist (code 2303).
 * e.g., trying to renew a domain that doesn't exist.
 */
export class EppObjectNotFoundError extends EppKnownError {
  readonly code = 'EPP_OBJECT_NOT_FOUND' as const;

  constructor(
    public readonly objectType: 'domain' | 'contact' | 'host' | 'unknown',
    public readonly objectId: string,
    meta: EppKnownErrorMeta,
  ) {
    super(`${objectType} '${objectId}' does not exist`, meta);
  }
}

/**
 * Authentication error (code 2200).
 * Invalid credentials or session issue.
 */
export class EppAuthenticationError extends EppKnownError {
  readonly code = 'EPP_AUTHENTICATION_ERROR' as const;

  constructor(message: string, meta: EppKnownErrorMeta) {
    super(message, meta);
  }
}

/**
 * Authorization error (code 2201).
 * Not authorized to perform operation on this object.
 */
export class EppAuthorizationError extends EppKnownError {
  readonly code = 'EPP_AUTHORIZATION_ERROR' as const;

  constructor(
    public readonly objectId: string,
    public readonly operation: string,
    meta: EppKnownErrorMeta,
  ) {
    super(`Not authorized to ${operation} '${objectId}'`, meta);
  }
}

/**
 * Invalid authorization info (code 2202).
 * e.g., wrong auth code for transfer.
 */
export class EppInvalidAuthInfoError extends EppKnownError {
  readonly code = 'EPP_INVALID_AUTH_INFO' as const;

  constructor(
    public readonly objectId: string,
    meta: EppKnownErrorMeta,
  ) {
    super(`Invalid authorization info for '${objectId}'`, meta);
  }
}

/**
 * Object status prohibits operation (code 2304).
 * e.g., trying to transfer a locked domain.
 */
export class EppStatusProhibitsError extends EppKnownError {
  readonly code = 'EPP_STATUS_PROHIBITS' as const;

  constructor(
    public readonly objectId: string,
    public readonly operation: string,
    public readonly prohibitingStatuses?: string[],
    meta?: EppKnownErrorMeta,
  ) {
    const statusMsg = prohibitingStatuses?.length
      ? ` (statuses: ${prohibitingStatuses.join(', ')})`
      : '';
    super(
      `Object status prohibits ${operation} on '${objectId}'${statusMsg}`,
      meta ?? { resultCode: 2304 as EppResultCode },
    );
  }
}

/**
 * Billing failure (code 2104).
 * Insufficient funds or billing issue.
 */
export class EppBillingError extends EppKnownError {
  readonly code = 'EPP_BILLING_ERROR' as const;

  constructor(
    public readonly operation: string,
    meta: EppKnownErrorMeta,
  ) {
    super(`Billing failure for ${operation}`, meta);
  }
}

/**
 * Transfer-related errors (codes 2300, 2301, 2106).
 */
export class EppTransferError extends EppKnownError {
  readonly code = 'EPP_TRANSFER_ERROR' as const;

  constructor(
    public readonly objectId: string,
    public readonly transferState: 'pending' | 'not_pending' | 'not_eligible',
    meta: EppKnownErrorMeta,
  ) {
    const stateMsg = {
      pending: 'already has a pending transfer',
      not_pending: 'does not have a pending transfer',
      not_eligible: 'is not eligible for transfer',
    }[transferState];
    super(`Domain '${objectId}' ${stateMsg}`, meta);
  }
}

/**
 * Validation/syntax error (codes 2001-2005, 2306).
 * Invalid parameter values or syntax.
 */
export class EppValidationError extends EppKnownError {
  readonly code = 'EPP_VALIDATION_ERROR' as const;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: string,
    meta?: EppKnownErrorMeta,
  ) {
    super(message, meta ?? { resultCode: 2005 as EppResultCode });
  }
}

/**
 * Generic command error for codes not covered by specific types.
 */
export class EppCommandFailedError extends EppKnownError {
  readonly code = 'EPP_COMMAND_FAILED' as const;

  constructor(message: string, meta: EppKnownErrorMeta) {
    super(message, meta);
  }
}

/**
 * Object not eligible for renewal (code 2105).
 */
export class EppNotEligibleForRenewalError extends EppKnownError {
  readonly code = 'EPP_NOT_ELIGIBLE_FOR_RENEWAL' as const;

  constructor(
    public readonly objectId: string,
    meta: EppKnownErrorMeta,
  ) {
    super(`Domain '${objectId}' is not eligible for renewal`, meta);
  }
}

/**
 * Session limit exceeded (code 2502).
 */
export class EppSessionLimitError extends EppKnownError {
  readonly code = 'EPP_SESSION_LIMIT' as const;

  constructor(meta: EppKnownErrorMeta) {
    super('Session limit exceeded', meta);
  }
}

// ============================================================================
// Error Factory
// ============================================================================

export interface CreateEppErrorOptions {
  resultCode: EppResultCode;
  message: string;
  results?: EppResult[];
  trID?: EppTransactionId;
  objectType?: 'domain' | 'contact' | 'host' | 'unknown';
  objectId?: string;
  operation?: string;
}

/**
 * Create the appropriate EppError subclass based on result code.
 */
export function createEppError(options: CreateEppErrorOptions): EppKnownError {
  const {
    resultCode,
    message,
    results,
    trID,
    objectType,
    objectId,
    operation,
  } = options;
  const meta: EppKnownErrorMeta = { resultCode, results, trID };

  switch (resultCode) {
    // Object exists
    case 2302:
      return new EppObjectExistsError(
        objectType ?? 'unknown',
        objectId ?? 'unknown',
        meta,
      );

    // Object not found
    case 2303:
      return new EppObjectNotFoundError(
        objectType ?? 'unknown',
        objectId ?? 'unknown',
        meta,
      );

    // Authentication error
    case 2200:
    case 2501:
      return new EppAuthenticationError(message, meta);

    // Authorization error
    case 2201:
      return new EppAuthorizationError(
        objectId ?? 'unknown',
        operation ?? 'operation',
        meta,
      );

    // Invalid auth info
    case 2202:
      return new EppInvalidAuthInfoError(objectId ?? 'unknown', meta);

    // Status prohibits
    case 2304:
      return new EppStatusProhibitsError(
        objectId ?? 'unknown',
        operation ?? 'operation',
        undefined,
        meta,
      );

    // Billing failure
    case 2104:
      return new EppBillingError(operation ?? 'operation', meta);

    // Transfer errors
    case 2300:
      return new EppTransferError(objectId ?? 'unknown', 'pending', meta);
    case 2301:
      return new EppTransferError(objectId ?? 'unknown', 'not_pending', meta);
    case 2106:
      return new EppTransferError(objectId ?? 'unknown', 'not_eligible', meta);

    // Not eligible for renewal
    case 2105:
      return new EppNotEligibleForRenewalError(objectId ?? 'unknown', meta);

    // Session limit
    case 2502:
      return new EppSessionLimitError(meta);

    // Validation errors
    case 2001:
    case 2002:
    case 2003:
    case 2004:
    case 2005:
    case 2306:
      return new EppValidationError(message, undefined, undefined, meta);

    // Default to generic command failed
    default:
      return new EppCommandFailedError(message, meta);
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isEppError(error: unknown): error is EppError {
  return error instanceof EppError;
}

export function isEppKnownError(error: unknown): error is EppKnownError {
  return error instanceof EppKnownError;
}

export function isEppObjectExistsError(
  error: unknown,
): error is EppObjectExistsError {
  return error instanceof EppObjectExistsError;
}

export function isEppObjectNotFoundError(
  error: unknown,
): error is EppObjectNotFoundError {
  return error instanceof EppObjectNotFoundError;
}

export function isEppAuthenticationError(
  error: unknown,
): error is EppAuthenticationError {
  return error instanceof EppAuthenticationError;
}

export function isEppAuthorizationError(
  error: unknown,
): error is EppAuthorizationError {
  return error instanceof EppAuthorizationError;
}

export function isEppStatusProhibitsError(
  error: unknown,
): error is EppStatusProhibitsError {
  return error instanceof EppStatusProhibitsError;
}

export function isEppTransportError(
  error: unknown,
): error is EppTransportError {
  return error instanceof EppTransportError;
}

export function isEppProtocolError(error: unknown): error is EppProtocolError {
  return error instanceof EppProtocolError;
}

// ============================================================================
// Error Code Constants
// ============================================================================

export const EppErrorCodes = {
  // Base errors
  UNKNOWN_ERROR: 'EPP_UNKNOWN_ERROR',
  TRANSPORT_ERROR: 'EPP_TRANSPORT_ERROR',
  PROTOCOL_ERROR: 'EPP_PROTOCOL_ERROR',

  // Known errors
  OBJECT_EXISTS: 'EPP_OBJECT_EXISTS',
  OBJECT_NOT_FOUND: 'EPP_OBJECT_NOT_FOUND',
  AUTHENTICATION_ERROR: 'EPP_AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'EPP_AUTHORIZATION_ERROR',
  INVALID_AUTH_INFO: 'EPP_INVALID_AUTH_INFO',
  STATUS_PROHIBITS: 'EPP_STATUS_PROHIBITS',
  BILLING_ERROR: 'EPP_BILLING_ERROR',
  TRANSFER_ERROR: 'EPP_TRANSFER_ERROR',
  VALIDATION_ERROR: 'EPP_VALIDATION_ERROR',
  COMMAND_FAILED: 'EPP_COMMAND_FAILED',
  NOT_ELIGIBLE_FOR_RENEWAL: 'EPP_NOT_ELIGIBLE_FOR_RENEWAL',
  SESSION_LIMIT: 'EPP_SESSION_LIMIT',
} as const;

export type EppErrorCode = (typeof EppErrorCodes)[keyof typeof EppErrorCodes];
