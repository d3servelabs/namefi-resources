import { describe, expect, it } from 'vitest';
import type { RegistrarKnownErrorMeta } from './base';
import { RegistrarRateLimitError, RegistrarTransportError } from './base';
import {
  isAuthError,
  isDomainStateError,
  isRegistrarError,
  isRegistrarKnownError,
  isRegistrarRateLimitError,
  isRegistrarTransportError,
  isRetryableRegistrarError,
  isTLDError,
} from './guards';
import {
  RegistrarAuthenticationError,
  RegistrarDomainNotFoundError,
  RegistrarStatusProhibitsError,
  RegistrarTLDNotSupportedError,
} from './known';

const knownMeta: Omit<RegistrarKnownErrorMeta, 'domainName'> = {
  registrarKey: 'centralnic',
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
};

const baseMeta = {
  registrarKey: 'route53' as const,
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
};

const domainNotFound = new RegistrarDomainNotFoundError(
  'example.com',
  knownMeta,
);
const transport = new RegistrarTransportError('network down', baseMeta);
const rateLimit = new RegistrarRateLimitError('busy', baseMeta, 5000);
const statusProhibits = new RegistrarStatusProhibitsError(
  'example.com',
  'transfer',
  { ...knownMeta, prohibitingStatuses: ['clientTransferProhibited'] },
);
const authError = new RegistrarAuthenticationError('bad creds', knownMeta);
const tldError = new RegistrarTLDNotSupportedError('example.xyz', knownMeta);

describe('base guards', () => {
  it('isRegistrarError distinguishes registrar errors from plain errors', () => {
    expect(isRegistrarError(domainNotFound)).toBe(true);
    expect(isRegistrarError(new Error('plain'))).toBe(false);
    expect(isRegistrarError('nope')).toBe(false);
  });

  it('isRegistrarKnownError only matches known errors', () => {
    expect(isRegistrarKnownError(domainNotFound)).toBe(true);
    expect(isRegistrarKnownError(transport)).toBe(false);
  });

  it('narrows transport and rate-limit errors', () => {
    expect(isRegistrarTransportError(transport)).toBe(true);
    expect(isRegistrarTransportError(rateLimit)).toBe(false);
    expect(isRegistrarRateLimitError(rateLimit)).toBe(true);
  });
});

describe('utility guards', () => {
  it('isRetryableRegistrarError matches throttling/transport but not domain state', () => {
    expect(isRetryableRegistrarError(rateLimit)).toBe(true);
    expect(isRetryableRegistrarError(transport)).toBe(true);
    expect(isRetryableRegistrarError(domainNotFound)).toBe(false);
    expect(isRetryableRegistrarError(new Error('plain'))).toBe(false);
  });

  it('isDomainStateError matches status/transfer/renewal errors', () => {
    expect(isDomainStateError(statusProhibits)).toBe(true);
    expect(isDomainStateError(authError)).toBe(false);
  });

  it('isAuthError matches authentication/authorization errors', () => {
    expect(isAuthError(authError)).toBe(true);
    expect(isAuthError(domainNotFound)).toBe(false);
  });

  it('isTLDError matches TLD errors', () => {
    expect(isTLDError(tldError)).toBe(true);
    expect(isTLDError(domainNotFound)).toBe(false);
  });
});
