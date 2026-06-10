import { describe, expect, it } from 'vitest';
import type { RegistrarKnownErrorMeta } from './base';
import { RegistrarRateLimitError, RegistrarTransportError } from './base';
import {
  RegistrarAuthorizationError,
  RegistrarDomainNotFoundError,
  RegistrarDuplicateRequestError,
  RegistrarStatusProhibitsError,
  RegistrarTLDNotSupportedError,
  RegistrarTransferError,
  RegistrarValidationError,
} from './known';

const knownMeta: Omit<RegistrarKnownErrorMeta, 'domainName'> = {
  registrarKey: 'centralnic',
  operation: 'renewDomain',
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  nativeCode: 2303,
};

const baseMeta = {
  registrarKey: 'route53' as const,
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
};

describe('RegistrarError#toString', () => {
  it('renders code + context + message for known errors', () => {
    const error = new RegistrarDomainNotFoundError('example.com', knownMeta);
    expect(error.toString()).toBe(
      "RegistrarDomainNotFoundError [REGISTRAR_DOMAIN_NOT_FOUND] (registrar=centralnic, domain=example.com, operation=renewDomain, native=2303): Domain 'example.com' does not exist in centralnic account",
    );
  });

  it('is used by String() and template interpolation', () => {
    const error = new RegistrarDomainNotFoundError('example.com', knownMeta);
    expect(String(error)).toBe(error.toString());
    expect(`${error}`).toContain(
      '[REGISTRAR_DOMAIN_NOT_FOUND] (registrar=centralnic',
    );
  });

  it('omits optional context that is absent', () => {
    const error = new RegistrarTransportError('network down', baseMeta);
    expect(error.toString()).toBe(
      'RegistrarTransportError [REGISTRAR_TRANSPORT_ERROR] (registrar=route53): network down',
    );
  });

  it('includes retryAfterMs for rate-limit errors', () => {
    const error = new RegistrarRateLimitError('slow down', baseMeta, 5000);
    expect(error.toString()).toBe(
      'RegistrarRateLimitError [REGISTRAR_RATE_LIMIT_ERROR] (registrar=route53, retryAfterMs=5000): slow down',
    );
  });
});

describe('RegistrarError#toJSON', () => {
  it('surfaces the cause as name/message/code for Error causes', () => {
    const original = Object.assign(new Error('socket dead'), {
      code: 'ECONNRESET',
    });
    const error = new RegistrarTransportError('network down', {
      ...baseMeta,
      originalError: original,
    });
    expect(error.toJSON().cause).toEqual({
      name: 'Error',
      message: 'socket dead',
      code: 'ECONNRESET',
    });
  });

  it('passes through a non-Error cause (e.g. a provider response)', () => {
    const response = { ResponseCode: '-1', Error: 'boom' };
    const error = new RegistrarTransportError('failed', {
      ...baseMeta,
      originalError: response,
    });
    expect(error.toJSON().cause).toBe(response);
  });

  it('leaves cause undefined when there is no original error', () => {
    const error = new RegistrarTransportError('network down', baseMeta);
    expect(error.toJSON().cause).toBeUndefined();
  });
});

describe('RegistrarError#toString — subclass-specific context', () => {
  it('surfaces prohibiting statuses', () => {
    const error = new RegistrarStatusProhibitsError('example.com', 'update', {
      registrarKey: 'centralnic',
      domainName: 'example.com',
      operation: 'update',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      nativeCode: 2304,
      prohibitingStatuses: ['clientUpdateProhibited', 'serverUpdateProhibited'],
    });
    expect(error.toString()).toContain(
      '[REGISTRAR_STATUS_PROHIBITS] (registrar=centralnic',
    );
    expect(error.toString()).toContain(
      'statuses=clientUpdateProhibited|serverUpdateProhibited',
    );
  });

  it('surfaces transfer state', () => {
    const error = new RegistrarTransferError('example.com', 'pending', {
      registrarKey: 'dynadot',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      nativeCode: 2300,
    });
    expect(error.toString()).toContain('transferState=pending');
  });

  it('surfaces validation field and value', () => {
    const error = new RegistrarValidationError('Invalid nameserver', {
      registrarKey: 'route53',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      field: 'nameserver',
      value: 'bad..ns',
    });
    expect(error.toString()).toContain('field=nameserver');
    expect(error.toString()).toContain('value=bad..ns');
  });

  it('surfaces tld, duplicate request id, and authorization object', () => {
    const tld = new RegistrarTLDNotSupportedError('example.xyz', {
      registrarKey: 'route53',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(tld.toString()).toContain('tld=xyz');

    const dup = new RegistrarDuplicateRequestError('Already in progress', {
      registrarKey: 'route53',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      existingRequestId: 'req-123',
    });
    expect(dup.toString()).toContain('existingRequestId=req-123');

    const authz = new RegistrarAuthorizationError('example.com', 'transfer', {
      registrarKey: 'centralnic',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(authz.toString()).toContain('object=example.com');
    expect(authz.toString()).toContain('deniedOperation=transfer');
  });
});
