/**
 * Registrar Error Message Utilities
 *
 * Functions to create human-readable messages from registrar errors.
 */

import {
  RegistrarError,
  RegistrarKnownError,
  RegistrarUnknownError,
  RegistrarTransportError,
  RegistrarRateLimitError,
} from './base';
import { RegistrarErrorCodes } from './codes';
import {
  RegistrarDomainExistsError,
  RegistrarDomainNotFoundError,
  RegistrarDomainLimitExceededError,
  RegistrarAuthenticationError,
  RegistrarAuthorizationError,
  RegistrarInvalidAuthCodeError,
  RegistrarStatusProhibitsError,
  RegistrarNotEligibleForRenewalError,
  RegistrarTransferError,
  RegistrarBillingError,
  RegistrarOperationLimitExceededError,
  RegistrarValidationError,
  RegistrarTLDNotSupportedError,
  RegistrarTLDRulesViolationError,
  RegistrarDuplicateRequestError,
  RegistrarOperationFailedError,
} from './known';

// ============================================================================
// Developer/Debug Message
// ============================================================================

/**
 * Options for formatting debug messages.
 */
export interface DebugMessageOptions {
  /** Include the full stack trace (default: false) */
  includeStack?: boolean;
  /** Include native response data (default: false) */
  includeNativeResponse?: boolean;
  /** Include timestamp (default: true) */
  includeTimestamp?: boolean;
}

/**
 * Create a detailed, technical error message for logging and debugging.
 * Includes error code, registrar key, native codes, and contextual information.
 *
 * @example
 * ```typescript
 * try {
 *   await registrar.renewDomain(domain);
 * } catch (error) {
 *   logger.error(formatRegistrarErrorForDebug(error));
 * }
 * ```
 */
export function formatRegistrarErrorForDebug(
  error: unknown,
  options: DebugMessageOptions = {},
): string {
  const {
    includeStack = false,
    includeNativeResponse = false,
    includeTimestamp = true,
  } = options;

  // Handle non-RegistrarError
  if (!(error instanceof RegistrarError)) {
    if (error instanceof Error) {
      return `[UnknownError] ${error.name}: ${error.message}${includeStack && error.stack ? `\n${error.stack}` : ''}`;
    }
    return `[UnknownError] ${String(error)}`;
  }

  const parts: string[] = [];

  // Header with error code and registrar
  parts.push(`[${error.code}] ${error.name}`);
  parts.push(`  Registrar: ${error.registrarKey}`);

  // Timestamp
  if (includeTimestamp) {
    parts.push(`  Timestamp: ${error.timestamp.toISOString()}`);
  }

  // Domain and operation context
  if (error.domainName) {
    parts.push(`  Domain: ${error.domainName}`);
  }
  if (error.operation) {
    parts.push(`  Operation: ${error.operation}`);
  }

  // Error message
  parts.push(`  Message: ${error.message}`);

  // Native error information for known errors
  if (error instanceof RegistrarKnownError) {
    if (error.nativeCode !== undefined) {
      parts.push(`  Native Code: ${error.nativeCode}`);
    }
    if (includeNativeResponse && error.nativeResponse !== undefined) {
      try {
        const nativeStr = JSON.stringify(error.nativeResponse, null, 2);
        parts.push(
          `  Native Response:\n${nativeStr
            .split('\n')
            .map((l) => `    ${l}`)
            .join('\n')}`,
        );
      } catch {
        parts.push('  Native Response: [Unable to serialize]');
      }
    }
  }

  // Error-specific details
  if (
    error instanceof RegistrarStatusProhibitsError &&
    error.prohibitingStatuses?.length
  ) {
    parts.push(
      `  Prohibiting Statuses: ${error.prohibitingStatuses.join(', ')}`,
    );
  }
  if (error instanceof RegistrarTransferError) {
    parts.push(`  Transfer State: ${error.transferState}`);
  }
  if (error instanceof RegistrarValidationError) {
    if (error.field) parts.push(`  Invalid Field: ${error.field}`);
    if (error.value) parts.push(`  Invalid Value: ${error.value}`);
  }
  if (error instanceof RegistrarTLDNotSupportedError) {
    parts.push(`  TLD: ${error.tld}`);
  }
  if (error instanceof RegistrarRateLimitError && error.retryAfterMs) {
    parts.push(`  Retry After: ${error.retryAfterMs}ms`);
  }
  if (
    error instanceof RegistrarDuplicateRequestError &&
    error.existingRequestId
  ) {
    parts.push(`  Existing Request ID: ${error.existingRequestId}`);
  }
  if (error instanceof RegistrarAuthorizationError) {
    parts.push(`  Object ID: ${error.objectId}`);
    parts.push(`  Denied Operation: ${error.operationName}`);
  }

  // Original error cause
  if (error.originalError) {
    const cause = error.originalError;
    if (cause instanceof Error) {
      parts.push(`  Cause: ${cause.name}: ${cause.message}`);
    } else {
      parts.push(`  Cause: ${String(cause)}`);
    }
  }

  // Stack trace
  if (includeStack && error.stack) {
    parts.push(
      `  Stack:\n${error.stack
        .split('\n')
        .slice(1)
        .map((l) => `    ${l.trim()}`)
        .join('\n')}`,
    );
  }

  return parts.join('\n');
}

// ============================================================================
// User/Client Message
// ============================================================================

/**
 * Options for formatting user messages.
 */
export interface UserMessageOptions {
  /** Include the domain name in the message (default: true) */
  includeDomain?: boolean;
  /** Language/locale for messages (default: 'en') - reserved for future i18n */
  locale?: string;
}

/**
 * User-friendly error messages mapped by error code.
 * These messages are non-technical and actionable.
 */
const USER_MESSAGES: Record<string, (error: RegistrarError) => string> = {
  [RegistrarErrorCodes.UNKNOWN_ERROR]: () =>
    'An unexpected error occurred. Please try again later or contact support if the problem persists.',

  [RegistrarErrorCodes.TRANSPORT_ERROR]: () =>
    'We were unable to connect to the domain registrar. Please check your internet connection and try again.',

  [RegistrarErrorCodes.RATE_LIMIT_ERROR]: (error) => {
    if (error instanceof RegistrarRateLimitError && error.retryAfterMs) {
      const seconds = Math.ceil(error.retryAfterMs / 1000);
      return `Too many requests. Please wait ${seconds} seconds before trying again.`;
    }
    return 'Too many requests. Please wait a moment before trying again.';
  },

  [RegistrarErrorCodes.DOMAIN_EXISTS]: (error) =>
    error.domainName
      ? `The domain "${error.domainName}" is already registered.`
      : 'This domain is already registered.',

  [RegistrarErrorCodes.DOMAIN_NOT_FOUND]: (error) =>
    error.domainName
      ? `The domain "${error.domainName}" was not found in your account.`
      : 'The requested domain was not found in your account.',

  [RegistrarErrorCodes.DOMAIN_LIMIT_EXCEEDED]: () =>
    'You have reached the maximum number of domains allowed for your account. Please contact support to increase your limit.',

  [RegistrarErrorCodes.AUTHENTICATION_ERROR]: () =>
    'Authentication failed. Please check your credentials or contact support.',

  [RegistrarErrorCodes.AUTHORIZATION_ERROR]: (error) =>
    error.domainName
      ? `You do not have permission to perform this operation on "${error.domainName}".`
      : 'You do not have permission to perform this operation.',

  [RegistrarErrorCodes.INVALID_AUTH_CODE]: (error) =>
    error.domainName
      ? `The authorization code for "${error.domainName}" is invalid. Please verify the code and try again.`
      : 'The authorization code is invalid. Please verify the code and try again.',

  [RegistrarErrorCodes.STATUS_PROHIBITS]: (error) => {
    if (error instanceof RegistrarStatusProhibitsError) {
      const domain = error.domainName ?? 'The domain';
      if (
        error.prohibitingStatuses?.some((s) => s.toLowerCase().includes('lock'))
      ) {
        return `${domain} is locked and cannot be modified. Please unlock the domain first.`;
      }
      if (
        error.prohibitingStatuses?.some((s) =>
          s.toLowerCase().includes('transfer'),
        )
      ) {
        return `${domain} has a transfer restriction and cannot be transferred at this time.`;
      }
    }
    return error.domainName
      ? `The current status of "${error.domainName}" prevents this operation. Please check the domain status and try again.`
      : 'The current domain status prevents this operation. Please check the domain status and try again.';
  },

  [RegistrarErrorCodes.NOT_ELIGIBLE_FOR_RENEWAL]: (error) =>
    error.domainName
      ? `The domain "${error.domainName}" is not eligible for renewal at this time. It may be too early to renew or there may be pending operations.`
      : 'This domain is not eligible for renewal at this time.',

  [RegistrarErrorCodes.TRANSFER_ERROR]: (error) => {
    if (error instanceof RegistrarTransferError) {
      const domain = error.domainName ?? 'The domain';
      switch (error.transferState) {
        case 'pending':
          return `${domain} already has a transfer in progress. Please wait for it to complete or cancel it first.`;
        case 'not_pending':
          return `${domain} does not have a pending transfer to approve or reject.`;
        case 'not_eligible':
          return `${domain} is not eligible for transfer. It may be recently registered, recently transferred, or have a transfer lock enabled.`;
      }
    }
    return 'There was an issue with the domain transfer. Please try again or contact support.';
  },

  [RegistrarErrorCodes.BILLING_ERROR]: () =>
    'There was a billing issue with this operation. Please check your account balance and payment method.',

  [RegistrarErrorCodes.OPERATION_LIMIT_EXCEEDED]: () =>
    'You have too many operations in progress. Please wait for some to complete before starting new ones.',

  [RegistrarErrorCodes.VALIDATION_ERROR]: (error) => {
    if (error instanceof RegistrarValidationError && error.field) {
      return `Invalid value provided for "${error.field}". Please check your input and try again.`;
    }
    return 'The provided information is invalid. Please check your input and try again.';
  },

  [RegistrarErrorCodes.TLD_NOT_SUPPORTED]: (error) => {
    if (error instanceof RegistrarTLDNotSupportedError) {
      return `The ".${error.tld}" domain extension is not supported. Please choose a different domain extension.`;
    }
    return 'This domain extension is not supported. Please choose a different domain extension.';
  },

  [RegistrarErrorCodes.TLD_RULES_VIOLATION]: (error) =>
    error.domainName
      ? `The operation on "${error.domainName}" violates the rules for this domain extension. Please review the requirements for this TLD.`
      : 'This operation violates the rules for this domain extension. Please review the requirements.',

  [RegistrarErrorCodes.DUPLICATE_REQUEST]: (error) =>
    error.domainName
      ? `A similar operation for "${error.domainName}" is already in progress. Please wait for it to complete.`
      : 'A similar operation is already in progress. Please wait for it to complete.',

  [RegistrarErrorCodes.OPERATION_FAILED]: () =>
    'The operation could not be completed. Please try again later or contact support if the problem persists.',
};

/**
 * Create a user-friendly, non-technical error message.
 * Suitable for displaying to end users in UI.
 *
 * @example
 * ```typescript
 * try {
 *   await registrar.renewDomain(domain);
 * } catch (error) {
 *   showToast(formatRegistrarErrorForUser(error));
 * }
 * ```
 */
export function formatRegistrarErrorForUser(
  error: unknown,
  options: UserMessageOptions = {},
): string {
  const { includeDomain = true } = options;

  // Handle non-RegistrarError
  if (!(error instanceof RegistrarError)) {
    return 'An unexpected error occurred. Please try again later or contact support if the problem persists.';
  }

  // Get the message generator for this error code
  const messageGenerator = USER_MESSAGES[error.code];

  if (messageGenerator) {
    let message = messageGenerator(error);

    // Optionally strip domain name from message
    if (!includeDomain && error.domainName) {
      message = message
        .replace(`"${error.domainName}"`, 'this domain')
        .replace(error.domainName, 'the domain');
    }

    return message;
  }

  // Fallback for unhandled error codes
  return 'An error occurred while processing your request. Please try again later or contact support.';
}

// ============================================================================
// Additional Utilities
// ============================================================================

/**
 * Get a short, one-line summary of the error for logs or notifications.
 *
 * @example
 * // Returns: "[REGISTRAR_DOMAIN_NOT_FOUND] example.com - Domain not found in route53 account"
 * getErrorSummary(error);
 */
export function getRegistrarErrorSummary(error: unknown): string {
  if (!(error instanceof RegistrarError)) {
    if (error instanceof Error) {
      return `[ERROR] ${error.message}`;
    }
    return `[ERROR] ${String(error)}`;
  }

  const parts = [`[${error.code}]`];

  if (error.domainName) {
    parts.push(error.domainName);
    parts.push('-');
  }

  // Use a shortened message
  const shortMessage =
    error.message.length > 80
      ? `${error.message.slice(0, 77)}...`
      : error.message;
  parts.push(shortMessage);

  return parts.join(' ');
}

/**
 * Check if an error message should suggest the user retry.
 */
export function shouldSuggestRetry(error: unknown): boolean {
  if (!(error instanceof RegistrarError)) return false;

  return (
    error instanceof RegistrarRateLimitError ||
    error instanceof RegistrarTransportError ||
    error instanceof RegistrarDuplicateRequestError ||
    error instanceof RegistrarOperationLimitExceededError ||
    error instanceof RegistrarUnknownError
  );
}

/**
 * Get a suggested action for the user based on the error type.
 */
export function getSuggestedAction(error: unknown): string | null {
  if (!(error instanceof RegistrarError)) return null;

  if (error instanceof RegistrarRateLimitError) {
    if (error.retryAfterMs) {
      const seconds = Math.ceil(error.retryAfterMs / 1000);
      return `Wait ${seconds} seconds and try again.`;
    }
    return 'Wait a moment and try again.';
  }

  if (error instanceof RegistrarTransportError) {
    return 'Check your internet connection and try again.';
  }

  if (error instanceof RegistrarStatusProhibitsError) {
    if (
      error.prohibitingStatuses?.some((s) => s.toLowerCase().includes('lock'))
    ) {
      return 'Unlock the domain in your domain settings, then try again.';
    }
    return 'Check the domain status and resolve any restrictions.';
  }

  if (error instanceof RegistrarInvalidAuthCodeError) {
    return 'Request a new authorization code from your current registrar.';
  }

  if (error instanceof RegistrarBillingError) {
    return 'Add funds to your account or update your payment method.';
  }

  if (error instanceof RegistrarDuplicateRequestError) {
    return 'Wait for the existing operation to complete.';
  }

  if (error instanceof RegistrarNotEligibleForRenewalError) {
    return 'Check if the domain has any pending operations or if renewal is available yet.';
  }

  if (error instanceof RegistrarTransferError) {
    if (error.transferState === 'not_eligible') {
      return 'Ensure the domain is at least 60 days old and transfer lock is disabled.';
    }
    if (error.transferState === 'pending') {
      return 'Wait for the current transfer to complete or cancel it.';
    }
  }

  return null;
}
