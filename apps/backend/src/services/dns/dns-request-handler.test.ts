import type { DnsResponse } from '#lib/dns/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('#lib/env', () => ({
  config: {
    NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE: 'gtld.namefi.dev',
    NAMEFI_ASTRA_NAMESERVERS: ['ns3.namefi.dev.', 'ns4.namefi.dev.'],
  },
  secrets: {},
}));

// Zone-ns-soa pulls in DB clients and the powered-by-namefi registry; stub
// it to a passthrough so V2.1 integration tests can exercise the relay
// sub-chain without real DB/registry dependencies. The link's own behavior is
// covered in its own tests.
vi.mock('./links/zone-ns-soa-link', () => ({
  createZoneNsAndSoaLink:
    () => async (_ctx: unknown, next: () => Promise<DnsResponse>) =>
      next(),
}));

import {
  createDnsRequestHandlerV2,
  createDnsRequestHandlerV2_1,
  createDnsRequestHandlerV2_2,
} from './factory';
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

describe('createDnsRequestHandlerV2_1 (relay chain integration)', () => {
  const originalEnvironment = process.env.ENVIRONMENT;
  const originalTldsEnv = process.env.NAMEFI_UNOFFICIAL_TLDS;

  beforeEach(() => {
    // The relay sub-chain is gated off in production; run the tests as a
    // non-production env so the switchLink predicate can engage.
    process.env.ENVIRONMENT = 'development';
    process.env.NAMEFI_UNOFFICIAL_TLDS = JSON.stringify(['nfi']);
  });

  afterEach(() => {
    if (originalEnvironment === undefined) {
      delete process.env.ENVIRONMENT;
    } else {
      process.env.ENVIRONMENT = originalEnvironment;
    }
    if (originalTldsEnv === undefined) {
      delete process.env.NAMEFI_UNOFFICIAL_TLDS;
    } else {
      process.env.NAMEFI_UNOFFICIAL_TLDS = originalTldsEnv;
    }
  });

  it('returns NXDOMAIN with a relay-zone Authority SOA when no records exist', async () => {
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        // Mirror the production `getAnswerForDnsQueryFromDnsRecords` contract:
        // an explicit `{ RCODE: 3, Answer: [] }` is returned when no records
        // match, which short-circuits the resolver chain with NXDOMAIN.
        getAnswerFromDnsRecords: vi
          .fn()
          .mockResolvedValue({ RCODE: 3, Answer: [] }),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'sami.nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(response.RCODE).toBe(3);
    expect(response.Answer).toEqual([]);
    expect(response.Authority).toHaveLength(1);
    expect(response.Authority?.[0]).toMatchObject({
      name: 'gtld.namefi.dev',
      type: 6, // SOA
    });
  });

  it('rewrites downstream records from logical to relay form when found', async () => {
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: vi.fn(async (recordName) => {
          // The resolver must see the stripped logical name.
          expect(recordName).toBe('sami.nfi');
          return {
            RCODE: 0,
            Answer: [{ name: 'sami.nfi', type: 1, TTL: 300, data: '1.2.3.4' }],
          };
        }),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'sami.nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(response.RCODE).toBe(0);
    expect(response.Answer).toEqual([
      {
        name: 'sami.nfi.gtld.namefi.dev',
        type: 1,
        TTL: 300,
        data: '1.2.3.4',
      },
    ]);
  });

  it('short-circuits NS at the relay-zone apex with synthesized records', async () => {
    const preferences = vi.fn().mockResolvedValue(null);
    const dnsRecords = vi.fn().mockResolvedValue(null);
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: preferences,
        getAnswerFromDnsRecords: dnsRecords,
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'gtld.namefi.dev.',
      rawType: 2,
      recordName: 'gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'NS',
      wildcard: false,
    });

    expect(response.RCODE).toBe(0);
    expect(response.Answer).toHaveLength(2);
    expect(response.Answer?.[0]).toMatchObject({
      name: 'gtld.namefi.dev',
      type: 2, // NS
      data: 'ns3.namefi.dev.',
    });
    // The resolvers are never reached — the apex short-circuit fires first.
    expect(preferences).not.toHaveBeenCalled();
    expect(dnsRecords).not.toHaveBeenCalled();
  });

  it('does not engage the relay sub-chain for non-relay hosts', async () => {
    const preferences = vi.fn(async (recordName) => {
      // The resolver must see the original (non-rewritten) name.
      expect(recordName).toBe('example.com');
      return null;
    });
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: preferences,
        getAnswerFromDnsRecords: vi.fn().mockResolvedValue(null),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'example.com.',
      rawType: 1,
      recordName: 'example.com' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    // Zone-ns-soa is stubbed to passthrough, so we get whatever terminationLink finalizes.
    expect(response.RCODE).toBe(0);
    expect(response.Answer).toEqual([]);
    expect(response.Authority).toBeUndefined();
    expect(preferences).toHaveBeenCalledTimes(1);
  });

  it('returns NODATA with a relay-zone Authority SOA for ENT (records only at descendants)', async () => {
    // Resolver signals "node exists as ENT" by returning RCODE=0 empty Answer.
    // Per RFC 2308 §3 we still attach the relay-zone SOA so resolvers can
    // negative-cache the lack of records of this type at this node.
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: vi
          .fn()
          .mockResolvedValue({ RCODE: 0, Answer: [] }),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'sami.nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(response.RCODE).toBe(0);
    expect(response.Answer).toEqual([]);
    expect(response.Authority).toHaveLength(1);
    expect(response.Authority?.[0]).toMatchObject({
      name: 'gtld.namefi.dev',
      type: 6, // SOA
    });
  });

  it('returns NODATA (not NXDOMAIN) for the TLD apex `nfi.gtld.namefi.dev` when logical `nfi` has descendant records', async () => {
    // `sami.nfi` exists in dns_records, so `nfi` is an ENT in the tree
    // (RFC 8020). A query for `nfi.gtld.namefi.dev` must get NODATA, not
    // NXDOMAIN: the relay strip rewrites the query to bare `nfi`, and the
    // tree-aware resolver finds `sami.nfi` as a descendant of `nfi`.
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: vi.fn(async (recordName) => {
          // The relay link must rewrite the TLD apex to the bare TLD.
          expect(recordName).toBe('nfi');
          // Emulate the real resolver: `sami.nfi` is a descendant → NODATA.
          return { RCODE: 0, Answer: [] };
        }),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(response.RCODE).toBe(0);
    expect(response.Answer).toEqual([]);
    expect(response.Authority).toHaveLength(1);
    expect(response.Authority?.[0]).toMatchObject({
      name: 'gtld.namefi.dev',
      type: 6, // SOA
    });
  });

  it('is a no-op in production regardless of host', async () => {
    process.env.ENVIRONMENT = 'production';
    const dnsRecords = vi.fn(async (recordName) => {
      // Production bypasses the relay sub-chain, so the resolver sees the raw name.
      expect(recordName).toBe('sami.nfi.gtld.namefi.dev');
      return null;
    });
    const handler = createDnsRequestHandlerV2_1({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: dnsRecords,
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'sami.nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(dnsRecords).toHaveBeenCalledTimes(1);
    // No relay-zone Authority injected.
    expect(response.Authority).toBeUndefined();
  });
});

describe('createDnsRequestHandlerV2_2 (relay chain integration)', () => {
  // V2.2 uses `createGatedLink(createRewriteRelayedLink(), predicate)` and
  // places `createZoneNsAndSoaLink` *after* the gate in the outer chain,
  // so relay queries transit zone-ns-soa on unwind. The regression these
  // tests guard against: zone-ns-soa used to unconditionally return
  // `{ RCODE: 3, Answer: [] }` when no authoritative zone was found,
  // clobbering the resolver's NODATA (from the ENT descendant probe for
  // the stripped logical name — e.g. `nfi` has `sami.nfi` below it) into
  // NXDOMAIN. zone-ns-soa now preserves the downstream decision when it
  // has no zone-level info to contribute.
  const originalEnvironment = process.env.ENVIRONMENT;
  const originalTldsEnv = process.env.NAMEFI_UNOFFICIAL_TLDS;

  beforeEach(() => {
    process.env.ENVIRONMENT = 'development';
    process.env.NAMEFI_UNOFFICIAL_TLDS = JSON.stringify(['nfi']);
  });

  afterEach(() => {
    if (originalEnvironment === undefined) {
      delete process.env.ENVIRONMENT;
    } else {
      process.env.ENVIRONMENT = originalEnvironment;
    }
    if (originalTldsEnv === undefined) {
      delete process.env.NAMEFI_UNOFFICIAL_TLDS;
    } else {
      process.env.NAMEFI_UNOFFICIAL_TLDS = originalTldsEnv;
    }
  });

  it('returns NODATA (not NXDOMAIN) for the unofficial-TLD apex `nfi.gtld.namefi.dev`, even when downstream says NXDOMAIN', async () => {
    // The relay zone owns the `nfi` namespace because `nfi` is declared
    // in `NAMEFI_UNOFFICIAL_TLDS`. Even if zone-ns-soa (which doesn't
    // know about the relay) clobbers the result to NXDOMAIN on its way
    // back up, `createRelayZoneAuthorityLink` must clamp it to NODATA.
    const handler = createDnsRequestHandlerV2_2({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: vi.fn(async (recordName) => {
          // Relay must have stripped `nfi.gtld.namefi.dev` → `nfi`
          // before hitting the resolver.
          expect(recordName).toBe('nfi');
          // Worst case: downstream clobbers to NXDOMAIN (this is what
          // zone-ns-soa does for a bare `nfi` it can't authoritatively
          // identify). The relay authority link should still emit
          // NODATA because `nfi` is a declared unofficial TLD.
          return { RCODE: 3, Answer: [] };
        }),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(response.RCODE).toBe(0);
    expect(response.Answer).toEqual([]);
    expect(response.Authority).toHaveLength(1);
    expect(response.Authority?.[0]).toMatchObject({
      name: 'gtld.namefi.dev',
      type: 6, // SOA
    });
  });

  it('returns NXDOMAIN with relay-zone SOA when no records at or below the queried relay name', async () => {
    const handler = createDnsRequestHandlerV2_2({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: vi
          .fn()
          .mockResolvedValue({ RCODE: 3, Answer: [] }),
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'sami.nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(response.RCODE).toBe(3);
    expect(response.Answer).toEqual([]);
    expect(response.Authority).toHaveLength(1);
    expect(response.Authority?.[0]).toMatchObject({
      name: 'gtld.namefi.dev',
      type: 6, // SOA
    });
  });

  it('serves synthesized NS at the relay-zone apex without touching the resolver chain', async () => {
    const dnsRecords = vi.fn().mockResolvedValue(null);
    const handler = createDnsRequestHandlerV2_2({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: dnsRecords,
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    const response = await handler.handle({
      rawName: 'gtld.namefi.dev.',
      rawType: 2,
      recordName: 'gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'NS',
      wildcard: false,
    });

    expect(response.RCODE).toBe(0);
    expect(response.Answer).toHaveLength(2);
    expect(dnsRecords).not.toHaveBeenCalled();
  });

  it('is a no-op in production regardless of host', async () => {
    process.env.ENVIRONMENT = 'production';
    const dnsRecords = vi.fn(async (recordName) => {
      // Production bypasses the relay sub-chain, so the resolver sees
      // the raw relay-form name.
      expect(recordName).toBe('nfi.gtld.namefi.dev');
      return null;
    });
    const handler = createDnsRequestHandlerV2_2({
      dependencies: {
        getAnswerFromPreferences: vi.fn().mockResolvedValue(null),
        getAnswerFromDnsRecords: dnsRecords,
        getAnswerFromMockTable: vi.fn().mockResolvedValue(null),
      },
    });

    await handler.handle({
      rawName: 'nfi.gtld.namefi.dev.',
      rawType: 1,
      recordName: 'nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
      recordType: 'A',
      wildcard: false,
    });

    expect(dnsRecords).toHaveBeenCalledTimes(1);
  });
});
