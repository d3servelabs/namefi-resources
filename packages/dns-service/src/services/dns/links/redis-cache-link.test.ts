import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DnsResponse } from '#lib/dns/types';
import type {
  DnsQuestion,
  DnsRequestContext,
} from '../dns-request-handler.types';

const redisClient = { get: vi.fn(), set: vi.fn() };

vi.mock('#lib/redis', () => ({
  getRedisClient: vi.fn(async () => redisClient),
}));

const { createRedisCacheLink } = await import('./redis-cache-link');

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

const options = {
  namespace: 'v2',
  maxTtlSeconds: 300,
  negativeTtlSeconds: 30,
  timeoutMs: 1000,
};

beforeEach(() => {
  redisClient.get.mockReset().mockResolvedValue(null);
  redisClient.set.mockReset().mockResolvedValue('OK');
});

describe('createRedisCacheLink', () => {
  it('stores a cacheable response on a miss, keyed by namespace + question', async () => {
    const link = createRedisCacheLink(options);
    const next = vi.fn(async () => answerResponse(60));

    await link(makeContext(makeQuestion('example.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      'dns-cache:v1:v2:example.com.:A',
      expect.any(String),
      { EX: 60 },
    );
  });

  it('serves a hit without calling next', async () => {
    redisClient.get.mockResolvedValue(JSON.stringify(answerResponse(60)));
    const link = createRedisCacheLink(options);
    const next = vi.fn(async () => answerResponse(99));

    const res = await link(makeContext(makeQuestion('example.com.')), next);

    expect(next).not.toHaveBeenCalled();
    expect(res.Answer?.[0].TTL).toBe(60);
  });

  it('caps the positive TTL at maxTtlSeconds', async () => {
    const link = createRedisCacheLink({ ...options, maxTtlSeconds: 30 });
    const next = vi.fn(async () => answerResponse(600));

    await link(makeContext(makeQuestion('a.com.')), next);

    expect(redisClient.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        EX: 30,
      },
    );
  });

  it('uses the negative TTL for NXDOMAIN', async () => {
    const link = createRedisCacheLink(options);
    const next = vi.fn(async () => ({ RCODE: 3, Answer: [] }) as DnsResponse);

    await link(makeContext(makeQuestion('nx.com.')), next);

    expect(redisClient.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        EX: 30,
      },
    );
  });

  it('does not cache non-cacheable responses', async () => {
    const link = createRedisCacheLink(options);
    const next = vi.fn(async () => ({ RCODE: 2, Answer: [] }) as DnsResponse);

    await link(makeContext(makeQuestion('fail.com.')), next);

    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it('degrades gracefully when the Redis read fails', async () => {
    redisClient.get.mockRejectedValue(new Error('redis down'));
    const link = createRedisCacheLink(options);
    const next = vi.fn(async () => answerResponse(60));

    const res = await link(makeContext(makeQuestion('a.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.Answer?.[0].data).toBe('1.2.3.4');
  });

  it('falls through to origin when a Redis read exceeds the timeout', async () => {
    redisClient.get.mockReturnValue(new Promise<string | null>(() => {})); // never resolves
    const link = createRedisCacheLink({ ...options, timeoutMs: 20 });
    const next = vi.fn(async () => answerResponse(60));

    const res = await link(makeContext(makeQuestion('slow.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.Answer?.[0].data).toBe('1.2.3.4');
  });

  it('still returns the response when a Redis write exceeds the timeout', async () => {
    redisClient.set.mockReturnValue(new Promise<string>(() => {})); // never resolves
    const link = createRedisCacheLink({ ...options, timeoutMs: 20 });
    const next = vi.fn(async () => answerResponse(60));

    const res = await link(makeContext(makeQuestion('slow-write.com.')), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.Answer?.[0].data).toBe('1.2.3.4');
  });

  it('bypasses the cache for mock-table requests', async () => {
    const link = createRedisCacheLink(options);
    const next = vi.fn(async () => answerResponse(60));

    await link(
      makeContext(makeQuestion('m.com.'), { useMockDnsTable: true }),
      next,
    );

    expect(redisClient.get).not.toHaveBeenCalled();
    expect(redisClient.set).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
