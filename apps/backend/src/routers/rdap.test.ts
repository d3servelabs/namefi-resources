import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockGetDomainDetails = vi.fn();
let mockGetDomainStatus = vi.fn();
let mockGetCentralnicRegistrar = vi.fn();
const mockConfig = {
  CENTRALNIC_KEY: 'centralnic_ote_01',
  RDAP_ENABLE_DUMMY_OBJECTS: true,
};

const mockLogger = {
  assign: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
};

vi.mock('#lib/env', () => ({
  config: mockConfig,
}));

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('#lib/epp-registrars/centralnic', () => ({
  getCentralnicRegistrar: (...args: unknown[]) =>
    mockGetCentralnicRegistrar(...args),
}));

const { rdapRouter } = await import('./rdap');

function createDomainRegistration() {
  return {
    domainName: 'example.com',
    expirationTime: new Date('2030-01-01T00:00:00.000Z'),
    creationTime: new Date('2020-01-01T00:00:00.000Z'),
    autoRenewOption: 'MANUAL',
    nameservers: ['ns1.example.com.', 'ns2.example.com.'],
    contacts: {
      registrantContact: {
        firstName: 'Alice',
        lastName: 'Registrant',
        organizationName: 'Example Org',
        email: 'alice@example.com',
        phoneNumber: '+12025550199',
      },
    },
    contactsPrivacy: {
      registrantContact: 'PUBLIC_CONTACT_DATA',
    },
    supportsDnssec: true,
  };
}

describe('rdapRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.RDAP_ENABLE_DUMMY_OBJECTS = true;

    mockGetDomainDetails = vi
      .fn()
      .mockResolvedValue(createDomainRegistration());
    mockGetDomainStatus = vi
      .fn()
      .mockResolvedValue(['ok', 'clientTransferProhibited']);
    mockGetCentralnicRegistrar = vi.fn().mockReturnValue({
      getDomainDetails: (...args: unknown[]) => mockGetDomainDetails(...args),
      getDomainStatus: (...args: unknown[]) => mockGetDomainStatus(...args),
    });
  });

  it('returns RDAP help response', async () => {
    const response = await rdapRouter.request('http://localhost/help');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'application/rdap+json',
    );
    expect(body.rdapConformance).toContain('rdap_level_0');
    expect(body.notices.length).toBeGreaterThan(0);
  });

  it('returns domain RDAP object from CentralNic data', async () => {
    const response = await rdapRouter.request(
      'http://localhost/domain/example.com',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.objectClassName).toBe('domain');
    expect(body.ldhName).toBe('example.com');
    expect(body.status).toContain('active');
    expect(body.status).toContain('client transfer prohibited');
    expect(body.nameservers).toHaveLength(2);
    expect(body.nameservers[0].objectClassName).toBe('nameserver');
    type RdapEntity = { roles?: string[] };
    expect(
      body.entities.some((entity: RdapEntity) =>
        entity.roles?.includes('registrar'),
      ),
    ).toBe(true);
    expect(mockGetCentralnicRegistrar).toHaveBeenCalledTimes(2);
    expect(mockGetDomainDetails).toHaveBeenCalledWith('example.com');
  });

  it('returns 404 RDAP error when domain does not exist', async () => {
    mockGetDomainDetails.mockRejectedValue(
      new Error('EPP 2303: Object does not exist'),
    );

    const response = await rdapRouter.request(
      'http://localhost/domain/missing.com',
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.errorCode).toBe(404);
    expect(body.title).toBe('Not Found');
  });

  it('returns 400 RDAP error for invalid domain handle', async () => {
    const response = await rdapRouter.request(
      'http://localhost/domain/localhost',
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe(400);
  });

  it('returns schema-valid dummy entity object', async () => {
    const response = await rdapRouter.request('http://localhost/entity/ABC123');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.objectClassName).toBe('entity');
    expect(body.handle).toBe('ABC123');
  });

  it('returns 501 when dummy non-domain responses are disabled', async () => {
    mockConfig.RDAP_ENABLE_DUMMY_OBJECTS = false;

    const response = await rdapRouter.request('http://localhost/entity/ABC123');
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.errorCode).toBe(501);
    expect(body.title).toBe('Not Implemented');
  });

  it('supports HEAD lookup for existing domain', async () => {
    const response = await rdapRouter.request(
      'http://localhost/domain/example.com',
      {
        method: 'HEAD',
      },
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toBe('');
    expect(mockGetDomainDetails).toHaveBeenCalledWith('example.com');
  });

  it('returns 501 on HEAD for non-domain type when dummy responses disabled', async () => {
    mockConfig.RDAP_ENABLE_DUMMY_OBJECTS = false;

    const response = await rdapRouter.request(
      'http://localhost/entity/ABC123',
      {
        method: 'HEAD',
      },
    );

    expect(response.status).toBe(501);
  });
});
