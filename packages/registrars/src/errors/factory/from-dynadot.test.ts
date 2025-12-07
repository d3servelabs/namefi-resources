import { describe, expect, it } from 'vitest';
import { RegistrarErrorCodes } from '../codes';
import {
  createRegistrarErrorFromDynadot,
  isDynadotResponseFailed,
} from './from-dynadot';

function failedResponse(error: string, status?: string) {
  return { ResponseCode: '-1', Status: status, Error: error } as const;
}

const ctx = { domainName: 'example.com', operation: 'renewDomain' } as const;

describe('isDynadotResponseFailed', () => {
  it('treats 0 and 1 as success and everything else as failure', () => {
    expect(isDynadotResponseFailed({ ResponseCode: '0' })).toBe(false);
    expect(isDynadotResponseFailed({ ResponseCode: '1' })).toBe(false);
    expect(isDynadotResponseFailed({ ResponseCode: '-1' })).toBe(true);
    expect(isDynadotResponseFailed({ ResponseCode: 'error' as never })).toBe(
      true,
    );
  });
});

describe('createRegistrarErrorFromDynadot - response classification', () => {
  const cases: Array<[string, string, string | undefined]> = [
    [
      RegistrarErrorCodes.DUPLICATE_REQUEST,
      'Currently processing another request',
      undefined,
    ],
    [
      RegistrarErrorCodes.DOMAIN_NOT_FOUND,
      'Could not find domain in your account',
      undefined,
    ],
    [RegistrarErrorCodes.AUTHENTICATION_ERROR, 'Invalid API Key', undefined],
    [
      RegistrarErrorCodes.VALIDATION_ERROR,
      'Domain must be in ASCII',
      undefined,
    ],
    [
      RegistrarErrorCodes.STATUS_PROHIBITS,
      "This domain doesn't support DNSSEC.",
      undefined,
    ],
    [RegistrarErrorCodes.DOMAIN_EXISTS, 'Domain already exists', undefined],
    [
      RegistrarErrorCodes.TRANSFER_ERROR,
      'A transfer is pending for this domain',
      undefined,
    ],
    [
      RegistrarErrorCodes.INVALID_AUTH_CODE,
      'Invalid auth code provided',
      undefined,
    ],
    [RegistrarErrorCodes.BILLING_ERROR, 'Insufficient balance', undefined],
    [
      RegistrarErrorCodes.OPERATION_FAILED,
      'Unexpected provider failure',
      undefined,
    ],
    [RegistrarErrorCodes.RATE_LIMIT_ERROR, 'anything', 'system_busy'],
  ];

  it.each(cases)('maps "%s" message', (expectedCode, message, status) => {
    const result = createRegistrarErrorFromDynadot({
      ...ctx,
      response: failedResponse(message, status),
    });
    expect(result.code).toBe(expectedCode);
    expect(result.registrarKey).toBe('dynadot');
  });

  it('records the native response code on known errors', () => {
    const result = createRegistrarErrorFromDynadot({
      ...ctx,
      response: failedResponse('Domain already exists'),
    });
    expect((result as { nativeCode?: unknown }).nativeCode).toBe('-1');
  });
});

describe('createRegistrarErrorFromDynadot - thrown errors', () => {
  it('maps Node socket errors to TRANSPORT_ERROR', () => {
    const result = createRegistrarErrorFromDynadot({
      ...ctx,
      error: Object.assign(new Error('connect failed'), {
        code: 'ECONNREFUSED',
      }),
    });
    expect(result.code).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);
  });

  it('maps "threads busy" / "system busy" messages to RATE_LIMIT_ERROR', () => {
    const result = createRegistrarErrorFromDynadot({
      ...ctx,
      error: new Error('Threads busy, please retry later'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.RATE_LIMIT_ERROR);
  });

  it('maps other thrown errors to UNKNOWN_ERROR', () => {
    const result = createRegistrarErrorFromDynadot({
      ...ctx,
      error: new Error('something odd happened'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.UNKNOWN_ERROR);
  });
});
