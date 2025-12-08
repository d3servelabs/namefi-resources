/**
 * Layer-1 XML JSON schema for type host:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const HostChgTypeXml = z.object({
  'host:name': z.string().min(1).max(255),
});

export type HostChgTypeXml = z.infer<typeof HostChgTypeXml>;
