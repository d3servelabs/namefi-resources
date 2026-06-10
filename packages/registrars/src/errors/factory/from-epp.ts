/**
 * EPP / CentralNic Error Factory
 *
 * Maps EPP errors from @namefi-astra/epp-client to registrar errors.
 * This wraps the existing EPP error system to provide a consistent registrar error interface.
 */

import {
  EppError,
  EppKnownError,
  EppObjectExistsError,
  EppObjectNotFoundError,
  EppAuthenticationError,
  EppAuthorizationError,
  EppInvalidAuthInfoError,
  EppStatusProhibitsError,
  EppBillingError,
  EppTransferError,
  EppValidationError,
  EppNotEligibleForRenewalError,
  EppSessionLimitError,
  EppTransportError,
  EppProtocolError,
  EppCommandFailedError,
} from '@namefi-astra/epp-client/errors';
import type { Registrars } from '../../registrars/registrars-keys';
import {
  RegistrarUnknownError,
  RegistrarTransportError,
  RegistrarRateLimitError,
  type RegistrarError,
  type RegistrarKnownErrorMeta,
} from '../base';
import {
  RegistrarDomainExistsError,
  RegistrarDomainNotFoundError,
  RegistrarAuthenticationError,
  RegistrarAuthorizationError,
  RegistrarInvalidAuthCodeError,
  RegistrarStatusProhibitsError,
  RegistrarBillingError,
  RegistrarTransferError,
  RegistrarValidationError,
  RegistrarNotEligibleForRenewalError,
  RegistrarOperationFailedError,
} from '../known';
import { isTransportError } from './transport';

/**
 * Options for creating a registrar error from an EPP error.
 */
export interface CreateFromEppOptions {
  /** The EPP error to convert */
  error: unknown;
  /** Domain name involved in the operation */
  domainName?: string;
  /** Operation being performed */
  operation?: string;
  /** The registrar key (defaults to 'centralnic') */
  registrarKey?: Registrars;
}

/**
 * Create a RegistrarError from an EPP error.
 */
export function createRegistrarErrorFromEpp(
  options: CreateFromEppOptions,
): RegistrarError {
  const rawError = options.error;
  const error =
    rawError instanceof Error
      ? rawError
      : new Error(
          rawError === undefined ? 'Unknown EPP error' : String(rawError),
        );
  const { domainName, operation, registrarKey = 'centralnic' } = options;

  const baseMeta = {
    registrarKey,
    domainName,
    operation,
    originalError: rawError,
    timestamp: new Date(),
  };

  // Handle non-EPP errors
  if (!(error instanceof EppError)) {
    // Check for network/transport errors
    if (isTransportError(error)) {
      return new RegistrarTransportError(error.message, baseMeta);
    }
    return new RegistrarUnknownError(error.message, baseMeta);
  }

  // Build metadata for known errors
  const knownMeta: RegistrarKnownErrorMeta =
    error instanceof EppKnownError
      ? {
          ...baseMeta,
          nativeCode: error.resultCode,
          nativeResponse: error.results,
        }
      : {
          ...baseMeta,
          nativeCode: error.code,
        };

  // Map EPP errors to Registrar errors
  if (error instanceof EppObjectExistsError) {
    return new RegistrarDomainExistsError(
      error.objectId ?? domainName ?? 'unknown',
      knownMeta,
    );
  }

  if (error instanceof EppObjectNotFoundError) {
    return new RegistrarDomainNotFoundError(
      error.objectId ?? domainName ?? 'unknown',
      knownMeta,
    );
  }

  if (error instanceof EppAuthenticationError) {
    return new RegistrarAuthenticationError(error.message, knownMeta);
  }

  if (error instanceof EppAuthorizationError) {
    return new RegistrarAuthorizationError(
      error.objectId ?? domainName ?? 'unknown',
      error.operation ?? operation ?? 'operation',
      knownMeta,
    );
  }

  if (error instanceof EppInvalidAuthInfoError) {
    return new RegistrarInvalidAuthCodeError(
      error.objectId ?? domainName ?? 'unknown',
      knownMeta,
    );
  }

  if (error instanceof EppStatusProhibitsError) {
    return new RegistrarStatusProhibitsError(
      error.objectId ?? domainName ?? 'unknown',
      error.operation ?? operation ?? 'operation',
      {
        ...knownMeta,
        prohibitingStatuses: error.prohibitingStatuses,
      },
    );
  }

  if (error instanceof EppBillingError) {
    return new RegistrarBillingError(
      error.operation ?? operation ?? 'operation',
      knownMeta,
    );
  }

  if (error instanceof EppTransferError) {
    return new RegistrarTransferError(
      error.objectId ?? domainName ?? 'unknown',
      error.transferState,
      knownMeta,
    );
  }

  if (error instanceof EppValidationError) {
    return new RegistrarValidationError(error.message, {
      ...knownMeta,
      field: error.field,
      value: error.value,
    });
  }

  if (error instanceof EppNotEligibleForRenewalError) {
    return new RegistrarNotEligibleForRenewalError(
      error.objectId ?? domainName ?? 'unknown',
      knownMeta,
    );
  }

  if (error instanceof EppSessionLimitError) {
    return new RegistrarRateLimitError(error.message, baseMeta);
  }

  if (error instanceof EppTransportError) {
    return new RegistrarTransportError(error.message, baseMeta);
  }

  if (error instanceof EppProtocolError) {
    return new RegistrarValidationError(`Protocol error: ${error.message}`, {
      ...knownMeta,
      nativeResponse: error.rawXml,
    });
  }

  if (error instanceof EppCommandFailedError) {
    return new RegistrarOperationFailedError(error.message, knownMeta);
  }

  // Default fallback for any other EppError
  return new RegistrarUnknownError(error.message, baseMeta);
}
