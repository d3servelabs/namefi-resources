import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Google Cloud DNS library before importing anything
vi.mock('@google-cloud/dns', () => {
  const mockZone = {
    getMetadata: vi
      .fn()
      .mockResolvedValue([{ dnsName: 'test-zone.example.com.' }]),
    getRecords: vi.fn().mockResolvedValue([[]]),
    createChange: vi.fn().mockResolvedValue([{ id: 'test-change-id' }]),
    record: vi.fn().mockReturnValue({
      name: 'test-record.test-zone.example.com.',
      type: 'CNAME',
      ttl: 300,
      data: ['target.example.com.'],
    }),
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

// Mock environment with minimal required values
vi.mock('#lib/env', () => ({
  secrets: {
    GOOGLE_CLOUD_PROJECT_ID: 'test-project',
  },
}));

describe('GoogleCloudDnsClient Basic Functionality', () => {
  let GoogleCloudDnsClient: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Import the client after all mocks are set up
    const module = await import('./dns-client');
    GoogleCloudDnsClient = module.GoogleCloudDnsClient;
  });

  it('should create a client instance successfully', () => {
    const client = new GoogleCloudDnsClient('test-project');
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(GoogleCloudDnsClient);
  });

  it('should create CNAME record successfully', async () => {
    const client = new GoogleCloudDnsClient('test-project');
    const result = await client.createCnameRecord(
      'test-zone',
      'test-record',
      'target.example.com',
    );

    expect(result).toEqual({
      name: 'test-record.test-zone.example.com.',
      type: 'CNAME',
      ttl: 300,
      rrdatas: ['target.example.com.'],
    });
  });

  it('should check if record exists', async () => {
    const client = new GoogleCloudDnsClient('test-project');
    const exists = await client.recordExists(
      'test-zone',
      'test-record',
      'CNAME',
    );

    expect(exists).toBe(false); // Should be false since we mocked empty records
  });

  it('should list records', async () => {
    const client = new GoogleCloudDnsClient('test-project');
    const records = await client.listRecords('test-zone', 'CNAME');

    expect(records).toEqual([]); // Should be empty since we mocked empty records
  });
});

describe('Error Handling', () => {
  let GoogleCloudDnsClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('./dns-client');
    GoogleCloudDnsClient = module.GoogleCloudDnsClient;
  });

  it('should handle errors when creating record', async () => {
    // Mock the DNS library to throw an error
    const mockDns = vi.mocked(require('@google-cloud/dns').DNS);
    const mockZone = mockDns().zone();
    mockZone.createChange.mockRejectedValue(new Error('API error'));

    const client = new GoogleCloudDnsClient('test-project');

    await expect(
      client.createCnameRecord(
        'test-zone',
        'test-record',
        'target.example.com',
      ),
    ).rejects.toThrow('API error');
  });

  it('should handle errors when checking record existence', async () => {
    // Mock the DNS library to throw an error
    const mockDns = vi.mocked(require('@google-cloud/dns').DNS);
    const mockZone = mockDns().zone();
    mockZone.getRecords.mockRejectedValue(new Error('API error'));

    const client = new GoogleCloudDnsClient('test-project');

    const exists = await client.recordExists(
      'test-zone',
      'test-record',
      'CNAME',
    );
    expect(exists).toBe(false); // Should return false on error
  });
});
