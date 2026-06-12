import { describe, expect, it } from 'vitest';
import { recordSchema, sanitizeDnsRecord } from './record';
import {
  invalidAAAARecordTestCases,
  invalidARecordTestCases,
  invalidCNAMERecordTestCases,
  invalidMXRecordTestCases,
  invalidNSRecordTestCases,
  invalidSOARecordTestCases,
  invalidPTRRecordTestCases,
  invalidSRVRecordTestCases,
  invalidCAARecordTestCases,
  invalidDSRecordTestCases,
  invalidTLSARecordTestCases,
  invalidSSHFPRecordTestCases,
  invalidHTTPSRecordTestCases,
  invalidSVCBRecordTestCases,
  invalidNAPTRRecordTestCases,
  invalidSPFRecordTestCases,
  invalidTXTRecordTestCases,
  missingFieldsTestCases,
  validAAAARecordTestCases,
  validARecordTestCases,
  validCNAMERecordTestCases,
  validMXRecordTestCases,
  validTXTRecordTestCases,
  validNSRecordTestCases,
  validSOARecordTestCases,
  validPTRRecordTestCases,
  validSRVRecordTestCases,
  validCAARecordTestCases,
  validDSRecordTestCases,
  validTLSARecordTestCases,
  validSSHFPRecordTestCases,
  validHTTPSRecordTestCases,
  validSVCBRecordTestCases,
  validNAPTRRecordTestCases,
  validSPFRecordTestCases,
} from './record.testing';

const utf8ByteLength = (value: string) =>
  new TextEncoder().encode(value).length;

function getQuotedCharacterStrings(rdata: string): string[] {
  return (rdata.match(/"([^"]*)"/g) ?? []).map((quoted: string) =>
    quoted.slice(1, -1),
  );
}

describe('DNS Record Validation', () => {
  describe('A Records', () => {
    for (const testCase of validARecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidARecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('AAAA Records', () => {
    for (const testCase of validAAAARecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidAAAARecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('CNAME Records', () => {
    for (const testCase of validCNAMERecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidCNAMERecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('MX Records', () => {
    for (const testCase of validMXRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidMXRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        if (testCase.expectedError) {
          expect(() => recordSchema.parse(testCase)).toThrow();
        } else {
          expect(result.success).toBe(false);
        }
      });
    }
  });

  describe('TXT Records', () => {
    for (const testCase of validTXTRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidTXTRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('NS Records', () => {
    for (const testCase of validNSRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidNSRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('SOA Records', () => {
    for (const testCase of validSOARecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidSOARecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('PTR Records', () => {
    for (const testCase of validPTRRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidPTRRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('SRV Records', () => {
    for (const testCase of validSRVRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidSRVRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('CAA Records', () => {
    for (const testCase of validCAARecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidCAARecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('DS Records', () => {
    for (const testCase of validDSRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidDSRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('TLSA Records', () => {
    for (const testCase of validTLSARecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidTLSARecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('SSHFP Records', () => {
    for (const testCase of validSSHFPRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidSSHFPRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('HTTPS Records', () => {
    for (const testCase of validHTTPSRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidHTTPSRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('SVCB Records', () => {
    for (const testCase of validSVCBRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidSVCBRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('NAPTR Records', () => {
    for (const testCase of validNAPTRRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidNAPTRRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('SPF Records', () => {
    for (const testCase of validSPFRecordTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    }

    for (const testCase of invalidSPFRecordTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('Missing Fields', () => {
    for (const testCase of missingFieldsTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = recordSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    }
  });
});

describe('Sanitize DNS Record', () => {
  it('should sanitize a A record', () => {
    const record = {
      name: 'example.com',
      type: 'A',
      ttl: 60,
      rdata: '192.168.1.1',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('A');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual('192.168.1.1');
  });

  it('should sanitize a CNAME record', () => {
    const record = {
      name: 'example.com',
      type: 'CNAME',
      ttl: 60,
      rdata: 'example.com',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('CNAME');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual('example.com.');
  });

  it('should sanitize a MX record', () => {
    const record = {
      name: 'example.com',
      type: 'MX',
      ttl: 60,
      rdata: ' 10   mail.example.com ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('MX');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual('10 mail.example.com.');
  });

  it('should sanitize a TXT record and wrap in quotes', () => {
    const record = {
      name: 'example.com',
      type: 'TXT',
      ttl: 60,
      rdata: ' This is a test ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('TXT');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual('"This is a test"');
  });

  it('should sanitize a TXT record that already has quotes', () => {
    const record = {
      name: 'example.com',
      type: 'TXT',
      ttl: 60,
      rdata: '"v=spf1 include:_spf.example.com ~all"',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('TXT');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual(
      '"v=spf1 include:_spf.example.com ~all"',
    );
  });

  it('should sanitize a TXT record with partial quotes', () => {
    const record = {
      name: 'example.com',
      type: 'TXT',
      ttl: 60,
      rdata: '"missing end quote',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('TXT');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual('"missing end quote"');
  });

  it('should sanitize an SPF record and wrap in quotes', () => {
    const record = {
      name: 'example.com',
      type: 'SPF',
      ttl: 60,
      rdata: ' v=spf1 include:_spf.example.com ~all ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('SPF');
    expect(sanitizedRecord.ttl).toEqual(60);
    expect(sanitizedRecord.rdata).toEqual(
      '"v=spf1 include:_spf.example.com ~all"',
    );
  });

  it('should split a long TXT value into multiple 255-octet character-strings', () => {
    const longValue = 'A'.repeat(600);
    const record = {
      name: 'selector._domainkey.example.com',
      type: 'TXT',
      ttl: 60,
      rdata: longValue,
    };
    const sanitizedRecord = sanitizeDnsRecord(record);
    // 600 chars -> 255 + 255 + 90, each wrapped in its own quotes.
    expect(sanitizedRecord.rdata).toEqual(
      `"${'A'.repeat(255)}" "${'A'.repeat(255)}" "${'A'.repeat(90)}"`,
    );
    const segments = getQuotedCharacterStrings(sanitizedRecord.rdata);
    for (const segment of segments) {
      expect(utf8ByteLength(segment)).toBeLessThanOrEqual(255);
    }
    // Concatenating the character-strings reproduces the original value.
    expect(segments.join('')).toEqual(longValue);
    expect(utf8ByteLength(segments.join(''))).toEqual(
      utf8ByteLength(longValue),
    );
  });

  it('should split a multibyte TXT value on UTF-8 octet boundaries', () => {
    const longValue = '界'.repeat(100);
    const record = {
      name: 'example.com',
      type: 'TXT',
      ttl: 60,
      rdata: longValue,
    };
    const sanitizedRecord = sanitizeDnsRecord(record);
    const segments = getQuotedCharacterStrings(sanitizedRecord.rdata);

    expect(segments.length).toBeGreaterThan(1);
    for (const segment of segments) {
      expect(utf8ByteLength(segment)).toBeLessThanOrEqual(255);
    }
    expect(segments.join('')).toEqual(longValue);
    expect(utf8ByteLength(segments.join(''))).toEqual(
      utf8ByteLength(longValue),
    );
  });

  it('should preserve an already multi-string TXT value', () => {
    const record = {
      name: 'example.com',
      type: 'TXT',
      ttl: 60,
      rdata: '"part one" "part two"',
    };
    const sanitizedRecord = sanitizeDnsRecord(record);
    expect(sanitizedRecord.rdata).toEqual('"part one" "part two"');
  });

  it('should split a long SPF value into multiple character-strings', () => {
    const longValue = `v=spf1 ${'include:_spf.example.com '.repeat(20)}-all`;
    const record = {
      name: 'example.com',
      type: 'SPF',
      ttl: 60,
      rdata: longValue,
    };
    const sanitizedRecord = sanitizeDnsRecord(record);
    const segments = getQuotedCharacterStrings(sanitizedRecord.rdata);
    expect(segments.length).toBeGreaterThan(1);
    for (const segment of segments) {
      expect(utf8ByteLength(segment)).toBeLessThanOrEqual(255);
    }
    expect(segments.join('')).toEqual(longValue);
    expect(utf8ByteLength(segments.join(''))).toEqual(
      utf8ByteLength(longValue),
    );
  });

  it('it should not change already sanitized A record', () => {
    const record = {
      name: 'example.com.',
      type: 'A',
      ttl: 60,
      rdata: '192.168.1.1',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord).toEqual(record);
  });

  it('it should not change already sanitized CNAME record', () => {
    const record = {
      name: 'example.com.',
      type: 'CNAME',
      ttl: 60,
      rdata: 'example.com.',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord).toEqual(record);
  });

  it('should sanitize an NS record', () => {
    const record = {
      name: 'example.com',
      type: 'NS',
      ttl: 3600,
      rdata: ' ns1.example.com ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('NS');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('ns1.example.com.');
  });

  it('should sanitize a SOA record', () => {
    const record = {
      name: 'example.com',
      type: 'SOA',
      ttl: 3600,
      rdata:
        ' ns1.example.com   admin.example.com   2023010101  7200   3600   1209600   3600 ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('SOA');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual(
      'ns1.example.com. admin.example.com. 2023010101 7200 3600 1209600 3600',
    );
  });

  it('should sanitize a PTR record', () => {
    const record = {
      name: '1.1.168.192.in-addr.arpa',
      type: 'PTR',
      ttl: 3600,
      rdata: ' host.example.com ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('1.1.168.192.in-addr.arpa.');
    expect(sanitizedRecord.type).toEqual('PTR');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('host.example.com.');
  });

  it('should sanitize an SRV record', () => {
    const record = {
      name: '_sip._tcp.example.com',
      type: 'SRV',
      ttl: 3600,
      rdata: ' 0   5   5060   sipserver.example.com ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('_sip._tcp.example.com.');
    expect(sanitizedRecord.type).toEqual('SRV');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('0 5 5060 sipserver.example.com.');
  });

  it('should sanitize an SRV record with no service target', () => {
    const record = {
      name: '_sip._tcp.example.com',
      type: 'SRV',
      ttl: 3600,
      rdata: ' 0   5   5060   . ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('_sip._tcp.example.com.');
    expect(sanitizedRecord.type).toEqual('SRV');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('0 5 5060 .');
  });

  it('should sanitize an HTTPS record', () => {
    const record = {
      name: 'example.com',
      type: 'HTTPS',
      ttl: 3600,
      rdata: ' 1   alt.example.com   alpn=h2,h3   port=443 ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('HTTPS');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual(
      '1 alt.example.com. alpn=h2,h3 port=443',
    );
  });

  it('should sanitize an HTTPS record with dot target', () => {
    const record = {
      name: 'example.com',
      type: 'HTTPS',
      ttl: 3600,
      rdata: ' 1   .   alpn=h2,h3   port=443 ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('HTTPS');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('1 . alpn=h2,h3 port=443');
  });

  it('should sanitize an SVCB record', () => {
    const record = {
      name: '_example._tcp.example.com',
      type: 'SVCB',
      ttl: 3600,
      rdata: ' 1   service.example.com   port=8080 ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('_example._tcp.example.com.');
    expect(sanitizedRecord.type).toEqual('SVCB');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('1 service.example.com. port=8080');
  });

  it('should sanitize a CAA record and normalize format', () => {
    const record = {
      name: 'example.com',
      type: 'CAA',
      ttl: 3600,
      rdata: ' 0   ISSUE   letsencrypt.org ',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('CAA');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('0 issue "letsencrypt.org"');
  });

  it('should sanitize a CAA record that already has quotes', () => {
    const record = {
      name: 'example.com',
      type: 'CAA',
      ttl: 3600,
      rdata: '128 issuewild "ca.example.com"',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('CAA');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual('128 issuewild "ca.example.com"');
  });

  it('should sanitize a NAPTR record and ensure proper format', () => {
    const record = {
      name: 'example.com',
      type: 'NAPTR',
      ttl: 3600,
      rdata:
        '100 10 "u" "E2U+sip" "!^.*$!sip:info@example.com!" replacement.example.com',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('NAPTR');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual(
      '100 10 "u" "E2U+sip" "!^.*$!sip:info@example.com!" replacement.example.com.',
    );
  });

  it('should sanitize DS record and normalize hex to uppercase', () => {
    const record = {
      name: 'example.com',
      type: 'DS',
      ttl: 3600,
      rdata: '12345 7 1 1234567890abcdef1234567890abcdef12345678',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('example.com.');
    expect(sanitizedRecord.type).toEqual('DS');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual(
      '12345 7 1 1234567890ABCDEF1234567890ABCDEF12345678',
    );
  });

  it('should sanitize TLSA record and normalize hex to uppercase', () => {
    const record = {
      name: '_443._tcp.example.com',
      type: 'TLSA',
      ttl: 3600,
      rdata: '3 1 1 abcdef1234567890abcdef123456789012345678',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('_443._tcp.example.com.');
    expect(sanitizedRecord.type).toEqual('TLSA');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual(
      '3 1 1 ABCDEF1234567890ABCDEF123456789012345678',
    );
  });

  it('should sanitize SSHFP record and normalize hex to uppercase', () => {
    const record = {
      name: 'server.example.com',
      type: 'SSHFP',
      ttl: 3600,
      rdata: '1 1 abcdef123456789abcdef123456789abcdef12',
    };
    const sanitizedRecord = sanitizeDnsRecord(record, {
      usingFullRecordName: true,
    });
    expect(sanitizedRecord.name).toEqual('server.example.com.');
    expect(sanitizedRecord.type).toEqual('SSHFP');
    expect(sanitizedRecord.ttl).toEqual(3600);
    expect(sanitizedRecord.rdata).toEqual(
      '1 1 ABCDEF123456789ABCDEF123456789ABCDEF12',
    );
  });
});
