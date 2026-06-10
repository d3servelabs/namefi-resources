/**
 * Registrar Error System - Known Error Classes
 *
 * These errors represent known, expected error conditions from registrars.
 * Each error type maps to common scenarios across AWS Route53, Dynadot, and CentralNic/EPP.
 */

import { RegistrarKnownError, type RegistrarKnownErrorMeta } from './base';
import { RegistrarErrorCodes } from './codes';

// ============================================================================
// Domain State Errors
// ============================================================================

/**
 * Domain already exists / is already registered.
 * EPP code: 2302
 */
export class RegistrarDomainExistsError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.DOMAIN_EXISTS;

  constructor(
    domainName: string,
    meta: Omit<RegistrarKnownErrorMeta, 'domainName'>,
  ) {
    super(`Domain '${domainName}' already exists`, { ...meta, domainName });
  }
}

/**
 * Domain does not exist in the registrar account.
 * EPP code: 2303
 */
export class RegistrarDomainNotFoundError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.DOMAIN_NOT_FOUND;

  constructor(
    domainName: string,
    meta: Omit<RegistrarKnownErrorMeta, 'domainName'>,
  ) {
    super(
      `Domain '${domainName}' does not exist in ${meta.registrarKey} account`,
      { ...meta, domainName },
    );
  }
}

/**
 * Domain limit exceeded for the account.
 * AWS-specific: DomainLimitExceeded
 */
export class RegistrarDomainLimitExceededError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.DOMAIN_LIMIT_EXCEEDED;

  constructor(message: string, meta: RegistrarKnownErrorMeta) {
    super(message, meta);
  }
}

// ============================================================================
// Authentication / Authorization Errors
// ============================================================================

/**
 * Authentication error - invalid credentials.
 * EPP code: 2200, 2501
 */
export class RegistrarAuthenticationError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.AUTHENTICATION_ERROR;

  constructor(message: string, meta: RegistrarKnownErrorMeta) {
    super(message, meta);
  }
}

/**
 * Authorization error - not permitted to perform operation on this object.
 * EPP code: 2201
 */
export class RegistrarAuthorizationError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.AUTHORIZATION_ERROR;
  /** The object ID that the operation was attempted on */
  readonly objectId: string;
  /** The operation that was not authorized */
  readonly operationName: string;

  constructor(
    objectId: string,
    operationName: string,
    meta: RegistrarKnownErrorMeta,
  ) {
    super(`Not authorized to ${operationName} '${objectId}'`, meta);
    this.objectId = objectId;
    this.operationName = operationName;
  }

  protected override describeContext(): string[] {
    return [
      ...super.describeContext(),
      `object=${this.objectId}`,
      `deniedOperation=${this.operationName}`,
    ];
  }
}

/**
 * Invalid authorization code (auth code / EPP code) for domain transfer.
 * EPP code: 2202
 */
export class RegistrarInvalidAuthCodeError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.INVALID_AUTH_CODE;

  constructor(
    domainName: string,
    meta: Omit<RegistrarKnownErrorMeta, 'domainName'>,
  ) {
    super(`Invalid authorization code for '${domainName}'`, {
      ...meta,
      domainName,
    });
  }
}

// ============================================================================
// Operation State Errors
// ============================================================================

/**
 * Object status prohibits the requested operation.
 * EPP code: 2304
 */
export class RegistrarStatusProhibitsError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.STATUS_PROHIBITS;
  /** The object ID that has the prohibiting status */
  readonly objectId: string;
  /** The operation that was prohibited */
  readonly operationName: string;
  /** The statuses that are prohibiting the operation */
  readonly prohibitingStatuses?: string[];

  constructor(
    objectId: string,
    operationName: string,
    meta: RegistrarKnownErrorMeta & { prohibitingStatuses?: string[] },
  ) {
    const statusMsg = meta.prohibitingStatuses?.length
      ? ` (statuses: ${meta.prohibitingStatuses.join(', ')})`
      : '';
    super(
      `Object status prohibits ${operationName} on '${objectId}'${statusMsg}`,
      meta,
    );
    this.objectId = objectId;
    this.operationName = operationName;
    this.prohibitingStatuses = meta.prohibitingStatuses;
  }

  protected override describeContext(): string[] {
    const context = super.describeContext();
    if (this.prohibitingStatuses?.length) {
      context.push(`statuses=${this.prohibitingStatuses.join('|')}`);
    }
    return context;
  }
}

/**
 * Domain is not eligible for renewal.
 * EPP code: 2105
 */
export class RegistrarNotEligibleForRenewalError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.NOT_ELIGIBLE_FOR_RENEWAL;

  constructor(
    domainName: string,
    meta: Omit<RegistrarKnownErrorMeta, 'domainName'>,
  ) {
    super(`Domain '${domainName}' is not eligible for renewal`, {
      ...meta,
      domainName,
    });
  }
}

/**
 * Transfer-related error.
 * EPP codes: 2300 (pending), 2301 (not pending), 2106 (not eligible)
 */
export class RegistrarTransferError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.TRANSFER_ERROR;
  /** The state that caused the transfer error */
  readonly transferState: 'pending' | 'not_pending' | 'not_eligible';

  constructor(
    domainName: string,
    transferState: 'pending' | 'not_pending' | 'not_eligible',
    meta: Omit<RegistrarKnownErrorMeta, 'domainName'>,
  ) {
    const stateMsg = {
      pending: 'already has a pending transfer',
      not_pending: 'does not have a pending transfer',
      not_eligible: 'is not eligible for transfer',
    }[transferState];
    super(`Domain '${domainName}' ${stateMsg}`, { ...meta, domainName });
    this.transferState = transferState;
  }

  protected override describeContext(): string[] {
    return [...super.describeContext(), `transferState=${this.transferState}`];
  }
}

// ============================================================================
// Billing / Resource Errors
// ============================================================================

/**
 * Billing failure - insufficient funds or payment issue.
 * EPP code: 2104
 */
export class RegistrarBillingError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.BILLING_ERROR;

  constructor(operationName: string, meta: RegistrarKnownErrorMeta) {
    super(`Billing failure for ${operationName}`, meta);
  }
}

/**
 * Operation limit exceeded - too many concurrent operations.
 * AWS-specific: OperationLimitExceeded
 */
export class RegistrarOperationLimitExceededError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.OPERATION_LIMIT_EXCEEDED;

  constructor(message: string, meta: RegistrarKnownErrorMeta) {
    super(message, meta);
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Validation error - invalid parameters or syntax.
 * EPP codes: 2001-2005, 2306
 */
export class RegistrarValidationError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.VALIDATION_ERROR;
  /** The field that failed validation (if known) */
  readonly field?: string;
  /** The invalid value (if known) */
  readonly value?: string;

  constructor(
    message: string,
    meta: RegistrarKnownErrorMeta & { field?: string; value?: string },
  ) {
    super(message, meta);
    this.field = meta.field;
    this.value = meta.value;
  }

  protected override describeContext(): string[] {
    const context = super.describeContext();
    if (this.field !== undefined) {
      context.push(`field=${this.field}`);
    }
    if (this.value !== undefined) {
      context.push(`value=${this.value}`);
    }
    return context;
  }
}

// ============================================================================
// TLD Errors
// ============================================================================

/**
 * TLD not supported by the registrar.
 * AWS-specific: UnsupportedTLD
 */
export class RegistrarTLDNotSupportedError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.TLD_NOT_SUPPORTED;
  /** The TLD that is not supported */
  readonly tld: string;

  constructor(
    domainName: string,
    meta: Omit<RegistrarKnownErrorMeta, 'domainName'>,
  ) {
    const tld = domainName.split('.').pop() ?? domainName;
    super(`TLD '${tld}' is not supported by ${meta.registrarKey}`, {
      ...meta,
      domainName,
    });
    this.tld = tld;
  }

  protected override describeContext(): string[] {
    return [...super.describeContext(), `tld=${this.tld}`];
  }
}

/**
 * TLD-specific rule violation.
 * AWS-specific: TLDRulesViolation
 */
export class RegistrarTLDRulesViolationError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.TLD_RULES_VIOLATION;

  constructor(message: string, meta: RegistrarKnownErrorMeta) {
    super(message, meta);
  }
}

// ============================================================================
// Request State Errors
// ============================================================================

/**
 * Duplicate request - the same operation is already in progress.
 * AWS-specific: DuplicateRequest
 */
export class RegistrarDuplicateRequestError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.DUPLICATE_REQUEST;
  /** The ID of the existing request (if available) */
  readonly existingRequestId?: string;

  constructor(
    message: string,
    meta: RegistrarKnownErrorMeta & { existingRequestId?: string },
  ) {
    super(message, meta);
    this.existingRequestId = meta.existingRequestId;
  }

  protected override describeContext(): string[] {
    const context = super.describeContext();
    if (this.existingRequestId !== undefined) {
      context.push(`existingRequestId=${this.existingRequestId}`);
    }
    return context;
  }
}

// ============================================================================
// Generic Fallback
// ============================================================================

/**
 * Generic operation failed error for codes not covered by specific types.
 */
export class RegistrarOperationFailedError extends RegistrarKnownError {
  readonly code = RegistrarErrorCodes.OPERATION_FAILED;

  constructor(message: string, meta: RegistrarKnownErrorMeta) {
    super(message, meta);
  }
}
