export const normalizedDomainNamesTestCases = [
  {
    name: '@',
    valid: true,
    reason:
      'Empty domain name is valid, used in zone files for records indicating the apex of the zone',
  },
  {
    name: '_dmarc.example.com',
    valid: true,
  },
  // Service names for SRV, TLSA, SVCB records (RFC 2782)
  {
    name: '_sip._tcp',
    valid: true,
    reason: 'Service name with underscores for SRV records',
  },
  {
    name: '_http._tcp.example.com',
    valid: true,
    reason: 'Service name with protocol for SRV records',
  },
  {
    name: '_443._tcp',
    valid: true,
    reason: 'TLSA record service name with port number',
  },
  {
    name: '_25._tcp.mail.example.com',
    valid: true,
    reason: 'TLSA record for SMTP service',
  },
  {
    name: '_example._tcp',
    valid: true,
    reason: 'SVCB record service name',
  },
  {
    name: '_service._protocol.example.com',
    valid: true,
    reason: 'Full service record name with domain',
  },
  // Underscores in any position should be valid
  {
    name: 'prefix._service.example.com',
    valid: true,
    reason: 'Underscore in second label should be valid',
  },
  {
    name: 'example._internal._tcp',
    valid: true,
    reason: 'Multiple underscores in different labels',
  },
  // Single character labels with underscores
  {
    name: '_',
    valid: true,
    reason: 'Single underscore character is valid',
  },
  {
    name: '_.example.com',
    valid: true,
    reason: 'Single underscore as first label',
  },
  {
    name: 'example._',
    valid: true,
    reason: 'Single underscore as last label',
  },
  {
    name: 'example.com',
    valid: true,
  },
  {
    name: 'sub.example.com',
    valid: true,
  },
  {
    name: 'sub-domain.example.com',
    valid: true,
  },
  // domain name with 63 characters in each label
  {
    name: `${['a'.repeat(62), 'b'.repeat(62), 'c'.repeat(62), 'd'.repeat(62)].join('.')}.co`,
    // 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd.co'
    // length = 254 (without trailing dot)
    // length = 255 (with trailing dot)
    valid: true,
  },
];
export const nonNormalizedDomainNamesTestCases = [
  // Note: Underscores are now allowed in any label position for service names
  {
    name: 'ab__double.example.com',
    valid: false,
    reason: 'Domain name contains consecutive underscores',
  },
  {
    name: 'example.-invalid.com',
    valid: false,
    reason: 'Domain name contains label starting with hyphen',
  },
  {
    name: 'example.invalid-.com',
    valid: false,
    reason: 'Domain name contains label ending with hyphen',
  },
  {
    name: '.example.com',
    valid: false,
    reason: 'Domain name starts with a dot',
  },
  {
    name: 'example..com',
    valid: false,
    reason: 'Domain name contains consecutive dots',
  },
  {
    name: 'Example.com',
    valid: false,
    reason: 'Domain name contains uppercase letters',
  },
  {
    name: 'Example.com.',
    valid: false,
    reason: 'Domain name contains a trailing dot',
  },
  {
    name: 'example.com/path',
    valid: false,
    reason: 'Domain name contains a path',
  },
  {
    name: 'example.com:8080',
    valid: false,
    reason: 'Domain name contains a port',
  },
  {
    name: '宏',
    valid: false,
    reason: 'Domain name contains non-ASCII characters',
  },
  // domain name with label longer than 63 characters
  {
    name: `${'a'.repeat(64)}.com`,
    valid: false,
    reason: 'Domain name contains a label longer than 63 characters',
  },
  // TODO! test length limit
  // {
  //   name: `${["a".repeat(62), "b".repeat(62), "c".repeat(62), "d".repeat(62)].join(".")}.com`,
  //   valid: false,
  //   reason: "Domain name too long, it has 255 characters",
  // }
];

export const fqdnLowercaseTestCases = [
  {
    name: 'example.com',
    valid: false,
  },
  {
    name: 'example.com.',
    valid: true,
  },
  {
    name: 'abc.example.com.',
    valid: true,
  },
  {
    name: '张三.com',
    valid: false,
  },
  {
    name: '_dmarc.example.com.',
    valid: true,
  },
  {
    name: '__dmarc.example.com.',
    valid: false,
  },
  // Service names with FQDN format
  {
    name: '_sip._tcp.example.com.',
    valid: true,
  },
  {
    name: '_443._tcp.mail.example.com.',
    valid: true,
  },
  {
    name: '_example._tcp.',
    valid: true,
  },
  {
    name: 'service._internal._tcp.example.com.',
    valid: true,
  },
];
