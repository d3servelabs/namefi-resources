/**
 * Layer-1 XML JSON schema for type host:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const HostAddrTypeXml = zloosen(
  z.object({
    '@_ip': z.enum(['v4', 'v6']).default('v4').optional(),
    '#text': z.string().min(3).max(45),
  }),
);

export type HostAddrTypeXml = z.infer<typeof HostAddrTypeXml>;
