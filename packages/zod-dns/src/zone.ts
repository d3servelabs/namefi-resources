// This file contains the validation logic for DNS zones
// Given a list of records, validate that the zone is valid
// - all records are valid
// - all records are unique
// - all records are in the same zone
// - there is no conflict between records based on known RFC standards

import { z } from 'zod';
import { nameRegex } from './name';
import { recordSchema } from './record';

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
      message: 'Invalid record name',
    },
  );

// Export the zone schema with all the refinements chained together
export const zoneSchema = zoneBasicSchema
  // check that there are no duplicate records with the same name AND type
  .refine(
    (data) => {
      const recordKeys = new Set();
      return data.records.every((record) => {
        const key = `${record.name}:${record.type}`;
        if (recordKeys.has(key)) {
          return false;
        }
        recordKeys.add(key);
        return true;
      });
    },
    {
      message: 'Duplicate records found (same name and type)',
    },
  )
  // Check that there is at most one CNAME record per name
  .refine(
    (data) => {
      const cnameRecords = data.records.filter(
        (record) => record.type === 'CNAME',
      );
      const cnameNames = new Set();
      return cnameRecords.every((cnameRecord) => {
        if (cnameNames.has(cnameRecord.name)) {
          return false;
        }
        cnameNames.add(cnameRecord.name);
        return true;
      });
    },
    {
      message: 'There should be only one CNAME record for any given name',
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
      const cnameRecords = data.records.filter(
        (record) => record.type === 'CNAME',
      );
      const otherRecords = data.records.filter(
        (record) => record.type !== 'CNAME',
      );
      return cnameRecords.every((cnameRecord) => {
        return otherRecords.every(
          (otherRecord) => otherRecord.name !== cnameRecord.name,
        );
      });
    },
    {
      message:
        'For any CNAME record, no other record of any type can have the same name',
    },
  );

// TODO: add more checks
