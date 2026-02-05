import os from 'node:os';
import { describe, expect, it, vi } from 'vitest';
import { generateGA4ClientId } from './ga4-measurement';

describe('generateGA4ClientId', () => {
  it('encodes the primary IPv4 address when available', () => {
    vi.spyOn(os, 'networkInterfaces').mockReturnValue({
      eth0: [
        {
          address: '1.2.3.4',
          family: 'IPv4',
          internal: false,
          mac: '00:00:00:00:00:00',
          netmask: '255.255.255.0',
          cidr: '1.2.3.4/24',
        },
      ],
    });
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    const clientId = generateGA4ClientId();

    expect(clientId).toBe('001002003004.1700000000');
    vi.restoreAllMocks();
  });

  it('falls back to localhost encoding when no IPv4 address is found', () => {
    vi.spyOn(os, 'networkInterfaces').mockReturnValue({
      lo0: [
        {
          address: '::1',
          family: 'IPv6',
          internal: true,
          mac: '00:00:00:00:00:00',
          netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
          cidr: '::1/128',
          scopeid: 0,
        },
      ],
    });
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    const clientId = generateGA4ClientId();

    expect(clientId).toBe('127001001001.1700000000');
    vi.restoreAllMocks();
  });
});
