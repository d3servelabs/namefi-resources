import { describe, expect, it } from 'vitest';
import type { RegistrarKnownErrorMeta } from './base';
import { RegistrarRateLimitError, RegistrarTransportError } from './base';
import {
  formatRegistrarErrorForDebug,
  formatRegistrarErrorForUser,
  getRegistrarErrorSummary,
  getSuggestedAction,
  shouldSuggestRetry,
} from './messages';
import {
  RegistrarDomainNotFoundError,
  RegistrarStatusProhibitsError,
} from './known';

const knownMeta: Omit<RegistrarKnownErrorMeta, 'domainName'> = {
  registrarKey: 'centralnic',
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  nativeCode: 2303,
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
const lockedStatus = new RegistrarStatusProhibitsError(
  'example.com',
  'update',
  {
    ...knownMeta,
    prohibitingStatuses: ['clientUpdateProhibited', 'serverUpdateLock'],
  },
);

describe('formatRegistrarErrorForUser', () => {
  it('produces a friendly, domain-specific message', () => {
    const message = formatRegistrarErrorForUser(domainNotFound);
    expect(message).toContain('example.com');
    expect(message.toLowerCase()).toContain('not found');
  });

  it('can strip the domain name when includeDomain is false', () => {
    const message = formatRegistrarErrorForUser(domainNotFound, {
      includeDomain: false,
    });
    expect(message).not.toContain('example.com');
  });

  it('falls back to a generic message for non-registrar errors', () => {
    expect(formatRegistrarErrorForUser(new Error('raw'))).toMatch(
      /unexpected error/i,
    );
  });

  it('surfaces an unlock hint for locked-domain statuses', () => {
    expect(formatRegistrarErrorForUser(lockedStatus).toLowerCase()).toContain(
      'locked',
    );
  });
});

describe('getRegistrarErrorSummary', () => {
  it('includes the error code and domain', () => {
    const summary = getRegistrarErrorSummary(domainNotFound);
    expect(summary).toContain('REGISTRAR_DOMAIN_NOT_FOUND');
    expect(summary).toContain('example.com');
  });
});

describe('shouldSuggestRetry', () => {
  it('is true for transient errors and false for domain-state errors', () => {
    expect(shouldSuggestRetry(transport)).toBe(true);
    expect(shouldSuggestRetry(rateLimit)).toBe(true);
    expect(shouldSuggestRetry(domainNotFound)).toBe(false);
    expect(shouldSuggestRetry(new Error('plain'))).toBe(false);
  });
});

describe('getSuggestedAction', () => {
  it('returns a wait hint with seconds for rate limits', () => {
    expect(getSuggestedAction(rateLimit)).toBe('Wait 5 seconds and try again.');
  });

  it('returns a connection hint for transport errors', () => {
    expect(getSuggestedAction(transport)?.toLowerCase()).toContain(
      'internet connection',
    );
  });

  it('returns null for non-registrar errors', () => {
    expect(getSuggestedAction(new Error('plain'))).toBeNull();
  });
});

describe('formatRegistrarErrorForDebug', () => {
  it('includes code, registrar, domain and native code', () => {
    const debug = formatRegistrarErrorForDebug(domainNotFound);
    expect(debug).toContain('REGISTRAR_DOMAIN_NOT_FOUND');
    expect(debug).toContain('centralnic');
    expect(debug).toContain('example.com');
    expect(debug).toContain('2303');
  });
});
