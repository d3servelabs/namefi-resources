import { Route53DomainsServiceException } from '@aws-sdk/client-route-53-domains';
import { describe, expect, it } from 'vitest';
import { RegistrarErrorCodes } from '../codes';
import { createRegistrarErrorFromR53 } from './from-r53';

function makeAwsException(
  name: string,
  message = 'aws error',
  extra: Record<string, unknown> = {},
): Route53DomainsServiceException {
  const error = new Route53DomainsServiceException({
    name,
    $fault: 'client',
    $metadata: {},
    message,
  });
  return Object.assign(error, extra);
}

const baseOptions = {
  domainName: 'example.com',
  operation: 'renewDomain',
} as const;

describe('createRegistrarErrorFromR53', () => {
  it('maps DomainLimitExceeded to DOMAIN_LIMIT_EXCEEDED', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: makeAwsException('DomainLimitExceeded', 'too many domains'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.DOMAIN_LIMIT_EXCEEDED);
    expect(result.registrarKey).toBe('route53');
  });

  it('maps DuplicateRequest and carries the requestId', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: makeAwsException('DuplicateRequest', 'dupe', {
        requestId: 'req-123',
      }),
    });
    expect(result.code).toBe(RegistrarErrorCodes.DUPLICATE_REQUEST);
    expect((result as { existingRequestId?: string }).existingRequestId).toBe(
      'req-123',
    );
  });

  it('maps InvalidInput ownership failures to DOMAIN_NOT_FOUND', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: makeAwsException(
        'InvalidInput',
        "Domain doesn't belong to the account",
      ),
    });
    expect(result.code).toBe(RegistrarErrorCodes.DOMAIN_NOT_FOUND);
  });

  it('maps other InvalidInput errors to VALIDATION_ERROR', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: makeAwsException('InvalidInput', 'bad nameserver'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.VALIDATION_ERROR);
  });

  it('maps OperationLimitExceeded and TLD errors', () => {
    expect(
      createRegistrarErrorFromR53({
        ...baseOptions,
        error: makeAwsException('OperationLimitExceeded'),
      }).code,
    ).toBe(RegistrarErrorCodes.OPERATION_LIMIT_EXCEEDED);

    expect(
      createRegistrarErrorFromR53({
        ...baseOptions,
        error: makeAwsException('TLDRulesViolation'),
      }).code,
    ).toBe(RegistrarErrorCodes.TLD_RULES_VIOLATION);

    expect(
      createRegistrarErrorFromR53({
        ...baseOptions,
        error: makeAwsException('UnsupportedTLD'),
      }).code,
    ).toBe(RegistrarErrorCodes.TLD_NOT_SUPPORTED);
  });

  it('maps throttling to RATE_LIMIT_ERROR with retryAfterMs', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: makeAwsException('ThrottlingException', 'slow down', {
        retryAfterSeconds: 5,
      }),
    });
    expect(result.code).toBe(RegistrarErrorCodes.RATE_LIMIT_ERROR);
    expect((result as { retryAfterMs?: number }).retryAfterMs).toBe(5000);
  });

  it('maps service availability errors to TRANSPORT_ERROR', () => {
    expect(
      createRegistrarErrorFromR53({
        ...baseOptions,
        error: makeAwsException('ServiceUnavailable'),
      }).code,
    ).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);
  });

  it('falls back to OPERATION_FAILED for unknown AWS exception names', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: makeAwsException('SomeBrandNewException'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.OPERATION_FAILED);
  });

  it('classifies non-AWS networking errors as TRANSPORT_ERROR', () => {
    expect(
      createRegistrarErrorFromR53({
        ...baseOptions,
        error: Object.assign(new Error('socket hang up'), {
          name: 'NetworkingError',
        }),
      }).code,
    ).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);

    expect(
      createRegistrarErrorFromR53({
        ...baseOptions,
        error: Object.assign(new Error('connect failed'), {
          code: 'ECONNREFUSED',
        }),
      }).code,
    ).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);
  });

  it('classifies other non-AWS errors as UNKNOWN_ERROR', () => {
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: new Error('totally unexpected'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.UNKNOWN_ERROR);
  });

  it('preserves the original error as cause', () => {
    const original = makeAwsException('DomainLimitExceeded', 'too many');
    const result = createRegistrarErrorFromR53({
      ...baseOptions,
      error: original,
    });
    expect((result as { cause?: unknown }).cause).toBe(original);
    expect(result.originalError).toBe(original);
  });
});
