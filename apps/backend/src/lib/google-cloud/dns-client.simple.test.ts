import { beforeEach, describe, expect, it, vi } from 'vitest';

const dnsMock = vi.hoisted(() => {
  const change = {
    getMetadata: vi.fn(),
  };
  const zone = {
    getMetadata: vi.fn(),
    getRecords: vi.fn(),
    createChange: vi.fn(),
    record: vi.fn(),
    change: vi.fn(),
  };
  const dnsInstance = {
    zone: vi.fn(),
  };
  const Dns = vi.fn();

  function reset() {
    Dns.mockReset().mockReturnValue(dnsInstance);
    dnsInstance.zone.mockReset().mockReturnValue(zone);
    zone.getMetadata
      .mockReset()
      .mockResolvedValue([{ dnsName: 'test-zone.example.com.' }]);
    zone.getRecords.mockReset().mockResolvedValue([[]]);
    zone.createChange.mockReset().mockResolvedValue([{ id: 'test-change-id' }]);
    zone.record.mockReset().mockImplementation((type, record) => ({
      type,
      ...record,
    }));
    zone.change.mockReset().mockReturnValue(change);
    change.getMetadata.mockReset().mockResolvedValue([{ status: 'done' }]);
  }

  reset();

  return {
    DNS: Dns,
    reset,
    zone,
  };
});

vi.mock('@google-cloud/dns', () => ({
  DNS: dnsMock.DNS,
}));

vi.mock('#lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('#lib/env', () => ({
  secrets: {
    GOOGLE_CLOUD_PROJECT_ID: 'test-project',
  },
}));

describe('GoogleCloudDnsClient Basic Functionality', () => {
  let GoogleCloudDnsClient: typeof import('./dns-client').GoogleCloudDnsClient;

  beforeEach(async () => {
    dnsMock.reset();
    const module = await import('./dns-client');
    GoogleCloudDnsClient = module.GoogleCloudDnsClient;
  });

  it('creates a client instance successfully', () => {
    const client = new GoogleCloudDnsClient('test-project');

    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(GoogleCloudDnsClient);
  });

  it('creates CNAME records successfully', async () => {
    const client = new GoogleCloudDnsClient('test-project');

    const result = await client.createCnameRecord(
      'test-zone',
      'test-record',
      'target.example.com',
      300,
    );

    expect(result).toEqual({
      name: 'test-record.test-zone.example.com.',
      rrdatas: ['target.example.com.'],
      ttl: 300,
      type: 'CNAME',
    });
  });

  it('checks whether records exist', async () => {
    const client = new GoogleCloudDnsClient('test-project');

    const exists = await client.recordExists(
      'test-zone',
      'test-record',
      'CNAME',
    );

    expect(exists).toBe(false);
  });

  it('lists records', async () => {
    const client = new GoogleCloudDnsClient('test-project');

    const records = await client.listRecords('test-zone', 'CNAME');

    expect(records).toEqual([]);
  });

  it('propagates record creation errors', async () => {
    dnsMock.zone.createChange.mockRejectedValue(new Error('API error'));
    const client = new GoogleCloudDnsClient('test-project');

    await expect(
      client.createCnameRecord(
        'test-zone',
        'test-record',
        'target.example.com',
        300,
      ),
    ).rejects.toThrow('API error');
  });

  it('returns false when record existence checks fail', async () => {
    dnsMock.zone.getRecords.mockRejectedValue(new Error('API error'));
    const client = new GoogleCloudDnsClient('test-project');

    const exists = await client.recordExists(
      'test-zone',
      'test-record',
      'CNAME',
    );

    expect(exists).toBe(false);
  });
});
