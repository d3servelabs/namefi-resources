/**
 * Layer-1 XML JSON schema for type domain:creDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainCreDataTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
  'domain:crDate': z.string(),
  'domain:exDate': z.string().optional(),
});

export type DomainCreDataTypeXml = z.infer<typeof DomainCreDataTypeXml>;
