import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoogleCloudDnsClient,
  GoogleCloudDnsClient,
  GoogleDnsZoneNotFoundError,
} from './dns-client';
import { logger } from '#lib/logger';

const envMock = vi.hoisted(() => ({
  secrets: {
    GOOGLE_CLOUD_PROJECT_ID: 'test-project-from-secrets' as string | undefined,
  },
}));

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
    change,
    dnsInstance,
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
  secrets: envMock.secrets,
}));

describe('GoogleCloudDnsClient', () => {
  let dnsClient: GoogleCloudDnsClient;

  beforeEach(() => {
    vi.useRealTimers();
    dnsMock.reset();
    envMock.secrets.GOOGLE_CLOUD_PROJECT_ID = 'test-project-from-secrets';
    dnsClient = new GoogleCloudDnsClient('test-project');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates DNS client with project ID', () => {
    expect(dnsMock.DNS).toHaveBeenCalledWith({ projectId: 'test-project' });
  });

  it('returns zone metadata successfully', async () => {
    const result = await dnsClient.getZone('test-zone');

    expect(dnsMock.dnsInstance.zone).toHaveBeenCalledWith('test-zone');
    expect(dnsMock.zone.getMetadata).toHaveBeenCalled();
    expect(result).toEqual({
      metadata: { dnsName: 'test-zone.example.com.' },
      zone: dnsMock.zone,
    });
  });

  it('wraps not-found zone errors', async () => {
    const error = Object.assign(new Error('Zone not found'), { code: 404 });
    dnsMock.zone.getMetadata.mockRejectedValue(error);

    await expect(dnsClient.getZone('missing-zone')).rejects.toThrow(
      GoogleDnsZoneNotFoundError,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      { projectId: 'test-project', zoneName: 'missing-zone' },
      'Google Cloud DNS zone not found',
    );
  });

  it('creates CNAME records idempotently', async () => {
    const result = await dnsClient.createCnameRecord(
      'test-zone',
      'test-record',
      'target.example.com',
      300,
    );

    expect(dnsMock.zone.getRecords).toHaveBeenCalledWith({
      filterByTypes_: { CNAME: true },
    });
    expect(dnsMock.zone.record).toHaveBeenCalledWith('CNAME', {
      data: ['target.example.com.'],
      name: 'test-record.test-zone.example.com.',
      ttl: 300,
    });
    expect(dnsMock.zone.createChange).toHaveBeenCalledWith({
      add: expect.any(Object),
    });
    expect(dnsMock.zone.change).toHaveBeenCalledWith('test-change-id');
    expect(result).toEqual({
      name: 'test-record.test-zone.example.com.',
      rrdatas: ['target.example.com.'],
      ttl: 300,
      type: 'CNAME',
    });
  });

  it('returns an existing CNAME without creating a change', async () => {
    dnsMock.zone.getRecords.mockResolvedValue([
      [
        {
          data: ['target.example.com.'],
          name: 'test-record.test-zone.example.com.',
          ttl: 300,
          type: 'CNAME',
        },
      ],
    ]);

    const result = await dnsClient.createCnameRecord(
      'test-zone',
      'test-record',
      'target.example.com',
      300,
    );

    expect(dnsMock.zone.createChange).not.toHaveBeenCalled();
    expect(result).toEqual({
      name: 'test-record.test-zone.example.com.',
      rrdatas: ['target.example.com.'],
      ttl: 300,
      type: 'CNAME',
    });
  });

  it('propagates record creation errors', async () => {
    dnsMock.zone.createChange.mockRejectedValue(
      new Error('Failed to create record'),
    );

    await expect(
      dnsClient.createCnameRecord(
        'test-zone',
        'test-record',
        'target.example.com',
        300,
      ),
    ).rejects.toThrow('Failed to create record');
    expect(logger.error).toHaveBeenCalled();
  });

  it('deletes CNAME records', async () => {
    await dnsClient.deleteCnameRecord(
      'test-zone',
      'test-record',
      'target.example.com',
      300,
    );

    expect(dnsMock.zone.record).toHaveBeenCalledWith('CNAME', {
      data: ['target.example.com.'],
      name: 'test-record.test-zone.example.com.',
      ttl: 300,
      type: 'CNAME',
    });
    expect(dnsMock.zone.createChange).toHaveBeenCalledWith({
      delete: expect.any(Object),
    });
  });

  it('checks record existence with record type filters', async () => {
    dnsMock.zone.getRecords.mockResolvedValue([
      [
        {
          data: ['target.example.com.'],
          name: 'test-record.test-zone.example.com.',
          type: 'CNAME',
        },
      ],
    ]);

    const result = await dnsClient.recordExists(
      'test-zone',
      'test-record',
      'CNAME',
    );

    expect(dnsMock.zone.getRecords).toHaveBeenCalledWith({
      filterByTypes_: { CNAME: true },
    });
    expect(result).toBe(true);
  });

  it('returns false when record existence checks fail', async () => {
    dnsMock.zone.getRecords.mockRejectedValue(
      new Error('Failed to get records'),
    );

    await expect(
      dnsClient.recordExists('test-zone', 'test-record', 'CNAME'),
    ).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it('lists records', async () => {
    dnsMock.zone.getRecords.mockResolvedValue([
      [
        {
          data: ['192.168.1.1'],
          name: 'record1.test-zone.example.com.',
          ttl: 300,
          type: 'A',
        },
        {
          data: ['target.example.com.'],
          name: 'record2.test-zone.example.com.',
          ttl: 300,
          type: 'CNAME',
        },
      ],
    ]);

    const result = await dnsClient.listRecords('test-zone');

    expect(dnsMock.zone.getRecords).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([
      {
        name: 'record1.test-zone.example.com.',
        rrdatas: ['192.168.1.1'],
        ttl: 300,
        type: 'A',
      },
      {
        name: 'record2.test-zone.example.com.',
        rrdatas: ['target.example.com.'],
        ttl: 300,
        type: 'CNAME',
      },
    ]);
  });

  it('filters listed records by type', async () => {
    await dnsClient.listRecords('test-zone', 'CNAME');

    expect(dnsMock.zone.getRecords).toHaveBeenCalledWith({
      filterByTypes_: { CNAME: true },
    });
  });

  it('throws list record errors', async () => {
    dnsMock.zone.getRecords.mockRejectedValue(
      new Error('Failed to list records'),
    );

    await expect(dnsClient.listRecords('test-zone', 'CNAME')).rejects.toThrow(
      'Failed to list records',
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('waits for completed changes', async () => {
    await dnsClient['waitForChange']('test-zone', 'test-change-id', 1000);

    expect(dnsMock.zone.change).toHaveBeenCalledWith('test-change-id');
    expect(dnsMock.change.getMetadata).toHaveBeenCalledTimes(1);
  });

  it('warns when a change stays pending until timeout', async () => {
    vi.useFakeTimers();
    dnsMock.change.getMetadata.mockResolvedValue([{ status: 'pending' }]);

    const wait = dnsClient['waitForChange']('test-zone', 'test-change-id', 100);
    await vi.advanceTimersByTimeAsync(2_000);
    await wait;

    expect(dnsMock.change.getMetadata).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { changeId: 'test-change-id', maxWaitTime: 100, zoneName: 'test-zone' },
      'DNS change may still be pending',
    );
  });

  it('warns when change status checks fail', async () => {
    dnsMock.change.getMetadata.mockRejectedValue(
      new Error('Status check failed'),
    );

    await dnsClient['waitForChange']('test-zone', 'test-change-id', 1000);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        changeId: 'test-change-id',
        zoneName: 'test-zone',
      }),
      'Error checking change status',
    );
  });

  it('creates the default client from secrets', () => {
    createGoogleCloudDnsClient();

    expect(dnsMock.DNS).toHaveBeenCalledWith({
      projectId: 'test-project-from-secrets',
    });
  });

  it('uses the built-in default project when the secret is absent', () => {
    envMock.secrets.GOOGLE_CLOUD_PROJECT_ID = undefined;

    createGoogleCloudDnsClient();

    expect(dnsMock.DNS).toHaveBeenCalledWith({ projectId: 'd3serve-labs' });
  });
});
