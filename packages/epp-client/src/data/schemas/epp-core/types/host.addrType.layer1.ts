/**
 * Layer-1 XML JSON schema for type host:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const HostAddrTypeXml = z.object({
  '@_ip': z.enum(['v4', 'v6']).default('v4').optional(),
  '#text': z.string().min(3).max(45),
});

export type HostAddrTypeXml = z.infer<typeof HostAddrTypeXml>;
