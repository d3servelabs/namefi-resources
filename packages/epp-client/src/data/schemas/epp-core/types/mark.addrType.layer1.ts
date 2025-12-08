/**
 * Layer-1 XML JSON schema for type mark:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const MarkAddrTypeXml = z.object({
  'mark:street': z.array(z.string()).min(1),
  'mark:city': z.string(),
  'mark:sp': z.string().optional(),
  'mark:pc': z.string().max(16).optional(),
  'mark:cc': z.string(),
});

export type MarkAddrTypeXml = z.infer<typeof MarkAddrTypeXml>;
