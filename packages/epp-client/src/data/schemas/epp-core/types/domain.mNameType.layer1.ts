/**
 * Layer-1 XML JSON schema for type domain:mNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainMNameTypeXml = z.object({
  'domain:name': z.array(z.string().min(1).max(255)).min(1),
});

export type DomainMNameTypeXml = z.infer<typeof DomainMNameTypeXml>;
