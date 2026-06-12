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
  {
    type: 'TXT',
    name: 'selector1._domainkey',
    ttl: 3600,
    rdata: `v=DKIM1; k=rsa; p=${'A'.repeat(400)}`,
    description: 'Valid long TXT record (DKIM public key over 255 chars)',
  },
  {
    type: 'TXT',
    name: 'txt-wire-boundary',
    ttl: 3600,
    rdata: 'x'.repeat(65279),
    description: 'Valid TXT record at the 65535-octet wire-size limit',
  },
];

export const invalidTXTRecordTestCases = [
  {
    type: 'TXT',
    name: 'example',
    ttl: 3600,
    rdata: 'x'.repeat(65280),
    description: 'Invalid TXT record exceeding the 65535-octet wire-size limit',
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

// Invalid TXT records are enumerated in invalidTXTRecordTestCases above
// (the only constraint is the 65535-octet RDLENGTH ceiling).

// NS Records
export const validNSRecordTestCases = [
  {
    type: 'NS',
    name: 'example',
    ttl: 3600,
    rdata: 'ns1.example.com.',
    description: 'Valid NS record with authoritative nameserver',
  },
  {
    type: 'NS',
    name: 'subdomain',
    ttl: 86400,
    rdata: 'ns2.provider.com.',
    description: 'Valid NS record with external nameserver',
  },
];

export const invalidNSRecordTestCases = [
  {
    type: 'NS',
    name: 'example',
    ttl: 3600,
    rdata: 'invalid-ns',
    description: 'Invalid NS record without trailing dot',
  },
  {
    type: 'NS',
    name: 'example',
    ttl: 3600,
    rdata: 'ns1.example.com',
    description: 'Invalid NS record missing trailing dot',
  },
];

// SOA Records
export const validSOARecordTestCases = [
  {
    type: 'SOA',
    name: 'example',
    ttl: 3600,
    rdata:
      'ns1.example.com. admin.example.com. 2023010101 7200 3600 1209600 3600',
    description: 'Valid SOA record with all required fields',
  },
  {
    type: 'SOA',
    name: 'test',
    ttl: 86400,
    rdata: 'primary.dns.com. hostmaster.dns.com. 1 10800 3600 604800 300',
    description: 'Valid SOA record with minimal values',
  },
];

export const invalidSOARecordTestCases = [
  {
    type: 'SOA',
    name: 'example',
    ttl: 3600,
    rdata: 'ns1.example.com. admin.example.com. 2023010101 7200 3600',
    description: 'Invalid SOA record with missing fields',
  },
  {
    type: 'SOA',
    name: 'example',
    ttl: 3600,
    rdata: 'invalid-ns admin.example.com. 2023010101 7200 3600 1209600 3600',
    description: 'Invalid SOA record with invalid primary NS',
  },
];

// PTR Records
export const validPTRRecordTestCases = [
  {
    type: 'PTR',
    name: '1.1.168.192.in-addr.arpa',
    ttl: 3600,
    rdata: 'host.example.com.',
    description: 'Valid PTR record for reverse DNS',
  },
  {
    type: 'PTR',
    name: '2.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
    ttl: 7200,
    rdata: 'ipv6host.example.com.',
    description: 'Valid PTR record for IPv6 reverse DNS',
  },
];

export const invalidPTRRecordTestCases = [
  {
    type: 'PTR',
    name: '1.1.168.192.in-addr.arpa',
    ttl: 3600,
    rdata: 'host.example.com',
    description: 'Invalid PTR record without trailing dot',
  },
  {
    type: 'PTR',
    name: '1.1.168.192.in-addr.arpa',
    ttl: 3600,
    rdata: 'invalid_host',
    description: 'Invalid PTR record with invalid domain',
  },
];

// SRV Records
export const validSRVRecordTestCases = [
  {
    type: 'SRV',
    name: '_sip._tcp',
    ttl: 3600,
    rdata: '0 5 5060 sipserver.example.com.',
    description: 'Valid SRV record for SIP service',
  },
  {
    type: 'SRV',
    name: '_http._tcp',
    ttl: 7200,
    rdata: '1 10 80 .',
    description: 'Valid SRV record with no service available',
  },
];

export const invalidSRVRecordTestCases = [
  {
    type: 'SRV',
    name: '_sip._tcp',
    ttl: 3600,
    rdata: '0 5 5060',
    description: 'Invalid SRV record with missing target',
  },
  {
    type: 'SRV',
    name: '_sip._tcp',
    ttl: 3600,
    rdata: '70000 5 5060 sipserver.example.com.',
    description: 'Invalid SRV record with priority too high',
  },
];

// CAA Records
export const validCAARecordTestCases = [
  {
    type: 'CAA',
    name: 'example',
    ttl: 3600,
    rdata: '0 issue "letsencrypt.org"',
    description: "Valid CAA record for Let's Encrypt",
  },
  {
    type: 'CAA',
    name: 'example',
    ttl: 7200,
    rdata: '128 issuewild "ca.example.com"',
    description: 'Valid CAA record for wildcard certificates',
  },
];

export const invalidCAARecordTestCases = [
  {
    type: 'CAA',
    name: 'example',
    ttl: 3600,
    rdata: '0 invalidtag "letsencrypt.org"',
    description: 'Invalid CAA record with invalid tag',
  },
  {
    type: 'CAA',
    name: 'example',
    ttl: 3600,
    rdata: '256 issue "letsencrypt.org"',
    description: 'Invalid CAA record with flags too high',
  },
];

// DS Records
export const validDSRecordTestCases = [
  {
    type: 'DS',
    name: 'example',
    ttl: 3600,
    rdata: '12345 7 1 1234567890ABCDEF1234567890ABCDEF12345678',
    description: 'Valid DS record with SHA-1 digest',
  },
  {
    type: 'DS',
    name: 'example',
    ttl: 7200,
    rdata:
      '54321 8 2 ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
    description: 'Valid DS record with SHA-256 digest',
  },
];

export const invalidDSRecordTestCases = [
  {
    type: 'DS',
    name: 'example',
    ttl: 3600,
    rdata: '70000 7 1 1234567890ABCDEF1234567890ABCDEF12345678',
    description: 'Invalid DS record with key tag too high',
  },
  {
    type: 'DS',
    name: 'example',
    ttl: 3600,
    rdata: '12345 7 1 GHIJKLMNOP',
    description: 'Invalid DS record with non-hexadecimal digest',
  },
];

// TLSA Records
export const validTLSARecordTestCases = [
  {
    type: 'TLSA',
    name: '_443._tcp',
    ttl: 3600,
    rdata: '3 1 1 1234567890ABCDEF1234567890ABCDEF12345678',
    description: 'Valid TLSA record for HTTPS',
  },
  {
    type: 'TLSA',
    name: '_25._tcp',
    ttl: 7200,
    rdata:
      '2 0 2 ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
    description: 'Valid TLSA record for SMTP',
  },
];

export const invalidTLSARecordTestCases = [
  {
    type: 'TLSA',
    name: '_443._tcp',
    ttl: 3600,
    rdata: '4 1 1 1234567890ABCDEF1234567890ABCDEF12345678',
    description: 'Invalid TLSA record with usage too high',
  },
  {
    type: 'TLSA',
    name: '_443._tcp',
    ttl: 3600,
    rdata: '3 1 1 GHIJKLMNOP',
    description: 'Invalid TLSA record with non-hexadecimal certificate data',
  },
];

// SSHFP Records
export const validSSHFPRecordTestCases = [
  {
    type: 'SSHFP',
    name: 'server',
    ttl: 3600,
    rdata: '1 1 123456789ABCDEF123456789ABCDEF123456789A',
    description: 'Valid SSHFP record for RSA key with SHA-1',
  },
  {
    type: 'SSHFP',
    name: 'server',
    ttl: 7200,
    rdata:
      '4 2 ABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF12',
    description: 'Valid SSHFP record for Ed25519 key with SHA-256',
  },
];

export const invalidSSHFPRecordTestCases = [
  {
    type: 'SSHFP',
    name: 'server',
    ttl: 3600,
    rdata: '5 1 123456789ABCDEF123456789ABCDEF123456789A',
    description: 'Invalid SSHFP record with algorithm too high',
  },
  {
    type: 'SSHFP',
    name: 'server',
    ttl: 3600,
    rdata: '1 1 GHIJKLMNOP',
    description: 'Invalid SSHFP record with non-hexadecimal fingerprint',
  },
];

// HTTPS Records
export const validHTTPSRecordTestCases = [
  {
    type: 'HTTPS',
    name: 'example',
    ttl: 3600,
    rdata: '1 . alpn="h2,h3" port=443',
    description: 'Valid HTTPS record with ALPN and port parameters',
  },
  {
    type: 'HTTPS',
    name: 'example',
    ttl: 7200,
    rdata: '0 alt.example.com.',
    description: 'Valid HTTPS record with alias mode',
  },
];

export const invalidHTTPSRecordTestCases = [
  {
    type: 'HTTPS',
    name: 'example',
    ttl: 3600,
    rdata: '70000 .',
    description: 'Invalid HTTPS record with priority too high',
  },
  {
    type: 'HTTPS',
    name: 'example',
    ttl: 3600,
    rdata: '1 invalid-target',
    description: 'Invalid HTTPS record with invalid target',
  },
];

// SVCB Records
export const validSVCBRecordTestCases = [
  {
    type: 'SVCB',
    name: '_example._tcp',
    ttl: 3600,
    rdata: '1 service.example.com. port=8080',
    description: 'Valid SVCB record with service binding',
  },
  {
    type: 'SVCB',
    name: '_example._tcp',
    ttl: 7200,
    rdata: '0 .',
    description: 'Valid SVCB record with alias mode',
  },
];

export const invalidSVCBRecordTestCases = [
  {
    type: 'SVCB',
    name: '_example._tcp',
    ttl: 3600,
    rdata: '70000 service.example.com.',
    description: 'Invalid SVCB record with priority too high',
  },
  {
    type: 'SVCB',
    name: '_example._tcp',
    ttl: 3600,
    rdata: '1 invalid-target',
    description: 'Invalid SVCB record with invalid target',
  },
];

// NAPTR Records
export const validNAPTRRecordTestCases = [
  {
    type: 'NAPTR',
    name: 'example',
    ttl: 3600,
    rdata: '100 10 "u" "E2U+sip" "!^.*$!sip:info@example.com!" .',
    description: 'Valid NAPTR record for SIP service',
  },
  {
    type: 'NAPTR',
    name: 'example',
    ttl: 7200,
    rdata: '100 10 "" "" "" replacement.example.com.',
    description: 'Valid NAPTR record with replacement',
  },
];

export const invalidNAPTRRecordTestCases = [
  {
    type: 'NAPTR',
    name: 'example',
    ttl: 3600,
    rdata: '70000 10 "u" "E2U+sip" "!^.*$!sip:info@example.com!" .',
    description: 'Invalid NAPTR record with order too high',
  },
  {
    type: 'NAPTR',
    name: 'example',
    ttl: 3600,
    rdata: '100 10 "toolong" "E2U+sip" "!^.*$!sip:info@example.com!" .',
    description: 'Invalid NAPTR record with flags too long',
  },
];

// SPF Records
export const validSPFRecordTestCases = [
  {
    type: 'SPF',
    name: 'example',
    ttl: 3600,
    rdata: 'v=spf1 include:_spf.example.com ~all',
    description: 'Valid SPF record (deprecated - use TXT instead)',
  },
  {
    type: 'SPF',
    name: 'example',
    ttl: 7200,
    rdata: 'v=spf1 a mx -all',
    description: 'Valid SPF record with strict policy',
  },
  {
    type: 'SPF',
    name: 'example',
    ttl: 3600,
    rdata: `v=spf1 ${'include:_spf.example.com '.repeat(20)}-all`,
    description: 'Valid long SPF record over 255 chars (many includes)',
  },
  {
    type: 'SPF',
    name: 'spf-wire-boundary',
    ttl: 3600,
    rdata: 'x'.repeat(65279),
    description: 'Valid SPF record at the 65535-octet wire-size limit',
  },
];

export const invalidSPFRecordTestCases = [
  {
    type: 'SPF',
    name: 'example',
    ttl: 3600,
    rdata: 'x'.repeat(65280),
    description: 'Invalid SPF record exceeding the 65535-octet wire-size limit',
  },
];
