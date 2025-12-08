/**
 * Layer-1 XML JSON schema for type domain:renDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainRenDataTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
  'domain:exDate': z.string().optional(),
});

export type DomainRenDataTypeXml = z.infer<typeof DomainRenDataTypeXml>;
