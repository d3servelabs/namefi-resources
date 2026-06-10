import {
  createEppError,
  EppProtocolError,
  EppTransportError,
  type EppResultCode,
} from '@namefi-astra/epp-client';
import { describe, expect, it } from 'vitest';
import { RegistrarErrorCodes } from '../codes';
import { createRegistrarErrorFromEpp } from './from-epp';

const ctx = {
  domainName: 'example.com',
  operation: 'renewDomain',
} as const;

function fromEppCode(resultCode: number, message = 'epp failure') {
  return createRegistrarErrorFromEpp({
    ...ctx,
    error: createEppError({
      resultCode: resultCode as EppResultCode,
      message,
      objectType: 'domain',
      objectId: ctx.domainName,
      operation: ctx.operation,
    }),
  });
}

describe('createRegistrarErrorFromEpp - EPP result codes', () => {
  const cases: Array<[string, number]> = [
    [RegistrarErrorCodes.DOMAIN_EXISTS, 2302],
    [RegistrarErrorCodes.DOMAIN_NOT_FOUND, 2303],
    [RegistrarErrorCodes.AUTHENTICATION_ERROR, 2200],
    [RegistrarErrorCodes.AUTHORIZATION_ERROR, 2201],
    [RegistrarErrorCodes.INVALID_AUTH_CODE, 2202],
    [RegistrarErrorCodes.STATUS_PROHIBITS, 2304],
    [RegistrarErrorCodes.BILLING_ERROR, 2104],
    [RegistrarErrorCodes.TRANSFER_ERROR, 2300],
    [RegistrarErrorCodes.NOT_ELIGIBLE_FOR_RENEWAL, 2105],
    [RegistrarErrorCodes.RATE_LIMIT_ERROR, 2502],
    [RegistrarErrorCodes.VALIDATION_ERROR, 2005],
    [RegistrarErrorCodes.OPERATION_FAILED, 9999],
  ];

  it.each(cases)('maps EPP %s', (expectedCode, resultCode) => {
    const result = fromEppCode(resultCode);
    expect(result.code).toBe(expectedCode);
    expect(result.registrarKey).toBe('centralnic');
  });

  it('records the EPP result code as nativeCode on known errors', () => {
    const result = fromEppCode(2302);
    expect((result as { nativeCode?: unknown }).nativeCode).toBe(2302);
    expect(result.domainName).toBe('example.com');
  });
});

describe('createRegistrarErrorFromEpp - non-result errors', () => {
  it('maps EppTransportError to TRANSPORT_ERROR', () => {
    const result = createRegistrarErrorFromEpp({
      ...ctx,
      error: new EppTransportError('socket closed'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);
  });

  it('maps EppProtocolError to VALIDATION_ERROR', () => {
    const result = createRegistrarErrorFromEpp({
      ...ctx,
      error: new EppProtocolError('bad xml', '<xml/>'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.VALIDATION_ERROR);
  });

  it('classifies non-EPP socket errors as TRANSPORT_ERROR', () => {
    const result = createRegistrarErrorFromEpp({
      ...ctx,
      error: Object.assign(new Error('read failed'), { code: 'ETIMEDOUT' }),
    });
    expect(result.code).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);
  });

  it('classifies other non-EPP errors as UNKNOWN_ERROR', () => {
    const result = createRegistrarErrorFromEpp({
      ...ctx,
      error: new Error('unexpected'),
    });
    expect(result.code).toBe(RegistrarErrorCodes.UNKNOWN_ERROR);
  });

  it('handles undefined errors without throwing', () => {
    const result = createRegistrarErrorFromEpp({ ...ctx, error: undefined });
    expect(result.code).toBe(RegistrarErrorCodes.UNKNOWN_ERROR);
  });

  it('preserves the original error as cause', () => {
    const original = new Error('upstream epp failure');
    const result = createRegistrarErrorFromEpp({ ...ctx, error: original });
    expect((result as { cause?: unknown }).cause).toBe(original);
    expect(result.originalError).toBe(original);
  });
});
