/**
 * Layer-1 XML JSON schema for type host:creDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const HostCreDataTypeXml = z.object({
  'host:name': z.string().min(1).max(255),
  'host:crDate': z.string(),
});

export type HostCreDataTypeXml = z.infer<typeof HostCreDataTypeXml>;
