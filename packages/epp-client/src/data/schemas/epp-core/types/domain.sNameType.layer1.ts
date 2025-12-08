/**
 * Layer-1 XML JSON schema for type domain:sNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainSNameTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
});

export type DomainSNameTypeXml = z.infer<typeof DomainSNameTypeXml>;
