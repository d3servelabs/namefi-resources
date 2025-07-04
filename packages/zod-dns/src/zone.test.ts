import { describe, expect, it } from 'vitest';
import { zoneSchema } from './zone';
import {
  apexSoaNsTestCases,
  cnameConflictTestCases,
  duplicateRecordsTestCases,
  invalidRecordNameTestCases,
  invalidZoneNameTestCases,
  multipleCnameTestCases,
  nsConflictTestCases,
  nsSubdomainTestCases,
  validZoneTestCases,
} from './zone.testing';

describe('DNS Zone Validation', () => {
  describe('Valid zones', () => {
    for (const testCase of validZoneTestCases) {
      it(`should validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
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

  describe('Apex SOA/NS records check', () => {
    for (const testCase of apexSoaNsTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          const hasError = result.error.issues.some(
            (issue) =>
              issue.code === 'custom' &&
              issue.message ===
                'SOA and NS records are not allowed at the zone apex (@ or empty name). These records are managed by the DNS provider.',
          );
          expect(hasError).toBe(true);
        }
      });
    }
  });

  describe('NS conflict check', () => {
    for (const testCase of nsConflictTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          const hasError = result.error.issues.some(
            (issue) =>
              issue.code === 'custom' &&
              issue.message ===
                'If NS records exist for a name, no other record types may use that name. Please remove conflicting records.',
          );
          expect(hasError).toBe(true);
        }
      });
    }
  });

  describe('NS subdomain check', () => {
    for (const testCase of nsSubdomainTestCases) {
      it(`should not validate ${testCase.description}`, () => {
        const result = zoneSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          const hasError = result.error.issues.some(
            (issue) =>
              issue.code === 'custom' &&
              issue.message ===
                'Records cannot be created for subdomains when a parent domain has NS records. NS records indicate delegation to another nameserver.',
          );
          expect(hasError).toBe(true);
        }
      });
    }
  });
});
