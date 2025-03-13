import { describe, expect, it } from 'vitest';
import { recordSchema } from './record';
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
