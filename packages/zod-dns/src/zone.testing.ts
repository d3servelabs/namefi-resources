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
    records: [
      {
        type: 'A',
        name: '@',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
      {
        type: 'A',
        name: '@',
        ttl: 3600,
        rdata: '192.168.1.2',
      },
    ],
    description: 'Valid zone with multiple records same name and type',
  },
  {
    zoneName: 'subdomain.example.com',
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
        rdata: '192.168.1.1',
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

export const apexSoaNsTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'SOA',
        name: '@',
        ttl: 3600,
        rdata: 'ns1.example.com. admin.example.com. 1 3600 1800 604800 86400',
      },
    ],
    description: 'Zone with SOA record at apex (@)',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: '@',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
    ],
    description: 'Zone with NS record at apex (@)',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'SOA',
        name: '',
        ttl: 3600,
        rdata: 'ns1.example.com. admin.example.com. 1 3600 1800 604800 86400',
      },
    ],
    description: 'Zone with SOA record at apex (empty name)',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: '',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
    ],
    description: 'Zone with NS record at apex (empty name)',
  },
];

export const nsConflictTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
      {
        type: 'A',
        name: 'subdomain',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Zone with NS and A records for the same name',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns2.example.com.',
      },
      {
        type: 'MX',
        name: 'subdomain',
        ttl: 3600,
        rdata: '10 mail.example.com.',
      },
    ],
    description: 'Zone with NS and MX records for the same name',
  },
];

export const nsSubdomainTestCases = [
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
      {
        type: 'A',
        name: 'host.subdomain',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Zone with NS record and A record for its subdomain',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
      {
        type: 'MX',
        name: 'mail.subdomain',
        ttl: 3600,
        rdata: '10 mail.example.com.',
      },
    ],
    description: 'Zone with NS record and MX record for its subdomain',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
      {
        type: 'CNAME',
        name: 'www.subdomain',
        ttl: 3600,
        rdata: 'target.example.com.',
      },
    ],
    description: 'Zone with NS record and CNAME record for its subdomain',
  },
  {
    zoneName: 'example.com',
    records: [
      {
        type: 'NS',
        name: 'subdomain',
        ttl: 3600,
        rdata: 'ns1.example.com.',
      },
      {
        type: 'A',
        name: 'deep.nested.subdomain',
        ttl: 3600,
        rdata: '192.168.1.1',
      },
    ],
    description: 'Zone with NS record and A record for deeply nested subdomain',
  },
];
