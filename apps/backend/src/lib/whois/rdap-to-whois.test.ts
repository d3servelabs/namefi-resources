import { describe, expect, it, vi } from 'vitest';
import { convertRdapDomainToWhois } from './rdap-to-whois';

describe('convertRdapDomainToWhois', () => {
  it('renders a common WHOIS key-value layout from RDAP domain data', () => {
    const output = convertRdapDomainToWhois({
      ldhName: 'example.com',
      handle: 'EXAMPLE-12345',
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
      nameservers: [{ ldhName: 'ns1.example.com' }],
      entities: [
        {
          roles: ['registrar'],
          handle: 'centralnic',
          vcardArray: ['vcard', [['fn', {}, 'text', 'CentralNic']]],
        },
        {
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
      secureDns: {
        delegationSigned: false,
      },
    });

    expect(output).toContain('Domain Name: EXAMPLE.COM');
    expect(output).toContain('Registry Domain ID: EXAMPLE-12345');
    expect(output).toContain('Registrar: CentralNic');
    expect(output).toContain('Registrant Name: Alice Registrant');
    expect(output).toContain('Registrant Email: alice@example.com');
    expect(output).toContain(
      'Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited',
    );
    expect(output).toContain('Name Server: NS1.EXAMPLE.COM');
    expect(output).toContain('DNSSEC: unsigned');
    expect(output.endsWith('\r\n')).toBe(true);
  });

  it('falls back to camelCase token for unknown RDAP-like statuses', () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const output = convertRdapDomainToWhois({
      ldhName: 'example.com',
      status: ['custom pending status'],
      events: [
        {
          eventAction: 'last update of RDAP database',
          eventDate: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(output).toContain(
      'Domain Status: customPendingStatus https://icann.org/epp#customPendingStatus',
    );

    warnSpy.mockRestore();
  });
});
