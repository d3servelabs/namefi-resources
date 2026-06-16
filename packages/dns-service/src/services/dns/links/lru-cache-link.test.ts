import { describe, expect, it, vi } from 'vitest';
import type { DnsResponse } from '#lib/dns/types';
import type {
  DnsQuestion,
  DnsRequestContext,
} from '../dns-request-handler.types';
import { createLruCacheLink } from './lru-cache-link';

const mockLogger = {
  assign: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
};

function makeQuestion(name: string, type = 'A'): DnsQuestion {
  return {
    rawName: name,
    rawType: 1,
    recordName: name as DnsQuestion['recordName'],
    recordType: type as DnsQuestion['recordType'],
    wildcard: false,
  };
}

function makeContext(
  question: DnsQuestion,
  meta: Partial<DnsRequestContext['meta']> = {},
): DnsRequestContext {
  return {
    question,
    result: { Answer: [] },
    meta: { heartbeat: false, useMockDnsTable: false, ...meta },
    logger: mockLogger as unknown as DnsRequestContext['logger'],
  };
}

const answerResponse = (ttl = 60): DnsResponse => ({
  RCODE: 0,
  Answer: [{ name: 'example.com.', type: 1, TTL: ttl, data: '1.2.3.4' }],
});

const baseOptions = {
  namespace: 'v2',
  maxEntries: 100,
  maxTtlSeconds: 300,
  negativeTtlSeconds: 30,
};

describe('createLruCacheLink', () => {
  it('caches a cacheable response and serves it on the next identical query', async () => {
    const link = createLruCacheLink(baseOptions);
    const next = vi.fn(async () => answerResponse());

    const first = await link(makeContext(makeQuestion('example.com.')), next);
    const second = await link(makeContext(makeQuestion('example.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('returns a clone, so mutating the result cannot corrupt the cache', async () => {
    const link = createLruCacheLink(baseOptions);
    const next = vi.fn(async () => answerResponse());

    const first = await link(makeContext(makeQuestion('a.com.')), next);
    first.Answer![0].data = 'mutated';
    const second = await link(makeContext(makeQuestion('a.com.')), next);

    expect(second.Answer![0].data).toBe('1.2.3.4');
  });

  it('misses for a different question', async () => {
    const link = createLruCacheLink(baseOptions);
    const next = vi.fn(async () => answerResponse());

    await link(makeContext(makeQuestion('a.com.')), next);
    await link(makeContext(makeQuestion('b.com.')), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does not cache mock-table responses', async () => {
    const link = createLruCacheLink(baseOptions);
    const next = vi.fn(async () => answerResponse());
    const q = makeQuestion('mock.com.');

    await link(makeContext(q, { useMockDnsTable: true }), next);
    await link(makeContext(q, { useMockDnsTable: true }), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does not cache non-cacheable responses (e.g. SERVFAIL)', async () => {
    const link = createLruCacheLink(baseOptions);
    const next = vi.fn(async () => ({ RCODE: 2, Answer: [] }) as DnsResponse);

    await link(makeContext(makeQuestion('fail.com.')), next);
    await link(makeContext(makeQuestion('fail.com.')), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('caches negative (NXDOMAIN) responses', async () => {
    const link = createLruCacheLink(baseOptions);
    const next = vi.fn(async () => ({ RCODE: 3, Answer: [] }) as DnsResponse);

    await link(makeContext(makeQuestion('nx.com.')), next);
    await link(makeContext(makeQuestion('nx.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('evicts by entry count when maxEntries is exceeded', async () => {
    const link = createLruCacheLink({ ...baseOptions, maxEntries: 1 });
    const next = vi.fn(async () => answerResponse());

    await link(makeContext(makeQuestion('a.com.')), next); // store a
    await link(makeContext(makeQuestion('b.com.')), next); // store b, evict a
    await link(makeContext(makeQuestion('a.com.')), next); // a evicted -> miss

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('works in size-based mode (maxSizeBytes set)', async () => {
    const link = createLruCacheLink({ ...baseOptions, maxSizeBytes: 100_000 });
    const next = vi.fn(async () => answerResponse());

    await link(makeContext(makeQuestion('a.com.')), next);
    await link(makeContext(makeQuestion('a.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
