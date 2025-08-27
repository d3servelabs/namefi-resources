import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleCloudDnsClient, type DnsRecord } from './dns-client';
import { DNS } from '@google-cloud/dns';
import { logger } from '#lib/logger';

// Mock the Google Cloud DNS library
vi.mock('@google-cloud/dns', () => {
  const mockZone = {
    getMetadata: vi.fn(),
    getRecords: vi.fn(),
    createChange: vi.fn(),
    record: vi.fn(),
  };

  const mockChange = {
    getMetadata: vi.fn(),
    id: 'test-change-id',
  };

  const mockDns = vi.fn(() => ({
    zone: vi.fn(() => mockZone),
  }));

  return {
    DNS: mockDns,
  };
});

// Mock the logger
vi.mock('#lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the environment to avoid validation errors
vi.mock('#lib/env', () => ({
  secrets: {
    GOOGLE_CLOUD_PROJECT_ID: 'test-project',
    AWS_ACCESS_KEY_ID: 'test-aws-key',
    AWS_SECRET_ACCESS_KEY: 'test-aws-secret',
    WHOIS_API_KEY: 'test-whois-key',
    DYNADOT_GDG_API_KEY: 'test-dynadot-gdg-key',
    DYNADOT_REGULAR_API_KEY: 'test-dynadot-regular-key',
    DEFAULT_EPP_CODE_ENCRYPTION_KEY_ID: 'test-epp-key',
    LEGACY_DB_URL: 'test-legacy-db-url',
    LISTMONK_BASE_URL: 'test-listmonk-url',
    LISTMONK_USERNAME: 'test-listmonk-user',
    LISTMONK_PASSWORD: 'test-listmonk-pass',
    VISION_API_KEY: 'test-vision-key',
    OPENSEA_API_KEY: 'test-opensea-key',
    VERCEL_API_TOKEN: 'test-vercel-token',
    VERCEL_TEAM_ID: 'test-vercel-team',
  },
}));

describe('GoogleCloudDnsClient', () => {
  let dnsClient: GoogleCloudDnsClient;
  let mockZone: any;
  let mockDns: any;

  beforeEach(() => {
    vi.clearAllMocks();

    dnsClient = new GoogleCloudDnsClient('test-project');

    // Get the mock zone instance
    const Dns = vi.mocked(require('@google-cloud/dns').DNS);
    mockDns = Dns.mock.results[0].value;
    mockZone = mockDns.zone.mock.results[0].value;
  });

  describe('constructor', () => {
    it('should create DNS client with project ID', () => {
      expect(mockDns).toHaveBeenCalledWith({ projectId: 'test-project' });
    });
  });

  describe('getZone', () => {
    it('should return zone and metadata successfully', async () => {
      const mockMetadata = { dnsName: 'test-zone.example.com.' };
      mockZone.getMetadata.mockResolvedValue([mockMetadata]);

      const result = await dnsClient.getZone('test-zone');

      expect(mockDns.zone).toHaveBeenCalledWith('test-zone');
      expect(mockZone.getMetadata).toHaveBeenCalled();
      expect(result).toEqual({
        zone: mockZone,
        metadata: mockMetadata,
      });
    });

    it('should handle errors when getting zone', async () => {
      const error = new Error('Zone not found');
      mockZone.getMetadata.mockRejectedValue(error);

      await expect(dnsClient.getZone('nonexistent-zone')).rejects.toThrow(
        'Zone not found',
      );
      expect(mockZone.getMetadata).toHaveBeenCalled();
    });
  });

  describe('createCnameRecord', () => {
    const zoneName = 'test-zone';
    const recordName = 'test-record';
    const target = 'target.example.com';
    const ttl = 300;

    beforeEach(() => {
      mockZone.getMetadata.mockResolvedValue([
        { dnsName: 'test-zone.example.com.' },
      ]);
      mockZone.getRecords.mockResolvedValue([[]]); // No existing records
      mockZone.record.mockReturnValue({
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
        ttl,
        data: ['target.example.com.'],
      });
      mockZone.createChange.mockResolvedValue([{ id: 'test-change-id' }]);
    });

    it('should create CNAME record successfully', async () => {
      const result = await dnsClient.createCnameRecord(
        zoneName,
        recordName,
        target,
        ttl,
      );

      expect(mockZone.getRecords).toHaveBeenCalledWith({
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
      });
      expect(mockZone.record).toHaveBeenCalledWith('CNAME', {
        name: 'test-record.test-zone.example.com.',
        data: ['target.example.com.'],
        ttl,
      });
      expect(mockZone.createChange).toHaveBeenCalledWith({
        add: expect.any(Object),
      });
      expect(result).toEqual({
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
        ttl,
        rrdatas: ['target.example.com.'],
      });
    });

    it('should handle existing record gracefully', async () => {
      const existingRecord = {
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
        ttl: 300,
        data: ['existing-target.example.com.'],
      };
      mockZone.getRecords.mockResolvedValue([[existingRecord]]);

      const result = await dnsClient.createCnameRecord(
        zoneName,
        recordName,
        target,
        ttl,
      );

      expect(mockZone.createChange).not.toHaveBeenCalled();
      expect(result).toEqual({
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
        ttl: 300,
        rrdatas: ['existing-target.example.com.'],
      });
    });

    it('should handle errors during record creation', async () => {
      const error = new Error('Failed to create record');
      mockZone.createChange.mockRejectedValue(error);

      await expect(
        dnsClient.createCnameRecord(zoneName, recordName, target, ttl),
      ).rejects.toThrow('Failed to create record');
      expect(mockZone.createChange).toHaveBeenCalled();
    });
  });

  describe('deleteCnameRecord', () => {
    const zoneName = 'test-zone';
    const recordName = 'test-record';
    const target = 'target.example.com';
    const ttl = 300;

    beforeEach(() => {
      mockZone.getMetadata.mockResolvedValue([
        { dnsName: 'test-zone.example.com.' },
      ]);
      mockZone.record.mockReturnValue({
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
        ttl,
        data: ['target.example.com.'],
      });
      mockZone.createChange.mockResolvedValue([{ id: 'test-change-id' }]);
    });

    it('should delete CNAME record successfully', async () => {
      await dnsClient.deleteCnameRecord(zoneName, recordName, target, ttl);

      expect(mockZone.record).toHaveBeenCalledWith('CNAME', {
        name: 'test-record.test-zone.example.com.',
        data: ['target.example.com.'],
        ttl,
      });
      expect(mockZone.createChange).toHaveBeenCalledWith({
        delete: expect.any(Object),
      });
    });

    it('should handle errors during record deletion', async () => {
      const error = new Error('Failed to delete record');
      mockZone.createChange.mockRejectedValue(error);

      await expect(
        dnsClient.deleteCnameRecord(zoneName, recordName, target, ttl),
      ).rejects.toThrow('Failed to delete record');
      expect(mockZone.createChange).toHaveBeenCalled();
    });
  });

  describe('recordExists', () => {
    const zoneName = 'test-zone';
    const recordName = 'test-record';

    beforeEach(() => {
      mockZone.getMetadata.mockResolvedValue([
        { dnsName: 'test-zone.example.com.' },
      ]);
    });

    it('should return true when record exists', async () => {
      const existingRecord = {
        name: 'test-record.test-zone.example.com.',
        type: 'CNAME',
        data: ['target.example.com.'],
      };
      mockZone.getRecords.mockResolvedValue([[existingRecord]]);

      const result = await dnsClient.recordExists(
        zoneName,
        recordName,
        'CNAME',
      );

      expect(mockZone.getRecords).toHaveBeenCalledWith({
        filterByTypes_: { CNAME: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      mockZone.getRecords.mockResolvedValue([[]]);

      const result = await dnsClient.recordExists(
        zoneName,
        recordName,
        'CNAME',
      );

      expect(result).toBe(false);
    });

    it('should handle errors gracefully and return false', async () => {
      const error = new Error('Failed to get records');
      mockZone.getRecords.mockRejectedValue(error);

      const result = await dnsClient.recordExists(
        zoneName,
        recordName,
        'CNAME',
      );

      expect(result).toBe(false);
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });

    it('should work without specifying record type', async () => {
      mockZone.getRecords.mockResolvedValue([[]]);

      const result = await dnsClient.recordExists(zoneName, recordName);

      expect(mockZone.getRecords).toHaveBeenCalledWith(undefined);
      expect(result).toBe(false);
    });
  });

  describe('listRecords', () => {
    const zoneName = 'test-zone';

    beforeEach(() => {
      mockZone.getMetadata.mockResolvedValue([
        { dnsName: 'test-zone.example.com.' },
      ]);
    });

    it('should list all records when no type specified', async () => {
      const mockRecords = [
        {
          name: 'record1.test-zone.example.com.',
          type: 'A',
          ttl: 300,
          data: ['192.168.1.1'],
        },
        {
          name: 'record2.test-zone.example.com.',
          type: 'CNAME',
          ttl: 300,
          data: ['target.example.com.'],
        },
      ];
      mockZone.getRecords.mockResolvedValue([mockRecords]);

      const result = await dnsClient.listRecords(zoneName);

      expect(mockZone.getRecords).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([
        {
          name: 'record1.test-zone.example.com.',
          type: 'A',
          ttl: 300,
          rrdatas: ['192.168.1.1'],
        },
        {
          name: 'record2.test-zone.example.com.',
          type: 'CNAME',
          ttl: 300,
          rrdatas: ['target.example.com.'],
        },
      ]);
    });

    it('should filter records by type', async () => {
      const mockRecords = [
        {
          name: 'record1.test-zone.example.com.',
          type: 'CNAME',
          ttl: 300,
          data: ['target.example.com.'],
        },
      ];
      mockZone.getRecords.mockResolvedValue([mockRecords]);

      const result = await dnsClient.listRecords(zoneName, 'CNAME');

      expect(mockZone.getRecords).toHaveBeenCalledWith({
        filterByTypes_: { CNAME: true },
      });
      expect(result).toEqual([
        {
          name: 'record1.test-zone.example.com.',
          type: 'CNAME',
          ttl: 300,
          rrdatas: ['target.example.com.'],
        },
      ]);
    });

    it('should handle empty results', async () => {
      mockZone.getRecords.mockResolvedValue([[]]);

      const result = await dnsClient.listRecords(zoneName, 'CNAME');

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to list records');
      mockZone.getRecords.mockRejectedValue(error);

      await expect(dnsClient.listRecords(zoneName, 'CNAME')).rejects.toThrow(
        'Failed to list records',
      );
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('waitForChange', () => {
    const zoneName = 'test-zone';
    const changeId = 'test-change-id';

    beforeEach(() => {
      mockZone.getMetadata.mockResolvedValue([
        { dnsName: 'test-zone.example.com.' },
      ]);
    });

    it('should wait for change to complete successfully', async () => {
      const mockChange = {
        getMetadata: vi
          .fn()
          .mockResolvedValueOnce([{ status: 'pending' }])
          .mockResolvedValueOnce([{ status: 'done' }]),
      };
      mockDns.zone.mockReturnValueOnce({
        ...mockZone,
        change: vi.fn(() => mockChange),
      });

      // Recreate client to use the new mock
      const client = new GoogleCloudDnsClient('test-project');

      await client['waitForChange'](zoneName, changeId, 10000);

      expect(mockChange.getMetadata).toHaveBeenCalledTimes(2);
    });

    it('should timeout if change takes too long', async () => {
      const mockChange = {
        getMetadata: vi.fn().mockResolvedValue([{ status: 'pending' }]),
      };
      mockDns.zone.mockReturnValueOnce({
        ...mockZone,
        change: vi.fn(() => mockChange),
      });

      const client = new GoogleCloudDnsClient('test-project');

      await client['waitForChange'](zoneName, changeId, 100);

      expect(mockChange.getMetadata).toHaveBeenCalled();
      expect(vi.mocked(logger.warn)).toHaveBeenCalled();
    });

    it('should handle errors when checking change status', async () => {
      const mockChange = {
        getMetadata: vi
          .fn()
          .mockRejectedValue(new Error('Status check failed')),
      };
      mockDns.zone.mockReturnValueOnce({
        ...mockZone,
        change: vi.fn(() => mockChange),
      });

      const client = new GoogleCloudDnsClient('test-project');

      await client['waitForChange'](zoneName, changeId, 1000);

      expect(mockChange.getMetadata).toHaveBeenCalled();
      expect(vi.mocked(logger.warn)).toHaveBeenCalled();
    });
  });

  describe('createGoogleCloudDnsClient', () => {
    it('should create client with project ID from secrets', () => {
      // Mock secrets
      vi.mock('#lib/env', () => ({
        secrets: {
          GOOGLE_CLOUD_PROJECT_ID: 'test-project-from-secrets',
        },
      }));

      const { createGoogleCloudDnsClient } = require('./dns-client');
      const client = createGoogleCloudDnsClient();

      expect(client).toBeInstanceOf(GoogleCloudDnsClient);
    });

    it('should throw error if project ID is not configured', () => {
      // Mock secrets without project ID
      vi.mock('#lib/env', () => ({
        secrets: {
          GOOGLE_CLOUD_PROJECT_ID: undefined,
        },
      }));

      const { createGoogleCloudDnsClient } = require('./dns-client');

      expect(() => createGoogleCloudDnsClient()).toThrow(
        'GOOGLE_CLOUD_PROJECT_ID is required',
      );
    });
  });
});
