import { describe, expect, it, vi } from 'vitest';
import type {
  DnsQuestion,
  DnsRequestContext,
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

vi.mock('#lib/env', () => ({
  config: {
    NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE: 'gtld.namefi.dev',
    NAMEFI_ASTRA_NAMESERVERS: ['ns3.namefi.dev.', 'ns4.namefi.dev.'],
  },
  secrets: {},
}));

const { createRelayZoneAuthorityLink } = await import(
  './relay-zone-authority-link'
);

const RELAY_ZONE = 'gtld.namefi.dev';

function createContext(question: Partial<DnsQuestion>): DnsRequestContext {
  return {
    question: {
      rawName: `${question.recordName ?? 'x'}.`,
      rawType: 1,
      recordName: (question.recordName ??
        'sami.nfi.gtld.namefi.dev') as DnsQuestion['recordName'],
      recordType: question.recordType ?? 'A',
      wildcard: false,
      ...question,
    } as DnsQuestion,
    result: { Answer: [] },
    meta: { heartbeat: false, useMockDnsTable: false },
    logger: mockLogger as unknown as DnsRequestContext['logger'],
  };
}

describe('createRelayZoneAuthorityLink', () => {
  describe('apex short-circuit', () => {
    it('serves synthesized NS records for the relay-zone apex without calling next', async () => {
      const next = vi.fn();
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: RELAY_ZONE as DnsQuestion['recordName'],
        recordType: 'NS',
      });

      const result = await link(context, next);

      expect(next).not.toHaveBeenCalled();
      expect(result.RCODE).toBe(0);
      expect(result.Answer).toHaveLength(2);
      expect(result.Answer?.[0]).toMatchObject({
        name: RELAY_ZONE,
        type: 2, // NS
        data: 'ns3.namefi.dev.',
      });
    });

    it('serves synthesized SOA record for the relay-zone apex without calling next', async () => {
      const next = vi.fn();
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: RELAY_ZONE as DnsQuestion['recordName'],
        recordType: 'SOA',
      });

      const result = await link(context, next);

      expect(next).not.toHaveBeenCalled();
      expect(result.RCODE).toBe(0);
      expect(result.Answer).toHaveLength(1);
      expect(result.Answer?.[0]).toMatchObject({
        name: RELAY_ZONE,
        type: 6, // SOA
      });
    });

    it('apex A with downstream NXDOMAIN is downgraded to NODATA (RFC 1034 §4.3.2 / RFC 8020)', async () => {
      // The zone origin always exists as a tree node in an authoritative
      // zone. A downstream NXDOMAIN at the apex would illegally cut the
      // subtree that the relay serves for descendants.
      const next = vi.fn().mockResolvedValue({ RCODE: 3, Answer: [] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: RELAY_ZONE as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(result.RCODE).toBe(0);
      expect(result.Answer).toEqual([]);
      expect(result.Authority).toHaveLength(1);
      expect(result.Authority?.[0]).toMatchObject({
        name: RELAY_ZONE,
        type: 6, // SOA
      });
    });

    it('apex A with downstream NODATA stays NODATA with Authority SOA', async () => {
      const next = vi.fn().mockResolvedValue({ RCODE: 0, Answer: [] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: RELAY_ZONE as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(result.RCODE).toBe(0);
      expect(result.Answer).toEqual([]);
      expect(result.Authority).toHaveLength(1);
    });

    it('apex A with answers returned by downstream passes through unchanged', async () => {
      const apexAnswer = {
        name: RELAY_ZONE,
        type: 1,
        TTL: 60,
        data: '203.0.113.5',
      };
      const next = vi
        .fn()
        .mockResolvedValue({ RCODE: 0, Answer: [apexAnswer] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: RELAY_ZONE as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(result.RCODE).toBe(0);
      expect(result.Answer).toEqual([apexAnswer]);
      expect(result.Authority).toBeUndefined();
    });
  });

  describe('Authority injection', () => {
    it('injects relay-zone SOA in Authority on NXDOMAIN', async () => {
      const next = vi.fn().mockResolvedValue({ RCODE: 3, Answer: [] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(result.RCODE).toBe(3);
      expect(result.Answer).toEqual([]);
      expect(result.Authority).toHaveLength(1);
      expect(result.Authority?.[0]).toMatchObject({
        name: RELAY_ZONE,
        type: 6, // SOA
      });
    });

    it('injects relay-zone SOA in Authority on NODATA (RCODE=0, empty Answer) per RFC 2308', async () => {
      const next = vi.fn().mockResolvedValue({ RCODE: 0, Answer: [] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(result.RCODE).toBe(0);
      expect(result.Answer).toEqual([]);
      expect(result.Authority).toHaveLength(1);
      expect(result.Authority?.[0]).toMatchObject({
        name: RELAY_ZONE,
        type: 6, // SOA
      });
    });

    it('does not overwrite existing non-NXDOMAIN RCODEs (e.g. SERVFAIL)', async () => {
      const next = vi.fn().mockResolvedValue({ RCODE: 2, Answer: [] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(result.RCODE).toBe(2);
      expect(result.Authority).toBeUndefined();
    });
  });

  describe('success passthrough', () => {
    it('passes non-empty Answer from downstream through unchanged', async () => {
      const answer = {
        name: 'sami.nfi.gtld.namefi.dev',
        type: 1,
        TTL: 300,
        data: '1.2.3.4',
      };
      const next = vi.fn().mockResolvedValue({ RCODE: 0, Answer: [answer] });
      const link = createRelayZoneAuthorityLink();
      const context = createContext({
        recordName: 'sami.nfi.gtld.namefi.dev' as DnsQuestion['recordName'],
        recordType: 'A',
      });

      const result = await link(context, next);

      expect(result.RCODE).toBe(0);
      expect(result.Answer).toEqual([answer]);
      expect(result.Authority).toBeUndefined();
    });
  });
});
