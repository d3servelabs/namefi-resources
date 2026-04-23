import { describe, expect, it, vi } from 'vitest';

// Keep these tests free of the real `@google-cloud/dns` client so we can
// exercise the pure helpers without any network / credential machinery.
vi.mock('@google-cloud/dns', () => ({
  DNS: vi.fn(() => ({ zone: vi.fn() })),
}));

vi.mock('#lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('#lib/env', () => ({
  secrets: {
    GOOGLE_CLOUD_PROJECT_ID: 'test-project',
  },
}));

const {
  GoogleDnsZoneNotFoundError,
  normalizeCnameTarget,
  normalizeFqdnWithinZone,
} = await import('./dns-client');

describe('normalizeFqdnWithinZone', () => {
  it('returns record name unchanged when already dot-terminated (absolute FQDN)', () => {
    expect(normalizeFqdnWithinZone('www.example.com.', 'example.com.')).toBe(
      'www.example.com.',
    );
  });

  it('appends zone DNS name when record is relative', () => {
    expect(normalizeFqdnWithinZone('www', 'example.com.')).toBe(
      'www.example.com.',
    );
  });

  it('tolerates zone DNS name without trailing dot', () => {
    expect(normalizeFqdnWithinZone('www', 'example.com')).toBe(
      'www.example.com.',
    );
  });
});

describe('normalizeCnameTarget', () => {
  it('adds a trailing dot when absent', () => {
    expect(normalizeCnameTarget('target.example.com')).toBe(
      'target.example.com.',
    );
  });

  it('leaves a dot-terminated target untouched', () => {
    expect(normalizeCnameTarget('target.example.com.')).toBe(
      'target.example.com.',
    );
  });
});

describe('GoogleDnsZoneNotFoundError', () => {
  it('carries the zone name and project id, with a descriptive message', () => {
    const err = new GoogleDnsZoneNotFoundError('my-zone', 'my-project');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('GoogleDnsZoneNotFoundError');
    expect(err.zoneName).toBe('my-zone');
    expect(err.projectId).toBe('my-project');
    expect(err.message).toMatch(/my-zone/);
    expect(err.message).toMatch(/my-project/);
  });

  it('accepts an optional cause', () => {
    const root = new Error('upstream 404');
    const err = new GoogleDnsZoneNotFoundError('z', 'p', root);
    expect((err as unknown as { cause?: unknown }).cause).toBe(root);
  });
});
