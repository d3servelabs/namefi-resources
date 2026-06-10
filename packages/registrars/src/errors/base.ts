/**
 * Registrar Error System - Base Classes
 *
 * Inspired by Prisma's error hierarchy:
 * - RegistrarError (base)
 *   - RegistrarKnownError (errors with registrar-specific codes)
 *   - RegistrarUnknownError (unexpected errors)
 *   - RegistrarTransportError (connection/network errors)
 *   - RegistrarRateLimitError (throttling/rate limits)
 */

import type { Registrars } from '../registrars/registrars-keys';
import { RegistrarErrorCodes } from './codes';

// ============================================================================
// Metadata Interfaces
// ============================================================================

/**
 * Base metadata for all registrar errors.
 */
export interface RegistrarErrorMeta {
  /** The registrar that produced this error */
  registrarKey: Registrars;
  /** Domain name involved in the operation (if applicable) */
  domainName?: string;
  /** Operation being performed when the error occurred */
  operation?: string;
  /** Original error from the registrar's API/protocol */
  originalError?: unknown;
  /** Timestamp when the error occurred */
  timestamp: Date;
}

/**
 * Extended metadata for known errors with registrar-specific codes.
 */
export interface RegistrarKnownErrorMeta extends RegistrarErrorMeta {
  /** Native error code from the registrar (EPP code, AWS exception name, Dynadot response code) */
  nativeCode?: string | number;
  /** Native response data from the registrar */
  nativeResponse?: unknown;
}

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Base class for all registrar errors.
 * Never thrown directly - use specific subclasses.
 */
export abstract class RegistrarError extends Error {
  /** Error code for programmatic handling */
  abstract readonly code: string;
  /** The registrar that produced this error */
  readonly registrarKey: Registrars;
  /** Domain name involved in the operation (if applicable) */
  readonly domainName?: string;
  /** Operation being performed when the error occurred */
  readonly operation?: string;
  /** Original error from the registrar's API/protocol */
  readonly originalError?: unknown;
  /** Timestamp when the error occurred */
  readonly timestamp: Date;

  constructor(
    message: string,
    meta: RegistrarErrorMeta,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
    this.name = this.constructor.name;
    this.registrarKey = meta.registrarKey;
    this.domainName = meta.domainName;
    this.operation = meta.operation;
    this.originalError = meta.originalError;
    this.timestamp = meta.timestamp;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for logging/transport.
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      registrarKey: this.registrarKey,
      domainName: this.domainName,
      operation: this.operation,
      timestamp: this.timestamp.toISOString(),
      cause: this.serializeCause(),
    };
  }

  /**
   * Reduce the cause (original error) to a logging-safe shape:
   * - `Error` → `{ name, message, code? }` (no stack, avoids circular structures)
   * - nested `RegistrarError` → its own `toJSON()`
   * - anything else (e.g. a raw provider response) → returned as-is
   */
  private serializeCause(): unknown {
    const cause = (this as Error & { cause?: unknown }).cause;
    if (cause === undefined) {
      return undefined;
    }
    if (cause instanceof RegistrarError) {
      return cause.toJSON();
    }
    if (cause instanceof Error) {
      const code = (cause as { code?: unknown }).code;
      return {
        name: cause.name,
        message: cause.message,
        ...(typeof code === 'string' || typeof code === 'number'
          ? { code }
          : {}),
      };
    }
    return cause;
  }

  /**
   * Context fields rendered inline by {@link toString}. Subclasses override to
   * surface type-specific details (native code, retry delay, ...).
   */
  protected describeContext(): string[] {
    const context = [`registrar=${this.registrarKey}`];
    if (this.domainName) {
      context.push(`domain=${this.domainName}`);
    }
    if (this.operation) {
      context.push(`operation=${this.operation}`);
    }
    return context;
  }

  /**
   * Single-line, log-friendly representation that includes the error code and
   * context, e.g. used by `String(error)` and template interpolation.
   *
   * `RegistrarDomainNotFoundError [REGISTRAR_DOMAIN_NOT_FOUND] (registrar=route53, domain=example.com): Domain 'example.com' does not exist`
   */
  override toString(): string {
    const context = this.describeContext();
    const suffix = context.length > 0 ? ` (${context.join(', ')})` : '';
    return `${this.name} [${this.code}]${suffix}: ${this.message}`;
  }
}

// ============================================================================
// Known Error Base
// ============================================================================

/**
 * Base class for errors with known registrar-specific codes.
 * Provides structured error information from the registrar.
 */
export abstract class RegistrarKnownError extends RegistrarError {
  /** Native error code from the registrar */
  readonly nativeCode?: string | number;
  /** Native response data from the registrar */
  readonly nativeResponse?: unknown;

  constructor(message: string, meta: RegistrarKnownErrorMeta) {
    super(message, meta, { cause: meta.originalError });
    this.nativeCode = meta.nativeCode;
    this.nativeResponse = meta.nativeResponse;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      nativeCode: this.nativeCode,
    };
  }

  protected override describeContext(): string[] {
    const context = super.describeContext();
    if (this.nativeCode !== undefined) {
      context.push(`native=${this.nativeCode}`);
    }
    return context;
  }
}

// ============================================================================
// Non-Protocol Errors
// ============================================================================

/**
 * Unexpected error that doesn't fit known categories.
 * Usually indicates a bug or unexpected registrar behavior.
 */
export class RegistrarUnknownError extends RegistrarError {
  readonly code = RegistrarErrorCodes.UNKNOWN_ERROR;

  constructor(message: string, meta: RegistrarErrorMeta) {
    super(message, meta, { cause: meta.originalError });
  }
}

/**
 * Connection or network-level error.
 * Occurs before registrar protocol communication.
 */
export class RegistrarTransportError extends RegistrarError {
  readonly code = RegistrarErrorCodes.TRANSPORT_ERROR;

  constructor(message: string, meta: RegistrarErrorMeta) {
    super(message, meta, { cause: meta.originalError });
  }
}

/**
 * Rate limiting or throttling error.
 * The registrar has rejected the request due to too many requests.
 */
export class RegistrarRateLimitError extends RegistrarError {
  readonly code = RegistrarErrorCodes.RATE_LIMIT_ERROR;
  /** Suggested retry delay in milliseconds (if provided by registrar) */
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    meta: RegistrarErrorMeta,
    retryAfterMs?: number,
  ) {
    super(message, meta, { cause: meta.originalError });
    this.retryAfterMs = retryAfterMs;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      retryAfterMs: this.retryAfterMs,
    };
  }

  protected override describeContext(): string[] {
    const context = super.describeContext();
    if (this.retryAfterMs !== undefined) {
      context.push(`retryAfterMs=${this.retryAfterMs}`);
    }
    return context;
  }
}
