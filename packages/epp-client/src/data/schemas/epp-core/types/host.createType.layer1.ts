/**
 * Layer-1 XML JSON schema for type host:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostAddrTypeXml } from './host.addrType.layer1.js';

export const HostCreateTypeXml = z.object({
  'host:name': z.string().min(1).max(255),
  'host:addr': z.array(HostAddrTypeXml).optional(),
});

export type HostCreateTypeXml = z.infer<typeof HostCreateTypeXml>;
