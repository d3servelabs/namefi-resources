/**
 * Registrar Error System
 *
 * Inspired by Prisma's error hierarchy:
 * - RegistrarError (base)
 *   - RegistrarKnownError (errors with registrar-specific codes)
 *     - RegistrarDomainExistsError
 *     - RegistrarDomainNotFoundError
 *     - RegistrarAuthenticationError
 *     - RegistrarAuthorizationError
 *     - RegistrarInvalidAuthCodeError
 *     - RegistrarStatusProhibitsError
 *     - RegistrarBillingError
 *     - RegistrarTransferError
 *     - RegistrarValidationError
 *     - RegistrarOperationFailedError
 *     - RegistrarNotEligibleForRenewalError
 *     - RegistrarDomainLimitExceededError
 *     - RegistrarOperationLimitExceededError
 *     - RegistrarTLDNotSupportedError
 *     - RegistrarTLDRulesViolationError
 *     - RegistrarDuplicateRequestError
 *   - RegistrarUnknownError (unexpected errors)
 *   - RegistrarTransportError (connection/network errors)
 *   - RegistrarRateLimitError (throttling/rate limits)
 */

// Error codes
export { RegistrarErrorCodes, type RegistrarErrorCode } from './codes';

// Base classes and metadata types
export {
  RegistrarError,
  RegistrarKnownError,
  RegistrarUnknownError,
  RegistrarTransportError,
  RegistrarRateLimitError,
  type RegistrarErrorMeta,
  type RegistrarKnownErrorMeta,
} from './base';

// Known error classes
export {
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

// Factory functions
export {
  createRegistrarErrorFromR53,
  createRegistrarErrorFromDynadot,
  createRegistrarErrorFromEpp,
  isDynadotResponseFailed,
  type CreateFromR53Options,
  type CreateFromDynadotOptions,
  type CreateFromEppOptions,
  type DynadotErrorResponse,
} from './factory';

// Message formatting utilities
export {
  formatRegistrarErrorForDebug,
  formatRegistrarErrorForUser,
  getRegistrarErrorSummary,
  shouldSuggestRetry,
  getSuggestedAction,
  type DebugMessageOptions,
  type UserMessageOptions,
} from './messages';

// Decorators
export { fromArgsPath, withRegistrarError } from './decorator';

// Type guards
export {
  // Base guards
  isRegistrarError,
  isRegistrarKnownError,
  isRegistrarUnknownError,
  isRegistrarTransportError,
  isRegistrarRateLimitError,
  // Domain state guards
  isRegistrarDomainExistsError,
  isRegistrarDomainNotFoundError,
  isRegistrarDomainLimitExceededError,
  // Auth guards
  isRegistrarAuthenticationError,
  isRegistrarAuthorizationError,
  isRegistrarInvalidAuthCodeError,
  // Operation state guards
  isRegistrarStatusProhibitsError,
  isRegistrarNotEligibleForRenewalError,
  isRegistrarTransferError,
  // Billing/resource guards
  isRegistrarBillingError,
  isRegistrarOperationLimitExceededError,
  // Validation guards
  isRegistrarValidationError,
  // TLD guards
  isRegistrarTLDNotSupportedError,
  isRegistrarTLDRulesViolationError,
  // Request state guards
  isRegistrarDuplicateRequestError,
  isRegistrarOperationFailedError,
  // Utility guards
  isRetryableRegistrarError,
  isDomainStateError,
  isAuthError,
  isTLDError,
} from './guards';
