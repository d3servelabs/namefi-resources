/**
 * Layer-1 XML JSON schema for type domain:infoNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainInfoNameTypeXml = z.object({
  '@_hosts': z.enum(['all', 'del', 'none', 'sub']).default('all').optional(),
  '#text': z.string().min(1).max(255),
});

export type DomainInfoNameTypeXml = z.infer<typeof DomainInfoNameTypeXml>;
