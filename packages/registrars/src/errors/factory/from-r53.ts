/**
 * AWS Route53 Domains Error Factory
 *
 * Maps AWS SDK exceptions to registrar errors.
 * AWS Route53 throws typed exceptions like DomainLimitExceeded, InvalidInput, etc.
 */

import { Route53DomainsServiceException } from '@aws-sdk/client-route-53-domains';
import type { Registrars } from '../../registrars/registrars-keys';
import {
  RegistrarUnknownError,
  RegistrarTransportError,
  RegistrarRateLimitError,
  type RegistrarError,
  type RegistrarKnownErrorMeta,
} from '../base';
import {
  RegistrarDomainLimitExceededError,
  RegistrarDuplicateRequestError,
  RegistrarDomainNotFoundError,
  RegistrarValidationError,
  RegistrarOperationLimitExceededError,
  RegistrarTLDRulesViolationError,
  RegistrarTLDNotSupportedError,
  RegistrarOperationFailedError,
} from '../known';
import { isTransportError } from './transport';

/**
 * Options for creating a registrar error from an AWS Route53 error.
 */
export interface CreateFromR53Options {
  /** The error thrown by AWS SDK */
  error: Error;
  /** Domain name involved in the operation */
  domainName?: string;
  /** Operation being performed */
  operation?: string;
  /** The registrar key (defaults to 'route53') */
  registrarKey?: Registrars;
}

/**
 * Create a RegistrarError from an AWS Route53 error.
 */
export function createRegistrarErrorFromR53(
  options: CreateFromR53Options,
): RegistrarError {
  const { error, domainName, operation, registrarKey = 'route53' } = options;

  const baseMeta = {
    registrarKey,
    domainName,
    operation,
    originalError: error,
    timestamp: new Date(),
  };

  // Handle non-AWS SDK errors
  if (!(error instanceof Route53DomainsServiceException)) {
    // Check for network/transport errors ('NetworkingError' is the AWS wrapper)
    if (error.name === 'NetworkingError' || isTransportError(error)) {
      return new RegistrarTransportError(error.message, baseMeta);
    }
    return new RegistrarUnknownError(error.message, baseMeta);
  }

  const errorName = error.name;
  const message = error.message;
  const knownMeta: RegistrarKnownErrorMeta = {
    ...baseMeta,
    nativeCode: errorName,
    nativeResponse: error,
  };

  switch (errorName) {
    case 'DomainLimitExceeded':
      return new RegistrarDomainLimitExceededError(message, knownMeta);

    case 'DuplicateRequest': {
      // AWS DuplicateRequest includes requestId
      const requestId = (error as { requestId?: string }).requestId;
      return new RegistrarDuplicateRequestError(message, {
        ...knownMeta,
        existingRequestId: requestId,
      });
    }

    case 'InvalidInput':
      // Check if it's a "domain doesn't belong to account" error
      if (
        message.includes("doesn't belong to") ||
        message.includes('does not belong to') ||
        message.includes('not found')
      ) {
        return new RegistrarDomainNotFoundError(
          domainName ?? 'unknown',
          knownMeta,
        );
      }
      return new RegistrarValidationError(message, knownMeta);

    case 'OperationLimitExceeded':
      return new RegistrarOperationLimitExceededError(message, knownMeta);

    case 'TLDRulesViolation':
      return new RegistrarTLDRulesViolationError(message, knownMeta);

    case 'UnsupportedTLD':
      return new RegistrarTLDNotSupportedError(
        domainName ?? 'unknown',
        knownMeta,
      );

    case 'ThrottlingException':
    case 'TooManyRequestsException': {
      // Try to extract retry-after from error
      const retryAfter = (error as { retryAfterSeconds?: number })
        .retryAfterSeconds;
      return new RegistrarRateLimitError(
        message,
        baseMeta,
        retryAfter ? retryAfter * 1000 : undefined,
      );
    }

    case 'ServiceUnavailable':
    case 'InternalServerError':
      return new RegistrarTransportError(message, baseMeta);

    default:
      return new RegistrarOperationFailedError(message, knownMeta);
  }
}
