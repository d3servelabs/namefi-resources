import { describe, expect, it, vi } from 'vitest';
import type {
  DnsRequestContext,
  DnsRequestLink,
} from '../dns-request-handler.types';

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

const { mergeLinks, switchLink } = await import('./combinators');

function createContext(): DnsRequestContext {
  return {
    question: {
      rawName: 'example.com.',
      rawType: 1,
      recordName: 'example.com' as DnsRequestContext['question']['recordName'],
      recordType: 'A',
      wildcard: false,
    },
    result: { Answer: [] },
    meta: { heartbeat: false, useMockDnsTable: false },
    logger: mockLogger as unknown as DnsRequestContext['logger'],
  };
}

describe('mergeLinks', () => {
  it('with zero links calls outer next directly', async () => {
    const composite = mergeLinks();
    const outerNext = vi.fn().mockResolvedValue({ RCODE: 0, Answer: [] });

    const result = await composite(createContext(), outerNext);

    expect(outerNext).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ RCODE: 0, Answer: [] });
  });

  it('sequences N links and only the last one reaches outer next', async () => {
    const order: string[] = [];
    const a: DnsRequestLink = async (_ctx, next) => {
      order.push('a:pre');
      const result = await next();
      order.push('a:post');
      return result;
    };
    const b: DnsRequestLink = async (_ctx, next) => {
      order.push('b:pre');
      const result = await next();
      order.push('b:post');
      return result;
    };
    const c: DnsRequestLink = async (_ctx, next) => {
      order.push('c:pre');
      const result = await next();
      order.push('c:post');
      return result;
    };
    const outerNext = vi.fn().mockImplementation(async () => {
      order.push('outer');
      return { RCODE: 0, Answer: [] };
    });

    const composite = mergeLinks(a, b, c);
    await composite(createContext(), outerNext);

    expect(order).toEqual([
      'a:pre',
      'b:pre',
      'c:pre',
      'outer',
      'c:post',
      'b:post',
      'a:post',
    ]);
    expect(outerNext).toHaveBeenCalledTimes(1);
  });

  it('short-circuits when any link returns without calling next', async () => {
    const first = vi
      .fn<DnsRequestLink>()
      .mockResolvedValue({ RCODE: 3, Answer: [] });
    const second = vi.fn<DnsRequestLink>();
    const outerNext = vi.fn();

    const composite = mergeLinks(first, second);
    const result = await composite(createContext(), outerNext);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(outerNext).not.toHaveBeenCalled();
    expect(result).toEqual({ RCODE: 3, Answer: [] });
  });

  it('throws when a merged link calls its next more than once', async () => {
    const misbehaving: DnsRequestLink = async (_ctx, next) => {
      await next();
      return next();
    };
    const outerNext = vi.fn().mockResolvedValue({ RCODE: 0, Answer: [] });

    const composite = mergeLinks(misbehaving);

    await expect(composite(createContext(), outerNext)).rejects.toThrow(
      /next\(\) called more than once/,
    );
  });
});

describe('switchLink', () => {
  it('runs ifTrue when predicate matches and leaves ifFalse untouched', async () => {
    const ifTrue = vi.fn<DnsRequestLink>().mockResolvedValue({
      RCODE: 0,
      Answer: [{ name: 'x', type: 1, TTL: 60, data: 'v' }],
    });
    const ifFalse = vi.fn<DnsRequestLink>();
    const outerNext = vi.fn();

    const link = switchLink(() => true, ifTrue, ifFalse);
    const result = await link(createContext(), outerNext);

    expect(ifTrue).toHaveBeenCalledTimes(1);
    expect(ifFalse).not.toHaveBeenCalled();
    expect(outerNext).not.toHaveBeenCalled();
    expect(result.Answer).toHaveLength(1);
  });

  it('runs ifFalse when predicate fails and ifFalse is provided', async () => {
    const ifTrue = vi.fn<DnsRequestLink>();
    const ifFalse = vi
      .fn<DnsRequestLink>()
      .mockResolvedValue({ RCODE: 3, Answer: [] });
    const outerNext = vi.fn();

    const link = switchLink(() => false, ifTrue, ifFalse);
    const result = await link(createContext(), outerNext);

    expect(ifTrue).not.toHaveBeenCalled();
    expect(ifFalse).toHaveBeenCalledTimes(1);
    expect(outerNext).not.toHaveBeenCalled();
    expect(result.RCODE).toBe(3);
  });

  it('falls through to outer next when predicate fails and ifFalse is omitted', async () => {
    const ifTrue = vi.fn<DnsRequestLink>();
    const outerNext = vi.fn().mockResolvedValue({ RCODE: 2, Answer: [] });

    const link = switchLink(() => false, ifTrue);
    const result = await link(createContext(), outerNext);

    expect(ifTrue).not.toHaveBeenCalled();
    expect(outerNext).toHaveBeenCalledTimes(1);
    expect(result.RCODE).toBe(2);
  });

  it('passes the same context and next through to the selected branch', async () => {
    const capturedContexts: DnsRequestContext[] = [];
    const ifTrue: DnsRequestLink = async (ctx, next) => {
      capturedContexts.push(ctx);
      return next();
    };
    const outerNext = vi.fn().mockResolvedValue({ RCODE: 0, Answer: [] });
    const context = createContext();

    const link = switchLink(() => true, ifTrue);
    await link(context, outerNext);

    expect(capturedContexts).toHaveLength(1);
    expect(capturedContexts[0]).toBe(context);
    expect(outerNext).toHaveBeenCalledTimes(1);
  });
});
