import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockLookupRdapDomain = vi.fn();

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
}));

vi.mock('./rdap', () => ({
  lookupRdapDomain: (...args: unknown[]) => mockLookupRdapDomain(...args),
}));

const { whoisRouter } = await import('./whois');

describe('whoisRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookupRdapDomain = vi.fn().mockResolvedValue({
      ok: true,
      normalizedDomainName: 'example.com',
      rdapDomain: {
        rdapConformance: ['rdap_level_0'],
        lang: 'en',
        objectClassName: 'domain',
        ldhName: 'example.com',
        unicodeName: 'example.com',
        port43: 'whois.centralnic.com',
        status: ['ok', 'client transfer prohibited'],
        events: [
          {
            eventAction: 'registration',
            eventDate: '2020-01-01T00:00:00.000Z',
          },
          {
            eventAction: 'expiration',
            eventDate: '2030-01-01T00:00:00.000Z',
          },
          {
            eventAction: 'last update of RDAP database',
            eventDate: '2026-01-01T00:00:00.000Z',
          },
        ],
        nameservers: [
          {
            objectClassName: 'nameserver',
            ldhName: 'ns1.example.com',
            unicodeName: 'ns1.example.com',
          },
        ],
        entities: [
          {
            objectClassName: 'entity',
            roles: ['registrar'],
            handle: 'centralnic',
            vcardArray: ['vcard', [['fn', {}, 'text', 'CentralNic']]],
          },
          {
            objectClassName: 'entity',
            roles: ['registrant'],
            handle: 'example-registrant',
            vcardArray: [
              'vcard',
              [
                ['fn', {}, 'text', 'Alice Registrant'],
                ['email', {}, 'text', 'alice@example.com'],
              ],
            ],
          },
        ],
      },
    });
  });

  it('returns WHOIS formatted text for path-based lookup', async () => {
    const response = await whoisRouter.request('http://localhost/example.com');
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('Domain Name: EXAMPLE.COM');
    expect(body).toContain('Registrar WHOIS Server: whois.centralnic.com');
    expect(body).toContain('Domain Status: ok https://icann.org/epp#ok');
    expect(body).toContain(
      'Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited',
    );
    expect(body).toContain('Name Server: NS1.EXAMPLE.COM');
    expect(mockLookupRdapDomain).toHaveBeenCalledWith('example.com');
  });

  it('returns WHOIS formatted text for query-based lookup', async () => {
    const response = await whoisRouter.request(
      'http://localhost/?domain=example.com',
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('Domain Name: EXAMPLE.COM');
  });

  it('returns 400 when query parameter domain is missing', async () => {
    const response = await whoisRouter.request('http://localhost/');
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(body).toContain('Missing required query parameter: domain');
  });

  it('returns 400 for invalid domain input', async () => {
    const response = await whoisRouter.request('http://localhost/localhost');
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(body).toContain('Invalid domain.');
  });

  it('returns 404 no match text when RDAP domain is not found', async () => {
    mockLookupRdapDomain.mockResolvedValueOnce({
      ok: false,
      normalizedDomainName: 'missing.com',
      error: {
        errorCode: 404,
        title: 'Not Found',
        description: 'The requested domain object does not exist.',
      },
    });

    const response = await whoisRouter.request('http://localhost/missing.com');
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).toContain('No match for "MISSING.COM".');
  });

  it('returns 503 text when RDAP is unavailable', async () => {
    mockLookupRdapDomain.mockResolvedValueOnce({
      ok: false,
      normalizedDomainName: 'example.com',
      error: {
        errorCode: 503,
        title: 'Service Unavailable',
        description: 'CentralNic registrar is not configured.',
      },
    });

    const response = await whoisRouter.request('http://localhost/example.com');
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toContain('WHOIS service is temporarily unavailable.');
  });
});
