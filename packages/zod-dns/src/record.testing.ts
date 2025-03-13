export const validARecordTestCases = [
  {
    type: 'A',
    name: 'example',
    ttl: 3600,
    rdata: '192.168.1.1',
    description: 'Valid A record with IPv4 address',
  },
  {
    type: 'A',
    name: 'sub',
    ttl: 86400,
    rdata: '10.0.0.1',
    description: 'Valid A record with different TTL rdata',
  },
];

export const invalidARecordTestCases = [
  {
    type: 'A',
    name: 'example',
    ttl: 3600,
    rdata: '300.168.1.1',
    description: 'Invalid A record with invalid IPv4 address (octet > 255)',
  },
  {
    type: 'A',
    name: 'example',
    ttl: -1,
    rdata: '192.168.1.1',
    description: 'Invalid A record with negative TTL',
  },
  {
    type: 'A',
    name: 'Invalid@Domain',
    ttl: 3600,
    rdata: '192.168.1.1',
    description: 'Invalid A record with invalid domain name',
  },
];

export const validAAAARecordTestCases = [
  {
    type: 'AAAA',
    name: 'example',
    ttl: 3600,
    rdata: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    description: 'Valid AAAA record with full IPv6 address',
  },
  {
    type: 'AAAA',
    name: 'ipv6',
    ttl: 7200,
    rdata: '::1',
    description: 'Valid AAAA record with shortened IPv6 address',
  },
];

export const invalidAAAARecordTestCases = [
  {
    type: 'AAAA',
    name: 'example',
    ttl: 3600,
    rdata: '192.168.1.1',
    description: 'Invalid AAAA record with IPv4 address instead of IPv6',
  },
  {
    type: 'AAAA',
    name: 'example',
    ttl: 3600,
    rdata: '2001:0db8:85a3:0000:0000:8a2e:0370:gggg',
    description:
      'Invalid AAAA record with invalid hexadecimal characters in IPv6',
  },
];

export const validCNAMERecordTestCases = [
  {
    type: 'CNAME',
    name: 'www',
    ttl: 3600,
    rdata: 'example.com.',
    description: 'Valid CNAME record pointing to a domain',
  },
  {
    type: 'CNAME',
    name: 'alias',
    ttl: 7200,
    rdata: 'service.example.com.',
    description: 'Valid CNAME record with subdomain target',
  },
];

export const invalidCNAMERecordTestCases = [
  {
    type: 'CNAME',
    name: 'www',
    ttl: 3600,
    rdata: 'Invalid_Domain',
    description: 'Invalid CNAME record with invalid domain rdata',
  },
  {
    type: 'CNAME',
    name: 'www',
    ttl: 3600,
    rdata: 'example.com',
    description: 'Invalid CNAME record with domain name without trailing dot',
  },
];

export const validMXRecordTestCases = [
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: '10 example.com.',
    description: 'Valid MX record with priority 10 example.com.',
  },
  {
    type: 'MX',
    name: 'mail',
    ttl: 7200,
    rdata: '50 example.com.',
    description: 'Valid MX record with priority 50 example.com.',
  },
];

export const invalidMXRecordTestCases = [
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: '-5',
    description: 'Invalid MX record with negative priority',
  },
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: '-5 example.com.',
    description: 'Invalid MX record with negative priority',
    expectedError: true,
  },
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: 10,
    description: 'Invalid MX record with only priority',
    expectedError: true,
  },
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: 'not-a-number example.com.',
    description: 'Invalid MX record with non-number priority',
    expectedError: true,
  },
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: '10 1.2.3.4',
    description: 'Invalid MX record with invalid target name',
    expectedError: true,
  },
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: '13254353 example.com.',
    description: 'Invalid MX record with too high priority',
    expectedError: true,
  },
  {
    type: 'MX',
    name: 'example',
    ttl: 3600,
    rdata: '0 example.com',
    description: 'Invalid MX record with priority but target is not a FQDN',
    expectedError: true,
  },
];

export const validTXTRecordTestCases = [
  {
    type: 'TXT',
    name: 'example',
    ttl: 3600,
    rdata: 'v=spf1 include:_spf.example.com ~all',
    description: 'Valid TXT record with SPF data',
  },
  {
    type: 'TXT',
    name: 'verification',
    ttl: 7200,
    rdata: 'google-site-verification=abcdefghijklmnopqrstuvwxyz',
    description: 'Valid TXT record with verification data',
  },
];

export const missingFieldsTestCases = [
  {
    type: 'A',
    name: 'example',
    ttl: 3600,
    description: 'Missing rdata',
  },
  {
    type: 'A',
    ttl: 3600,
    rdata: '192.168.1.1',
    description: 'Missing name',
  },
  {
    type: 'A',
    name: 'example',
    rdata: '192.168.1.1',
    description: 'Missing ttl',
  },
  {
    name: 'example',
    ttl: 3600,
    rdata: '192.168.1.1',
    description: 'Missing type',
  },
];

// We don't have any invalid TXT records since the schema currently accepts any string
