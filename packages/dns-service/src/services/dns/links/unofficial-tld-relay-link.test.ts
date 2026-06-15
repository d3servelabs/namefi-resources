import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DnsResponse } from '#lib/dns/types';
import type { DnsQuestion } from '../dns-request-handler.types';

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

vi.mock('#lib/env', () => ({
  config: {
    NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE: 'gtld.namefi.dev',
  },
}));

const {
  createUnofficialTldRelayLink,
  isRelayZoneHost,
  matchRelayPattern,
  rewriteAnswerNames,
} = await import('./unofficial-tld-relay-link');
const { createDnsRequestHandler } = await import('../dns-request-handler');

const baseQuestion: DnsQuestion = {
  rawName: 'sami.nfi.gtld.namefi.dev.',
  rawType: 1,
  recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
  recordType: 'A',
  wildcard: false,
};

const DEFAULT_TLDS = ['nfi', 'nmfi'];
const RELAY_ZONE = 'gtld.namefi.dev';

describe('matchRelayPattern', () => {
  const opts = { tlds: DEFAULT_TLDS, relayZone: RELAY_ZONE };

  it('matches a two-label relay-form name', () => {
    expect(matchRelayPattern('sami.nfi.gtld.namefi.dev', opts)).toEqual({
      logicalName: 'sami.nfi',
    });
  });

  it('matches multi-label (subdomain) relay-form names', () => {
    expect(matchRelayPattern('www.sami.nfi.gtld.namefi.dev', opts)).toEqual({
      logicalName: 'www.sami.nfi',
    });
    expect(
      matchRelayPattern('deep.sub.foo.nmfi.gtld.namefi.dev', opts),
    ).toEqual({
      logicalName: 'deep.sub.foo.nmfi',
    });
  });

  it('is case-insensitive on the TLD', () => {
    expect(
      matchRelayPattern('sami.nfi.gtld.namefi.dev', {
        tlds: ['NFI'],
        relayZone: RELAY_ZONE,
      }),
    ).toEqual({ logicalName: 'sami.nfi' });
  });

  it('accepts TLDs with or without leading dot in config', () => {
    expect(
      matchRelayPattern('sami.nfi.gtld.namefi.dev', {
        tlds: ['.nfi'],
        relayZone: RELAY_ZONE,
      }),
    ).toEqual({ logicalName: 'sami.nfi' });
  });

  it('matches the TLD apex itself (enables ENT detection for `<tld>.<relayZone>`)', () => {
    // `nfi.gtld.namefi.dev` is an empty non-terminal when records live at
    // `sami.nfi` — the tree-aware resolver finds those as descendants of
    // the bare `nfi` node and answers NODATA. That only works if the
    // relay rewrite strips `.gtld.namefi.dev` here too.
    expect(matchRelayPattern('nfi.gtld.namefi.dev', opts)).toEqual({
      logicalName: 'nfi',
    });
  });

  it('does not match the relay-zone apex', () => {
    expect(matchRelayPattern('gtld.namefi.dev', opts)).toBeNull();
  });

  it('does not match names under a non-unofficial TLD', () => {
    expect(matchRelayPattern('sami.com.gtld.namefi.dev', opts)).toBeNull();
  });

  it('does not match direct (non-relay) unofficial-TLD names', () => {
    expect(matchRelayPattern('sami.nfi', opts)).toBeNull();
  });

  it('is anchored: does not match when additional labels follow the relay zone', () => {
    expect(
      matchRelayPattern('sami.nfi.gtld.namefi.dev.extra', opts),
    ).toBeNull();
  });

  it('returns null when the TLD list is empty', () => {
    expect(
      matchRelayPattern('sami.nfi.gtld.namefi.dev', {
        tlds: [],
        relayZone: RELAY_ZONE,
      }),
    ).toBeNull();
  });

  it('returns null when the relay zone is empty', () => {
    expect(
      matchRelayPattern('sami.nfi.gtld.namefi.dev', {
        tlds: DEFAULT_TLDS,
        relayZone: '',
      }),
    ).toBeNull();
  });

  it('accepts a trailing dot in the configured relay zone', () => {
    expect(
      matchRelayPattern('sami.nfi.gtld.namefi.dev', {
        tlds: DEFAULT_TLDS,
        relayZone: 'gtld.namefi.dev.',
      }),
    ).toEqual({ logicalName: 'sami.nfi' });
  });
});

describe('isRelayZoneHost', () => {
  it('matches the relay-zone apex itself', () => {
    expect(isRelayZoneHost('gtld.namefi.dev', { relayZone: RELAY_ZONE })).toBe(
      true,
    );
  });

  it('matches any subdomain under the relay zone', () => {
    expect(
      isRelayZoneHost('sami.nfi.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toBe(true);
    expect(
      isRelayZoneHost('foo.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toBe(true);
    expect(
      isRelayZoneHost('a.b.c.d.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(
      isRelayZoneHost('SAMI.NFI.GTLD.NAMEFI.DEV', { relayZone: RELAY_ZONE }),
    ).toBe(true);
  });

  it('tolerates trailing dots on either side', () => {
    expect(
      isRelayZoneHost('sami.nfi.gtld.namefi.dev.', { relayZone: RELAY_ZONE }),
    ).toBe(true);
    expect(
      isRelayZoneHost('sami.nfi.gtld.namefi.dev', {
        relayZone: 'gtld.namefi.dev.',
      }),
    ).toBe(true);
  });

  it('rejects unrelated hosts', () => {
    expect(isRelayZoneHost('example.com', { relayZone: RELAY_ZONE })).toBe(
      false,
    );
    expect(isRelayZoneHost('sami.nfi', { relayZone: RELAY_ZONE })).toBe(false);
  });

  it('is anchored — rejects substring matches', () => {
    expect(
      isRelayZoneHost('gtld.namefi.dev.extra', { relayZone: RELAY_ZONE }),
    ).toBe(false);
  });

  it('returns false for an empty relay zone', () => {
    expect(isRelayZoneHost('sami.nfi.gtld.namefi.dev', { relayZone: '' })).toBe(
      false,
    );
  });
});

describe('rewriteAnswerNames', () => {
  const logical = 'sami.nfi';
  const relay = 'sami.nfi.gtld.namefi.dev';

  it('rewrites exact-match Answer names', () => {
    const response: DnsResponse = {
      RCODE: 0,
      Answer: [{ name: 'sami.nfi', type: 1, TTL: 300, data: '1.2.3.4' }],
    };

    expect(rewriteAnswerNames(response, logical, relay)).toEqual({
      RCODE: 0,
      Answer: [
        {
          name: 'sami.nfi.gtld.namefi.dev',
          type: 1,
          TTL: 300,
          data: '1.2.3.4',
        },
      ],
    });
  });

  it('rewrites suffix-match (subdomain) Answer names', () => {
    const response: DnsResponse = {
      RCODE: 0,
      Answer: [{ name: 'www.sami.nfi', type: 1, TTL: 300, data: '5.6.7.8' }],
    };

    expect(rewriteAnswerNames(response, logical, relay).Answer?.[0].name).toBe(
      'www.sami.nfi.gtld.namefi.dev',
    );
  });

  it('rewrites Authority names and leaves unrelated names alone', () => {
    const response: DnsResponse = {
      RCODE: 3,
      Answer: [],
      Authority: [
        {
          name: 'gtld.namefi.dev',
          type: 6,
          TTL: 300,
          data: 'ns3.namefi.dev. admin.namefi.dev. 1 60 30 300 60',
        },
      ],
    };

    expect(rewriteAnswerNames(response, logical, relay)).toEqual(response);
  });

  it('never touches record data / rdata', () => {
    const response: DnsResponse = {
      RCODE: 0,
      Answer: [
        {
          name: 'sami.nfi',
          type: 5,
          TTL: 300,
          data: 'other.nfi', // CNAME target should stay untouched
        },
      ],
    };

    expect(rewriteAnswerNames(response, logical, relay).Answer?.[0].data).toBe(
      'other.nfi',
    );
  });

  it('is a no-op when there are no Answer or Authority entries', () => {
    const response: DnsResponse = { RCODE: 0, Answer: [] };
    expect(rewriteAnswerNames(response, logical, relay)).toEqual(response);
  });
});

describe('createUnofficialTldRelayLink (integration)', () => {
  let originalTldsEnv: string | undefined;

  beforeEach(() => {
    originalTldsEnv = process.env.NAMEFI_UNOFFICIAL_TLDS;
    process.env.NAMEFI_UNOFFICIAL_TLDS = JSON.stringify(DEFAULT_TLDS);
  });

  afterEach(() => {
    if (originalTldsEnv === undefined) {
      delete process.env.NAMEFI_UNOFFICIAL_TLDS;
    } else {
      process.env.NAMEFI_UNOFFICIAL_TLDS = originalTldsEnv;
    }
  });

  it('rewrites recordName for downstream and rewrites Answer names back', async () => {
    const downstream = vi.fn().mockImplementation(async (context) => {
      expect(context.question.recordName).toBe('sami.nfi');
      return {
        RCODE: 0,
        Answer: [{ name: 'sami.nfi', type: 1, TTL: 300, data: '1.2.3.4' }],
      };
    });

    const handler = createDnsRequestHandler({
      links: [createUnofficialTldRelayLink(), downstream],
    });

    const response = await handler.handle(baseQuestion);

    expect(downstream).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      RCODE: 0,
      Answer: [
        {
          name: 'sami.nfi.gtld.namefi.dev',
          type: 1,
          TTL: 300,
          data: '1.2.3.4',
        },
      ],
    });
  });

  it('is a no-op for non-relay queries (passes through unchanged)', async () => {
    const downstream = vi.fn().mockImplementation(async (context) => {
      expect(context.question.recordName).toBe('sami.nfi');
      return {
        RCODE: 0,
        Answer: [{ name: 'sami.nfi', type: 1, TTL: 300, data: '1.2.3.4' }],
      };
    });

    const handler = createDnsRequestHandler({
      links: [createUnofficialTldRelayLink(), downstream],
    });

    const response = await handler.handle({
      ...baseQuestion,
      rawName: 'sami.nfi.',
      recordName: 'sami.nfi' as DnsQuestion['recordName'],
    });

    expect(response.Answer?.[0].name).toBe('sami.nfi');
  });

  it('preserves NXDOMAIN with empty Answer and does not fabricate Authority', async () => {
    const downstream = vi.fn().mockResolvedValue({ RCODE: 3, Answer: [] });

    const handler = createDnsRequestHandler({
      links: [createUnofficialTldRelayLink(), downstream],
    });

    const response = await handler.handle(baseQuestion);

    expect(response).toEqual({ RCODE: 3, Answer: [] });
  });

  it('restores context.question.recordName when downstream throws', async () => {
    const thrown = new Error('downstream failure');
    const capturedContexts: DnsQuestion[] = [];
    const probeLink = async (
      context: { question: DnsQuestion },
      next: () => Promise<DnsResponse>,
    ) => {
      capturedContexts.push(context.question);
      try {
        return await next();
      } finally {
        capturedContexts.push(context.question);
      }
    };
    const downstream = vi.fn().mockRejectedValue(thrown);

    const handler = createDnsRequestHandler({
      links: [probeLink, createUnofficialTldRelayLink(), downstream],
    });

    await expect(handler.handle(baseQuestion)).rejects.toBe(thrown);
    expect(capturedContexts).toHaveLength(2);
    expect(capturedContexts[0].recordName).toBe(baseQuestion.recordName);
    expect(capturedContexts[1].recordName).toBe(baseQuestion.recordName);
  });

  it('is a no-op when the TLD list resolves to empty', async () => {
    process.env.NAMEFI_UNOFFICIAL_TLDS = '[]';

    const downstream = vi.fn().mockImplementation(async (context) => {
      expect(context.question.recordName).toBe('sami.nfi.gtld.namefi.dev');
      return { RCODE: 3, Answer: [] };
    });

    const handler = createDnsRequestHandler({
      links: [createUnofficialTldRelayLink(), downstream],
    });

    await handler.handle(baseQuestion);
    expect(downstream).toHaveBeenCalledTimes(1);
  });
});
