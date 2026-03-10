import type { DnsResponse } from '#lib/dns/types';
import { describe, expect, it, vi } from 'vitest';
import {
  createDnsRequestContext,
  createDnsRequestHandler,
} from './dns-request-handler';

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

import { createDnsRequestHandlerV2 } from './factory';
import type { DnsQuestion, DnsRequestLink } from './dns-request-handler.types';

const baseQuestion: DnsQuestion = {
  rawName: 'example.com.',
  rawType: 1,
  recordName: 'example.com' as DnsQuestion['recordName'],
  recordType: 'A',
  wildcard: false,
};

function createAnswer(data: string): DnsResponse {
  return {
    Answer: [
      {
        name: 'example.com',
        type: 1,
        TTL: 300,
        data,
      },
    ],
  };
}

describe('createDnsRequestHandler', () => {
  it('terminates when a link returns a response', async () => {
    const secondLink = vi.fn<DnsRequestLink>();
    const handler = createDnsRequestHandler({
      links: [
        async () => ({
          RCODE: 3,
          Answer: [],
        }),
        secondLink,
      ],
    });

    const response = await handler.handle(baseQuestion);

    expect(response).toEqual({
      RCODE: 3,
      Answer: [],
    });
    expect(secondLink).not.toHaveBeenCalled();
  });

  it('accumulates answers across links and finalizes when the chain ends', async () => {
    const handler = createDnsRequestHandler({
      links: [
        async (context, next) => {
          context.result.Answer?.push(
            ...(createAnswer('1.1.1.1').Answer ?? []),
          );
          return next();
        },
        async (context, next) => {
          context.result.Answer?.push(
            ...(createAnswer('2.2.2.2').Answer ?? []),
          );
          return next();
        },
      ],
    });

    const response = await handler.handle(baseQuestion);

    expect(response).toEqual({
      RCODE: 0,
      Answer: [
        {
          name: 'example.com',
          type: 1,
          TTL: 300,
          data: '1.1.1.1',
        },
        {
          name: 'example.com',
          type: 1,
          TTL: 300,
          data: '2.2.2.2',
        },
      ],
    });
  });

  it('throws if a link calls next more than once', async () => {
    const handler = createDnsRequestHandler({
      links: [
        async (_context, next) => {
          await next();
          return next();
        },
      ],
    });

    await expect(handler.handle(baseQuestion)).rejects.toThrow(
      'DNS request link next() called multiple times',
    );
  });
});

describe('createDefaultDnsRequestHandler', () => {
  it('terminates wildcard questions before running resolvers', async () => {
    const getNsAndSoaRecords = vi.fn();
    const getAnswerFromPreferences = vi.fn();
    const getAnswerFromDnsRecords = vi.fn();

    const handler = createDnsRequestHandlerV2({
      dependencies: {
        getNsAndSoaRecords,
        getAnswerFromPreferences,
        getAnswerFromDnsRecords,
      },
    });

    const response = await handler.handle({
      ...baseQuestion,
      wildcard: true,
    });

    expect(response).toEqual({
      RCODE: 3,
      Answer: [],
    });
    expect(getNsAndSoaRecords).not.toHaveBeenCalled();
    expect(getAnswerFromPreferences).not.toHaveBeenCalled();
    expect(getAnswerFromDnsRecords).not.toHaveBeenCalled();
  });

  it('combines non-terminal answers before the finalizer returns', async () => {
    const handler = createDnsRequestHandlerV2({
      dependencies: {
        getNsAndSoaRecords: vi.fn().mockResolvedValue(null),
        getAnswerFromPreferences: vi
          .fn()
          .mockResolvedValue(createAnswer('1.1.1.1')),
        getAnswerFromDnsRecords: vi
          .fn()
          .mockResolvedValue(createAnswer('2.2.2.2')),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
      createInitialContext: (question) => createDnsRequestContext(question),
    });

    const response = await handler.handle(baseQuestion);

    expect(response).toEqual({
      RCODE: 0,
      Answer: [
        {
          name: 'example.com',
          type: 1,
          TTL: 300,
          data: '1.1.1.1',
        },
        {
          name: 'example.com',
          type: 1,
          TTL: 300,
          data: '2.2.2.2',
        },
      ],
    });
  });

  it('falls back to the mock resolver only when enabled and no answers exist yet', async () => {
    const getAnswerFromMockTable = vi.fn().mockResolvedValue({
      RCODE: 0,
      Answer: [
        {
          name: 'example.com.',
          type: 1,
          TTL: 300,
          data: '24.199.74.33',
        },
      ],
      Question: [
        {
          name: 'example.com.',
          type: 1,
        },
      ],
    });
    const handler = createDnsRequestHandlerV2({
      useMockDnsTable: true,
      dependencies: {
        getNsAndSoaRecords: vi.fn().mockResolvedValue(null),
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: vi.fn().mockResolvedValue(null),
        getAnswerFromMockTable,
      },
    });

    const response = await handler.handle(baseQuestion);

    expect(getAnswerFromMockTable).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      RCODE: 0,
      Answer: [
        {
          name: 'example.com.',
          type: 1,
          TTL: 300,
          data: '24.199.74.33',
        },
      ],
      Question: [
        {
          name: 'example.com.',
          type: 1,
        },
      ],
    });
  });
});
