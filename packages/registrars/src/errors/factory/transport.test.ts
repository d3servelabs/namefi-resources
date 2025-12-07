import { describe, expect, it } from 'vitest';
import { isTransportError } from './transport';

describe('isTransportError', () => {
  it('returns true when the Node error code is a known transport code', () => {
    for (const code of [
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ECONNRESET',
      'ENOTFOUND',
      'EAI_AGAIN',
      'EPIPE',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'EHOSTDOWN',
    ]) {
      const error = Object.assign(new Error('socket failure'), { code });
      expect(isTransportError(error), code).toBe(true);
    }
  });

  it('returns true when the code token is only present in the message', () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:700');
    expect(isTransportError(error)).toBe(true);
  });

  it('does not over-match on broad words like "connection"', () => {
    const error = new Error('The connection settings are invalid');
    expect(isTransportError(error)).toBe(false);
  });

  it('returns false for unrelated errors and non-Error values', () => {
    expect(isTransportError(new Error('Domain already exists'))).toBe(false);
    expect(
      isTransportError(Object.assign(new Error('x'), { code: 'EACCES' })),
    ).toBe(false);
    expect(isTransportError('ETIMEDOUT')).toBe(false);
    expect(isTransportError(undefined)).toBe(false);
    expect(isTransportError(null)).toBe(false);
  });
});
