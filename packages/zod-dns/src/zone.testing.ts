export const validZoneTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'A',
        name: '@',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
      {
        type: 'A',
        name: 'www',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
      {
        type: 'MX',
        name: '@',
        ttl: 3600,
        rdata: '10 example.com.',
      },
    ],
    description: 'Valid zone with multiple record types',
  },
  {
    zoneName: 'test.com',
    records: [
      {
        type: 'A',
        name: '@',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Valid zone with just one record',
  },
  {
    zoneName: 'empty-zone.com',
    records: [],
    description: 'Valid zone with no records',
  },
];

export const invalidZoneNameTestCases = [
  {
    zoneName: 'Invalid_Domain.com',
    records: [
      {
        type: 'A',
        name: '@',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Invalid zone with underscore in domain name',
  },
  {
    zoneName: 'example.com.',
    records: [
      {
        type: 'A',
        name: '@',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Invalid zone with trailing dot',
  },
];

export const invalidRecordNameTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'A',
        name: 'invalid_subdomain',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Invalid record with underscore in subdomain',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'A',
        name: 'a'.repeat(64), // Label too long (over 63 characters)
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Invalid record with label too long',
  },
];

export const duplicateRecordsTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'A',
        name: 'www',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
      {
        type: 'A',
        name: 'www',
        ttl: 7200,
        rdata: '192.168.1.2',
      },
    ],
    description: 'Zone with duplicate record names and types',
  },
];

export const multipleCnameTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'CNAME',
        name: 'www',
        ttl: 3600,
        rdata: 'example.com',
      },
      {
        type: 'CNAME',
        name: 'www',
        ttl: 7200,
        rdata: 'other.example.com',
      },
    ],
    description: 'Zone with multiple CNAME records for the same name',
  },
];

export const cnameConflictTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'CNAME',
        name: 'www',
        ttl: 3600,
        rdata: 'example.com',
      },
      {
        type: 'A',
        name: 'www',
        ttl: 7200,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Zone with CNAME and other record types with the same name',
  },
];
