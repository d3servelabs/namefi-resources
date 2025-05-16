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
          const hasError = result.error.issues.some(
            (issue) =>
              issue.code === 'custom' &&
              issue.message ===
                'Duplicate records detected: Each (name, type, rdata) combination must be unique within the zone. Please remove or modify duplicates.',
          );
          expect(hasError).toBe(true);
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
          const hasError = result.error.issues.some(
            (issue) =>
              issue.code === 'custom' &&
              issue.message ===
                'Each name may have at most one CNAME record. Please ensure no duplicate CNAME records exist for the same name.',
          );
          expect(hasError).toBe(true);
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
          // Check for the CNAME conflict error in the structured error format
          const hasConflictError = result.error.issues.some(
            (issue) =>
              issue.code === 'custom' &&
              issue.message ===
                'If a CNAME record exists for a name, no other record type may use that name. Please remove conflicting records.',
          );
          expect(hasConflictError).toBe(true);
        }
      });
    }
  });
});
