import { describe, expect, it, vi } from 'vitest';

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

const { parseDnsQuestion } = await import('./dns-request-question');

describe('parseDnsQuestion', () => {
  it('parses a valid query into a DNS question', () => {
    const result = parseDnsQuestion({
      name: 'example.com.',
      type: '1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected parseDnsQuestion to succeed');
    }

    expect(result.question).toMatchObject({
      rawName: 'example.com.',
      rawType: 1,
      recordName: 'example.com',
      recordType: 'A',
      wildcard: false,
    });
  });

  it('parses wildcard queries without terminating them early', () => {
    const result = parseDnsQuestion({
      name: '*.example.com.',
      type: '1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected parseDnsQuestion to succeed');
    }

    expect(result.question).toMatchObject({
      recordName: 'example.com',
      wildcard: true,
    });
  });

  it('returns a validation error for invalid domains', () => {
    const result = parseDnsQuestion({
      name: 'localhost',
      type: '1',
    });

    expect(result).toEqual({
      ok: false,
      kind: 'error',
      error: {
        statusCode: 412,
        message: expect.stringContaining('Invalid parameters'),
      },
    });
  });

  it('returns a validation error for non-numeric record types', () => {
    const result = parseDnsQuestion({
      name: 'example.com.',
      type: 'abc',
    });

    expect(result).toEqual({
      ok: false,
      kind: 'error',
      error: {
        statusCode: 412,
        message: expect.stringContaining(
          'Type must be a numeric DNS record type',
        ),
      },
    });
  });

  it('returns an immediate empty response for known but unsupported record types', () => {
    const result = parseDnsQuestion({
      name: 'example.com.',
      type: '24',
    });

    expect(result).toEqual({
      ok: false,
      kind: 'response',
      response: {
        RCODE: 0,
        Answer: [],
      },
    });
  });
});
