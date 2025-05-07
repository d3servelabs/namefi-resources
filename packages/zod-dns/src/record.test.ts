import { describe, expect, it } from 'vitest';
import { recordSchema, sanitizeDnsRecord } from './record';
import {
  invalidAAAARecordTestCases,
  invalidARecordTestCases,
  invalidCNAMERecordTestCases,
  invalidMXRecordTestCases,
  missingFieldsTestCases,
  validAAAARecordTestCases,
  validARecordTestCases,
  validCNAMERecordTestCases,
  validMXRecordTestCases,
  validTXTRecordTestCases,
} from './record.testing';

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

  it('should sanitize a TXT record', () => {
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
    expect(sanitizedRecord.rdata).toEqual('This is a test');
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
});
