/**
 * Dynadot Error Factory
 *
 * Maps Dynadot API responses to registrar errors.
 * Dynadot uses simple response codes: '0' or '1' = success, '-1' or '5' = failure
 */

import type {
  DynadotResponseCode,
  DynadotResponseStatus,
} from '../../lib/dynadot/common-types';
import type { Registrars } from '../../registrars/registrars-keys';
import {
  RegistrarUnknownError,
  RegistrarRateLimitError,
  RegistrarTransportError,
  type RegistrarError,
  type RegistrarKnownErrorMeta,
} from '../base';
import {
  RegistrarDuplicateRequestError,
  RegistrarDomainNotFoundError,
  RegistrarAuthenticationError,
  RegistrarInvalidAuthCodeError,
  RegistrarValidationError,
  RegistrarStatusProhibitsError,
  RegistrarOperationFailedError,
  RegistrarDomainExistsError,
  RegistrarTransferError,
  RegistrarBillingError,
} from '../known';
import { isTransportError } from './transport';

/**
 * Dynadot error response shape.
 */
export interface DynadotErrorResponse {
  ResponseCode: DynadotResponseCode;
  Status?: DynadotResponseStatus | string;
  Error?: string;
}

/**
 * Options for creating a registrar error from a Dynadot response.
 */
export interface CreateFromDynadotOptions {
  /** The Dynadot response that indicates failure */
  response?: DynadotErrorResponse;
  /** A thrown runtime/network error */
  error?: unknown;
  /** Domain name involved in the operation */
  domainName?: string;
  /** Operation being performed */
  operation?: string;
  /** The registrar key (defaults to 'dynadot') */
  registrarKey?: Registrars;
}

/**
 * Create a RegistrarError from a Dynadot error response.
 */
export function createRegistrarErrorFromDynadot(
  options: CreateFromDynadotOptions,
): RegistrarError {
  const {
    response,
    error,
    domainName,
    operation,
    registrarKey = 'dynadot',
  } = options;

  const baseMeta = {
    registrarKey,
    domainName,
    operation,
    originalError: response ?? error,
    timestamp: new Date(),
  };

  if (!response) {
    const thrownError =
      error instanceof Error
        ? error
        : new Error(
            error === undefined ? 'Unknown Dynadot error' : String(error),
          );
    const message = thrownError.message ?? 'Unknown Dynadot error';
    const lowerMessage = message.toLowerCase();

    if (
      thrownError.name === 'NetworkingError' ||
      isTransportError(thrownError)
    ) {
      return new RegistrarTransportError(message, baseMeta);
    }

    if (
      lowerMessage.includes('threads busy') ||
      lowerMessage.includes('system busy')
    ) {
      return new RegistrarRateLimitError('Dynadot system is busy', baseMeta);
    }

    return new RegistrarUnknownError(message, baseMeta);
  }

  const knownMeta: RegistrarKnownErrorMeta = {
    ...baseMeta,
    nativeCode: response.ResponseCode,
    nativeResponse: response,
  };

  const errorMessage = response.Error ?? 'Unknown Dynadot error';
  const lowerError = errorMessage.toLowerCase();

  // Handle system busy / rate limiting
  if (response.Status === 'system_busy') {
    return new RegistrarRateLimitError('Dynadot system is busy', baseMeta);
  }

  // Map common Dynadot error messages to specific error types
  if (
    lowerError.includes('currently processing another request') ||
    lowerError.includes('already in progress')
  ) {
    return new RegistrarDuplicateRequestError(errorMessage, knownMeta);
  }

  if (
    lowerError.includes('could not find domain in your account') ||
    lowerError.includes('domain not found') ||
    lowerError.includes('not in your account')
  ) {
    return new RegistrarDomainNotFoundError(domainName ?? 'unknown', knownMeta);
  }

  if (
    lowerError.includes('invalid key') ||
    lowerError.includes('invalid api key') ||
    lowerError.includes('authentication')
  ) {
    return new RegistrarAuthenticationError(errorMessage, knownMeta);
  }

  if (
    lowerError.includes('domain must be in ascii') ||
    lowerError.includes('invalid domain') ||
    lowerError.includes('invalid parameter') ||
    lowerError.includes('invalid format')
  ) {
    return new RegistrarValidationError(errorMessage, knownMeta);
  }

  if (
    lowerError.includes("doesn't support dnssec") ||
    lowerError.includes('domain is locked') ||
    lowerError.includes('status prohibits') ||
    lowerError.includes('cannot be')
  ) {
    return new RegistrarStatusProhibitsError(
      domainName ?? 'unknown',
      operation ?? 'operation',
      knownMeta,
    );
  }

  if (
    lowerError.includes('domain already exists') ||
    lowerError.includes('already registered')
  ) {
    return new RegistrarDomainExistsError(domainName ?? 'unknown', knownMeta);
  }

  if (
    lowerError.includes('transfer') &&
    (lowerError.includes('pending') || lowerError.includes('in progress'))
  ) {
    return new RegistrarTransferError(
      domainName ?? 'unknown',
      'pending',
      knownMeta,
    );
  }

  if (
    lowerError.includes('auth code') ||
    lowerError.includes('authorization code') ||
    lowerError.includes('epp code')
  ) {
    return new RegistrarInvalidAuthCodeError(
      domainName ?? 'unknown',
      knownMeta,
    );
  }

  if (
    lowerError.includes('insufficient') ||
    lowerError.includes('balance') ||
    lowerError.includes('billing') ||
    lowerError.includes('payment')
  ) {
    return new RegistrarBillingError(operation ?? 'operation', knownMeta);
  }

  // Default to operation failed
  return new RegistrarOperationFailedError(errorMessage, knownMeta);
}

/**
 * Check if a Dynadot response indicates failure.
 * Useful for validation before creating an error.
 */
export function isDynadotResponseFailed(response: {
  ResponseCode: DynadotResponseCode;
}): boolean {
  const code = response.ResponseCode.toString();
  return code !== '0' && code !== '1';
}
