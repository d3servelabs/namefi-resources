/**
 * Registrar Error Type Guards
 *
 * Runtime type checking functions for registrar errors.
 */

import {
  RegistrarError,
  RegistrarKnownError,
  RegistrarUnknownError,
  RegistrarTransportError,
  RegistrarRateLimitError,
} from './base';
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
// Base Type Guards
// ============================================================================

/**
 * Check if an error is a RegistrarError.
 */
export function isRegistrarError(error: unknown): error is RegistrarError {
  return error instanceof RegistrarError;
}

/**
 * Check if an error is a RegistrarKnownError (has native error code).
 */
export function isRegistrarKnownError(
  error: unknown,
): error is RegistrarKnownError {
  return error instanceof RegistrarKnownError;
}

/**
 * Check if an error is a RegistrarUnknownError.
 */
export function isRegistrarUnknownError(
  error: unknown,
): error is RegistrarUnknownError {
  return error instanceof RegistrarUnknownError;
}

/**
 * Check if an error is a RegistrarTransportError.
 */
export function isRegistrarTransportError(
  error: unknown,
): error is RegistrarTransportError {
  return error instanceof RegistrarTransportError;
}

/**
 * Check if an error is a RegistrarRateLimitError.
 */
export function isRegistrarRateLimitError(
  error: unknown,
): error is RegistrarRateLimitError {
  return error instanceof RegistrarRateLimitError;
}

// ============================================================================
// Domain State Guards
// ============================================================================

/**
 * Check if an error is a RegistrarDomainExistsError.
 */
export function isRegistrarDomainExistsError(
  error: unknown,
): error is RegistrarDomainExistsError {
  return error instanceof RegistrarDomainExistsError;
}

/**
 * Check if an error is a RegistrarDomainNotFoundError.
 */
export function isRegistrarDomainNotFoundError(
  error: unknown,
): error is RegistrarDomainNotFoundError {
  return error instanceof RegistrarDomainNotFoundError;
}

/**
 * Check if an error is a RegistrarDomainLimitExceededError.
 */
export function isRegistrarDomainLimitExceededError(
  error: unknown,
): error is RegistrarDomainLimitExceededError {
  return error instanceof RegistrarDomainLimitExceededError;
}

// ============================================================================
// Authentication / Authorization Guards
// ============================================================================

/**
 * Check if an error is a RegistrarAuthenticationError.
 */
export function isRegistrarAuthenticationError(
  error: unknown,
): error is RegistrarAuthenticationError {
  return error instanceof RegistrarAuthenticationError;
}

/**
 * Check if an error is a RegistrarAuthorizationError.
 */
export function isRegistrarAuthorizationError(
  error: unknown,
): error is RegistrarAuthorizationError {
  return error instanceof RegistrarAuthorizationError;
}

/**
 * Check if an error is a RegistrarInvalidAuthCodeError.
 */
export function isRegistrarInvalidAuthCodeError(
  error: unknown,
): error is RegistrarInvalidAuthCodeError {
  return error instanceof RegistrarInvalidAuthCodeError;
}

// ============================================================================
// Operation State Guards
// ============================================================================

/**
 * Check if an error is a RegistrarStatusProhibitsError.
 */
export function isRegistrarStatusProhibitsError(
  error: unknown,
): error is RegistrarStatusProhibitsError {
  return error instanceof RegistrarStatusProhibitsError;
}

/**
 * Check if an error is a RegistrarNotEligibleForRenewalError.
 */
export function isRegistrarNotEligibleForRenewalError(
  error: unknown,
): error is RegistrarNotEligibleForRenewalError {
  return error instanceof RegistrarNotEligibleForRenewalError;
}

/**
 * Check if an error is a RegistrarTransferError.
 */
export function isRegistrarTransferError(
  error: unknown,
): error is RegistrarTransferError {
  return error instanceof RegistrarTransferError;
}

// ============================================================================
// Billing / Resource Guards
// ============================================================================

/**
 * Check if an error is a RegistrarBillingError.
 */
export function isRegistrarBillingError(
  error: unknown,
): error is RegistrarBillingError {
  return error instanceof RegistrarBillingError;
}

/**
 * Check if an error is a RegistrarOperationLimitExceededError.
 */
export function isRegistrarOperationLimitExceededError(
  error: unknown,
): error is RegistrarOperationLimitExceededError {
  return error instanceof RegistrarOperationLimitExceededError;
}

// ============================================================================
// Validation Guards
// ============================================================================

/**
 * Check if an error is a RegistrarValidationError.
 */
export function isRegistrarValidationError(
  error: unknown,
): error is RegistrarValidationError {
  return error instanceof RegistrarValidationError;
}

// ============================================================================
// TLD Guards
// ============================================================================

/**
 * Check if an error is a RegistrarTLDNotSupportedError.
 */
export function isRegistrarTLDNotSupportedError(
  error: unknown,
): error is RegistrarTLDNotSupportedError {
  return error instanceof RegistrarTLDNotSupportedError;
}

/**
 * Check if an error is a RegistrarTLDRulesViolationError.
 */
export function isRegistrarTLDRulesViolationError(
  error: unknown,
): error is RegistrarTLDRulesViolationError {
  return error instanceof RegistrarTLDRulesViolationError;
}

// ============================================================================
// Request State Guards
// ============================================================================

/**
 * Check if an error is a RegistrarDuplicateRequestError.
 */
export function isRegistrarDuplicateRequestError(
  error: unknown,
): error is RegistrarDuplicateRequestError {
  return error instanceof RegistrarDuplicateRequestError;
}

/**
 * Check if an error is a RegistrarOperationFailedError.
 */
export function isRegistrarOperationFailedError(
  error: unknown,
): error is RegistrarOperationFailedError {
  return error instanceof RegistrarOperationFailedError;
}

// ============================================================================
// Utility Guards
// ============================================================================

/**
 * Check if an error is retryable.
 * Retryable errors include rate limiting, transport errors, duplicate requests,
 * and operation limit exceeded errors.
 */
export function isRetryableRegistrarError(error: unknown): boolean {
  if (!isRegistrarError(error)) return false;

  return (
    error instanceof RegistrarRateLimitError ||
    error instanceof RegistrarTransportError ||
    error instanceof RegistrarDuplicateRequestError ||
    error instanceof RegistrarOperationLimitExceededError
  );
}

/**
 * Check if an error is due to domain state.
 * These errors indicate the domain is in a state that prevents the operation.
 */
export function isDomainStateError(error: unknown): boolean {
  if (!isRegistrarError(error)) return false;

  return (
    error instanceof RegistrarStatusProhibitsError ||
    error instanceof RegistrarNotEligibleForRenewalError ||
    error instanceof RegistrarTransferError
  );
}

/**
 * Check if an error is an authentication or authorization error.
 */
export function isAuthError(error: unknown): boolean {
  if (!isRegistrarError(error)) return false;

  return (
    error instanceof RegistrarAuthenticationError ||
    error instanceof RegistrarAuthorizationError ||
    error instanceof RegistrarInvalidAuthCodeError
  );
}

/**
 * Check if an error is a TLD-related error.
 */
export function isTLDError(error: unknown): boolean {
  if (!isRegistrarError(error)) return false;

  return (
    error instanceof RegistrarTLDNotSupportedError ||
    error instanceof RegistrarTLDRulesViolationError
  );
}
