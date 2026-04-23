import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const mockLogger = {
  assign: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
  logger: mockLogger,
}));

const {
  isVercelProvisionable,
  VercelNotApplicableError,
  vercelApplicabilityReason,
} = await import('./applicability');

const asDomain = (s: string) => s as NamefiNormalizedDomain;

// Some assertions involve unofficial TLDs (e.g. `nfi`, `sami.nfi`) which
// `parseDomainName` only treats as valid when NAMEFI_UNOFFICIAL_TLDS lists
// them. Stub the env so those cases reflect production behavior.
const originalTlds = process.env.NAMEFI_UNOFFICIAL_TLDS;

beforeEach(() => {
  process.env.NAMEFI_UNOFFICIAL_TLDS = JSON.stringify(['nfi']);
});

afterEach(() => {
  if (originalTlds === undefined) {
    delete process.env.NAMEFI_UNOFFICIAL_TLDS;
  } else {
    process.env.NAMEFI_UNOFFICIAL_TLDS = originalTlds;
  }
});

describe('isVercelProvisionable', () => {
  it('rejects TLDs (single-label)', () => {
    expect(isVercelProvisionable(asDomain('com'))).toBe(false);
  });

  it('rejects unofficial TLDs like `nfi` as a bare label', () => {
    expect(isVercelProvisionable(asDomain('nfi'))).toBe(false);
  });

  it('accepts 2LDs', () => {
    expect(isVercelProvisionable(asDomain('example.com'))).toBe(true);
  });

  it('accepts subdomains', () => {
    expect(isVercelProvisionable(asDomain('www.example.com'))).toBe(true);
    expect(isVercelProvisionable(asDomain('sami.nfi'))).toBe(true);
  });

  it('rejects obviously invalid strings', () => {
    expect(isVercelProvisionable(asDomain(''))).toBe(false);
    expect(isVercelProvisionable(asDomain(' '))).toBe(false);
  });
});

describe('vercelApplicabilityReason', () => {
  it('returns `tld` for single-label names', () => {
    expect(vercelApplicabilityReason(asDomain('com'))).toBe('tld');
  });

  it('returns `invalid-domain` for invalid inputs', () => {
    expect(vercelApplicabilityReason(asDomain(''))).toBe('invalid-domain');
  });

  it('returns null for provisionable domains', () => {
    expect(vercelApplicabilityReason(asDomain('example.com'))).toBeNull();
    expect(vercelApplicabilityReason(asDomain('www.example.com'))).toBeNull();
  });
});

describe('VercelNotApplicableError', () => {
  it('carries a tagged `reason` and the offending domain', () => {
    const err = new VercelNotApplicableError('nfi', 'tld');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('VercelNotApplicableError');
    expect(err.reason).toBe('tld');
    expect(err.domain).toBe('nfi');
    expect(err.message).toMatch(/TLD/);
  });

  it('has a distinct message for invalid domains', () => {
    const err = new VercelNotApplicableError('', 'invalid-domain');
    expect(err.reason).toBe('invalid-domain');
    expect(err.message).toMatch(/valid FQDN/);
  });
});
