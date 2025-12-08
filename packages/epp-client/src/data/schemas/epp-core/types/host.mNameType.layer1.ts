/**
 * Layer-1 XML JSON schema for type host:mNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const HostMNameTypeXml = z.object({
  'host:name': z.array(z.string().min(1).max(255)).min(1),
});

export type HostMNameTypeXml = z.infer<typeof HostMNameTypeXml>;
