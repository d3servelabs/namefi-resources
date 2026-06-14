import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    NAMEFI_PARK_GATE_LABEL: '_namefi-gate',
    NAMEFI_PARK_GATE_RECORD_TTL_SECONDS: 3600,
    NAMEFI_PARK_GATE_ROUTES: ['/*'],
  },
  secrets: {},
}));

// Stub the resolving-link adapter so importing this module does not pull in
// the DB-backed link helpers; we exercise the raw resolver directly.
vi.mock('./resolving-link', () => ({
  createResolvingLink: (resolver: unknown) => resolver,
}));

vi.mock('../managed-records', () => ({
  getDomainManagedDnsState: vi.fn(),
}));

vi.mock('../park-gate/issuer', () => ({
  isParkGateEnabled: vi.fn(),
  getOrIssueGateToken: vi.fn(),
  // Real splitting/quoting is unit-tested in park-gate/issuer.test.ts; here a
  // short token round-trips to a single quoted string.
  formatGateTxtRdata: (value: string) => `"${value}"`,
}));

const { getDomainManagedDnsState } = await import('../managed-records');
const { isParkGateEnabled, getOrIssueGateToken } = await import(
  '../park-gate/issuer'
);
const { parseGateHost, resolveParkGateAnswer } = await import(
  './park-gate-link'
);

const asRecordName = (value: string) => value as DnsQuestion['recordName'];

const parkedState = {
  autoEnsEnabled: false,
  autoParkEnabled: true,
  forwardTo: null,
  ownerAddress: '0xabc',
  shouldServeParkingRecords: true,
};

const unparkedState = {
  ...parkedState,
  autoParkEnabled: false,
  shouldServeParkingRecords: false,
};

describe('parseGateHost', () => {
  it('extracts the host from a gate-label name', () => {
    expect(parseGateHost('_namefi-gate.example.com', '_namefi-gate')).toBe(
      'example.com',
    );
  });

  it('is case-insensitive', () => {
    expect(parseGateHost('_NAMEFI-GATE.Example.COM', '_namefi-gate')).toBe(
      'example.com',
    );
  });

  it('returns null for a non-gate name', () => {
    expect(parseGateHost('example.com', '_namefi-gate')).toBeNull();
    expect(parseGateHost('www.example.com', '_namefi-gate')).toBeNull();
  });

  it('returns null for the bare label with no host', () => {
    expect(parseGateHost('_namefi-gate.', '_namefi-gate')).toBeNull();
  });
});

describe('resolveParkGateAnswer', () => {
  beforeEach(() => {
    vi.mocked(isParkGateEnabled).mockReturnValue(true);
    vi.mocked(getOrIssueGateToken).mockResolvedValue('signed.jwt.token');
    vi.mocked(getDomainManagedDnsState).mockResolvedValue(parkedState);
  });

  it('serves the signed token as a TXT record for a parked host', async () => {
    const result = (await resolveParkGateAnswer(
      asRecordName('_namefi-gate.example.com'),
      'TXT',
    )) as DnsResponse;

    expect(result.RCODE).toBe(0);
    expect(result.Answer).toHaveLength(1);
    expect(result.Answer?.[0]).toMatchObject({
      name: '_namefi-gate.example.com',
      type: 16, // TXT
      TTL: 3600,
      data: '"signed.jwt.token"',
    });
    expect(getOrIssueGateToken).toHaveBeenCalledWith('example.com');
  });

  it('ignores non-TXT queries', async () => {
    expect(
      await resolveParkGateAnswer(
        asRecordName('_namefi-gate.example.com'),
        'A',
      ),
    ).toBeNull();
    expect(getDomainManagedDnsState).not.toHaveBeenCalled();
  });

  it('returns null when the gate is disabled', async () => {
    vi.mocked(isParkGateEnabled).mockReturnValue(false);
    expect(
      await resolveParkGateAnswer(
        asRecordName('_namefi-gate.example.com'),
        'TXT',
      ),
    ).toBeNull();
  });

  it('passes through names that are not the gate label', async () => {
    expect(
      await resolveParkGateAnswer(asRecordName('example.com'), 'TXT'),
    ).toBeNull();
    expect(getDomainManagedDnsState).not.toHaveBeenCalled();
  });

  it('returns null when the host is not serving parking records', async () => {
    vi.mocked(getDomainManagedDnsState).mockResolvedValue(unparkedState);
    expect(
      await resolveParkGateAnswer(
        asRecordName('_namefi-gate.example.com'),
        'TXT',
      ),
    ).toBeNull();
    expect(getOrIssueGateToken).not.toHaveBeenCalled();
  });
});
