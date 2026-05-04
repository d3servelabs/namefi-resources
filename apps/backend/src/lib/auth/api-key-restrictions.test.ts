import { describe, expect, it, vi } from 'vitest';

vi.mock('#lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const { ipMatchesCidr, isValidOriginPattern, originMatchesPattern } =
  await import('./api-key-restrictions');

describe('isValidOriginPattern', () => {
  it.each([
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://example.com:8443',
    'https://*.example.com:3000',
    'http://[::1]:3000',
  ])('accepts origin patterns with optional ports: %s', (origin) => {
    expect(isValidOriginPattern(origin)).toBe(true);
  });

  it.each([
    'https://example.com:',
    'https://example.com:99999',
    'https://example.com:abc',
    'https://example.com/path',
    'https://*.[::1]:3000',
  ])('rejects invalid origin patterns: %s', (origin) => {
    expect(isValidOriginPattern(origin)).toBe(false);
  });
});

describe('originMatchesPattern', () => {
  it('matches exact origins with non-default ports', () => {
    expect(
      originMatchesPattern('http://localhost:3000', 'http://localhost:3000'),
    ).toBe(true);
  });

  it('does not match exact origins with different ports', () => {
    expect(
      originMatchesPattern('http://localhost:5173', 'http://localhost:3000'),
    ).toBe(false);
  });

  it('normalizes default ports for exact origin matches', () => {
    expect(
      originMatchesPattern('https://example.com', 'https://example.com:443'),
    ).toBe(true);
  });

  it('requires wildcard origin ports to match', () => {
    expect(
      originMatchesPattern(
        'https://api.example.com:3000',
        'https://*.example.com:3000',
      ),
    ).toBe(true);

    expect(
      originMatchesPattern(
        'https://api.example.com:4000',
        'https://*.example.com:3000',
      ),
    ).toBe(false);
  });
});

describe('ipMatchesCidr', () => {
  it('normalizes IPv4-mapped IPv6 hex clients before CIDR checks', () => {
    expect(ipMatchesCidr('::ffff:c0a8:0101', '192.168.1.0/24')).toBe(true);
    expect(ipMatchesCidr('::ffff:c0a8:0101', '192.168.2.0/24')).toBe(false);
  });

  it('normalizes IPv4-mapped IPv6 hex addresses for exact matches', () => {
    expect(ipMatchesCidr('::ffff:c0a8:0101', '192.168.1.1')).toBe(true);
    expect(ipMatchesCidr('192.168.1.1', '::ffff:c0a8:0101')).toBe(true);
  });

  it('normalizes IPv4-mapped IPv6 CIDR ranges', () => {
    expect(ipMatchesCidr('192.168.1.42', '::ffff:c0a8:0100/120')).toBe(true);
    expect(ipMatchesCidr('192.168.2.42', '::ffff:c0a8:0100/120')).toBe(false);
  });
});
