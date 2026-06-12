// This file contains the validation logic for DNS zones
// Given a list of records, validate that the zone is valid
// - all records are valid
// - all records are unique
// - all records are in the same zone
// - there is no conflict between records based on known RFC standards

import { z } from 'zod';
import { nameRegex } from './name';
import { recordSchema } from './record';

// Helper function to group array items by a key function
function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

const zoneBasicSchema = z
  .object({
    // zoneName is the name of the zone, it is the name of the apex record
    // it is not a record itself
    zoneName: z.string().regex(nameRegex),
    records: z.array(recordSchema),
  })
  .refine(
    (data) => {
      return data.records.every((record) => {
        let fullName: string;
        // @ is a special case - it refers to the zone apex itself (zone name)
        if (record.name === '@') {
          fullName = data.zoneName;
        } else {
          fullName = `${record.name}.${data.zoneName}`;
        }
        return nameRegex.test(fullName) && fullName.length <= 255;
      });
    },
    {
      message:
        'One or more record names are invalid or not normalized according to DNS rules (lowercase, digits, hyphens, underscores, max 255 chars). Please check all record names and the zone name.',
    },
  );

// Export the zone schema with all the refinements chained together
export const zoneSchema = zoneBasicSchema
  // check that there are no duplicate records with the same name AND type
  .refine(
    (data) => {
      const recordKeys = new Set();
      return data.records.every((record) => {
        const key = `${record.name}:${record.type}:${record.rdata}`;
        if (recordKeys.has(key)) {
          return false;
        }
        recordKeys.add(key);
        return true;
      });
    },
    {
      message:
        'Duplicate records detected: Each (name, type, rdata) combination must be unique within the zone. Please remove or modify duplicates.',
    },
  )
  // Check that there is at most one CNAME record per name
  .refine(
    (data) => {
      const recordsByName = groupBy(data.records, (record) => record.name);

      for (const [, records] of recordsByName) {
        const cnameCount = records.filter((r) => r.type === 'CNAME').length;
        if (cnameCount > 1) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        'Each name may have at most one CNAME record. Please ensure no duplicate CNAME records exist for the same name.',
    },
  )
  /**
   * RFC-1034, Section 3.6.2: "If a CNAME RR is present at a node, no other data should be
  present; this ensures that the data for a canonical name and its aliases
  cannot be different."
   * There should be only one CNAME record for any given name!!!
   * And no other record should have the same name!!!
   */
  .refine(
    (data) => {
      const recordsByName = groupBy(data.records, (record) => record.name);

      for (const [, records] of recordsByName) {
        const typeSet = new Set(records.map((r) => r.type));
        if (typeSet.has('CNAME') && typeSet.size > 1) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        'If a CNAME record exists for a name, no other record type may use that name. Please remove conflicting records.',
    },
  )
  // Check that SOA and NS records are not present at the apex (@ or '')
  .refine(
    (data) => {
      const apexRecords = data.records.filter(
        (record) => record.name === '@' || record.name === '',
      );
      return apexRecords.every(
        (record) => record.type !== 'SOA' && record.type !== 'NS',
      );
    },
    {
      message:
        'SOA and NS records are not allowed at the zone apex (@ or empty name). These records are managed by the DNS provider.',
    },
  )
  /**
   * RFC 1034 §3.6.2 / RFC 2181 §10.1: a CNAME cannot coexist with any other
   * data at the same node. The zone apex (@ or empty name) always carries the
   * provider-managed SOA and NS records, so a CNAME there is always a conflict
   * and would break the zone — even when it is the only user-supplied record at
   * the apex (in which case the same-name coexistence check above cannot see it).
   */
  .refine(
    (data) => {
      const apexRecords = data.records.filter(
        (record) => record.name === '@' || record.name === '',
      );
      return apexRecords.every((record) => record.type !== 'CNAME');
    },
    {
      message:
        'CNAME records are not allowed at the zone apex (@ or empty name). The apex always has SOA and NS records, and a CNAME cannot coexist with other record types (RFC 1034 §3.6.2).',
    },
  )
  // Check that no other records exist for names that have NS records
  .refine(
    (data) => {
      const recordsByName = groupBy(data.records, (record) => record.name);

      for (const [, records] of recordsByName) {
        const typeSet = new Set(records.map((r) => r.type));
        if (typeSet.has('NS') && typeSet.size > 1) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        'If NS records exist for a name, no other record types may use that name. Please remove conflicting records.',
    },
  )
  // Check that no sub-records exist when parent has NS records
  .refine(
    (data) => {
      const normalizedRecords = data.records.map((record) => ({
        ...record,
        name: record.name === '@' ? '' : record.name,
      }));
      // Get all NS record names for efficient lookup
      const nsNames = new Set(
        normalizedRecords
          .filter((record) => record.type === 'NS')
          .map((record) => record.name),
      );

      // Check each record to see if it's a subdomain of any NS record
      for (const record of normalizedRecords) {
        // Skip if this record is itself an NS record
        if (record.type === 'NS') continue;

        // Check if this record is a subdomain of any NS record
        for (const nsName of nsNames) {
          // If NS is not at apex, check if record is a subdomain
          if (record.name !== '' && record.name.endsWith(`.${nsName}`)) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message:
        'Records cannot be created for subdomains when a parent domain has NS records. NS records indicate delegation to another nameserver.',
    },
  );

// TODO: add more checks
