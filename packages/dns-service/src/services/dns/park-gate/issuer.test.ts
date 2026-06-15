import { describe, expect, it, vi } from 'vitest';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
  logger: mockLogger,
}));

vi.mock('#lib/env', () => ({
  config: {
    NAMEFI_PARK_GATE_LABEL: '_namefi-gate',
    NAMEFI_PARK_GATE_TOKEN_TTL_SECONDS: 60 * 60 * 24,
    NAMEFI_PARK_GATE_CACHE_TTL_SECONDS: 60 * 60 * 12,
    NAMEFI_PARK_GATE_ROUTES: ['/*'],
  },
  secrets: {},
}));

vi.mock('#lib/redis', () => ({
  getRedisClient: vi.fn(),
}));

const { formatGateTxtRdata, TXT_CHARACTER_STRING_MAX_BYTES } = await import(
  './issuer'
);

function unquoteChunks(rdata: string): string[] {
  return rdata.split(' ').map((chunk) => chunk.replace(/^"|"$/g, ''));
}

describe('formatGateTxtRdata', () => {
  it('wraps a short value in a single quoted character-string', () => {
    expect(formatGateTxtRdata('signed.jwt.token')).toBe('"signed.jwt.token"');
  });

  it('emits an empty quoted string for an empty value', () => {
    expect(formatGateTxtRdata('')).toBe('""');
  });

  it('splits a value longer than 255 bytes into multiple quoted strings', () => {
    const value = `${'a'.repeat(TXT_CHARACTER_STRING_MAX_BYTES)}${'b'.repeat(30)}`;
    const rdata = formatGateTxtRdata(value);

    expect(rdata).toBe(
      `"${'a'.repeat(TXT_CHARACTER_STRING_MAX_BYTES)}" "${'b'.repeat(30)}"`,
    );

    const chunks = unquoteChunks(rdata);
    expect(chunks).toHaveLength(2);
    // Every character-string stays within the 255-byte cap...
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(TXT_CHARACTER_STRING_MAX_BYTES);
    }
    // ...and concatenating them (as net.LookupTXT does) round-trips the token.
    expect(chunks.join('')).toBe(value);
  });

  it('splits exactly on the boundary (two full chunks)', () => {
    const value = 'x'.repeat(TXT_CHARACTER_STRING_MAX_BYTES * 2);
    const rdata = formatGateTxtRdata(value);
    const chunks = unquoteChunks(rdata);
    expect(chunks).toHaveLength(2);
    expect(chunks.join('')).toBe(value);
  });

  it('round-trips a realistic ~280-byte ES256 JWT', () => {
    const jwt = `${'h'.repeat(36)}.${'p'.repeat(154)}.${'s'.repeat(86)}`;
    expect(jwt.length).toBeGreaterThan(TXT_CHARACTER_STRING_MAX_BYTES);

    const chunks = unquoteChunks(formatGateTxtRdata(jwt));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe(jwt);
  });
});
