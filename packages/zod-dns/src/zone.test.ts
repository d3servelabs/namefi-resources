import { describe, expect, it } from 'vitest';
import { zoneSchema } from './zone';
import {
  cnameConflictTestCases,
  duplicateRecordsTestCases,
  invalidRecordNameTestCases,
  invalidZoneNameTestCases,
  multipleCnameTestCases,
  validZoneTestCases,
} from './zone.testing';

describe('DNS Zone Validation', () => {
  describe('Valid zones', () => {
    for (const testCase of validZoneTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        if (!result.success) {
          console.error('Validation failed with error:', result.error);
        }
        expect(result.success).toBe(true);
      });
    }
  });

  describe('Invalid zone names', () => {
    for (const testCase of invalidZoneNameTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('Invalid record names', () => {
    for (const testCase of invalidRecordNameTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      });
    }
  });

  describe('Duplicate records check', () => {
    for (const testCase of duplicateRecordsTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('Duplicate records found');
        }
      });
    }
  });

  describe('Multiple CNAME records check', () => {
    for (const testCase of multipleCnameTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain(
            'There should be only one CNAME record for any given name',
          );
        }
      });
    }
  });

  describe('CNAME conflict check', () => {
    for (const testCase of cnameConflictTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain(
            'For any CNAME record, no other record of any type can have the same name',
          );
        }
      });
    }
  });
});
