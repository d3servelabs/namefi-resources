/**
 * Layer-1 XML JSON schema for type host:sNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const HostSNameTypeXml = z.object({
  'host:name': z.string().min(1).max(255),
});

export type HostSNameTypeXml = z.infer<typeof HostSNameTypeXml>;
