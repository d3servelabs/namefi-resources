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
  {
    name: 'ab._dmarc.example.com',
    valid: false,
    reason: 'Domain name contains an underscore but it is not the first label',
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
];
